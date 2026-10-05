/**
 * EX SHARE ATELIER — AI Smart Cull & Deduplication Engine
 *
 * Client-Side Algorithmic Engine:
 * 1. Perceptual Difference Hashing (dHash 64-bit structural fingerprint):
 *    Rescales images to 9x8 grayscale, computes horizontal luminance gradients,
 *    and generates a 64-bit binary hash invariant to scaling, compression, and minor color shifts.
 * 2. Hamming Distance:
 *    Measures exact bit-level similarity between fingerprints.
 * 3. Discrete 2D Laplacian Variance (Blur vs. Focus Detection):
 *    Applies a 3x3 convolution kernel [0, 1, 0; 1, -4, 1; 0, 1, 0] over grayscale pixels
 *    to compute edge variance σ². Out-of-focus shots yield low variance, crisp shots yield high variance.
 * 4. Cluster Grouping & Best Pick Auto-Curation:
 *    Clusters photos with similarity >= threshold into duplicate sets.
 *    The sharpest photo in each set is crowned "Best Pick" (Winner / Keep),
 *    while inferior/blurry duplicates are flagged for removal.
 */

export interface AnalyzedPhoto {
  id: string;
  file?: File;
  previewUrl: string;
  name: string;
  sizeBytes: number;
  sizeMB: number;
  width?: number;
  height?: number;
  aspectRatio?: number;
  hash: string; // 64-character binary string
  sharpnessScore: number; // 0 - 100
  rawSharpnessVariance: number;
  clusterId?: string; // ID of the duplicate cluster if clustered
  isBestPick?: boolean; // True if selected as the sharpest photo in its cluster
  status: 'keep' | 'discard'; // User or AI designated action
  similarityWithBest?: number; // Similarity % with the cluster winner
  metadata?: {
    capturedAt?: string;
    camera?: string;
  };
}

export interface DuplicateCluster {
  id: string;
  title: string;
  averageSimilarity: number;
  bestPickId: string;
  photoIds: string[];
  totalPhotos: number;
  duplicatesCount: number; // totalPhotos - 1
  wastedBytes: number; // sum of discarded photo sizes
}

export interface CullingResult {
  allPhotos: AnalyzedPhoto[];
  clusters: DuplicateCluster[];
  uniquePhotos: AnalyzedPhoto[];
  totalPhotos: number;
  totalDuplicates: number;
  totalKeepers: number;
  totalSavedBytes: number;
  totalSavedMB: number;
  percentSaved: number;
}

/**
 * Loads an HTMLImageElement safely from a URL or Blob
 */
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

/**
 * 1. Compute 64-bit Perceptual Difference Hash (dHash)
 * Scales to 9x8 to compare 8 horizontal pairs across 8 rows = 64 bits.
 */
export const computeDHash = (img: HTMLImageElement): string => {
  const width = 9;
  const height = 8;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '0'.repeat(64);

  ctx.drawImage(img, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height).data;

  // Compute grayscale luminance matrix
  const grays: number[][] = [];
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Standard Rec. 601 Luma
      const gray = 0.299 * imgData[idx] + 0.587 * imgData[idx + 1] + 0.114 * imgData[idx + 2];
      row.push(gray);
    }
    grays.push(row);
  }

  // Compare adjacent pixels: if left > right => 1, else 0
  let hashBits = '';
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      hashBits += grays[y][x] > grays[y][x + 1] ? '1' : '0';
    }
  }

  return hashBits;
};

/**
 * 2. Compute Laplacian Edge Sharpness Variance
 * A discrete 3x3 convolution kernel over a sampled 200x200 canvas.
 * Higher variance indicates sharper, in-focus details.
 */
