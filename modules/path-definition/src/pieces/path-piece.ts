import {Matrix4, Object3D, Vector3} from "three";

import {Piece} from "./piece";

export class PathPiece implements Piece {
  /**
   * @internal
   */
  public TYPE_PINPOINT = "PATH_PIECE" as const;

  private readonly length: number;
  private readonly points: Vector3[];

  constructor(private pieces: Piece[]) {
    let lastEnd = pieces[0].getEnd();
    for (let i = 1; i < pieces.length; i++)
      if (lastEnd.clone().sub(pieces[i].getStart()).length() < 0.01) lastEnd = pieces[i].getEnd();
      else {
        // console.log(lastEnd, pieces[i].getStart());
        throw new Error(
          "The path is not continuous, all parts must start where the last one ended."
        );
      }

    this.length = this.pieces.reduce((sum, piece) => sum + piece.getLength(), 0);

    this.points = [this.pieces[0].getStart()];
    const addPathPieces = (pieces: Piece[]) => {
      for (const p of pieces)
        if (p instanceof PathPiece) addPathPieces(p.getPieces());
        else this.points.push(p.getEnd());
    };

    addPathPieces(pieces);
  }

  getPieces() {
    return this.pieces;
  }

  getPoints() {
    return this.points;
  }

  getStart(): Vector3 {
    return this.pieces[0].getStart();
  }

  getEnd(): Vector3 {
    return this.pieces[this.pieces.length - 1].getEnd();
  }

  getPositionOnPathPercentage(perc: number) {
    if (perc < 0) throw new Error("perc needs to be >= 0");

    if (perc > 1) {
      // TODO REMOVE FIX

      if (1 - perc < 1e-5) perc = 1;
      else throw new Error("perc needs to be <= 1");
    }

    return this.getPositionOnPathDistance(perc * this.getLength());
  }

  getPositionOnPathDistance(n: number): Vector3 {
    if (n < 0) throw new Error("the distance needs to be greater or equal to zero");

    let segmentReachesTo = 0;
    for (let i = 0; i < this.pieces.length; i++) {
      const piece = this.pieces[i];
      const pieceLength = piece.getLength();
      if (n <= segmentReachesTo + pieceLength) {
        const percOfPiece = (n - segmentReachesTo) / pieceLength;
        return piece.getPositionOnPathPercentage(percOfPiece);
      }

      segmentReachesTo += pieceLength;
    }

    throw new Error("the distance needs to be smaller or equal to the length of the path");
  }

  getLength(): number {
    return this.length;
  }

  createTransformed(transform: Object3D | Matrix4): PathPiece {
    return new PathPiece(this.getPieces().map(p => p.createTransformed(transform)));
  }
}
