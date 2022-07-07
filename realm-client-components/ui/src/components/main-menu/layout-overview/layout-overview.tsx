import {useSelector} from "react-redux";
import React from "react";

import {State, ViewLayoutA} from "@triss/state-management";
import {useThunkDispatch} from "../../../hooks/use-thunk";
import {LayoutInformation} from "@triss/client-server-serializer";

import {AddLayout} from "./add-layout/add-layout";

const selectLayouts = (state: State) => state.server.layouts;

export const LayoutOverview = () => {
  const layouts = useSelector(selectLayouts);
  const dispatch = useThunkDispatch();

  const selectToInstance = (instance: LayoutInformation) => {
    dispatch({
      type: "view-layout",
      id: instance.id
    } as ViewLayoutA);
  };

  return (
    <>
      <h2>Layouts</h2>
      <div className="dash-item-container">
        {layouts.map(inst => (
          <div className="dash-item grid-one-one entity-information" key={inst.id}>
            <h3>
              <span className="name">{inst.name}</span>
              <span className="id">{inst.id}</span>
            </h3>
            <div className="information-container">
              <div className="information-key">Beschreibung</div>
              <div className="information-value">{inst.description}</div>
            </div>
            <div className="actions">
              <button className="choose button--inverse" onClick={() => selectToInstance(inst)}>
                Anschauen
              </button>
            </div>
          </div>
        ))}
      </div>
      <AddLayout layouts={layouts} />
    </>
  );
};
