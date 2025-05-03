import { Image } from "imagescript";
import { err, ok } from "neverthrow";
import { interpolatePixelColor } from "./colors.ts";

export function scaleCenteredCoordinate(coordinate: number, scale: number) {
  return (coordinate + 0.5) / scale - 0.5;
}

export function resizeImage(image: Image, scale: number) {
  if (scale <= 0) {
    return err("Invalid scale: Positive number required");
  }

  if (scale == 1) {
    return ok(image.clone());
  }

  const targetWidth = Math.round(image.width * scale);
  const targetHeight = Math.round(image.height * scale);
  const outputImage = new Image(targetWidth, targetHeight);

  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const sourceX = scaleCenteredCoordinate(x, scale);
      const sourceY = scaleCenteredCoordinate(y, scale);
      const color = interpolatePixelColor(image, sourceX, sourceY);
      outputImage.setPixelAt(x + 1, y + 1, color);
    }
  }

  return ok(outputImage);
}
