const internalBreadthWalker = <Node extends object>(
  remaining: Node[][],
  visited: Set<Node>,
  shouldStop: (node: Node, path: Node[]) => boolean,
  getConnected: (node: Node) => Node[]
): undefined => {
  const path = remaining.shift();
  if (!path) return;

  const node = path[path.length - 1];

  if (shouldStop(node, path)) return;

  for (const next of getConnected(node))
    if (!visited.has(next)) {
      visited.add(next);
      remaining.push(path.concat(next));
    }

  return internalBreadthWalker(remaining, visited, shouldStop, getConnected);
};

export const breadthWalker = <Node extends object>(
  start: Node,
  shouldStop: (node: Node, path: Node[]) => boolean,
  getConnected: (node: Node) => Node[]
) => internalBreadthWalker([[start]], new Set([start]), shouldStop, getConnected);
