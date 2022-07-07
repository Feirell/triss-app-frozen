import {Vector3} from "three";

import {
  ArraySerializer,
  createTransformSerializer,
  FLOAT32_SERIALIZER,
  SwitchSerializer,
  VectorSerializer
} from "serialization-generator";

import {CurvedPiece, PathPiece, Piece, StraightPiece} from "@triss/path-definition";

const VECTOR_3_SERIALIZER = createTransformSerializer<Vector3, [number, number, number]>(
  val => [val.x, val.y, val.z],
  arr => new Vector3(arr[0], arr[1], arr[2]),
  new VectorSerializer(FLOAT32_SERIALIZER, 3)
);

export const CURVED_PIECE_SERIALIZER = createTransformSerializer<CurvedPiece,
  [Vector3, Vector3, Vector3]>(
  // any cast since the members are private
  val => [(val as any).start, (val as any).middle, (val as any).end],
  val => new CurvedPiece(val[0], val[1], val[2]),
  new VectorSerializer(VECTOR_3_SERIALIZER, 3)
);

export const STRAIGHT_PIECE_SERIALIZER = createTransformSerializer<StraightPiece,
  [Vector3, Vector3]>(
  // any cast since the members are private
  val => [(val as any).start, (val as any).end],
  val => new StraightPiece(val[0], val[1]),
  new VectorSerializer(VECTOR_3_SERIALIZER, 2)
);

export const PIECE_SERIALIZER = new SwitchSerializer<StraightPiece | CurvedPiece | PathPiece>();

export const PATH_PIECE_SERIALIZER = createTransformSerializer<PathPiece, Piece[]>(
  v => (v as any).pieces,
  arr => new PathPiece(arr),
  new ArraySerializer(PIECE_SERIALIZER)
);

const isPathPiece = (val: any): val is PathPiece => val instanceof PathPiece;
const isCurvedPiece = (val: any): val is CurvedPiece => val instanceof CurvedPiece;
const isStraightPiece = (val: any): val is StraightPiece => val instanceof StraightPiece;

PIECE_SERIALIZER.register(isPathPiece, PATH_PIECE_SERIALIZER)
  .register(isCurvedPiece, CURVED_PIECE_SERIALIZER)
  .register(isStraightPiece, STRAIGHT_PIECE_SERIALIZER)
  .finalize();
