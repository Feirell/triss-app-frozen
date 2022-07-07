import {Performance} from "node:perf_hooks";

export default ((): Performance => {
  const g = Function("return this;")();

  if (typeof g != "object" || g === null)
    throw new Error("Could not get the global/window object");

  if (!("performance" in g))
    throw new Error("The global object does not have the performance attribute");

  return g.performance;
})();
