import { Image } from "imagescript";
import { enumi, type EnumerationValue } from "@unielit/enumi";

import { Axis, LOWER_8_BIT_MASK } from "./constants.ts";
import { bilerp } from "./interpolation.ts";

export const ColorChannel = enumi("r", "g", "b", "a");
export type ColorChannel = EnumerationValue<typeof ColorChannel>;

export const colorChannels = [...ColorChannel];

export const bitOffsetByChannel = {
  [ColorChannel.R]: 24,
  [ColorChannel.G]: 16,
  [ColorChannel.B]: 8,
  [ColorChannel.A]: 0,
} as const;

function rgbaColorToChannelValue(color: number, channel: ColorChannel) {
  return (color >> bitOffsetByChannel[channel]) & LOWER_8_BIT_MASK;
}

/**
 * Performs bilinear interpolation to find the color at a fractional coordinate.
 *
 * @returns The interpolated color as a 32-bit integer (RGBA).
 */
export function interpolatePixelColor(image: Image, x: number, y: number) {
  const x1 = Math.floor(x);
  const x2 = x1 + 1;

  const y1 = Math.floor(y);
  const y2 = y1 + 1;

  function clamp(coordinate: number, axis: Axis) {
    const maxValue = (axis == Axis.X ? image.width : image.height) - 1;

    return Math.max(0, Math.min(coordinate, maxValue));
  }

  function getPixelAt(x: number, y: number) {
    return image.getPixelAt(clamp(x, Axis.X) + 1, clamp(y, Axis.Y) + 1);
  }

  const neighborPixelCoords = [
    { x: x1, y: y1 },
    { x: x2, y: y1 },
    { x: x1, y: y2 },
    { x: x2, y: y2 },
  ] as const;

  const neighborPixelColors = neighborPixelCoords.map(({ x, y }) => {
    return getPixelAt(x, y);
  });

  const dx = x - x1;
  const dy = y - y1;

  const colorChannelValues = new Uint8ClampedArray(colorChannels.length);

  for (let i = 0; i < colorChannels.length; i++) {
    const channel = colorChannels[i];

    const [c11, c21, c12, c22] = neighborPixelColors.map((color) => {
      return rgbaColorToChannelValue(color, channel);
    });

    colorChannelValues[i] = bilerp(c11, c21, c12, c22, dx, dy);
  }

  const [r, g, b, a] = colorChannelValues;

  return Image.rgbaToColor(r, g, b, a);
}
