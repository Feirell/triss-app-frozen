import {EventEmitter} from "event-emitter-typesafe";

type Vector2 = [number, number];

interface MouseInteractionHelperEvents {
  click: {
    type: "click";
    emitter: MouseInteractionHelper;
    original: MouseEvent;
    startingOriginal: MouseEvent;
  };

  dragstart: {
    type: "dragstart";
    emitter: MouseInteractionHelper;
    original: MouseEvent;
  };
  drag: {
    type: "drag";
    emitter: MouseInteractionHelper;
    original: MouseEvent;
    previous: Vector2;
  };
  dragend: {
    type: "dragend";
    emitter: MouseInteractionHelper;
    original: MouseEvent;
    startingOriginal: MouseEvent;
  };

  mousedown: {
    type: "mousedown";
    emitter: MouseInteractionHelper;
    original: MouseEvent;
  };
  mouseup: {
    type: "mouseup";
    emitter: MouseInteractionHelper;
    original: MouseEvent;
  };

  mousemove: {
    type: "mousemove";
    emitter: MouseInteractionHelper;
    original: MouseEvent;
  };
}

type ArrayEntry<T> = T extends (infer U)[] ? U : never;
type Values<T> = T extends object ? (T extends {[key in keyof T]: infer V} ? V : never) : never;

export type MouseInteractionHelperEventObjects = Values<MouseInteractionHelperEvents>;

export interface CombinedDragCommand {
  start: boolean;
  progressed: boolean;
  ended: boolean;

  startPosition: Vector2;
  endPosition: Vector2;
}

const pos = (ev: MouseInteractionHelperEventObjects) =>
  [ev.original.clientX, ev.original.clientY] as Vector2;

export function getCombinedDragCommands(occurredEvents: MouseInteractionHelperEventObjects[]) {
  const combinedDragCommands: CombinedDragCommand[] = [];
  let currentDrag: CombinedDragCommand | undefined = undefined;

  for (const event of occurredEvents) {
    if (event.type == "dragstart") {
      currentDrag = {
        start: true,
        progressed: false,
        ended: false,

        startPosition: pos(event),
        endPosition: pos(event),
      };
    } else if (event.type == "drag") {
      if (currentDrag) {
        currentDrag.progressed = true;
        currentDrag.endPosition = pos(event);
      } else {
        // when the drag started before this buffer
        currentDrag = {
          start: false,
          progressed: true,
          ended: false,

          startPosition: event.previous,
          endPosition: pos(event),
        };
      }
    } else if (event.type == "dragend") {
      if (currentDrag) {
        currentDrag.ended = true;
        currentDrag.endPosition = pos(event);
        combinedDragCommands.push(currentDrag);
        currentDrag = undefined;
      } else {
        // if the drag ends without any movement in this buffer
        combinedDragCommands.push({
          start: false,
          progressed: false,
          ended: true,

          startPosition: pos(event),
          endPosition: pos(event),
        });
      }
    }
  }

  if (currentDrag) combinedDragCommands.push(currentDrag);

  return combinedDragCommands;
}

export function getMousePosition(occurredEvents: MouseInteractionHelperEventObjects[]) {
  return occurredEvents.length == 0 ? undefined : pos(occurredEvents[occurredEvents.length - 1]);
}

export class MouseInteractionHelper extends EventEmitter<MouseInteractionHelperEvents> {
  constructor(
    private readonly container: Document | HTMLElement = document,
    private readonly capture: boolean = false
  ) {
    super();
    this.attachListener();
  }

