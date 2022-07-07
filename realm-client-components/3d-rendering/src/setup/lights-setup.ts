import {AmbientLight, CameraHelper, Color, DirectionalLight, HemisphereLight, Vector3} from "three";

interface UIController {
  add(...args: any[]): void;
}

interface UIControllerConstructor {
  new (): UIController;
}

export interface CreateLightsOptions {
  createHelper: boolean;
  UIControl: UIControllerConstructor;

  groundColor: Color;
  skyColor: Color;
  sunColor: Color;
}

// let lightContrl: any;

function createSunLight({sunColor, createHelper, UIControl}: CreateLightsOptions) {
  // copied from https://github.com/mrdoob/three.js/blob/master/examples/webgl_lights_hemisphere.html#L110-L121

  const directionalLight = new DirectionalLight(sunColor, 0.6);
  // lightContrl.add(directionalLight, 'intensity', 0, 2, .1).name('Directional')
  // directionalLight.visible = false;
  directionalLight.castShadow = false;

  const direction = new Vector3(1, 1, 1);
  // const lookingAt = new Vector3(5.45, -0.5, 32.9 / 2);
  const lookingAt = new Vector3(0, 0, 0);

  directionalLight.target.position.copy(lookingAt);

  directionalLight.position.copy(lookingAt);
  directionalLight.position.add(direction.multiplyScalar(10));

  directionalLight.shadow.mapSize.width = 2 ** 12;
  directionalLight.shadow.mapSize.height = 2 ** 11;
  // dirLight.shadow.mapSize.width = 4096;
  // dirLight.shadow.mapSize.height = 4096;

  directionalLight.shadow.radius = 4;
  const d = 6;
  directionalLight.shadow.camera.left = -d;
  directionalLight.shadow.camera.right = d;
  directionalLight.shadow.camera.top = d / 2;
  directionalLight.shadow.camera.bottom = -d / 2;

  directionalLight.shadow.camera.far = 40;
  directionalLight.shadow.bias = -0.0002;
  // dirLight.shadow.bias = 0.0002;

  if (UIControl) {
    const cntrl = new UIControl();
    cntrl.add(directionalLight.shadow, "bias", -0.0005, 0.0005, 0.0001);
    cntrl.add(directionalLight, "intensity", 0, 10, 0.2);
  }

  const directionalLightTarget = directionalLight.target;

  if (createHelper) {
    // this seems to be buggy and not using the dirLight.target.position
    // const dirLightHelper = new DirectionalLightHelper(dirLight);
    // scene.add(dirLightHelper);

    const dirLightCameraHelper = new CameraHelper(directionalLight.shadow.camera);
    // scene.add(dirLightCameraHelper);
    return {
      directionalLight,
      directionalLightTarget,
      dirLightCameraHelper,
    };
  } else
    return {
      directionalLight,
      directionalLightTarget,
    };
}

function createSunReflectionLight({sunColor, groundColor}: CreateLightsOptions) {
  // TODO it is somewhat wrong that all ojects are partially lighten by the ground reflection, since
  // the (grass-)ground will not be present on the streets

  const hemiLight = new HemisphereLight(sunColor, groundColor, 0.4);
  // lightContrl.add(hemiLight, 'intensity', 0, 2, .1).name('Hemisphere')

  hemiLight.position.set(0, 50, 0);

  return hemiLight;
}

function createAmbient({sunColor, UIControl}: CreateLightsOptions) {
  const ambientLight = new AmbientLight(sunColor, 0.3);
  // lightContrl.add(ambientLight, 'intensity', 0, 2, .1).name('Ambient')

  return ambientLight;
}

export function createLights(options: CreateLightsOptions) {
  // lightContrl = new GUI();
  return {
    ...createSunLight(options),
    hemisphericLight: createSunReflectionLight(options),
    ambientLight: createAmbient(options),
  };
}
