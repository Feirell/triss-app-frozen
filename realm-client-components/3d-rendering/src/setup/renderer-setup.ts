import {LinearEncoding, WebGLRenderer} from "three";

export function createRenderer() {
  const renderer = new WebGLRenderer({antialias: true});

  renderer.shadowMap.enabled = true;

  // THREE.sRGBEncoding creates more trouble than it is worth
  // renderer.outputEncoding = THREE.sRGBEncoding;

  /*
    Notice: Temporarily disabling phys lights and going back to linear encoding, to correct the colors
    TODO fix the lightning
   */
  renderer.physicallyCorrectLights = false;
  renderer.outputEncoding = LinearEncoding;

  return renderer;
}
