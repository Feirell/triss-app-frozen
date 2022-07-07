import {
  AmbientLight,
  Box3,
  Color,
  HemisphereLight,
  Mesh,
  OrthographicCamera,
  Scene,
  Vector3,
  WebGLRenderer
} from "three";
import React, {useEffect, useState} from "react";

import {TAG_NAMES, TILE_NAMES} from "../../../common/tile-names-translation";
import {GLOBAL_MODEL_PROVIDER} from "@triss/server-connection";
import {createMerged} from "@triss/instanced-models";
import {TagType, TILE_SCALE, TileType} from "@triss/entity-definition";

import {isTag, isTile} from "@triss/entity-definition";

const noop = () => undefined;

function renderLoop(fnc: () => void) {
  const loop = () => {
    fnc();
    id = requestAnimationFrame(loop);
  };

  let id = requestAnimationFrame(loop);

  return () => cancelAnimationFrame(id);
}

function getProjectedWidthHeight(x: number, y: number, z: number) {
  const deg60Rad = (60 * Math.PI) / 180;
  const cos60Deg = Math.cos(deg60Rad);
  const sin60Deg = Math.sin(deg60Rad);

  const width = sin60Deg * x + sin60Deg * z;
  const height = cos60Deg * x + cos60Deg * z + y;

  return {width, height};
}

(window as any).getProjectedWidthHeight = getProjectedWidthHeight;

const usePreview = (id: TileType | TagType) => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | undefined>(undefined);
  // const ref = useRef<null | HTMLCanvasElement>(null);

  useEffect(() => {
    const renderer = new WebGLRenderer({alpha: true});

    const camPos = 100;
    const camDistance = Math.sqrt(camPos * camPos * 3);

    const camera = new OrthographicCamera(0, 0, 0, 0, 1, camDistance * 2);
    camera.position.set(camPos, -camPos, camPos);
    camera.up.set(0, -1, 0);
    camera.lookAt(0, 0, 0);

    // about 35.264 deg
    const cameraAngle = camera.position.angleTo(camera.position.clone().setY(0));

    const sinCameraAngle = Math.sin(cameraAngle);
    const cosCameraAngle = Math.cos(cameraAngle);

    const sin45deg = Math.sin(Math.PI / 4);

    const model = GLOBAL_MODEL_PROVIDER.get(id) as Mesh;

    const scene = new Scene();

    const merged = createMerged(model);
    if (isTile(id)) merged.scale.set(TILE_SCALE, TILE_SCALE, TILE_SCALE);
    else merged.scale.set(TILE_SCALE, TILE_SCALE, TILE_SCALE);

    merged.updateMatrix();
    merged.updateMatrixWorld();

    scene.add(merged);

    merged.geometry.computeBoundingBox();
    const bb = merged.geometry.boundingBox as Box3;
    const scaledBB = bb.clone().applyMatrix4(merged.matrixWorld);

    const {x, y, z} = scaledBB.getSize(new Vector3());

    const projectedWidth = sin45deg * x + sin45deg * z;
    const projectedHeight = sinCameraAngle * projectedWidth + cosCameraAngle * y;

    const projectedAspectRatio = projectedWidth / projectedHeight;

    const y_min = scaledBB.min.y;
    const y_max = scaledBB.max.y;

    merged.position.setY(-(y_min + (y_max - y_min) / 2));

    // copied from the lightning setup of the renderer
    const groundColor = new Color(0x8ab448);
    const skyColor = new Color(0x28b9fc);
    const sunColor = new Color(0xf7f7f1);

    const hemisphericLight = new HemisphereLight(sunColor, groundColor, 0.525);
    hemisphericLight.position.set(0, 50, 0);

    const ambientLight = new AmbientLight(sunColor, 0.375);

    scene.add(hemisphericLight);
    scene.add(ambientLight);

    let lastSize = {width: 0, height: 0};

    const loop = () => {
      const domElem = renderer.domElement;
      const parent = domElem.parentElement;
      if (!parent) return;

      const newSize = {
        width: parent.clientWidth,
        height: parent.clientHeight
      };

      if (lastSize.width == newSize.width && lastSize.height == newSize.height) return;

      const {width, height} = (lastSize = newSize);
      renderer.setSize(width, height);

      const availableAspectRatio = width / height;

      let scale;

      // The available space is wider than the projected.
      // We need to set the ratio to the height to make it align with that.
      if (availableAspectRatio > projectedAspectRatio) {
        scale = projectedHeight / height;
      }

      // Otherwise we need to use the width
      else {
        scale = projectedWidth / width;
      }

      camera.top = (-height / 2) * scale;
      camera.bottom = (height / 2) * scale;

      camera.left = (-width / 2) * scale;
      camera.right = (width / 2) * scale;

      camera.updateProjectionMatrix();

      renderer.render(scene, camera);
    };

    const stopRenderLoop = renderLoop(loop);

    setCanvas(renderer.domElement);

    return () => {
      setCanvas(undefined);
      stopRenderLoop();
    };
  }, [id]);

  return canvas;
};

const PickablePreview = ({id}: {id: TileType | TagType}) => {
  const readableName = isTile(id)
    ? TILE_NAMES.get(id) || "Kachel #" + id
    : TAG_NAMES.get(id) || id;

  const canvas = usePreview(id);

  const wrapperRef = (ref: HTMLDivElement | null) => {
    if (ref && canvas) ref.appendChild(canvas);
  };

  return <div className="preview" ref={wrapperRef}></div>;
};

export type RemoveType = "REMOVE";
export type PickableType = TileType | TagType | RemoveType;

export const REMOVE: RemoveType = "REMOVE";

const getName = (p: PickableType) => {
  if (isTile(p)) return TILE_NAMES.get(p) || "Kachel #" + p;

  if (isTag(p)) return TAG_NAMES.get(p) || p;

  if (p == REMOVE) return "Entfernen";

  throw new Error("Unrecognised pickable type " + p);
};

const RedCross = () => {
  return (
    <svg className="preview" viewBox="0 0 1 1" xmlns="http://www.w3.org/2000/svg">
      <line
        x1=".15"
        y1=".15"
        x2=".85"
        y2=".85"
        strokeWidth=".1"
        stroke="#ff3434"
        strokeLinecap="round"
      />

      <line
        x1=".15"
        y1=".85"
        x2=".85"
        y2=".15"
        strokeWidth=".1"
        stroke="#ff3434"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const Pickable = ({
                           id,
                           onPicked = noop,
                           picked = false,
                           favorite = false
                         }: {
  id: PickableType;
  onPicked?: (nr: PickableType) => void;
  picked?: boolean;
  favorite?: boolean;
}) => {
  const readableName = getName(id);

  const preview = id == REMOVE ? <RedCross /> : <PickablePreview id={id} />;

  return (
    <div
      key={id}
      onClick={() => onPicked(id)}
      className={"pickable " + (picked ? " picked" : " not-picked")}
    >
      {/*<div className={"toggle-favorite" + (favorite ? ' is-favorite' : ' not-favorite')}>&#11088;</div>*/}
      <h4 className="name">{readableName}</h4>
      {preview}
      {/*<div className="image-placeholder"></div>*/}
    </div>
  );
};
