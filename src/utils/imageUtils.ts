/**
 * Utility functions for robust image compression, mobile camera handling,
 * and reliable fallback avatars across iOS Safari, Android Chrome, and Desktop.
 */

// Safe fallback avatar (SVG inline data URI - 100% offline & mobile reliable)
export const DEFAULT_PATIENT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="%230f766e"><circle cx="64" cy="64" r="64" fill="%23ccfbf1"/><path d="M64 24a24 24 0 1 0 0 48 24 24 0 0 0 0-48zm0 56c-26.7 0-50 14.3-50 38v10h100v-10c0-23.7-23.3-38-50-38z" fill="%230f766e"/></svg>`;

export const DEFAULT_VISIT_PHOTO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" fill="%23f1f5f9"><rect width="400" height="300" fill="%23f1f5f9"/><path d="M160 130a30 30 0 1 0 0-60 30 30 0 0 0 0 60zm-80 120h240l-75-100-60 80-45-60-60 80z" fill="%2394a3b8"/></svg>`;

/**
 * Compresses an image File (e.g. from camera or photo library on mobile)
 * to a lightweight, permanent Base64 Data URL (JPEG).
 * Solves the issue where blob URLs or multi-megabyte camera photos fail to display on mobile devices.
 */
export function compressImageFile(
  file: File,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve) => {
    // If not an image, fallback to empty or raw read
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || DEFAULT_PATIENT_AVATAR);
      reader.onerror = () => resolve(DEFAULT_PATIENT_AVATAR);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Proportional resize
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        // Fill white background for transparent PNGs
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compact JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = () => {
        // Fallback to raw data url if canvas fails
        resolve((readerEvent.target?.result as string) || DEFAULT_PATIENT_AVATAR);
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => {
      resolve(DEFAULT_PATIENT_AVATAR);
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Handle image error gracefully to prevent broken image icons on mobile
 */
export function handleImageFallback(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback = DEFAULT_PATIENT_AVATAR
) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = fallback;
}
