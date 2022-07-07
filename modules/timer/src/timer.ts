import {doNextLoop, schedule} from "./schedule";

interface FunctionToRepeat {
  (callNr: number, actualTime: number, desiredTime: number): Promise<void> | void;
}

export class SelfAligningRepeater {
  private state: "running" | "stopped" = "stopped";
  private startTime: undefined | number = undefined;
  private calls = 0;

  private timeoutId: undefined | number = undefined;

  constructor(
    private readonly next: FunctionToRepeat,
    private readonly skipped: FunctionToRepeat,
    private readonly loopTime: number
  ) {
  }

  start() {
    if (this.state == "running") return false;

    doNextLoop(() => this.executeFunction());
    return true;
  }

  stop() {
    if (this.timeoutId !== undefined) {
      clearTimeout(this.timeoutId as any);
      this.timeoutId = undefined;
    }

    this.calls = 0;
    this.startTime = undefined;
    return true;
  }

  private async executeFunction() {
    const now = Date.now();

    if (this.startTime == undefined) {
      this.calls = 0;
      this.startTime = now;
    }

    const timeDiff = now - this.startTime;
    const shouldBeCall = Math.round(timeDiff / this.loopTime);

    while (shouldBeCall > this.calls) {
      await this.skipped.call(
        undefined,
        this.calls,
        now,
        this.startTime + this.calls * this.loopTime
      );
      this.calls++;
    }

    await this.next.call(undefined, this.calls, now, this.startTime + this.calls * this.loopTime);

    this.calls++;
    this.scheduleFor(this.startTime + this.calls * this.loopTime);
  }

  private scheduleFor(ts: number) {
    if (this.timeoutId !== undefined) {
      clearTimeout(this.timeoutId as any);
      this.timeoutId = undefined;
    }

    const delta = Math.round(ts - Date.now());
    this.timeoutId = schedule(() => this.executeFunction(), delta) as any;
  }
}

export class ThrottledProducerWithBuffer<K,
  Producer extends () => K = () => K,
  Consumer extends (val: K) => void = (val: K) => void> {
  private bufferQueue: K[] = [];

  private sar;

  constructor(
    private producer: Producer,
    private consumer: Consumer,
    private keepBuffered = 5,
    private timeout = 1000 / 60
  ) {
    this.refillBuffer();

    this.sar = new SelfAligningRepeater(
      this.pushValue.bind(this),
      this.skipValue.bind(this),
      this.timeout
    );
  }

  start() {
    this.sar.start();
  }

  stop() {
    this.sar.stop();
  }

  refillBuffer() {
    while (this.bufferQueue.length < this.keepBuffered) this.bufferQueue.push(this.producer());
  }

  private skipValue() {
    this.bufferQueue.shift();

    doNextLoop(this.refillBuffer.bind(this));
  }

  private pushValue() {
    if (this.bufferQueue.length == 0) throw new Error("there is no value left to push");

    const val = this.bufferQueue.shift()!;
    this.consumer(val);

    doNextLoop(this.refillBuffer.bind(this));
  }
}
