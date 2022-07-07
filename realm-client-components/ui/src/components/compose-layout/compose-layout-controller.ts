import {GLOBAL_MODEL_PROVIDER} from "@triss/server-connection";
import {
  createTileGrate,
  EntityKeyMap,
  getMousePosition,
  GreyScaleEntity,
  MouseInteractionHelper,
  MouseInteractionHelperEventObjects,
  RenderPipelineHandler
} from "@triss/3d-rendering";
import {removePlaceableInSetup, setPlaceableInSetup} from "@triss/entity-helper";
import {TagType, TileType} from "@triss/entity-definition";
import {identifierFromEntity, LayoutStateDTO, Orientation, TagDTO, TileDTO, Vector2ui} from "@triss/dto";
import {PickableType, REMOVE} from "./hud/pickable";
import {isTag} from "@triss/entity-definition";

function createIdHandler(id = 0) {
  function nextId() {
    return id++;
  }

  return {nextId};
}

interface ShadowInstructions {
  type: TileType | TagType;
  orientation: Orientation;

  gridPosition: [number, number];
}

export class ComposeLayoutController {
  public currentType!: PickableType | undefined;
  // private readonly clickLabelHandler = new OnClickLabel(this.renderer);
  public currentOrientation!: Orientation;
  // private readonly renderer = new InteractiveRenderer(GLOBAL_MODEL_PROVIDER);
  private readonly renderer = new RenderPipelineHandler(GLOBAL_MODEL_PROVIDER);
  private mih = new MouseInteractionHelper(this.renderer.getContainer(), true);
  private eventBuffer = this.mih.captureEvents();

  private idGenerator!: {nextId(): number};
  private mouseEvents: MouseInteractionHelperEventObjects[] = [];
  private lastKnownMousePosition: undefined | [number, number] = undefined;

  private stateNeedsMerge = true;
  private staticWithoutShadowing!: LayoutStateDTO;

  private shadowState: "NONE" | TagDTO | TileDTO = "NONE";

  constructor(basis: undefined | LayoutStateDTO = undefined) {
    this.setInitialLayout(basis);

    const grid = createTileGrate([0, 0xff], [0, 0xff]);
    const customObjets = this.renderer.getCustomObjectsGroup();
    customObjets.add(grid);
    this.renderer.forceRerender();
  }

  setInitialLayout(basis: LayoutStateDTO | undefined) {
    this.renderer.replaceLayout(basis);

    const {layout, traffic} = this.renderer.getFrame();

    const entityModifications = this.renderer.getEntityModifications();
    this.staticWithoutShadowing = layout;

    let lowestId = 0;

    for (const entityArray of [layout.tiles, layout.tags, traffic.vehicles])
      for (const entity of entityArray) if (entity.id >= lowestId) lowestId = entity.id + 1;

    this.idGenerator = createIdHandler(lowestId);
  }

  cycle() {
    if (this.renderer.isContainerAttached()) this.frame();
  }

  getRenderer() {
    return this.renderer;
  }

  getContainer() {
    return this.renderer.getContainer();
  }

  destroy() {
    // nothing to destroy
  }

  getLayout() {
    return this.staticWithoutShadowing;
  }

  private updateStepPlace() {
    if (this.currentType == undefined) return;

    let placedOne = false;

    for (const event of this.mouseEvents) {
      if (event.type != "click") continue;

      // Buttons contain flags for the keys pressed when this event was emitted.
      // this allows to check if it was in fact the left mouse button which is bit 1
      const releasedButtons = event.original.buttons ^ event.startingOriginal.buttons;

      if ((releasedButtons & 0b1) == 0) continue;

      const oldWorldSetup = this.renderer.extractLayout();

      let newWS: LayoutStateDTO = {
        ...oldWorldSetup
      };

      const {clientX, clientY} = event.original;
      const intersections = this.renderer.rayCastByClientCoords(clientX, clientY);
      const gh = this.renderer.getGroundHit(intersections);

      if (gh) {
        const gp = gh.gridPosition;
        const gpArray = [gp.x, gp.y] as Vector2ui;

        if (this.currentType == REMOVE) newWS = removePlaceableInSetup(newWS, gpArray);
        else
          newWS = setPlaceableInSetup(
            newWS,
            gpArray,
            this.idGenerator.nextId(),
            this.currentType,
            this.currentOrientation
          );

        this.stateNeedsMerge = true;
        placedOne = true;
      }

      this.staticWithoutShadowing = newWS;
    }

    if (placedOne && this.shadowState !== "NONE") {
      // TODO this is really getting hacky, see the TOOD for the shadowing
      this.shadowState.id = this.idGenerator.nextId();
    }
  }

