import {BoxBufferGeometry, Mesh, MeshStandardMaterial, Scene} from "three";

function SPAWN_AND_DESPAWN() {
  return new Scene()
    .add(new Mesh(
      new BoxBufferGeometry(0.9, 0.9, 0.9),
      new MeshStandardMaterial({color: 0xff00ff})
    ));
}

export const tags = [SPAWN_AND_DESPAWN];
