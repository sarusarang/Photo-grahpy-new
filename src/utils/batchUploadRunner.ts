/**
 * Shared Batch Upload Runner & High-Speed Pipeline Orchestrator
 *
 * Provides a robust, unified multi-stream pipeline for uploading files in chunks:
 * - High-speed parallel concurrency (up to 3-4 parallel upload streams)
 * - Dynamic batch sizing from environment variables (.env / .env.local)
 * - Real-time metrics: Upload Speed (MB/s), Uploaded MB vs Total MB, Elapsed Time & ETA
 * - Automatic retry with backoff for transient network errors
 * - Fast-fail on non-retryable errors (401, 403, storage limit)
 * - Adaptive 413 Content Too Large recovery (auto-fallback to single item ingestion)
 * - Safe AbortSignal cancellation with partial results preservation
 */

import { getMaxBatchBytes, getUploadConcurrency } from './uploadConfig';

export interface UploadProgressMetrics {
  percent: number;
  statusText: string;
  bytesUploaded: number;
  totalBytes: number;
  uploadedMbText: string;
  uploadSpeedBps: number;
  speedText: string;
  elapsedSeconds: number;
  elapsedTimeText: string;
  etaSeconds: number | null;
  etaTimeText: string;
  uploadedCount: number;
  totalCount: number;
  activeStreams: number;
  isPaused?: boolean;
}

export interface BatchUploadPauseController {
  isPaused: boolean;
  pause: () => void;
  resume: () => void;
  waitIfPaused: () => Promise<void>;
  subscribe: (listener: (isPaused: boolean) => void) => () => void;
}

