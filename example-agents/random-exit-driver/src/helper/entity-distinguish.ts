import {Tag, Tile} from "@triss/entities";

export const isTag = (val: any): val is Tag => typeof val == "object" && val instanceof Tag;

export const isTile = (val: any): val is Tile => typeof val == "object" && val instanceof Tile;
