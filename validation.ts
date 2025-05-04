import { err, ok } from "neverthrow";

export function validatePositiveNumber(value: unknown) {
  if (typeof value != "number") {
    return err("Not a number");
  } else if (Number.isNaN(value)) {
    return err("Number is NaN");
  } else if (!Number.isFinite(value)) {
    return err("Number is not finite");
  } else if (value == 0) {
    return err("Number is zero");
  } else if (value < 0) {
    return err("Number is negative");
  } else {
    return ok(value);
  }
}
