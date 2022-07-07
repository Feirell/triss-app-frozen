import {useMemo} from "react";

// TODO There is a memory leak in here!
//  useMemo is also called in an internal render run of react which has disabled console.log.
//  The constructor is called twice but the first time the useEffect is not called since it is only a test run.
//  This means that the cleanup call is not done. This is in terms of react correct, since the useMemo call should be
//  without side effect and such a call would not need a clean up.
//  In this specific case it is bad, since I can not definitively destroy the corresponding Canvas or the internal listeners.
//  Sadly this can't be helped. The only option is to move the construction into useEffect, which results in the useInstance
//  to change its return signature to T | undefined. This is because useEffect is asynchrone and therefore will not produce
//  a value for the initial call to useInstance but only one after the internal useState was called.
//  Currently the consumer for useInstance can not handle this new return type which is why I did not change it

export const useInstance = <T extends object>(constructor: () => T) =>
  useMemo(constructor, [constructor]);
