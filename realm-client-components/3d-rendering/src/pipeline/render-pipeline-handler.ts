import {CSS2DRenderer} from "three/examples/jsm/renderers/CSS2DRenderer";
import {
  Color,
  Group,
  InstancedMesh,
  Intersection,
  Object3D,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  WebGLRenderer,
} from "three";

import {EntityKeyMap} from "../utility/entity-key-map";
import {createDomeAndGround} from "../setup/sky-ground-setup";
import {createRenderer} from "../setup/renderer-setup";
import {createLights} from "../setup/lights-setup";
import {createCamera, createControls} from "../setup/camera-setup";
import {LabelData} from "../render-entities/label-data";
import {HighlightEntity} from "../render-entities/highlight-entity";
import {GreyScaleEntity} from "../render-entities/grey-scale-entity";
import {EntityModifications} from "../render-entities/entity-modifications";
import {ColorEntity} from "../render-entities/color-entity";
import {OrbitControls} from "../interaction/orbit-controls";
import {ModelProvider} from "@triss/server-connection";
import {TILE_SCALE} from "@triss/entity-definition";
import {FullFrameStateDTO} from "@triss/dto";
import {
  EntityDTO,
  EntityType,
  LayoutStateDTO,
} from "@triss/dto";
// import {createIdHandler} from "../../../../../modules/common/src/helper/create-id-handler";
import {Logger} from "@triss/logger";
import {createMeasureFrameRate} from "@triss/frame-rate-diagnostics";



// function createIdHandler(){
//   let id = 0;
//
//   function nextId(){
//     return id++;
//   }
//
//   return {nextId};
// }

import {createRenderPipeline, RenderPipelineProcessData} from "./render-pipeline";

const isInstancedMesh = (object: any): object is InstancedMesh =>
  typeof object == "object" && object.isInstancedMesh;

const isMap = (value: any): value is Map<any, any> =>
  typeof value == "object" && value instanceof Map;

const isEntity = (value: any): value is EntityDTO =>
  typeof value == "object" && ["TileDTO", "VehicleDTO", "TagDTO"].includes(value.category);

export const emptyFrame: FullFrameStateDTO = {
  frameId: 0,
  simulationTime: 0,

  layout: {
    category: "LayoutStateDTO",
    tags: [],
    tiles: [],
  },
  traffic: {
    category: "TrafficStateDTO",
    vehicles: [],
  },
  exportedAgentData: [],
};

const domNodeHasParent = (node: HTMLElement, parent: ParentNode) => {
  for (let n: ParentNode = node; n.parentNode != null; n = n.parentNode)
    if (n == parent) return true;

  return false;
};

// const id = createIdHandler();

const log = console.log.bind(console);

export class RenderPipelineHandler {
  private readonly pipeline;
  private readonly pipelineStatic: (data: RenderPipelineProcessData) => Group[];

  private dirtyChecks = {
    orbit: false,
    frame: true,
    dimensions: true,
    manual: false,
  };

  private entityModifications: EntityModifications = {
    highlighted: new EntityKeyMap<HighlightEntity>(),
    colored: new EntityKeyMap<ColorEntity>(),
    greyScaled: new EntityKeyMap<GreyScaleEntity>(),
    labels: new EntityKeyMap<LabelData>(),
  };

  private scene!: Scene;
  private metaGroup!: Group;
  private entitiesGroup!: Group;

  private css2dRenderer!: CSS2DRenderer;
  private threeRenderer!: WebGLRenderer;
  private mainCamera!: PerspectiveCamera;
  private container!: HTMLDivElement;

  private orbitControls!: OrbitControls;

  private environmentObjects: {
    dome: Object3D;
    ground: Object3D;
  } = {} as any;
  private frame = emptyFrame;

  private raycaster = new Raycaster();

  private customObjectsGroup!: Group;

  constructor(private readonly modelProvider: ModelProvider<EntityType>) {
    const pipeline = (this.pipeline = createRenderPipeline(modelProvider));
    this.pipelineStatic = pipeline.forgeStaticPipelineFunction("scene");

    this.initialize();
  }

  private get isOneFlagDirty() {
    for (const key in this.dirtyChecks) {
      const value = (this.dirtyChecks as any)[key];

      if (value) return true;
    }

    return false;
  }

  private unsetAllFlags() {
    for (const key in this.dirtyChecks) {
      (this.dirtyChecks as any)[key] = false;
    }
  }

