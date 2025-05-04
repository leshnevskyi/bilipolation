export type MessageToResizingWorker = {
  encodedImage: Uint8Array<ArrayBufferLike>;
  targetWidth: number;
  scale: number;
  yStart: number;
  yEnd: number;
};

export type MessageFromResizingWorker = {
  yStart: number;
  pixelColors: Uint32Array;
};
