/**
 * Comprime una imagen en el cliente antes de subirla
 * @param file Archivo original
 * @param maxWidth Ancho máximo en píxeles
 * @param quality Calidad 0.0 a 1.0
 */
export async function compressImage(file: File, maxWidth = 1200, quality = 0.7): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Error al comprimir imagen'));
          },
          'image/jpeg',
          quality
        );
      };
    };
    reader.onerror = (error) => reject(error);
  });
}
