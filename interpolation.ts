/**
 * Performs linear interpolation between two values `a` and `b` using the factor `dx`.
 *
 * @param a The start value (when dx = 0).
 * @param b The end value (when dx = 1).
 * @param dx The interpolation factor between 0 and 1.
 * @returns The interpolated value between `a` and `b`.
 */
export function lerp(a: number, b: number, dx: number) {
  return a + (b - a) * dx;
}
/**
 * Performs bilinear interpolation between four corner values.
 *
 * @param a The top-left corner value.
 * @param b The top-right corner value.
 * @param c The bottom-left corner value.
 * @param d The bottom-right corner value.
 * @param dx The horizontal interpolation factor (0 to 1).
 * @param dy The vertical interpolation factor (0 to 1).
 * @returns The bilinearly interpolated value.
 */
export function bilerp(
  a: number,
  b: number,
  c: number,
  d: number,
  dx: number,
  dy: number
) {
  return lerp(lerp(a, b, dx), lerp(c, d, dx), dy);
}
