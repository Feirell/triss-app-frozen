import {PerspectiveCamera, Vector3} from "three";

import {OrbitControls} from "../interaction/orbit-controls";

const loadControlPosition = (control: OrbitControls) => {
  const key = "control-settings";
  const controlSettings = localStorage.getItem(key);

  interface SavedControlPos {
    position: [number, number, number];
    target: [number, number, number];
  }

  if (controlSettings && controlSettings.length > 0) {
    const {position, target} = JSON.parse(controlSettings) as SavedControlPos;

    const camera = control.object as PerspectiveCamera;
    camera.position.fromArray(position);

    const currentTarget = control.target as Vector3;
    currentTarget.fromArray(target);

    control.update();
  }

  let lastString = controlSettings || "";

  const cameraSaveLoop = () => {
    const cameraPosition = (control.object as PerspectiveCamera).position;
    const currentTarget = control.target as Vector3;

    const position = cameraPosition.toArray();
    const target = currentTarget.toArray();

    const scp: SavedControlPos = {position, target};

    const str = JSON.stringify(scp);

    if (str != lastString) {
      localStorage.setItem(key, str);

      lastString = str;
    }
  };

  setInterval(cameraSaveLoop, 2000);
};

export function createControls(camera: PerspectiveCamera, container: HTMLElement) {
  const oc = new OrbitControls(camera, container);

  // oc.enableKeys = true;
  oc.keys = {
    LEFT: "a", // 65
    UP: "w", // 87
    RIGHT: "d", // 68
    BOTTOM: "s" // 83
  };

  // prevent the camera from being upside down
  oc.maxPolarAngle = Math.PI / 2 - 0.05;

  // This fixes the panning issue
  oc.screenSpacePanning = false;

  oc.addEventListener("change", () => {
    const t = oc.target;
    if (t.y != 0) {
      t.y = 0;
      oc.update();
    }
  });

  loadControlPosition(oc);

  return oc;
}

export function createCamera(viewHeight: number, viewWidth: number) {
  const camera = new PerspectiveCamera(35, viewWidth / viewHeight, 1, 5000);
  camera.position.set(0, 60, 0);
  return camera;
}