  /**
   * You can use this to add objects which are not managed by the render pipeline.
   * Call this.forceRerender() when you made a change to this group, otherwise the changed will only be visible after
   * the next other change, like rotating the camera or changing the frame object.
   */
  getCustomObjectsGroup() {
    return this.customObjectsGroup;
  }

  getEntityModifications() {
    return this.entityModifications;
  }

  setEntityModifications(em: EntityModifications) {
    this.entityModifications = em;
  }

  public mapClientCoordsToCanvasPercentagePos(clientX: number, clientY: number): [number, number] {
    if (!this.isContainerAttached()) throw new Error("container is not yet attached");

    const cr = this.container.getClientRects();
    const rect = cr[0];
    const percX = (clientX - rect.left) / rect.width;
    const percY = 1 - (clientY - rect.top) / rect.height;

    return [percX, percY];
  }

  public rayCastByPercentage(percentageX: number, percentageY: number) {
    const rc = this.raycaster;

    const x = percentageX * 2 - 1;
    const y = percentageY * 2 - 1;

    rc.setFromCamera({x, y}, this.mainCamera);
    return rc.intersectObjects([this.scene], true);
  }

  public rayCastByClientCoords(clientX: number, clientY: number) {
    const [percX, percY] = this.mapClientCoordsToCanvasPercentagePos(clientX, clientY);
    return this.rayCastByPercentage(percX, percY);
  }

  public mapIntersectionsToEntities(intersections: Intersection[]) {
    const ret: {entity: EntityDTO; intersection: Intersection}[] = [];

    for (const intersection of intersections) {
      const object = intersection.object;
      if (!isInstancedMesh(object)) continue;

      const userData = object.userData;

      if (!isMap(userData)) continue;

      const instanceId = intersection.instanceId;

      if (typeof instanceId != "number") continue;

      const entity = userData.get(instanceId);

      if (!isEntity(entity)) {
        console.warn(
          "The intersection",
          intersection,
          "intersected with a object which seemed like a " +
            "mapping for an entity but the map returned",
          entity
        );
        continue;
      }

      ret.push({entity, intersection});
    }

    return ret;
  }

  public getGroundHit(intersections: Intersection[]) {
    const groundMesh = this.environmentObjects.ground;

    for (const intersection of intersections) {
      const object = intersection.object;
      if (object != groundMesh) continue;

      const point = intersection.point;

      const xc = Math.round(point.x / TILE_SCALE);
      const yc = Math.round(point.z / TILE_SCALE);

      const gridPosition = new Vector2(xc, yc);

      return {point, gridPosition};
    }
  }

  forceRerender() {
    this.dirtyChecks.manual = true;
  }

  private readonly frameRenderMeasure = createMeasureFrameRate("frame-render");

  private readonly instanceId = "____-____".replace(/_/g, () =>
    String.fromCharCode("a".charCodeAt(0) + Math.random() * 26)
  );

  private readonly logger = new Logger(RenderPipelineHandler.name + "-" + this.instanceId);

  cycle() {
    this.update();
  }

  update() {
    const willRender = this.isOneFlagDirty;

    const start = performance.now();
    this.updateStepProcess();
    this.updateStepResize();
    this.updateStepRender();
    const end = performance.now();

    if (willRender) {
      this.frameRenderMeasure.addMeasure(start, end);

      if (this.frame.frameId % 120 == 0) this.logger.debug(this.frameRenderMeasure.generateLog());
    }
  }

  setFrame(frame: FullFrameStateDTO) {
    if (this.frame == frame) return;

    this.dirtyChecks.frame = true;
    this.frame = frame;
  }

  getFrame() {
    return this.frame;
  }

  replaceLayout(layout: LayoutStateDTO = emptyFrame.layout) {
    if (this.frame.layout == layout) return;

    // TODO would it be beneficial to increase the frame number or simulationTime?

    this.setFrame({...this.frame, layout});
  }

  extractLayout() {
    return this.frame.layout;
  }

  getContainer(): HTMLElement {
    return this.container;
  }

  public isContainerAttached = () => {
    return domNodeHasParent(this.container, document.body);
  };