  private getDesiredShadowing(): ShadowInstructions | "NONE" {
    if (this.currentType == undefined || this.currentType == REMOVE) return "NONE";

    const mp = this.lastKnownMousePosition;
    if (mp == undefined) return "NONE";

    const intersections = this.renderer.rayCastByClientCoords(mp[0], mp[1]);
    const gh = this.renderer.getGroundHit(intersections)?.gridPosition;

    if (gh == undefined) return "NONE";

    return {
      type: this.currentType,
      orientation: this.currentOrientation,

      gridPosition: [gh.x, gh.y]
    };
  }

  private updateStepShadow() {
    const cs = this.shadowState;
    const desired = this.getDesiredShadowing();

    if (cs == "NONE" && desired == "NONE") return;

    if (
      typeof cs == "object" &&
      typeof desired == "object" &&
      // check if the desired and the current are identical

      cs.type == desired.type &&
      cs.gridPosition[0] == desired.gridPosition[0] &&
      cs.gridPosition[1] == desired.gridPosition[1] &&
      cs.orientation == desired.orientation
    )
      return;

    if (desired == "NONE") {
      this.shadowState = "NONE";
    } else {
      const {gridPosition, type, orientation} = desired;

      const id = this.idGenerator.nextId();
      const category = isTag(type) ? "TagDTO" : "TileDTO";

      this.shadowState = {category, type, orientation, gridPosition, id} as TileDTO | TagDTO;
    }

    this.stateNeedsMerge = true;
  }

  private updateStepMergeToLayout() {
    // This function is needed since a shadow tile could replace an already placed one which this needs to temporarily replace

    // TODO this style of merging is really bad, there are many things which are done multiple times
    //  and timing and state inconsistencies it would be much better to have a realisedLayout and a previewLayout
    //  which could be used to find deltas and display those with greyscaling.
    //  But it is not trivial to find deltas and make it performant, since it would take too much time I have
    //  postponed it.

    if (!this.stateNeedsMerge) return;

    this.stateNeedsMerge = false;

    let merged = {...this.staticWithoutShadowing};
    // This is really not efficient but it works, see the TODO at the top
    const em = {...this.renderer.getEntityModifications()};
    em.greyScaled = new EntityKeyMap<GreyScaleEntity>();

    if (this.shadowState != "NONE") {
      const ent = this.shadowState;
      const gpArray = ent.gridPosition;
      merged = removePlaceableInSetup(merged, gpArray);
      const arrayFieldId = ent.category == "TagDTO" ? "tags" : "tiles";

      const newArr = merged[arrayFieldId].slice();
      newArr.push(ent as any);
      merged[arrayFieldId] = newArr as any;
      const entityIdentifier = identifierFromEntity(ent);
      em.greyScaled.set(entityIdentifier, {entityIdentifier});
    }

    this.renderer.replaceLayout(merged);
    this.renderer.setEntityModifications(em);
  }

  private frame() {
    this.mouseEvents = this.eventBuffer.flushEvents();
    const mp = getMousePosition(this.mouseEvents);
    if (mp) this.lastKnownMousePosition = mp;

    this.updateStepPlace();
    this.updateStepShadow();
    this.updateStepMergeToLayout();

    this.renderer.update();
  }
}
