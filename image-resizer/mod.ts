import { Image } from "imagescript";
import { err, ok } from "neverthrow";

import type { MessageFromResizingWorker } from "./types.ts";

export async function resizeImage(
  image: Image,
  scale: number,
  workerCount: number
) {
  if (scale <= 0) {
    return err("Invalid scale: Positive number required");
  }

  if (scale == 1) {
    return ok(image.clone());
  }

  const targetWidth = Math.round(image.width * scale);
  const targetHeight = Math.round(image.height * scale);
  const outputImage = new Image(targetWidth, targetHeight);

  const workers = Array.from({ length: workerCount }, () => {
    return new Worker(new URL("./worker.ts", import.meta.url).href, {
      type: "module",
    });
  });

  const rowCountPerWorker = Math.ceil(targetHeight / workerCount);
  const encodedImage = await image.encode();

  const messagePromises = workers.map((worker, index) => {
    const yStart = index * rowCountPerWorker;
    const yEnd = Math.min((index + 1) * rowCountPerWorker, targetHeight);

    worker.postMessage({ encodedImage, targetWidth, scale, yStart, yEnd });

    return new Promise<MessageFromResizingWorker>((resolve) => {
      worker.onmessage = (event) => resolve(event.data);
    });
  });

  for (const { yStart, pixelColors } of await Promise.all(messagePromises)) {
    for (let i = 0; i < pixelColors.length; i++) {
      const x = i % targetWidth;
      const y = Math.floor(i / targetWidth) + yStart;

      outputImage.setPixelAt(x + 1, y + 1, pixelColors[i]);
    }
  }

  for (const worker of workers) {
    worker.terminate();
  }

  return ok(outputImage);
}
