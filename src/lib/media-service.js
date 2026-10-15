export const MAX_IMAGE_BYTES = 256 * 1024;
export function validateImageFile(file) {
  if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return "Choose a JPEG, PNG or WebP image.";
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES)
    return "Choose an image between 1 byte and 256 KB. Resize or compress it first.";
  return "";
}
export async function readLocalImage(file) {
  const error = validateImageFile(file);
  if (error) throw new Error(error);
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every(
    (value, index) => bytes[index] === value,
  );
  const webp =
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (
    !(
      (file.type === "image/jpeg" && jpeg) ||
      (file.type === "image/png" && png) ||
      (file.type === "image/webp" && webp)
    )
  )
    throw new Error("The file contents do not match its image type.");
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject(new Error("The image could not be read. Try another file."));
    reader.readAsDataURL(file);
  });
  await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = () =>
      reject(new Error("This image cannot be decoded. Try another file."));
    image.src = data;
  });
  return data;
}
