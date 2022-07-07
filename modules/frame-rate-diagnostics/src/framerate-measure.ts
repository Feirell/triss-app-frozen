import performance from "@triss/performance";

const centi = (() => {
  const frmt = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (nr: number) => frmt.format(nr);
})();

const callsSec = (calls: number, duration: number) => centi(calls / (duration / 1000)) + "calls/s";

const msCall = (calls: number, duration: number) => centi(duration / calls) + "ms/calls";

type ArrType = {start: number; end: number}[];

const intRange = (min: number, v: number, max: number) => {
  if (!Number.isInteger(v)) throw new Error("v needs to be an integer");

  if (v < min) return min;
  else if (v > max) return max;
  else return v;
};

export const createMeasureFrameRate = (
  actionName: string,
  minimumMeasurements = 30,
  maximumTimeFrame = 10 * 1000
) => {
  const maxS = 5 * 60;
  minimumMeasurements = intRange(4, minimumMeasurements, 60 * maxS);
  maximumTimeFrame = intRange(1000, maximumTimeFrame, 1000 * maxS);

  let a: ArrType = [];

  const trim = () => {
    if (a.length <= minimumMeasurements) return;

    let cutAt = 0;
    const minimumTime = a[a.length - 1].end - maximumTimeFrame;
    for (let i = 0; i < a.length - minimumMeasurements; i++) {
      if (a[i].end < minimumTime) cutAt = i;
      else break;
    }

    if (cutAt != 0) a = a.slice(cutAt);
  };

  const addMeasure = (start: number, end: number) => {
    a.push({start, end});
    trim();
  };

  const measureTime = (action: () => void) => {
    const start = performance.now();
    action();
    const end = performance.now();

    addMeasure(start, end);
  };

  const generateLog = () => {
    if (a.length < 2) return "gathering measurements for action " + actionName;

    let executionDurationCalls = 0;
    let executionDurationSum = 0;

    const startTimePeriod = a[0].end;
    const endTimePeriod = a[a.length - 1].end;
    let callsInTimePeriod = 0;
    const period = endTimePeriod - startTimePeriod;

    for (let i = 0; i < a.length; i++) {
      const {start, end} = a[i];

      const inverseIndex = a.length - i - 1;
      if (inverseIndex < minimumMeasurements) {
        executionDurationCalls++;
        executionDurationSum += end - start;
      }

      if (i > 0) callsInTimePeriod++;
    }

    return (
      actionName +
      " average over " +
      executionDurationCalls +
      " calls is " +
      msCall(executionDurationCalls, executionDurationSum) +
      " (" +
      callsSec(executionDurationCalls, executionDurationSum) +
      "), " +
      callsInTimePeriod +
      " calls in the last " +
      centi(period) +
      " seconds which is " +
      callsSec(callsInTimePeriod, period)
    );
  };

  return {addMeasure, measureTime, generateLog};
};
