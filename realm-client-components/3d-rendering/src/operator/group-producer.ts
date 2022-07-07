import {Group, Object3D} from "three";

import {createGroupCache} from "../caches/group-cache";

import {Operator} from "./operator";

export type SceneProducerInput = {
  [key: string]: Object3D[];
};

export type SceneProducerOutput = Group[];

export class GroupProducer extends Operator<SceneProducerInput, SceneProducerOutput> {
  private groupCache = createGroupCache();

  process(args: SceneProducerInput): SceneProducerOutput {
    const groups: Group[] = [];

    this.groupCache.markAllUnused();

    for (const [key, value] of Object.entries(args)) {
      const group = this.groupCache.getOrProduce(key);
      group.name = key;

      for (const mesh of value) group.add(mesh);

      groups.push(group);
    }

    this.groupCache.removeAllUnused();

    return groups;
  }
}