export const computeSharpnessVariance = (img: HTMLImageElement): { score: number; rawVariance: number } => {
  const size = 180;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { score: 50, rawVariance: 0 };

  ctx.drawImage(img, 0, 0, size, size);
  const imgData = ctx.getImageData(0, 0, size, size).data;

  // Convert to grayscale 1D array
  const gray = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    const idx = i * 4;
    gray[i] = 0.299 * imgData[idx] + 0.587 * imgData[idx + 1] + 0.114 * imgData[idx + 2];
  }

  // Apply discrete 2D Laplacian operator:
  // [  0,  1,  0 ]
  // [  1, -4,  1 ]
  // [  0,  1,  0 ]
  const laplacian = new Float32Array((size - 2) * (size - 2));
  let sum = 0;
  let count = 0;

  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const c = gray[y * size + x];
      const top = gray[(y - 1) * size + x];
      const bottom = gray[(y + 1) * size + x];
      const left = gray[y * size + (x - 1)];
      const right = gray[y * size + (x + 1)];

      const val = top + bottom + left + right - 4 * c;
      laplacian[count] = val;
      sum += val;
      count++;
    }
  }

  const mean = sum / count;
  let varianceSum = 0;
  for (let i = 0; i < count; i++) {
    const diff = laplacian[i] - mean;
    varianceSum += diff * diff;
  }
  const variance = varianceSum / count;

  // Normalize sharpness score into a 0 - 100 range using sigmoid-like scaling
  // Typical photographic variances range between 20 (blurry) and 500+ (razor sharp)
  const normalized = Math.min(100, Math.max(10, Math.round(100 / (1 + Math.exp(-(variance - 140) / 75)))));

  return {
    score: normalized,
    rawVariance: Math.round(variance),
  };
};

/**
 * 3. Calculate Hamming Distance between two 64-bit binary strings
 */
export const calculateHammingDistance = (hash1: string, hash2: string): number => {
  if (hash1.length !== hash2.length) return 64;
  let diff = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) diff++;
  }
  return diff;
};

/**
 * 4. Calculate Percentage Similarity (0% - 100%)
 */
export const calculateSimilarity = (hash1: string, hash2: string): number => {
  const dist = calculateHammingDistance(hash1, hash2);
  const similarity = ((64 - dist) / 64) * 100;
  return Math.round(similarity * 10) / 10;
};

/**
 * Run Analysis on a Single Photo
 */
export const analyzeSinglePhoto = async (
  item: { id: string; file?: File; previewUrl: string; name: string; sizeBytes: number }
): Promise<AnalyzedPhoto> => {
  const img = await loadImage(item.previewUrl);
  const hash = computeDHash(img);
  const sharpness = computeSharpnessVariance(img);

  return {
    id: item.id,
    file: item.file,
    previewUrl: item.previewUrl,
    name: item.name,
    sizeBytes: item.sizeBytes,
    sizeMB: Math.round((item.sizeBytes / (1024 * 1024)) * 100) / 100,
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    aspectRatio: (img.naturalWidth || img.width) / (img.naturalHeight || img.height || 1),
    hash,
    sharpnessScore: sharpness.score,
    rawSharpnessVariance: sharpness.rawVariance,
    status: 'keep',
  };
};

/**
 * Master Batch Culling Pipeline
 * @param items List of files / preview URLs to analyze
 * @param similarityThreshold Minimum similarity % to consider photos duplicates (default: 88%)
 * @param onProgress Callback receiving progress (0 - 100%) and current status text
 */
