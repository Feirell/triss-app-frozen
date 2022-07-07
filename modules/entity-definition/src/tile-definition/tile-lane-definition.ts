import {Matrix4, Object3D, Vector3} from "three";

import {Piece} from "@triss/path-definition";

// const asphalt = getComponentOfTile(tile, 'asphalt');
// if (!asphalt)
//     throw new Error('asphalt could not be found');
//
// const asphaltGeo = asphalt.geometry as THREE.BoxBufferGeometry;
// const bb = asphaltGeo.boundingBox;
// if (!bb)
//     throw new Error('asphalt has no bounding box');
//
// const height = bb.getSize(new Vector3()).y;
// const centerY = bb.getCenter(new Vector3()).y;
// const asphaltLevel = centerY + height * .5;

const frm = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3,
  minimumFractionDigits: 3,
}).format;
const formatVector = (vec: Vector3) =>
  "Vector3{" + frm(vec.x) + ", " + frm(vec.y) + ", " + frm(vec.z) + "}";

export class TileLaneDefinition {
  constructor(private readonly lanes: Piece[], private readonly laneDelimiter: Piece[]) {}

  getLanes() {
    return this.lanes;
  }

  getLaneDelimiter() {
    return this.laneDelimiter;
  }

  createTransformed(transform: Object3D | Matrix4): TileLaneDefinition {
    if ("matrixWorld" in transform) transform = transform.matrixWorld;

    return new TileLaneDefinition(
      this.lanes.map(l => l.createTransformed(transform)),
      this.laneDelimiter.map(ld => ld.createTransformed(transform))
    );
  }

  // visualizeDefinition(tile: PlacedTile, visualizeEndpoints = false) {
  //     if (this.lanes.length == 0 && this.lanes.length == 0)
  //         return;
  //
  //     /* TODO
  //         this is really resource intensive since this will create one object
  //         apply transformation for all attributes
  //         and then return one value (.createTransformed)
  //     */
  //
  //     const tileModel = tile.getTileModel();
  //
  //     if (visualizeEndpoints) {
  //         let laneCounter = 0;
  //         for (const lane of this.lanes) {
  //
  //             const startAnno = new Annotation();
  //             startAnno.setWorldPosition(() => lane.createTransformed(tileModel).getStart());
  //             startAnno.setText('lane start: ' + laneCounter + '\nPos: ' + formatVector(lane.getStart()));
  //
  //             const endAnno = new Annotation();
  //             endAnno.setWorldPosition(() => lane.createTransformed(tileModel).getEnd());
  //             endAnno.setText('lane end: ' + laneCounter + '\nPos: ' + formatVector(lane.getEnd()));
  //
  //             laneCounter++;
  //         }
  //     }
  //
  //     for (const group of ['lanes', 'laneDelimiter']) {
  //         // just to combine the display, since lane separator and lane can be rendered the same way
  //         let groupArray: Piece[]
  //         let color: number;
  //
  //         if (group == 'lanes') {
  //             groupArray = this.lanes;
  //             color = 0xFF00FF;
  //         } else {
  //             groupArray = this.laneDelimiter;
  //             color = 0x00FFFF;
  //         }
  //
  //         for (const lane of groupArray) {
  //             let lineGeo: BufferGeometry;
  //
  //             if (lane instanceof StraightPiece) {
  //                 const start = lane.getStart();
  //                 const end = lane.getEnd();
  //
  //                 lineGeo = new BufferGeometry()
  //                     .setFromPoints([start, end]);
  //             } else if (lane instanceof PathPiece) {
  //                 lineGeo = new BufferGeometry()
  //                     .setFromPoints(lane.getPoints())
  //             } else
  //                 continue;
  //
  //             const lineMat = new LineBasicMaterial({color});
  //             const line = new Line(lineGeo, lineMat);
  //             lineMat.depthTest = false;
  //             tileModel.add(line);
  //         }
  //     }
  // }
}
