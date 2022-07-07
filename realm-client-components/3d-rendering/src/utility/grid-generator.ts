import {BoxBufferGeometry, Group, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial} from "three";

import {TILE_SCALE} from "@triss/entity-definition";

export function createTileGrate(
  xRange: [number, number],
  yRange: [number, number],
  {
    outerBorder = {
      width: 1.4,
      color: 0xff8800,
    },
    innerSeparators = {
      width: 0.7,
      color: 0xffffff,
    },
    height = 1,
  }: {
    outerBorder?: {
      width: number;
      color: number;
    };
    innerSeparators?: {
      width: number;
      color: number;
    };
    height?: number;
  } = {}
) {
  const [minX, maxX] = xRange.sort();
  const [minY, maxY] = yRange.sort();

  const xLength = maxX - minX;
  const yLength = maxY - minY;

  // could not use line material, because I was not able to configure the width

  // TODO this should be done by shader and not with geometry
  const innerLineMat = new MeshBasicMaterial({
    color: innerSeparators.color,
  });

  const initialXLine = new BoxBufferGeometry(
    innerSeparators.width,
    height,
    TILE_SCALE * (yLength + 1) - outerBorder.width
  );

  const instantiatedXLines = new InstancedMesh(initialXLine, innerLineMat, xLength);
  {
    const mat = new Matrix4();

    for (let i = 0; i < xLength; i++) {
      const xVal = minX * TILE_SCALE + i * TILE_SCALE;

      mat.setPosition(xVal + 0.5 * TILE_SCALE, 0, (minY + yLength * 0.5) * TILE_SCALE);
      instantiatedXLines.setMatrixAt(i, mat);
    }
  }

  const initialYLine = new BoxBufferGeometry(
    TILE_SCALE * (xLength + 1) - outerBorder.width,
    height,
    innerSeparators.width
  );

  const instantiatedYLines = new InstancedMesh(initialYLine, innerLineMat, yLength);
  {
    const mat = new Matrix4();

    for (let i = 0; i < yLength; i++) {
      const yVal = minY * TILE_SCALE + i * TILE_SCALE;

      mat.setPosition((minX + xLength * 0.5) * TILE_SCALE, 0, yVal + 0.5 * TILE_SCALE);
      instantiatedYLines.setMatrixAt(i, mat);
    }
  }

  const meshOuterMaterial = new MeshBasicMaterial({color: outerBorder.color});
  const outerBorders = new Group();

  const minXToMaxXOnMinY = new Mesh(
    new BoxBufferGeometry(
      TILE_SCALE * (xLength + 1) + outerBorder.width,
      height,
      outerBorder.width
    ),
    meshOuterMaterial
  );
  minXToMaxXOnMinY.position.set(TILE_SCALE * (minX + xLength * 0.5), 0, TILE_SCALE * (minY - 0.5));

  outerBorders.add(minXToMaxXOnMinY);

  const minXToMaxXOnMaxY = minXToMaxXOnMinY.clone();
  minXToMaxXOnMaxY.position.set(TILE_SCALE * (minX + xLength * 0.5), 0, TILE_SCALE * (maxY + 0.5));

  outerBorders.add(minXToMaxXOnMaxY);

  const minYToMaxYOnMinX = new Mesh(
    new BoxBufferGeometry(
      outerBorder.width,
      height,
      TILE_SCALE * (yLength + 1) + outerBorder.width
    ),
    meshOuterMaterial
  );
  minYToMaxYOnMinX.position.set(TILE_SCALE * (minX - 0.5), 0, TILE_SCALE * (minY + yLength * 0.5));

  outerBorders.add(minYToMaxYOnMinX);

  const minYToMaxYOnMaxX = minYToMaxYOnMinX.clone();
  minYToMaxYOnMaxX.position.set(TILE_SCALE * (maxX + 0.5), 0, TILE_SCALE * (minY + yLength * 0.5));

  outerBorders.add(minYToMaxYOnMaxX);

  const box = new Mesh(new BoxBufferGeometry(), new MeshBasicMaterial({color: 0xffff00}));
  box.position.set(TILE_SCALE, 0, 0);

  return new Group().add(instantiatedXLines).add(instantiatedYLines).add(outerBorders);
}
