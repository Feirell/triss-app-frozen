export interface TileEntry {
  size: number;
}

export interface TagEntry {
  size: number;
}

type Vector3 = [number, number, number];

export interface Dimensions {
  min: Vector3;
  max: Vector3;
}

export interface VehicleEntry {
  size: number;
  dimensions: Dimensions;
}
