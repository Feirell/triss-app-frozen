import {useSelector} from "react-redux";
import React, {FormEventHandler, KeyboardEventHandler, useEffect, useState} from "react";

import {StateRendererWrapper} from "../state-renderer/state-renderer-wrapper";
import {useInstance} from "../../hooks/use-instance";
import {State} from "@triss/state-management";
import {useThunkDispatch} from "../../hooks/use-thunk";
import {LayoutStateDTO, Orientation} from "@triss/dto";

import {PlaceableChooser, PossiblePicked} from "./hud/placeable-chooser";
import {ComposeLayoutController} from "./compose-layout-controller";

const viewSelector = (state: State) => state.client.view;

const createController = () => new ComposeLayoutController();

const ActualComposeView = ({basis}: {basis?: LayoutStateDTO}) => {
  const clc = useInstance(createController);

  useEffect(() => {
    clc.setInitialLayout(basis);
  }, [basis, clc]);

  const dispatch = useThunkDispatch();

  const [currentlyChosen, setCurrentlyChosen] = useState<PossiblePicked>(undefined);
  clc.currentType = currentlyChosen;

  const [currentOrientation, setCurrentOrientation] = useState<Orientation>(0);
  clc.currentOrientation = currentOrientation;

  const [nameForInstance, setNameForInstance] = useState("");
  const [descriptionForInstance, setDescriptionForInstance] = useState("");

  const onKeyDown: KeyboardEventHandler = ev => {
    if (ev.key == ",") {
      let nc = currentOrientation - 1;
      if (nc < 0) nc = 3;

      setCurrentOrientation(nc as Orientation);
    } else if (ev.key == ".") {
      let nc = currentOrientation + 1;
      if (nc > 3) nc = 0;

      setCurrentOrientation(nc as Orientation);
    }
  };

  // TODO make this react conform
  useEffect(() => {
    const listener = onKeyDown as any;
    document.addEventListener("keydown", listener);

    return () => document.removeEventListener("keydown", listener);
  }, [onKeyDown]);

  // const dispatch = useThunkDispatch();

  const isAbleToSubmit = () => {
    // if (!chosenAgent)
    //     return false;

    return true;
  };

  const create: FormEventHandler = ev => {
    ev.preventDefault();
    if (!isAbleToSubmit()) return;

    const layout = clc.getLayout();

    // TODO implement a algorithm which removes the gaps between ids, and compacts them.
    //  The gaps are coming from the way the ids are generated, removing them could simplify debugging

    dispatch({
      type: "finished-layout-creation",
      name: nameForInstance,
      description: descriptionForInstance,
      layout: layout,
    });
  };

  const onPlaceablePicked = (nr: PossiblePicked) =>
    setCurrentlyChosen(currentNr => (currentNr == nr ? undefined : nr));

  // const onAgentSelected = (nr: number) => setChosenAgent(availableAgents.find(v => v.id == nr));

  const abortCreation = () => dispatch({type: "navigate-to-overview", view: "layouts"});

  return (
    <>
      <div className="scene-container">
        <StateRendererWrapper renderer={clc} />
      </div>
      <div className="ui-container">
        <div className="left-ui">
          <h1>Layout erstellen</h1>
          <form onSubmit={create} className="meta-information">
            <div className="input-group">
              <label htmlFor="name-for-layout">Name des Layouts</label>
              <input
                id="name-for-layout"
                type="text"
                placeholder="Name"
                value={nameForInstance}
                onChange={ev => setNameForInstance(ev.target.value)}
              />
            </div>
            <div className="input-group">
              <label htmlFor="description-for-layout">Beschreibung des Layouts</label>
              <textarea
                id="description-for-layout"
                placeholder="Beschreibung des Layouts"
                value={descriptionForInstance}
                onChange={ev => setDescriptionForInstance(ev.target.value)}
              />
            </div>
            {/* <div className="input-group">
                        <AgentChooser options={availableAgents} onChosen={onAgentSelected}/>
                    </div>*/}
            <div className="input-group">
              <input type="submit" value="Erstellen" disabled={!isAbleToSubmit()} />
            </div>
          </form>

          <div className="abort-wrapper">
            <button className="abort" onClick={abortCreation}>
              Abbrechen
            </button>
          </div>
        </div>
        <div className="bottom-ui">
          <PlaceableChooser onPicked={onPlaceablePicked} picked={currentlyChosen} />
        </div>
      </div>
    </>
  );
};

export const ComposeLayout = () => {
  const view = useSelector(viewSelector);

  if (view.name !== "compose-layout")
    throw new Error("This component can only be used if the view is compose layout");

  const basisOn = view.basis;

  if (basisOn == "loading") return <span>Is still loading</span>;
  else return <ActualComposeView basis={basisOn} />;
};