export const createPauseController = (): BatchUploadPauseController => {
  let isPaused = false;
  let resumeResolve: (() => void) | null = null;
  const listeners = new Set<(isPaused: boolean) => void>();

  const notify = () => {
    listeners.forEach((l) => l(isPaused));
  };

  return {
    get isPaused() {
      return isPaused;
    },
    pause() {
      if (!isPaused) {
        isPaused = true;
        notify();
      }
    },
    resume() {
      if (isPaused) {
        isPaused = false;
        if (resumeResolve) {
          const r = resumeResolve;
          resumeResolve = null;
          r();
        }
        notify();
      }
    },
    async waitIfPaused() {
      if (!isPaused) return;
      return new Promise<void>((resolve) => {
        resumeResolve = resolve;
      });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

export interface BatchUploadConfig<TItem, TResult> {
  items: TItem[];
  batchSize: number;
  maxBatchBytes?: number; // Optional max byte threshold per chunk (default: 25MB)
  concurrency?: number; // Optional number of concurrent upload streams (default from env or 3)
  itemLabel?: string;
  signal?: AbortSignal;
  pauseController?: BatchUploadPauseController;
  onProgress?: (percent: number, statusText: string, metrics?: UploadProgressMetrics) => void;
  maxRetries?: number; // default: 2 attempts (1 retry)
  retryDelayMs?: number; // default: 1200ms
  uploadBatch: (
    batch: TItem[],
    onBatchProgress: (percent: number, loadedBytes?: number) => void,
    batchIndex: number,
    totalBatches: number
  ) => Promise<TResult>;
  onBatchSuccess?: (result: TResult, batch: TItem[], batchIndex: number) => void;
  onBatchError?: (
    err: any,
    batch: TItem[],
    batchIndex: number
  ) => Promise<TResult | void> | TResult | void;
}

export interface BatchUploadExecutionResult<TResult> {
  results: TResult[];
  totalBatches: number;
  totalItems: number;
  metrics: UploadProgressMetrics;
}

/**
 * Format seconds into a clean human-readable duration (e.g. "4m 39s" or "25s" or "1h 12m")
 */
export const formatDurationHuman = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0s';
  const totalSecs = Math.round(seconds);
  if (totalSecs < 60) {
    return `${totalSecs}s`;
  }
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return secs > 0 ? `${hrs}h ${remMins}m ${secs}s` : `${hrs}h ${remMins}m`;
  }
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

/**
 * Format seconds into human duration (minutes and seconds)
 */
export const formatDuration = (seconds: number): string => {
  return formatDurationHuman(seconds);
};

/**
 * Format bytes into clean MB or GB string
 */
export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0.0 MB';
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Format bytes per second into clean speed string
 */
export const formatSpeed = (bytesPerSec: number): string => {
  if (!Number.isFinite(bytesPerSec) || bytesPerSec <= 0) return '0.0 MB/s';
  if (bytesPerSec >= 1024 * 1024) {
    return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  }
  return `${Math.round(bytesPerSec / 1024)} KB/s`;
};

const getItemByteSize = (item: any): number => {
  if (!item) return 0;
  if (item.file && typeof item.file.size === 'number' && item.file.size > 0) return item.file.size;
  if (typeof item.size === 'number' && item.size > 0) return item.size;
  if (typeof item.sizeBytes === 'number' && item.sizeBytes > 0) return item.sizeBytes;
  if (typeof item.sizeMB === 'number' && item.sizeMB > 0) return item.sizeMB * 1024 * 1024;
  return 2.5 * 1024 * 1024; // safe 2.5MB fallback estimate
};

/**
 * Splits an array into chunks of the given size, with optional byte size cap.
 */
export const splitIntoBatches = <T>(
  items: T[],
  batchSize: number,
  maxBatchBytes?: number
): T[][] => {
  const size = Math.max(1, Math.floor(batchSize));
  const batches: T[][] = [];

  if (!maxBatchBytes || maxBatchBytes <= 0) {
    for (let i = 0; i < items.length; i += size) {
      batches.push(items.slice(i, i + size));
    }
    return batches;
  }

  let currentBatch: T[] = [];
  let currentBytes = 0;

  for (const item of items) {
    const itemBytes = getItemByteSize(item);

    // If current batch is non-empty, and adding this item would exceed size or maxBatchBytes:
    if (
      currentBatch.length > 0 &&
      (currentBatch.length >= size || currentBytes + itemBytes > maxBatchBytes)
    ) {
      batches.push(currentBatch);
      currentBatch = [];
      currentBytes = 0;
    }

    currentBatch.push(item);
    currentBytes += itemBytes;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
};

/**
 * Determines whether an error is fatal and should NOT be retried.
 */
export const isFatalUploadError = (
  err: any,
  signal?: AbortSignal,
  batchLength?: number
): boolean => {
  if (
    signal?.aborted ||
    err?.name === 'AbortError' ||
    err?.name === 'CanceledError' ||
    err?.code === 'ERR_CANCELED'
  ) {
    return true;
  }
  const status = err?.response?.status;
  if (
    status === 401 ||
    status === 403 ||
    err?.response?.data?.error_code === 'STORAGE_LIMIT_EXCEEDED'
  ) {
    return true;
  }
  // 413 is only unrecoverable if it is already a single-item upload
  if (status === 413 && (batchLength === undefined || batchLength <= 1)) {
    return true;
  }
  return false;
};

/**
 * Creates a standard AbortError with optional attached data.
 */
export const createAbortError = (
  message = 'Upload cancelled by user',
  uploadedData?: any
): Error => {
  const err: any = new Error(message);
  err.name = 'AbortError';
  if (uploadedData !== undefined) {
    err.uploadedMedia = uploadedData;
    err.uploadedPhotos = uploadedData;
  }
  return err;
};

/**
 * Executes a high-performance batch upload pipeline with parallel concurrency,
 * real-time transfer metrics (MB/s, elapsed, ETA, uploaded MB), and adaptive 413 recovery.
 */
export const executeBatchUpload = async <TItem, TResult>(
  config: BatchUploadConfig<TItem, TResult>
): Promise<BatchUploadExecutionResult<TResult>> => {
  const {
    items,
    batchSize,
    maxBatchBytes,
    concurrency: customConcurrency,
    itemLabel = 'item',
    signal,
    pauseController,
    onProgress,
    maxRetries = 2,
    retryDelayMs = 1200,
    uploadBatch,
    onBatchSuccess,
    onBatchError,
  } = config;

  // Compute total bytes upfront
  const totalItems = items?.length || 0;
  const totalBytes = items ? items.reduce((sum, it) => sum + getItemByteSize(it), 0) : 0;

  const emptyMetrics: UploadProgressMetrics = {
    percent: 100,
    statusText: 'No files to upload',
    bytesUploaded: 0,
    totalBytes: 0,
    uploadedMbText: '0 MB / 0 MB',
    uploadSpeedBps: 0,
    speedText: '0 MB/s',
    elapsedSeconds: 0,
    elapsedTimeText: '0s',
    etaSeconds: 0,
    etaTimeText: 'Complete',
    uploadedCount: 0,
    totalCount: 0,
    activeStreams: 0,
    isPaused: false,
  };

  if (!items || items.length === 0) {
    return { results: [], totalBatches: 0, totalItems: 0, metrics: emptyMetrics };
  }

  if (signal?.aborted) {
    throw createAbortError();
  }

  const effectiveBatchSize = Math.max(1, Math.floor(batchSize));
  const effectiveMaxBatchBytes =
    maxBatchBytes !== undefined ? maxBatchBytes : getMaxBatchBytes();
  const batches = splitIntoBatches(items, effectiveBatchSize, effectiveMaxBatchBytes);
  const totalBatches = batches.length;

  // Concurrency worker limit
  const maxConcurrency = Math.min(
    totalBatches,
    Math.max(1, customConcurrency !== undefined ? customConcurrency : getUploadConcurrency())
  );

  const startTime = performance.now();
  let totalPausedMs = 0;
  let lastPauseStartTime = 0;
  const speedSamples: { timestamp: number; bytes: number }[] = [];

  const chunkByteSizes = batches.map((chunk) => chunk.reduce((sum, it) => sum + getItemByteSize(it), 0));
  const batchLoadedBytes = new Map<number, number>();
  const completedBatches = new Set<number>();
  const resultsByBatchIndex = new Map<number, TResult>();
  const allResults: TResult[] = [];

  let activeStreams = 0;
  let hasFailed = false;

  // Pause controller subscription
  if (pauseController) {
    pauseController.subscribe((paused) => {
      if (paused) {
        lastPauseStartTime = performance.now();
        reportProgress('Upload paused by user', undefined, true);
      } else {
        if (lastPauseStartTime > 0) {
          totalPausedMs += performance.now() - lastPauseStartTime;
          lastPauseStartTime = 0;
        }
        reportProgress('Resuming upload...', undefined, true);
      }
    });
  }

  // Metrics broadcaster with rolling smoothing
  let lastReportedTime = 0;
  const buildMetrics = (statusText: string, forcePercent?: number): UploadProgressMetrics => {
    const isPaused = Boolean(pauseController?.isPaused);
    const now = performance.now();
    const currentPausedMs = isPaused && lastPauseStartTime > 0 ? now - lastPauseStartTime : 0;
    const effectiveActiveElapsedSec = Math.max(0.1, (now - startTime - totalPausedMs - currentPausedMs) / 1000);
    const totalElapsedSec = Math.max(0, (now - startTime) / 1000);

    // Sum loaded bytes from each batch
    let currentBytes = 0;
    batchLoadedBytes.forEach((val) => {
      currentBytes += val;
    });
    currentBytes = Math.min(totalBytes, Math.max(0, currentBytes));

    const computedPercent =
      totalBytes > 0
        ? Math.min(99, Math.round((currentBytes / totalBytes) * 100))
        : Math.min(99, Math.round((completedBatches.size / totalBatches) * 100));

    const finalPercent = forcePercent !== undefined ? forcePercent : computedPercent;

    // Rolling real-time user network speed (over recent 1.5 - 2s window)
    if (!isPaused) {
      speedSamples.push({ timestamp: now, bytes: currentBytes });
      while (speedSamples.length > 2 && now - speedSamples[0].timestamp > 2000) {
        speedSamples.shift();
      }
    }

    let liveSpeedBps = 0;
    if (!isPaused && speedSamples.length >= 2) {
      const oldest = speedSamples[0];
      const deltaBytes = currentBytes - oldest.bytes;
      const deltaSec = (now - oldest.timestamp) / 1000;
      if (deltaSec > 0.25 && deltaBytes >= 0) {
        liveSpeedBps = deltaBytes / deltaSec;
      }
    }
    if (!isPaused && liveSpeedBps <= 0 && effectiveActiveElapsedSec > 0.4) {
      liveSpeedBps = currentBytes / effectiveActiveElapsedSec;
    }

    const remainingBytes = Math.max(0, totalBytes - currentBytes);
    const etaSec =
      !isPaused && liveSpeedBps > 1024 && finalPercent < 99
        ? Math.ceil(remainingBytes / liveSpeedBps)
        : null;

    // Uploaded count estimate based on percent
    const uploadedCount = Math.min(
      totalItems,
      Math.max(
        0,
        Math.floor((finalPercent / 100) * totalItems)
      )
    );

    const etaTimeText = isPaused
      ? 'Paused'
      : etaSec !== null
      ? `${formatDurationHuman(etaSec)} left`
      : finalPercent >= 100
      ? 'Complete'
      : 'Calculating...';

    return {
      percent: finalPercent,
      statusText: isPaused ? 'Upload paused — Click Resume to continue' : statusText,
      bytesUploaded: currentBytes,
      totalBytes,
      uploadedMbText: `${formatBytes(currentBytes)} / ${formatBytes(totalBytes)}`,
      uploadSpeedBps: isPaused ? 0 : liveSpeedBps,
      speedText: isPaused ? 'Paused' : formatSpeed(liveSpeedBps),
      elapsedSeconds: Math.floor(totalElapsedSec),
      elapsedTimeText: formatDurationHuman(totalElapsedSec),
      etaSeconds: etaSec,
      etaTimeText,
      uploadedCount,
      totalCount: totalItems,
      activeStreams,
      isPaused,
    };
  };

  const reportProgress = (statusText: string, forcePercent?: number, immediate = false) => {
    const now = performance.now();
    if (!immediate && now - lastReportedTime < 80) {
      return; // throttle UI updates to ~12 FPS for buttery smooth rendering without frame drops
    }
    lastReportedTime = now;
    const metrics = buildMetrics(statusText, forcePercent);
    onProgress?.(metrics.percent, metrics.statusText, metrics);
  };

  // Initial announcement
  reportProgress(
    `Preparing ${totalItems} ${itemLabel}(s) for high-speed upload...`,
    5,
    true
  );

  /**
   * Process a single batch chunk with retries and adaptive 413 fallback
   */
  const processChunk = async (batchIndex: number) => {
    if (signal?.aborted || hasFailed) return;
    if (pauseController) {
      await pauseController.waitIfPaused();
    }
    if (signal?.aborted || hasFailed) return;

    const chunk = batches[batchIndex];
    const chunkSize = chunkByteSizes[batchIndex];
    activeStreams++;

    let attempt = 0;
    let success = false;
    let lastError: any = null;

    while (attempt < maxRetries && !success) {
      if (signal?.aborted) {
        throw createAbortError('Upload cancelled by user', Array.from(resultsByBatchIndex.values()));
      }
      if (pauseController) {
        await pauseController.waitIfPaused();
      }
      if (signal?.aborted || hasFailed) return;

      attempt++;
      try {
        const chunkResult = await uploadBatch(
          chunk,
          (percent, loadedBytes) => {
            const actualLoaded =
              loadedBytes !== undefined && loadedBytes >= 0
                ? Math.min(chunkSize, loadedBytes)
                : Math.round((percent / 100) * chunkSize);

            batchLoadedBytes.set(batchIndex, actualLoaded);
            const statusMsg =
              totalBatches > 1
                ? `Uploading batch ${batchIndex + 1} of ${totalBatches} (${chunk.length} ${itemLabel}s) • ${percent}%`
                : `Uploading ${totalItems} ${itemLabel}(s) • ${percent}%`;
            reportProgress(statusMsg);
          },
          batchIndex,
          totalBatches
        );

        batchLoadedBytes.set(batchIndex, chunkSize);
        completedBatches.add(batchIndex);
        resultsByBatchIndex.set(batchIndex, chunkResult);
        allResults.push(chunkResult);
        onBatchSuccess?.(chunkResult, chunk, batchIndex);
        success = true;
      } catch (err: any) {
        lastError = err;

        // Adaptive 413 recovery: If chunk exceeds proxy/tunnel limit, upload items individually
        if (err?.response?.status === 413 && chunk.length > 1) {
          try {
            reportProgress(`Chunk too large for proxy — switching to individual file streaming...`);
            for (let subIdx = 0; subIdx < chunk.length; subIdx++) {
              if (signal?.aborted || hasFailed) throw createAbortError('Upload cancelled', Array.from(resultsByBatchIndex.values()));
              const singleItem = [chunk[subIdx]];
              const singleSize = getItemByteSize(chunk[subIdx]);

              const singleResult = await uploadBatch(
                singleItem,
                (subPercent, subBytes) => {
                  const subLoaded = subBytes !== undefined ? subBytes : Math.round((subPercent / 100) * singleSize);
                  batchLoadedBytes.set(batchIndex, (subIdx * singleSize) + subLoaded);
                  reportProgress(`Streaming item ${subIdx + 1}/${chunk.length} of chunk ${batchIndex + 1}... ${subPercent}%`);
                },
                batchIndex,
                totalBatches
              );
              resultsByBatchIndex.set(batchIndex, singleResult);
              allResults.push(singleResult);
              onBatchSuccess?.(singleResult, singleItem, batchIndex);
            }
            batchLoadedBytes.set(batchIndex, chunkSize);
            completedBatches.add(batchIndex);
            success = true;
            break;
          } catch (subErr: any) {
            lastError = subErr;
            if (isFatalUploadError(subErr, signal, 1)) {
              throw subErr;
            }
          }
        }

        // Adaptive 429 Rate Throttling recovery: automatically wait specified seconds and retry
        if (err?.response?.status === 429) {
          const detail = String(err?.response?.data?.detail || err?.message || '');
          const match = detail.match(/(\d+)\s*seconds?/i);
          const waitSecs = match ? Math.min(60, Math.max(5, parseInt(match[1], 10))) : 10;
          reportProgress(`Upload rate-limited by server — waiting ${waitSecs}s to auto-resume...`);
          await new Promise((resolve) => setTimeout(resolve, (waitSecs + 1) * 1000));
          if (signal?.aborted) throw createAbortError();
          continue;
        }

        if (isFatalUploadError(err, signal, chunk.length)) {
          throw err;
        }

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        }
      }
    }

    activeStreams--;

    if (!success) {
      if (onBatchError) {
        const fallbackResult = await onBatchError(lastError, chunk, batchIndex);
        if (fallbackResult !== undefined) {
          resultsByBatchIndex.set(batchIndex, fallbackResult as TResult);
          allResults.push(fallbackResult as TResult);
        }
      } else {
        throw lastError;
      }
    }
  };

  // Concurrent Worker Pool Execution
  try {
    let nextChunkIndex = 0;
    const workerPromises: Promise<void>[] = [];

    const worker = async (): Promise<void> => {
      while (nextChunkIndex < totalBatches) {
        if (signal?.aborted || hasFailed) break;
        if (pauseController) {
          await pauseController.waitIfPaused();
        }
        if (signal?.aborted || hasFailed) break;
        const currentIdx = nextChunkIndex++;
        await processChunk(currentIdx);
      }
    };

    for (let w = 0; w < maxConcurrency; w++) {
      workerPromises.push(worker());
    }

    await Promise.all(workerPromises);
  } catch (err: any) {
    hasFailed = true;
    const currentUploaded = Array.from(resultsByBatchIndex.values());
    if (currentUploaded.length > 0) {
      err.uploadedMedia = currentUploaded;
      err.uploadedPhotos = currentUploaded;
    }
    throw err;
  }

  // Sort results by batch index for consistent ordering
  const orderedResults: TResult[] = [];
  for (let i = 0; i < totalBatches; i++) {
    const res = resultsByBatchIndex.get(i);
    if (res !== undefined) orderedResults.push(res);
  }

  // Final 100% completion announcement
  const finalMetrics = buildMetrics(`Successfully uploaded all ${totalItems} ${itemLabel}(s)!`, 100);
  reportProgress(`Successfully uploaded all ${totalItems} ${itemLabel}(s)!`, 100, true);

  return {
    results: orderedResults.length > 0 ? orderedResults : allResults,
    totalBatches,
    totalItems,
    metrics: finalMetrics,
  };
};

/**
 * Standard alias for the batch upload pipeline orchestrator
 */
export const runBatchUploadPipeline = executeBatchUpload;
