import "source-map-support/register";

import {Server} from "./server/server";
import {loadExampleLayout} from "@triss/example-layouts-loader";
import {loadExampleAgent} from "@triss/example-agents-loader";

import {RealmController} from "@triss/server-realm-spawn-interface";

export default async function start(rc: RealmController) {

  const server = await Server.createWithOwnAgentLoader(rc);

  const red = await loadExampleAgent(server, "@triss/random-exit-driver");
  const sm = await loadExampleAgent(server, "@triss/spawn-many");

  const emptyLayout = loadExampleLayout(server, "Empty Layout");
  const miniLayout = loadExampleLayout(server, "Mini Layout");
  loadExampleLayout(server, "Sample Layout");

  const generatedLayout = loadExampleLayout(server, "Generated (small)");
  loadExampleLayout(server, "Generated (medium)");
  loadExampleLayout(server, "Generated (huge)");
  loadExampleLayout(server, "Generated (enormous)");

  loadExampleLayout(server, "Cheese Grate (small)");
  loadExampleLayout(server, "Cheese Grate (medium)");
  loadExampleLayout(server, "Cheese Grate (huge)");

  loadExampleLayout(server, "Spawner Grate (small)");
  loadExampleLayout(server, "Spawner Grate (medium)");
  loadExampleLayout(server, "Spawner Grate (huge)");

  const pairings = [
    [emptyLayout, sm],
    [miniLayout, red],
    [generatedLayout, red]
  ] as const;

  for (const [layout, agent] of pairings)
    await server.createSimulation(
      layout.name + " Simulation",
      "This simulation " + "combines the " + agent.name + " and the " + layout.name + ".",
      agent.id,
      layout.id
    );
}
