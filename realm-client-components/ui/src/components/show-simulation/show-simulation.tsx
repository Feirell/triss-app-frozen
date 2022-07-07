import {Color} from "three";
import {useStore} from "react-redux";
import {createRoot} from "react-dom/client";
import React from "react";

import {StateRendererWrapper} from "../state-renderer/state-renderer-wrapper";
import {EaeDataComponent} from "../exported-agent-data/eae-data-component";
import {useInstance} from "../../hooks/use-instance";
import {State, store} from "@triss/state-management";
import {useThunkDispatch} from "../../hooks/use-thunk";
import {GLOBAL_MODEL_PROVIDER} from "@triss/server-connection";
import {EntityKeyMap, MouseInteractionHelper, RenderPipelineHandler} from "@triss/3d-rendering";
import {EntityDTO, EntityIdentifier, ExportedAgentEntityData, ExportedAgentEntityNotFound} from "@triss/dto";

function createIdHandler(start = 0) {
  let value = start;

  const nextId = () => value++;

  return {nextId};
}

// const chosenSelector = (state: State) => state.server.chosenInstance;

// const ExampleLabel = (
//     {
//         data
//     }: {
//         data: EntityDTO & { userData?: any }
//     }) =>
//     data.userData ?
//         <EaeDataComponent data={data.userData.attachedData}/> :
//         <span>There is not user data for vehicle with id {data.id}</span>

const ExampleLabel = ({
                        entity,
                        exportedData
                      }: {
  entity: EntityDTO;
  exportedData: ExportedAgentEntityData | ExportedAgentEntityNotFound;
}) => {
  if (exportedData.type == "exported-agent-entity-not-found")
    return (
      <span>
        There is not user data for {entity.category} with id {entity.id}
      </span>
    );
  else return <EaeDataComponent data={exportedData.attachedData} />;
};

const onEntity = (e: EntityDTO) =>
  e.category == "TagDTO" || e.category == "VehicleDTO" || e.category == "TileDTO";

const viewSelector = (state: State) => state.client.view;

const isIdentical = (a: EntityIdentifier, b: EntityIdentifier) =>
  a.idCategory == b.idCategory && a.idNumber == b.idNumber;

const id = createIdHandler();

class SimulationStateController {
  // private readonly renderer = new InteractiveRenderer(GLOBAL_MODEL_PROVIDER);
  private readonly renderer = new RenderPipelineHandler(GLOBAL_MODEL_PROVIDER);
  // private readonly clickLabelHandler = new OnClickLabel(this.renderer);

  private mih = new MouseInteractionHelper(this.renderer.getContainer(), true);
  private store!: typeof store;

  private observed = new EntityKeyMap<true>();

  constructor() {
    console.log("created SimulationStateController#" + id.nextId());
  }

  private unsubscribeFromStore: () => void = () => undefined;

  setStore(store: SimulationStateController["store"]) {
    this.unsubscribeFromStore();

    const storeUnsub = store.subscribe(() => this.onStoreChange());

    const listener = () => store.dispatch({type: "world-state-consumed"});

    const renderer = this.renderer;

    // renderer.addEventListener("consumed-world-state", listener);

    this.unsubscribeFromStore = () => {
      storeUnsub();
      // renderer.removeEventListener("consumed-world-state", listener);
    };

    this.store = store;
  }

  destroy() {
    // this.renderer.stop();
    this.unsubscribeFromStore();
  }

  getRenderer() {
    return this.renderer;
  }

  cycle() {
    // if (this.renderer.isContainerAttached())
    this.frame();
  }

  private onStoreChange() {
    const state = this.store.getState();
    const view = viewSelector(state);
    if (view.name != "show-simulation") return;

    const frame = view.frame;
    this.renderer.setFrame(frame);
  }

  getContainer() {
    return this.renderer.getContainer();
  }

  private toggleEntityObservation(entity: EntityDTO) {
    const identifier: EntityIdentifier = {
      category: "EntityIdentifier",

      idNumber: entity.id,
      idCategory: entity.category
    };

    if (!this.observed.has(identifier)) {
      this.observed.set(identifier, true);

      const em = {...this.renderer.getEntityModifications()};
      const highlighted = (em.highlighted = em.highlighted.clone());
      const labels = (em.labels = em.labels.clone());

      highlighted.set(identifier, {
        entityIdentifier: identifier,
        highlightColor: new Color(1, 1, 1)
      });

      labels.set(identifier, {
        entityIdentifier: identifier,
        attachLabel: (node, entity, data) =>
          createRoot(node).render(<ExampleLabel entity={entity} exportedData={data} />)
      });

      this.renderer.setEntityModifications(em);

      const state = store.getState();
      const view = state.client.view;
      if (view.name == "show-simulation")
        store.dispatch({
          type: "view-simulation-instance",
          id: view.simulation.id,
          exportFor: Array.from(this.observed.keys())
        });
    } else {
      this.observed.delete(identifier);

      const em = {...this.renderer.getEntityModifications()};
      const highlighted = (em.highlighted = em.highlighted.clone());
      const labels = (em.labels = em.labels.clone());

      highlighted.delete(identifier);
      labels.delete(identifier);

      this.renderer.setEntityModifications(em);
    }
  }

  private eventBuffer = this.mih.captureEvents();

  private updateStepSelectEntities() {
    const events = this.eventBuffer.flushEvents();

    for (const e of events) {
      if (e.type == "click") {
        const {clientX, clientY} = e.original;
        const intersections = this.renderer.rayCastByClientCoords(clientX, clientY);
        const entities = this.renderer.mapIntersectionsToEntities(intersections);

        const alreadyVisitedEntity = new Set<EntityDTO>();

        for (const {entity, intersection} of entities) {
          if (alreadyVisitedEntity.has(entity)) continue;

          alreadyVisitedEntity.add(entity);

          this.toggleEntityObservation(entity);
          break;
        }
      }
    }

    // const events = this.renderer.getFrameCapturedMouseEvents();
    // const clh = this.clickLabelHandler;
    //
    // for (const e of events) {
    //     if (e.type == 'click') {
    //         const mp: [number, number] = [e.original.clientX, e.original.clientY];
    //         const entity = this.renderer.rayCastEntities(mp);
    //         if (entity.length > 0) {
    //             const ent = entity[0];
    //             clh.setLabelForEntity(ent.category, ent.id, ExampleLabel);
    //         }
    //     }
    // }
  }

  private frame() {
    // this.renderer.updateMouseInformation();

    // there is no need to update the state, since we get it pushed by
    // an store event and dont need to pull it
    // this.updateStepWorldState();

    this.updateStepSelectEntities();

    this.renderer.update();
  }
}

const createController = () => new SimulationStateController();

export const ShowSimulation = () => {
  const ssc = useInstance(createController);

  const dispatch = useThunkDispatch();

  const store = useStore();
  ssc.setStore(store as any);
  // const sr = useStateRenderer() as WorldStateRenderer<ExportedAgentVehicleData>;
  //
  // useWorldStateRendererConnectionToStore(sr, store, dispatch);
  // useInspect(sr, ExampleLabel, onEntity);

  const backClick = () => dispatch({type: "close-simulation-instance"});

  return (
    <>
      <div className="scene-container">
        <StateRendererWrapper renderer={ssc} />
      </div>
      <div className="ui-container">
        <div className="left-ui">
          <div className="abort-wrapper">
            <button className="abort" onClick={backClick}>
              Zurück
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
