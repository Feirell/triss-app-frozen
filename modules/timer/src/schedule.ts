export const schedule = (fnc: () => void | Promise<void>, timeout = 0) => {
  return setTimeout(() => {
    try {
      const call = fnc();
      if (typeof call == "object" && "catch" in call)
        call.catch(e => {
          console.error(e);
          process.exit(1);
        });
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }, timeout);
};

export const doNextLoop = (fnc: () => void | Promise<void>) => schedule(fnc);
