import {EntityModifications} from "../render-entities/entity-modifications";
import {ModelProducer} from "../operator/model-producer";
import {MeshMerger} from "../operator/mesh-merger";
import {LabelProducer} from "../operator/label-producer";
import {LabelCreator} from "../operator/label-creater";
import {GroupProducer} from "../operator/group-producer";
import {EntitySimplifier} from "../operator/entity-simplifier";
import {ModelProvider} from "@triss/server-connection";
import {FullFrameStateDTO} from "@triss/dto";
import {EntityType} from "@triss/dto";
import {
  tagDataToMatrix,
  tileDataToMatrix,
  vehicleDataToMatrix,
} from "@triss/three-helper";

import {Pipeline} from "./pipeline";

export type RenderPipelineProcessData = FullFrameStateDTO & EntityModifications;

// const TILE_STRAIGHT_MESH = (() => {
//     const mat = new MeshBasicMaterial();
//     const geo = new BoxBufferGeometry(1, 1, 1);
//
//     const mesh = new Mesh(geo, mat);
//
//     return new Group().add(mesh);
// })();
//
// GLOBAL_MODEL_PROVIDER.set(TILE_STRAIGHT, TILE_STRAIGHT_MESH);

export const createRenderPipeline = (modelProvider: ModelProvider<EntityType>) => {
  const tile = {
    simplifier: new EntitySimplifier(tileDataToMatrix, modelProvider as any),
    modelProducer: new ModelProducer(),

    nonModifiedMeshMerger: new MeshMerger(),
    highlightMeshMerger: new MeshMerger(),
    colorMeshMerger: new MeshMerger(),
    greyScaledMerger: new MeshMerger(),

    labelProducer: new LabelProducer(),
    labelCreator: new LabelCreator(),
  };

  const tag = {
    simplifier: new EntitySimplifier(tagDataToMatrix, modelProvider as any),
    modelProducer: new ModelProducer(),

    nonModifiedMeshMerger: new MeshMerger(),
    highlightMeshMerger: new MeshMerger(),
    colorMeshMerger: new MeshMerger(),
    greyScaledMerger: new MeshMerger(),

    labelProducer: new LabelProducer(),
    labelCreator: new LabelCreator(),
  };

  const vehicle = {
    simplifier: new EntitySimplifier(vehicleDataToMatrix, modelProvider as any),
    modelProducer: new ModelProducer(),

    nonModifiedMeshMerger: new MeshMerger(),
    highlightMeshMerger: new MeshMerger(),
    colorMeshMerger: new MeshMerger(),
    greyScaledMerger: new MeshMerger(),

    labelProducer: new LabelProducer(),
    labelCreator: new LabelCreator(),
  };

  const groupProducer = new GroupProducer();

  return (
    new Pipeline<RenderPipelineProcessData>()

      //
      // TILES
      //

      .registerMapper("tilesSimplified", ["layout"], ({layout: {tiles}}) =>
        tiles.map(t => tile.simplifier.process(t))
      )

      .registerMapper(
        "tileModels",
        ["tilesSimplified", "highlighted", "colored", "greyScaled"],
        ({tilesSimplified, highlighted, colored, greyScaled}) =>
          tile.modelProducer.process({
            transitionalRenderable: tilesSimplified,
            highlights: highlighted,
            colors: colored,
            greys: greyScaled,
          })
      )

      .registerMapper("tileGreyScaledMerged", ["tileModels"], ({tileModels: {greyScaled}}) =>
        tile.greyScaledMerger.process(greyScaled)
      )

      .registerMapper("tileNonModifiedMerged", ["tileModels"], ({tileModels: {nonModified}}) =>
        tile.nonModifiedMeshMerger.process(nonModified)
      )

      .registerMapper("tileHaloMerged", ["tileModels"], ({tileModels: {halos}}) =>
        tile.highlightMeshMerger.process(halos)
      )

      .registerMapper("tileColoredMerged", ["tileModels"], ({tileModels: {colored}}) =>
        tile.colorMeshMerger.process(colored)
      )

      //
      // TILES - Labels
      //

      .registerMapper(
        "tileLabelProducer",
        ["tilesSimplified", "exportedAgentData", "labels"],
        ({tilesSimplified, exportedAgentData, labels}) =>
          tile.labelProducer.process({
            transitionalRenderable: tilesSimplified,
            exportedAgentData: exportedAgentData,
            labelData: labels,
          })
      )

      .registerMapper("tileLabelCreator", ["tileLabelProducer"], ({tileLabelProducer: {results}}) =>
        tile.labelCreator.process({
          labelDefinitions: results,
        })
      )

      //
      // TAGS
      //

      .registerMapper("tagsSimplified", ["layout"], ({layout: {tags}}) =>
        tags.map(t => tag.simplifier.process(t))
      )

      .registerMapper(
        "tagModels",
        ["tagsSimplified", "highlighted", "colored", "greyScaled"],
        ({tagsSimplified, highlighted, colored, greyScaled}) =>
          tag.modelProducer.process({
            transitionalRenderable: tagsSimplified,
            highlights: highlighted,
            colors: colored,
            greys: greyScaled,
          })
      )

      .registerMapper("tagGreyScaledMerged", ["tagModels"], ({tagModels: {greyScaled}}) =>
        tag.greyScaledMerger.process(greyScaled)
      )

      .registerMapper("tagNonModifiedMerged", ["tagModels"], ({tagModels: {nonModified}}) =>
        tag.nonModifiedMeshMerger.process(nonModified)
      )

      .registerMapper("tagHaloMerged", ["tagModels"], ({tagModels: {halos}}) =>
        tag.highlightMeshMerger.process(halos)
      )

      .registerMapper("tagColoredMerged", ["tagModels"], ({tagModels: {colored}}) =>
        tag.colorMeshMerger.process(colored)
      )

      //
      // TAGS - Labels
      //

      .registerMapper(
        "tagLabelProducer",
        ["tagsSimplified", "exportedAgentData", "labels"],
        ({tagsSimplified, exportedAgentData, labels}) =>
          tag.labelProducer.process({
            transitionalRenderable: tagsSimplified,
            exportedAgentData: exportedAgentData,
            labelData: labels,
          })
      )

      .registerMapper("tagLabelCreator", ["tagLabelProducer"], ({tagLabelProducer: {results}}) =>
        tag.labelCreator.process({
          labelDefinitions: results,
        })
      )

      //
      // VEHICLES
      //

      .registerMapper("vehiclesSimplified", ["traffic"], ({traffic: {vehicles}}) =>
        vehicles.map(t => vehicle.simplifier.process(t))
      )

      .registerMapper(
        "vehicleModels",
        ["vehiclesSimplified", "highlighted", "colored", "greyScaled"],
        ({vehiclesSimplified, highlighted, colored, greyScaled}) =>
          vehicle.modelProducer.process({
            transitionalRenderable: vehiclesSimplified,
            highlights: highlighted,
            colors: colored,
            greys: greyScaled,
          })
      )

      .registerMapper(
        "vehicleGreyScaledMerged",
        ["vehicleModels"],
        ({vehicleModels: {greyScaled}}) => vehicle.greyScaledMerger.process(greyScaled)
      )

      .registerMapper(
        "vehicleNonModifiedMerged",
        ["vehicleModels"],
        ({vehicleModels: {nonModified}}) => vehicle.nonModifiedMeshMerger.process(nonModified)
      )

      .registerMapper("vehicleHaloMerged", ["vehicleModels"], ({vehicleModels: {halos}}) =>
        vehicle.highlightMeshMerger.process(halos)
      )

      .registerMapper("vehicleColoredMerged", ["vehicleModels"], ({vehicleModels: {colored}}) =>
        vehicle.colorMeshMerger.process(colored)
      )

      //
      // VEHICLES - Labels
      //

      .registerMapper(
        "vehicleLabelProducer",
        ["vehiclesSimplified", "exportedAgentData", "labels"],
        ({vehiclesSimplified, exportedAgentData, labels}) =>
          vehicle.labelProducer.process({
            transitionalRenderable: vehiclesSimplified,
            exportedAgentData: exportedAgentData,
            labelData: labels,
          })
      )

      .registerMapper(
        "vehicleLabelCreator",
        ["vehicleLabelProducer"],
        ({vehicleLabelProducer: {results}}) =>
          vehicle.labelCreator.process({
            labelDefinitions: results,
          })
      )

      .registerMapper(
        "scene",
        [
          "tileNonModifiedMerged",
          "tileGreyScaledMerged",
          "tileHaloMerged",
          "tileColoredMerged",
          "tileLabelCreator",
          "tagNonModifiedMerged",
          "tagGreyScaledMerged",
          "tagHaloMerged",
          "tagColoredMerged",
          "tagLabelCreator",
          "vehicleNonModifiedMerged",
          "vehicleGreyScaledMerged",
          "vehicleHaloMerged",
          "vehicleColoredMerged",
          "vehicleLabelCreator",
        ],
        args => groupProducer.process(args)
      )
  );
};
