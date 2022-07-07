import {TileDTO} from "./tile";
import {TagDTO} from "./tag";

export interface LayoutStateDTO {
  category: "LayoutStateDTO";

  tiles: TileDTO[];
  tags: TagDTO[];
}
