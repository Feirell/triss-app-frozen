import {LayoutStateDTO} from "@triss/dto";

import {RegisteredLayout} from "@triss/entities";

import {sampleLayout} from "@triss/sample-layout";
import {miniLayout} from "@triss/mini-layout";
import {generateLayout} from "@triss/generated-layout";
import {emptyLayout} from "@triss/empty-layout";
import {createSpawnerGrate} from "@triss/spawner-grate";
import {createCheeseGrate} from "@triss/chees-grate";


const layouts = [
  {
    name: "Empty Layout",
    description: "Just an empty map.",
    layout: () => emptyLayout()
  },
  {
    name: "Mini Layout",
    description:
      "This is a rather simple basic setup which uses all kind of tiles and provides multiple de-/spawners.",
    layout: () => miniLayout()
  },
  {
    name: "Sample Layout",
    description: "This is a sample layout.",
    layout: () => sampleLayout()
  },
  {
    name: "Generated (small)",
    description: "Generate a layout with wave solve.",
    layout: () => generateLayout(10)
  },
  {
    name: "Generated (medium)",
    description: "Generate a layout with wave solve.",
    layout: () => generateLayout(25)
  },
  {
    name: "Generated (huge)",
    description: "Generate a layout with wave solve.",
    layout: () => generateLayout(50)
  },
  {
    name: "Generated (enormous)",
    description: "Generate a layout with wave solve.",
    layout: () => generateLayout(100)
  },
  {
    name: "Cheese Grate (small)",
    description: "This layout is cheese.",
    layout: () => createCheeseGrate(11)
  },
  {
    name: "Cheese Grate (medium)",
    description: "This layout is cheese.",
    layout: () => createCheeseGrate(25)
  },
  {
    name: "Cheese Grate (huge)",
    description: "This layout is cheese.",
    layout: () => createCheeseGrate(51)
  },
  {
    name: "Spawner Grate (small)",
    description: "This is a grate of spawner for maximum vehicle spawning.",
    layout: () => createSpawnerGrate(11)
  },
  {
    name: "Spawner Grate (medium)",
    description: "This is a grate of spawner for maximum vehicle spawning.",
    layout: () => createSpawnerGrate(25)
  },
  {
    name: "Spawner Grate (huge)",
    description: "This is a grate of spawner for maximum vehicle spawning.",
    layout: () => createSpawnerGrate(51)
  }
] as const;

interface RegisterObject {
  createLayout(name: string, description: string, layout: LayoutStateDTO): RegisteredLayout;
}

export function loadExampleLayout(server: RegisterObject, name: typeof layouts[number]["name"]) {
  const layout = layouts.find(l => l.name == name);

  if (!layout) throw new Error("The layout name \"" + name + "\" is unkown");

  return server.createLayout(layout.name, layout.description, layout.layout());
}

export function loadAllExampleLayouts(server: RegisterObject) {
  for (const layout of layouts)
    server.createLayout(layout.name, layout.description, layout.layout());
}
