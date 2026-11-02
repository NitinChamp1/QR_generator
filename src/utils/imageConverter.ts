export interface ImageConversionOptions {
  format: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/bmp' | 'image/x-icon';
  quality?: number; // 0.1 to 1.0
  maxWidth?: number;
  maxHeight?: number;
  maintainAspectRatio?: boolean;
}

export function getExtensionForMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/bmp':
      return 'bmp';
    case 'image/gif':
      return 'gif';
    case 'image/x-icon':
      return 'ico';
    case 'image/svg+xml':
      return 'svg';
    default:
      return 'png';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function convertImage(
  file: File,
  options: ImageConversionOptions
): Promise<{ blob: Blob; url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let targetWidth = img.naturalWidth;
      let targetHeight = img.naturalHeight;

      if (options.maxWidth && options.maxWidth < targetWidth) {
        if (options.maintainAspectRatio !== false) {
          targetHeight = Math.round((options.maxWidth / targetWidth) * targetHeight);
        }
        targetWidth = options.maxWidth;
      }

      if (options.maxHeight && options.maxHeight < targetHeight) {
        if (options.maintainAspectRatio !== false) {
          targetWidth = Math.round((options.maxHeight / targetHeight) * targetWidth);
        }
        targetHeight = options.maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // If converting to JPEG or BMP, fill white background to avoid black transparency
      if (options.format === 'image/jpeg' || options.format === 'image/bmp') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Handle standard browser canvas export
      const targetMime = options.format === 'image/x-icon' ? 'image/png' : options.format;
      const quality = options.quality ?? 0.92;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas export failed'));
            return;
          }
          const url = URL.createObjectURL(blob);
          resolve({ blob, url, width: targetWidth, height: targetHeight });
        },
        targetMime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image file'));
    };

    img.src = objectUrl;
  });
}
