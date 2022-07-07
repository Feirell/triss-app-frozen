import {mergeBufferGeometries} from "three/examples/jsm/utils/BufferGeometryUtils";
import {BufferGeometry, Material, Mesh, Object3D} from "three";

const isMesh = (v: any): v is Mesh => v.isMesh;
const isBufferGeometry = (v: any): v is BufferGeometry => v.isBufferGeometry;

export type MergedMesh = Mesh<BufferGeometry, Material[]>;

export function createMerged(obj: Object3D): MergedMesh {
  if (isMesh(obj)) {
    const mat = obj.material;

    // TODO ensure that this actually works.
    //  Not sure if the geometry needs to be in some kind of format to be referencing the materials as an array
    if (!Array.isArray(mat)) return new Mesh(obj.geometry, [mat]);

    return obj as Mesh<BufferGeometry, Material[]>;
  }

  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];

  obj.traverse(obj => {
    if (!isMesh(obj)) return;

    const {geometry, material} = obj;

    if (!isBufferGeometry(geometry))
      throw new Error("Error while merging: Geometry is not a BufferGeometry but " + geometry);

    if (Array.isArray(material)) throw new Error("can not process a material array");

    geometries.push(geometry);
    materials.push(material);
  });

  const mergedGeometries = mergeBufferGeometries(geometries, true);

  return new Mesh<BufferGeometry, Material[]>(mergedGeometries, materials);
}