export const runAICullPipeline = async (
  items: Array<{ id: string; file?: File; previewUrl: string; name: string; sizeBytes: number }>,
  similarityThreshold: number = 88,
  onProgress?: (percent: number, status: string) => void
): Promise<CullingResult> => {
  const total = items.length;
  if (total === 0) {
    return {
      allPhotos: [],
      clusters: [],
      uniquePhotos: [],
      totalPhotos: 0,
      totalDuplicates: 0,
      totalKeepers: 0,
      totalSavedBytes: 0,
      totalSavedMB: 0,
      percentSaved: 0,
    };
  }

  const analyzedPhotos: AnalyzedPhoto[] = [];

  // Phase 1: Feature Extraction (Hash & Sharpness)
  for (let i = 0; i < total; i++) {
    const item = items[i];
    onProgress?.(
      Math.round(((i + 1) / total) * 60),
      `Analyzing photo details & focus: ${item.name} (${i + 1}/${total})`
    );

    try {
      const analyzed = await analyzeSinglePhoto(item);
      analyzedPhotos.push(analyzed);
    } catch (err) {
      console.warn(`Could not analyze ${item.name}:`, err);
      // Fallback dummy item
      analyzedPhotos.push({
        id: item.id,
        file: item.file,
        previewUrl: item.previewUrl,
        name: item.name,
        sizeBytes: item.sizeBytes,
        sizeMB: Math.round((item.sizeBytes / (1024 * 1024)) * 100) / 100,
        hash: '0'.repeat(64),
        sharpnessScore: 50,
        rawSharpnessVariance: 100,
        status: 'keep',
      });
    }

    // Yield to main thread every 4 photos to keep UI responsive
    if (i % 4 === 0) {
      await new Promise((r) => setTimeout(r, 8));
    }
  }

  // Phase 2: Similarity Comparison & Graph Clustering
  onProgress?.(75, 'Computing structural similarity and clustering duplicate burst sequences...');
  await new Promise((r) => setTimeout(r, 20));

  const visited = new Set<string>();
  const clusters: DuplicateCluster[] = [];
  let clusterCounter = 1;

  for (let i = 0; i < analyzedPhotos.length; i++) {
    const photoA = analyzedPhotos[i];
    if (visited.has(photoA.id)) continue;

    const clusterGroup: AnalyzedPhoto[] = [photoA];

    for (let j = i + 1; j < analyzedPhotos.length; j++) {
      const photoB = analyzedPhotos[j];
      if (visited.has(photoB.id)) continue;

      const sim = calculateSimilarity(photoA.hash, photoB.hash);
      if (sim >= similarityThreshold) {
        photoB.similarityWithBest = sim;
        clusterGroup.push(photoB);
        visited.add(photoB.id);
      }
    }

    if (clusterGroup.length > 1) {
      visited.add(photoA.id);
      const clusterId = `cluster-${clusterCounter++}`;

      // Pick the sharpest photo as the winner
      clusterGroup.sort((a, b) => b.sharpnessScore - a.sharpnessScore);
      const winner = clusterGroup[0];
      winner.isBestPick = true;
      winner.status = 'keep';
      winner.clusterId = clusterId;
      winner.similarityWithBest = 100;

      let wastedClusterBytes = 0;

      // Mark the others as duplicates to discard
      for (let k = 1; k < clusterGroup.length; k++) {
        const dup = clusterGroup[k];
        dup.isBestPick = false;
        dup.status = 'discard'; // AI suggests discarding duplicate
        dup.clusterId = clusterId;
        if (!dup.similarityWithBest) {
          dup.similarityWithBest = calculateSimilarity(winner.hash, dup.hash);
        }
        wastedClusterBytes += dup.sizeBytes;
      }

      const totalSim = clusterGroup.slice(1).reduce((acc, p) => acc + (p.similarityWithBest || 90), 0);
      const avgSim = Math.round((totalSim / (clusterGroup.length - 1)) * 10) / 10;

      clusters.push({
        id: clusterId,
        title: `Burst Cluster #${clusters.length + 1}`,
        averageSimilarity: avgSim,
        bestPickId: winner.id,
        photoIds: clusterGroup.map((p) => p.id),
        totalPhotos: clusterGroup.length,
        duplicatesCount: clusterGroup.length - 1,
        wastedBytes: wastedClusterBytes,
      });
    }
  }

  // Phase 3: Segregate Unique Photos
  onProgress?.(95, 'Synthesizing curation recommendations and storage metrics...');
  await new Promise((r) => setTimeout(r, 20));

  const uniquePhotos = analyzedPhotos.filter((p) => !p.clusterId);
  uniquePhotos.forEach((p) => {
    p.status = 'keep';
    p.isBestPick = true;
  });

  // Calculate Aggregates
  const totalDuplicates = analyzedPhotos.filter((p) => p.status === 'discard').length;
  const totalKeepers = analyzedPhotos.filter((p) => p.status === 'keep').length;
  const totalSavedBytes = analyzedPhotos
    .filter((p) => p.status === 'discard')
    .reduce((sum, p) => sum + p.sizeBytes, 0);
  const totalSavedMB = Math.round((totalSavedBytes / (1024 * 1024)) * 100) / 100;
  const totalBytesAll = analyzedPhotos.reduce((sum, p) => sum + p.sizeBytes, 0);
  const percentSaved = totalBytesAll > 0 ? Math.round((totalSavedBytes / totalBytesAll) * 100) : 0;

  onProgress?.(100, 'AI Culling & Deduplication Complete!');

  return {
    allPhotos: analyzedPhotos,
    clusters,
    uniquePhotos,
    totalPhotos: analyzedPhotos.length,
    totalDuplicates,
    totalKeepers,
    totalSavedBytes,
    totalSavedMB,
    percentSaved,
  };
};
