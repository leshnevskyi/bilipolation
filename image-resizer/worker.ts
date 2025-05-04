import { Image } from "imagescript";

import { interpolatePixelColor } from "../colors.ts";
import type { MessageToResizingWorker } from "./types.ts";

export function scaleCenteredCoordinate(coordinate: number, scale: number) {
  return (coordinate + 0.5) / scale - 0.5;
}

self.onmessage = async (event: MessageEvent<MessageToResizingWorker>) => {
  const { encodedImage, targetWidth, scale, yStart, yEnd } = event.data;
  const image = await Image.decode(encodedImage);
  const rowCount = yEnd - yStart;
  const pixelCount = rowCount * targetWidth;
  const pixelColors = new Uint32Array(pixelCount);
  let currPixelIndex = 0;

  for (let y = yStart; y < yEnd; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const sx = scaleCenteredCoordinate(x, scale);
      const sy = scaleCenteredCoordinate(y, scale);
      const color = interpolatePixelColor(image, sx, sy);

      pixelColors[currPixelIndex++] = color >>> 0;
    }
  }

  self.postMessage({ yStart, pixelColors }, [pixelColors.buffer]);
};
