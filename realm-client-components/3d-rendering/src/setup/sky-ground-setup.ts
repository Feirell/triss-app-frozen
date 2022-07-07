import {
  BackSide,
  Color,
  Mesh,
  MeshStandardMaterial,
  PlaneBufferGeometry,
  ShaderMaterial,
  SphereBufferGeometry,
} from "three";

const vertexShader = `
    varying vec3 vWorldPosition;

    void main() {

        vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
        vWorldPosition = worldPosition.xyz;

        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }`;

const fragmentShader = `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;

    varying vec3 vWorldPosition;

    void main() {
        float h = normalize( vWorldPosition + offset ).y;
        gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
    }`;

export function createSkyDome({skyColor, domeGroundColor, radius}: CreateDomeAndGroundOptions) {
  // taken from https://github.com/mrdoob/three.js/blob/master/examples/webgl_lights_hemisphere.html#L140-L162

  const uniforms = {
    topColor: {value: skyColor},
    bottomColor: {value: domeGroundColor},
    offset: {value: 33},
    exponent: {value: 0.6},
  };

  const skyGeo = new SphereBufferGeometry(radius, 32, 15);
  const skyMat = new ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: BackSide,
  });

  return new Mesh(skyGeo, skyMat);
}

function createGround({groundColor, radius}: CreateDomeAndGroundOptions) {
  const groundGeo = new PlaneBufferGeometry(radius * 2, radius * 2);
  const groundMat = new MeshStandardMaterial({color: groundColor});

  const ground = new Mesh(groundGeo, groundMat);

  ground.position.y = 0;
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;

  return ground;
}

export interface CreateDomeAndGroundOptions {
  groundColor: Color;
  skyColor: Color;
  domeGroundColor: Color;
  radius: number;
}

export function createDomeAndGround(options: CreateDomeAndGroundOptions) {
  return {
    ground: createGround(options),
    dome: createSkyDome(options),
  };
}
