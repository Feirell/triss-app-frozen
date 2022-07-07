import {TileDTO} from "./tile";
import {TagDTO} from "./tag";

export interface RegisteredLayoutDTO {
  id: number;
  name: string;
  description: string;
  tiles: TileDTO[];
  tags: TagDTO[];
}
