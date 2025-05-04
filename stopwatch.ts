export type StopwatchOptions = {
  startImmediately?: boolean;
};

export class Stopwatch {
  #startTimeStampMs = 0;

  constructor({ startImmediately = false }: StopwatchOptions = {}) {
    if (startImmediately) {
      this.start();
    }
  }

  start() {
    this.#startTimeStampMs = performance.now();
  }

  stop() {
    return performance.now() - this.#startTimeStampMs;
  }
}
