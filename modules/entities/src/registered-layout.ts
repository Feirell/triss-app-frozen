import {RegisteredLayoutDTO} from "@triss/dto";

import {Tile} from "./tile";
import {Tag} from "./tag";

const idGenerator = (() => {
  let id = 0;

  const nextId = () => id++;

  return {nextId};
})();

export class RegisteredLayout {
  public readonly id = idGenerator.nextId();

  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly tags: Tag[],
    public readonly tiles: Tile[]
  ) {
  }

  getSerializeData(): RegisteredLayoutDTO {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      tags: this.tags.map(t => t.getSerializeData()),
      tiles: this.tiles.map(t => t.getSerializeData())
    };
  }
}