  private initialize() {
    const domeGroundColor = new Color(0xffffff);
    const groundColor = new Color(0x8ab448);
    const skyColor = new Color(0x28b9fc);
    const sunColor = new Color(0xf7f7f1);

    const domeRadius = 15000;

    // TODO reimplement some good version of fog which renders with the actual distance to the camera and not the depth
    //  value of the renderer which is in frustrum and not in world space

    // this.scene.fog = new Fog(0, (domeRadius * .95) / 2, domeRadius);
    // this.scene.fog.color.copy(domeGroundColor);

    this.scene = new Scene();

    this.metaGroup = new Group();
    this.metaGroup.name = "meta-objects";

    this.entitiesGroup = new Group();
    this.entitiesGroup.name = "entities-objects";

    this.customObjectsGroup = new Group();
    this.customObjectsGroup.name = "custom-objects";

    this.scene.add(this.metaGroup);
    this.scene.add(this.entitiesGroup);
    this.scene.add(this.customObjectsGroup);

    {
      // Camera and controls

      this.container = document.createElement("div");
      this.container.className = "three-wrapper";

      const viewWidth = this.container.clientWidth;
      const viewHeight = this.container.clientHeight;
      const pixelRatio = window.devicePixelRatio;

      {
        // Camera
        this.mainCamera = createCamera(viewHeight, viewWidth);
        this.mainCamera.far = domeRadius * 2;
      }

      {
        // 3D renderer
        this.threeRenderer = createRenderer();
        this.threeRenderer.setPixelRatio(pixelRatio);
        this.threeRenderer.setSize(viewWidth, viewHeight);

        this.container.appendChild(this.threeRenderer.domElement);
      }

      {
        // 2D renderer
        this.css2dRenderer = new CSS2DRenderer();
        this.css2dRenderer.setSize(viewWidth, viewHeight);

        this.container.appendChild(this.css2dRenderer.domElement);
      }

      {
        // Controls
        this.orbitControls = createControls(this.mainCamera, this.container);

        // TODO decouple the orbit control change and the camera movement
        //  buffer the change and apply it as an update step
        this.orbitControls.maxDistance = domeRadius / 3;
        this.orbitControls.addEventListener("change", () => (this.dirtyChecks.orbit = true));
      }
    }

    {
      // Ground and dome meta objects

      const {dome, ground} = createDomeAndGround({
        groundColor,
        skyColor,
        domeGroundColor,
        radius: domeRadius,
      });

      const metaElementsGroup = new Group();

      metaElementsGroup.add(dome);
      this.environmentObjects.dome = dome;

      metaElementsGroup.add(ground);
      this.environmentObjects.ground = ground;

      this.metaGroup.add(metaElementsGroup);
    }

    {
      // Lightning

      const lightsGroup = new Group();
      const lights = createLights({
        createHelper: false,

        UIControl: undefined as any,
        groundColor,
        skyColor,
        sunColor,
      });
      lightsGroup.add(lights.ambientLight);
      lightsGroup.add(lights.hemisphericLight);

      // TODO make the shadow camera follow the view camera, to enable sun shadows where the user looks
      lightsGroup.add(lights.directionalLight);
      lightsGroup.add(lights.directionalLightTarget);

      this.metaGroup.add(lightsGroup);
    }

    // const axesHelper = new THREE.AxesHelper(5);
    // if (!Array.isArray(axesHelper.material))
    //     axesHelper.material.depthTest = false;

    // this.scene.add(axesHelper);
  }

  private updateStepProcess() {
    // The frame did not change
    if (!this.dirtyChecks.frame) return;

    const groups = this.pipelineStatic({
      ...this.frame,
      ...this.entityModifications,
    });

    this.entitiesGroup.clear();
    this.entitiesGroup.add(...groups);
  }

  private updateStepResize() {
    // The container element is currently not attached to a viewport
    if (!this.isContainerAttached()) return;

    const {clientWidth, clientHeight} = this.container;
    const size = this.threeRenderer.getSize(new Vector2());

    // The size did not change, no need for update
    if (size.x == clientWidth && size.y == clientHeight) return;

    this.dirtyChecks.dimensions = true;

    this.mainCamera.aspect = clientWidth / clientHeight;

    // update the camera's frustum
    this.mainCamera.updateProjectionMatrix();

    this.threeRenderer.setSize(clientWidth, clientHeight);
    this.css2dRenderer.setSize(clientWidth, clientHeight);
  }

  private updateStepRender() {
    // The container is not yet attached, will not render
    if (!this.isContainerAttached()) return;

    if (!this.isOneFlagDirty) return;

    this.unsetAllFlags();

    this.threeRenderer.render(this.scene, this.mainCamera);
    this.css2dRenderer.render(this.scene, this.mainCamera);
  }
}
