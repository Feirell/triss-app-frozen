import {GLTF, GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {BoxBufferGeometry, Cache, Mesh, MeshStandardMaterial} from "three";
import {EventEmitter} from "event-emitter-typesafe";

import {InstancedModel} from "@triss/instanced-models";
import {
  isTag,
  isTile,
  isVehicle,
  tags,
  TagType,
  tagTypeValues,
  tiles,
  TileType,
  tileTypeValues,
  vehicles,
  VehicleType,
  vehicleTypeValues
} from "@triss/entity-definition";
import {GLOBAL_MODEL_PROVIDER} from "./model-provider";
import {TAG_MODEL_FILE_NAMES, TILE_MODEL_FILE_NAMES, VEHICLE_MODEL_FILE_NAMES} from "@triss/models/lib/concrete-entity-model-file-names";

function getTagSize(id: TagType) {
  const v = tags.get(id);
  if (!v)
    throw new Error("could not get the entry for tag id " + id);

  return v.size;
}

function ensureTagSizeIsCorrect(id: TagType, receivedSize: number) {
  const correctSize = getTagSize(id);
  if (correctSize != receivedSize)
    throw new Error("Received tag size " + receivedSize + " is not identical to the defined size " + correctSize);

  return true;
}

// this is defined in the webpack config
const modelsRoot = new URL("/res/models/", window.location.href);

function tagPath(id: TagType) {
  return new URL(TAG_MODEL_FILE_NAMES.getPartialPath(id), modelsRoot).href;
}


function getVehicleSize(id: VehicleType) {
  const v = vehicles.get(id);
  if (!v)
    throw new Error("could not get the entry for vehicle id " + id);

  return v.size;
}

function ensureVehicleSizeIsCorrect(id: VehicleType, receivedSize: number) {
  const correctSize = getVehicleSize(id);
  if (correctSize != receivedSize)
    throw new Error("Received vehicle size " + receivedSize + " is not identical to the defined size " + correctSize);

  return true;
}

function vehiclePath(id: VehicleType) {
  return new URL(VEHICLE_MODEL_FILE_NAMES.getPartialPath(id), modelsRoot).href;
}

function getTileSize(id: TileType) {
  const v = tiles.get(id);
  if (!v)
    throw new Error("could not get the entry for tile id " + id);

  return v.size;
}

function ensureTileSizeIsCorrect(id: TileType, receivedSize: number) {
  const correctSize = getTileSize(id);
  if (correctSize != receivedSize)
    throw new Error("Received tile size " + receivedSize + " is not identical to the defined size " + correctSize);

  return true;
}

function tilePath(id: TileType) {
  return new URL(TILE_MODEL_FILE_NAMES.getPartialPath(id), modelsRoot).href;
}

Cache.enabled = true;

export interface CorrespondingEntityVehicle {
  category: "vehicle";
  type: VehicleType;
}

export interface CorrespondingEntityTile {
  category: "tile";
  type: TileType;
}

export interface CorrespondingEntityTag {
  category: "tag";
  type: TagType;
}

export interface InstancedVehicle extends CorrespondingEntityVehicle {
  model: InstancedModel;
}

export interface InstancedTile extends CorrespondingEntityTile {
  model: InstancedModel;
}

export interface InstancedTag extends CorrespondingEntityTag {
  model: InstancedModel;
}

export type PossibleInstancedModelTypes = InstancedVehicle | InstancedTile | InstancedTag;

export interface LoadingResourceState<CorrespondingEntity extends | CorrespondingEntityVehicle
  | CorrespondingEntityTile
  | CorrespondingEntityTag =
    | CorrespondingEntityVehicle
  | CorrespondingEntityTile
  | CorrespondingEntityTag> {
  correspondingEntity: CorrespondingEntity;
  path: string;
  bytesToLoad: number;
  loadedBytes: number;
  finished: boolean;
  model: GLTF | undefined;
}

export interface LoaderEvents {
  "loading-begin": {event: "loading-begin"; loader: Loader};
  "loading-progress": {event: "loading-progress"; loader: Loader};
  "loading-finished": {event: "loading-finished"; loader: Loader};
}

function getTagModel(type: TagType) {
  switch (type) {
    case "SPAWN_AND_DESPAWN":
      return new Mesh(
        new BoxBufferGeometry(0.9, 0.9, 0.9),
        new MeshStandardMaterial({color: 0xff00ff})
      );

    default:
      throw new Error("could not find the model for tag type " + type);
  }
}

export class Loader extends EventEmitter<LoaderEvents> {
  state: "initialized" | "loading" | "finished" = "initialized";
  private loader = new GLTFLoader();
  private tilesToLoad: TileType[] = [];
  private vehiclesToLoad: VehicleType[] = [];
  private tagsToLoad: TagType[] = [];
  private loadingResources: LoadingResourceState[] = [];

  constructor() {
    super();

    this.once("loading-begin", () => (this.state = "loading"));
    this.once("loading-finished", () => (this.state = "finished"));
  }

  static createLoaderForAllAssets() {
    const l = new Loader();

    for (const nr of tileTypeValues)
      l.addTileToLoad(nr);

    for (const name of vehicleTypeValues)
      l.addVehicleToLoad(name);

    for (const tag of tagTypeValues)
      l.addTagToLoad(tag);

    return l;
  }

  addTileToLoad(tile: TileType) {
    if (this.state != "initialized")
      throw new Error("you can not add another tile while loading");

    if (!isTile(tile))
      throw new Error("tile name needs to be one of " + tileTypeValues.join(", "));

    if (this.tilesToLoad.includes(tile))
      return false;

    this.tilesToLoad.push(tile);
    return true;
  }

  addVehicleToLoad(vehicle: VehicleType) {
    if (this.state != "initialized")
      throw new Error("you can not add another vehicle while loading");

    if (!isVehicle(vehicle))
      throw new Error("vehicle name needs to be one of " + vehicleTypeValues.join(", "));

    if (this.vehiclesToLoad.includes(vehicle))
      return false;

    this.vehiclesToLoad.push(vehicle);
    return true;
  }

  addTagToLoad(tag: TagType) {
    if (this.state != "initialized")
      throw new Error("you can not add another tag while loading");

    if (!isTag(tag))
      throw new Error("tag name needs to be one of " + tagTypeValues.join(", "));

    if (this.tagsToLoad.includes(tag))
      return false;

    this.tagsToLoad.push(tag);
    return true;
  }

  beginLoading() {
    if (this.state != "initialized")
      throw new Error("can only begin loading if the loading initialized");

    const allLrs: LoadingResourceState[] = [];

    for (const vehicle of this.vehiclesToLoad) {
      const lrs: LoadingResourceState = {
        correspondingEntity: {category: "vehicle", type: vehicle},
        finished: false,
        model: undefined,
        path: vehiclePath(vehicle),
        bytesToLoad: getVehicleSize(vehicle),
        loadedBytes: 0
      };

      allLrs.push(lrs);
    }

    for (const tile of this.tilesToLoad) {
      const lrs: LoadingResourceState = {
        correspondingEntity: {category: "tile", type: tile},
        finished: false,
        model: undefined,
        path: tilePath(tile),
        bytesToLoad: getTileSize(tile),
        loadedBytes: 0
      };

      allLrs.push(lrs);
    }

    for (const tag of this.tagsToLoad) {
      const lrs: LoadingResourceState = {
        correspondingEntity: {category: "tag", type: tag},
        finished: false,
        model: undefined,
        path: tagPath(tag),
        bytesToLoad: getTagSize(tag),
        loadedBytes: 0
      };

      allLrs.push(lrs);
    }

    this.loadingResources = allLrs;

    for (const lrs of allLrs) {
      if (lrs.model) continue;

      this.loader.load(
        lrs.path,
        gltf => this.finishedLoading(lrs, gltf),
        xhr => this.progressLoading(lrs, xhr),
        error => this.errorLoading(lrs, error)
      );
    }

    this.dispatch("loading-begin", {event: "loading-begin", loader: this});
  }

  getState() {
    return this.state;
  }

  getProgress() {
    let totalBytesNeeded = 0;
    let totalBytesLoaded = 0;

    for (const lrs of this.loadingResources) {
      totalBytesNeeded += lrs.bytesToLoad;
      totalBytesLoaded += lrs.loadedBytes;
    }

    return {totalBytesLoaded, totalBytesNeeded};
  }

  getLoadingProgress() {
    return this.loadingResources;
  }

  findByIdentifier(id: TileType): LoadingResourceState<CorrespondingEntityTile> | never;
  findByIdentifier(id: VehicleType): LoadingResourceState<CorrespondingEntityVehicle> | never;
  findByIdentifier(id: TagType): LoadingResourceState<CorrespondingEntityTag> | never;
  findByIdentifier(id: TileType | VehicleType | TagType): LoadingResourceState | never;
  findByIdentifier(id: TileType | VehicleType | TagType): LoadingResourceState | never {
    let category;

    if (isTile(id)) category = "tile";
    else if (isTag(id)) category = "tag";
    else if (isVehicle(id)) category = "vehicle";
    else throw new Error("Could not find the category for the entity");

    for (const lrs of this.loadingResources) {
      const ce = lrs.correspondingEntity;
      if (ce.category == category && ce.type == id) {
        return lrs;
      }
    }

    throw new Error("Could not the the corresponding loading state");
  }

  getInstancedModel(id: TileType | TagType | VehicleType): InstancedModel {
    const foundLrs = this.findByIdentifier(id);
    const gltf = foundLrs.model;
    if (!gltf) throw new Error("gltf is not yet loaded");

    return InstancedModel.createFromModel(gltf.scene, "" + id);
  }

  private errorLoading(lrs: LoadingResourceState, error: ErrorEvent) {
    // TODO implement error handling
    console.error(error);
  }

  private progressLoading(lrs: LoadingResourceState, xhr: ProgressEvent) {
    lrs.loadedBytes = xhr.loaded;
    lrs.bytesToLoad = xhr.total;
    this.dispatch("loading-progress", {
      event: "loading-progress",
      loader: this
    });

    const ce = lrs.correspondingEntity;

    if (ce.category == "tile") ensureTileSizeIsCorrect(ce.type, xhr.total);
    else if (ce.category == "vehicle") ensureVehicleSizeIsCorrect(ce.type, xhr.total);
  }

  private finishedLoading(lrs: LoadingResourceState, gltf: GLTF) {
    lrs.loadedBytes = lrs.bytesToLoad;
    lrs.finished = true;
    lrs.model = gltf;
    this.dispatch("loading-progress", {
      event: "loading-progress",
      loader: this
    });
    for (const {finished} of this.loadingResources) if (!finished) return;

    this.dispatch("loading-finished", {
      event: "loading-finished",
      loader: this
    });
  }
}

export const ALL_ASSETS_LOADER = (() => {
  const ALL_ASSETS_LOADER = Loader.createLoaderForAllAssets();
  ALL_ASSETS_LOADER.addEventListener("loading-finished", ev => {
    const progress = ev.loader.getLoadingProgress();

    for (const {model, correspondingEntity} of progress) {
      if (!model)
        throw new Error(
          "loading finished but there was a model missing for" + correspondingEntity.type
        );

      GLOBAL_MODEL_PROVIDER.set(correspondingEntity.type, model.scene);
    }
  });

  return ALL_ASSETS_LOADER;
})();
