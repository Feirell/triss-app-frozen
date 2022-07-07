// Listing those in the dependencies, just guarantees
// that they are build and available in the distributable
// There is no actual dependency needed, but this makes it easier.

const availableExampleAgents = [
  "@triss/random-exit-driver",
  "@triss/spawn-many"
] as const;

interface Server<T> {
  registerStandardAgent(name: string): Promise<T>;
}


export function loadExampleAgent<T>(al: Server<T>, name: typeof availableExampleAgents[number]) {
  const agent = availableExampleAgents.includes(name);
  if (!agent)
    throw new Error("There is no agent with the name " + name);

  return al.registerStandardAgent(name);
}
