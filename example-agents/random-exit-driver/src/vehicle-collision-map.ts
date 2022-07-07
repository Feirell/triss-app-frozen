import {Vehicle} from "@triss/entities";

import {
  doesVVDIntersect,
  getVehicleVolumeDescriptionForVehicle,
  VehicleVolumeDescription,
} from "./helper/vehicle-volume-description";

class CustomMap<Key, Value> {
  private backing = new Map<string, Value>();

  constructor(private readonly keyCreator: (key: Key) => string) {}

  get(key: Key) {
    return this.backing.get(this.keyCreator(key));
  }

  has(key: Key) {
    return this.backing.has(this.keyCreator(key));
  }

  set(key: Key, value: Value) {
    this.backing.set(this.keyCreator(key), value);
    return this;
  }

  delete(key: Key) {
    return this.backing.delete(this.keyCreator(key));
  }

  clear() {
    this.backing.clear();
  }
}

class CustomValueArrayMap<Key, Value> {
  private backing = new Map<string, Set<Value>>();

  constructor(private readonly keyCreator: (key: Key) => string) {}

  getValues(key: Key): ReadonlyArray<Value> {
    const set = this.backing.get(this.keyCreator(key));
    if (set) return Array.from(set);
    else return [];
  }

  appendValue(key: Key, value: Value) {
    const keyStr = this.keyCreator(key);
    let set = this.backing.get(keyStr);
    if (!set) {
      set = new Set<Value>();
      this.backing.set(keyStr, set);
    }

    set.add(value);
    return this;
  }

  removeValue(key: Key, value: Value) {
    const keyStr = this.keyCreator(key);
    const prev = this.backing.get(keyStr);
    if (!prev) return false;

    const deletedSomething = prev.delete(value);

    if (prev.size == 0) this.backing.delete(keyStr);

    return deletedSomething;
  }

  clear() {
    this.backing.clear();
  }
}

export class VehicleCollisionMap {
  // private tileRelativeMap: TwoDArrayWithShift<VehicleVolumeDescription[]> = new TwoDArrayWithShift<VehicleVolumeDescription[]>(0, 0, 0, 0);
  private chunkToVVDMap = new CustomValueArrayMap<[number, number], VehicleVolumeDescription>(
    ([x, y]) => x + "-" + y
  );
  private vehicleToVVD = new CustomMap<Vehicle, VehicleVolumeDescription>(v => v.type + "-" + v.id);

  removeVehicle(vehicle: Vehicle) {
    const previousVVD = this.vehicleToVVD.get(vehicle);

    if (previousVVD) {
      for (const [x, y] of previousVVD.chunks) this.chunkToVVDMap.removeValue([x, y], previousVVD);

      this.vehicleToVVD.delete(vehicle);
    }
  }

  updateOrSetVehicle(vehicle: Vehicle) {
    this.removeVehicle(vehicle);

    const newVVD = getVehicleVolumeDescriptionForVehicle(vehicle);

    this.vehicleToVVD.set(vehicle, newVVD);
    for (const [x, y] of newVVD.chunks) this.chunkToVVDMap.appendValue([x, y], newVVD);
  }

  setFromVehicles(vehicles: Vehicle[]) {
    this.chunkToVVDMap.clear();
    this.vehicleToVVD.clear();

    for (const vehicle of vehicles) this.updateOrSetVehicle(vehicle);
  }

  doesVehicleIntersect(vehicle: Vehicle) {
    // console.count('doesVehicleIntersect');
    const vvd = getVehicleVolumeDescriptionForVehicle(vehicle);
    const hasChecked = new Set<VehicleVolumeDescription>();

    for (const [x, y] of vvd.chunks) {
      const vvdsInChunk = this.chunkToVVDMap.getValues([x, y]);
      for (const otherVvd of vvdsInChunk) {
        if (otherVvd.vehicle.id == vehicle.id) continue;

        if (hasChecked.has(otherVvd)) continue;

        hasChecked.add(otherVvd);
        if (doesVVDIntersect(vvd, otherVvd))
          // could also return the other vehicle with which this intersected
          return true;
      }
    }

    return false;
  }
}
