import {Vector3} from "three";

import {StraightPiece} from "./straight-piece";
import {PathPiece} from "./path-piece";

export function interPoint(a: Vector3, b: Vector3, val: number) {
  return a.clone().add(b.clone().sub(a).multiplyScalar(val));
}

export class CurvedPiece extends PathPiece {
  private static readonly NUMBER_OF_INTER_POINTS = 10;

  /**
   * @internal
   */
  // TODO fix typing error of inheritance

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public TYPE_PINPOINT = "CURVED_PIECE" as const;

  constructor(
    private readonly start: Vector3,
    private readonly middle: Vector3,
    private readonly end: Vector3
  ) {
    super(
      (() => {
        let last;
        const paths = [];
        // Beziér Curve 2. degree
        for (let i = 0; i < CurvedPiece.NUMBER_OF_INTER_POINTS; i++) {
          const v = i / (CurvedPiece.NUMBER_OF_INTER_POINTS - 1);
          const interA = interPoint(start, middle, v);
          const interB = interPoint(middle, end, v);
          const interFinal = interPoint(interA, interB, v);

          if (last) paths.push(new StraightPiece(last, interFinal));

          last = interFinal;
        }

        return paths;
      })()
    );
  }

  public getMiddle() {
    return this.middle;
  }
}