  /**
   * Listens for several events and pushes them together in an buffer which can be get by calling the stopCapture or flushEvents functions.
   */
  captureEvents(
    eventNames: (keyof MouseInteractionHelperEvents)[] = [
      "click",
      "dragstart",
      "drag",
      "dragend",
      "mousedown",
      "mouseup",
      "mousemove",
    ]
  ) {
    type ListeningEvents = MouseInteractionHelperEvents[ArrayEntry<typeof eventNames>];
    let occurredEvents: ListeningEvents[] = [];

    const listener = (ev: ListeningEvents) => occurredEvents.push(ev);

    for (const name of eventNames) this.addEventListener(name, listener);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;

    /**
     * Detaches the listener and returns the events which were left in the buffer.
     */
    function stopCapture() {
      for (const name of eventNames) that.removeEventListener(name, listener);

      return occurredEvents;
    }

    /**
     * Returns all captured events and empties the buffer.
     */
    function flushEvents() {
      const events = occurredEvents;
      occurredEvents = [];
      return events;
    }

    return {stopCapture, flushEvents};
  }

  attachListener() {
    this.attachDOMListener();
    this.attachTranslateListener();
  }

  detachListener() {
    this.detachDOMListener();
    this.detachTranslateListener();
  }

  private detachDOMListener: () => void = () => undefined;

  private attachDOMListener() {
    const container = this.container;

    this.detachDOMListener();

    const mousemoveListener: any = (ev: MouseEvent) =>
      this.emit("mousemove", {
        type: "mousemove",
        emitter: this,
        original: ev,
      });
    container.addEventListener("mousemove", mousemoveListener, this.capture);

    const mousedownListener: any = (ev: MouseEvent) =>
      this.emit("mousedown", {
        type: "mousedown",
        emitter: this,
        original: ev,
      });
    container.addEventListener("mousedown", mousedownListener, this.capture);

    const mouseupListener: any = (ev: MouseEvent) =>
      this.emit("mouseup", {type: "mouseup", emitter: this, original: ev});
    container.addEventListener("mouseup", mouseupListener, this.capture);

    this.detachDOMListener = () => {
      container.removeEventListener("mousemove", mousemoveListener);
      container.removeEventListener("mousedown", mousedownListener);
      container.removeEventListener("mouseup", mouseupListener);
    };
  }

  private detachTranslateListener: () => void = () => undefined;

  private attachTranslateListener() {
    this.detachTranslateListener();

    let mouseDownEvent: MouseInteractionHelperEvents["mousedown"] | undefined = undefined;
    let emittedDragStart = false;

    const mouseDownListener = (ev: MouseInteractionHelperEvents["mousedown"]) => {
      emittedDragStart = false;
      mouseDownEvent = ev;
    };
    this.addEventListener("mousedown", mouseDownListener);

    const mouseUpListener = (ev: MouseInteractionHelperEvents["mouseup"]) => {
      if (mouseDownEvent === undefined) return;

      // lastMouseDownPos = undefined;
      if (emittedDragStart)
        this.emit("dragend", {
          type: "dragend",
          original: ev.original,
          startingOriginal: mouseDownEvent!.original,
          emitter: this,
        });
      else
        this.emit("click", {
          type: "click",
          original: ev.original,
          startingOriginal: mouseDownEvent!.original,
          emitter: this,
        });

      mouseDownEvent = undefined;
    };
    this.addEventListener("mouseup", mouseUpListener);

    const mouseMoveListener = (ev: MouseInteractionHelperEvents["mousemove"]) => {
      if (ev.original.buttons > 0) {
        if (!emittedDragStart) {
          emittedDragStart = true;
          this.emit("dragstart", {
            type: "dragstart",
            original: ev.original,
            emitter: this,
          });
        } else {
          this.emit("drag", {
            type: "drag",
            original: ev.original,
            // TODO check if this previous is semantically correct
            previous: pos(ev),
            emitter: this,
          });
        }
      }
    };
    this.addEventListener("mousemove", mouseMoveListener);

    this.detachTranslateListener = () => {
      this.removeEventListener("mousedown", mouseDownListener);
      this.removeEventListener("mouseup", mouseUpListener);
      this.removeEventListener("mousemove", mouseMoveListener);
    };
  }
}

export const GLOBAL_MOUSE_LISTENER = new MouseInteractionHelper();
