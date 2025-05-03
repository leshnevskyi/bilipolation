export const ErrorCode = {
  Generic: 1,
  InvalidArgs: 2,
} as const;

export function normalizeError(error: unknown) {
  return error instanceof Error
    ? error
    : new Error("Non-error instance thrown", { cause: error });
}
