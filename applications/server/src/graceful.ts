import Graceful from "node-graceful/index";

import {cc} from "./global-replace-cons";

Graceful.captureExceptions = true;
Graceful.captureRejections = true;

type Fnc = () => void;

const exitListener: Fnc[] = [];

// The promise version erases the error so we only use non async functions
Graceful.on("exit", (type, param) => {
  for (const listener of exitListener) {
    try {
      listener();
    } catch (e) {
      console.error(e);
    }
  }

  if (type == "uncaughtException" || type == "unhandledRejection") {
    cc.error(param);
    throw param;
  }
});

export function appendExitListener(fnc: Fnc, dontAppendIfPresent = true) {
  if (dontAppendIfPresent && exitListener.includes(fnc)) return;

  exitListener.push(fnc);
}
