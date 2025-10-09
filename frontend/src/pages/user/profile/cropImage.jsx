export default function getCroppedImg(imageSrc, crop) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
	image.crossOrigin = "anonymous";	
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = crop.width;
      canvas.height = crop.height;

      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );

      canvas.toBlob((blob) => {
        resolve(new File([blob], "cropped.jpg", { type: "image/jpeg" }));
      }, "image/jpeg");
    };
    image.onerror = reject;
  });
}
