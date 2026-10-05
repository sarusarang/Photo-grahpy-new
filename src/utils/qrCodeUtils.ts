/**
 * QR Code Sharing & Download Utilities
 * Provides high-res PNG download, native file sharing, and clipboard image copying.
 */

export const sanitizeFilename = (name: string): string => {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'ex-share-qr'
  );
};

/**
 * Downloads a canvas element as a high-resolution PNG image.
 */
export const downloadQrCanvas = (
  canvas: HTMLCanvasElement | null,
  filename = 'ex-share-qr-code.png'
): boolean => {
  if (!canvas) return false;
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('Failed to download QR canvas:', err);
    return false;
  }
};

export interface ShareQrOptions {
  title: string;
  text?: string;
  url?: string;
  filename?: string;
  onToast?: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void;
}

/**
 * Shares the QR code image via native Web Share API (with file attachment),
 * or falls back to copying the image to clipboard or downloading.
 */
export const shareQrImage = async (
  canvas: HTMLCanvasElement | null,
  options: ShareQrOptions
): Promise<boolean> => {
  if (!canvas) return false;

  const {
    title,
    text = `Scan this QR Code to open ${title}`,
    url,
    filename = 'qr-code.png',
    onToast,
  } = options;

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        onToast?.('Sharing Failed', 'Could not generate QR code image.', 'error');
        resolve(false);
        return;
      }

      const cleanName = filename.endsWith('.png') ? filename : `${filename}.png`;
      const file = new File([blob], cleanName, { type: 'image/png' });

      // 1. Try Native Web Share API with File (Mobile devices, macOS Safari, Android)
      if (
        typeof navigator !== 'undefined' &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: `${title} — QR Code`,
            text,
            url,
          });
          onToast?.('QR Code Shared', 'Shared successfully via apps.', 'success');
          resolve(true);
          return;
        } catch (err: unknown) {
          if ((err as Error)?.name === 'AbortError') {
            resolve(false);
            return;
          }
          console.warn('Native file share failed, falling back:', err);
        }
      }

      // 2. Try Copying Image Directly to Clipboard
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ]);
          onToast?.(
            'QR Image Copied!',
            'QR Code image copied to clipboard. You can paste it directly into chats, emails, or docs.',
            'success'
          );
          resolve(true);
          return;
        } catch (clipErr) {
          console.warn('Clipboard image write failed, falling back to download:', clipErr);
        }
      }

      // 3. Fallback: Download the QR Code image
      const downloaded = downloadQrCanvas(canvas, cleanName);
      if (downloaded) {
        onToast?.(
          'QR Code Downloaded',
          'QR code image saved to your device.',
          'success'
        );
        resolve(true);
      } else {
        onToast?.('Sharing Failed', 'Could not share or download QR code.', 'error');
        resolve(false);
      }
    }, 'image/png');
  });
};

/**
 * Copies the QR code canvas image directly to the system clipboard as a PNG.
 */
export const copyQrImageToClipboard = async (
  canvas: HTMLCanvasElement | null,
  onToast?: (title: string, message: string, type?: 'success' | 'warning' | 'error') => void
): Promise<boolean> => {
  if (!canvas) return false;

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        onToast?.('Copy Failed', 'Could not generate QR image data.', 'error');
        resolve(false);
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ]);
          onToast?.(
            'QR Code Image Copied',
            'Image copied to clipboard! Paste it into WhatsApp, Slack, emails, or docs.',
            'success'
          );
          resolve(true);
          return;
        } catch (err) {
          console.warn('ClipboardItem failed:', err);
        }
      }

      onToast?.(
        'Clipboard Not Supported',
        'Your browser does not allow direct image copying. Please use the Download button.',
        'warning'
      );
      resolve(false);
    }, 'image/png');
  });
};
