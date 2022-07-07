import {useSelector} from "react-redux";
import React from "react";

import {State} from "@triss/state-management";
import {useThunkDispatch} from "../../../hooks/use-thunk";
import {
  SimulationInstanceInformation,
  SimulationOperatingState,
  SimulationOperatingStateEnum,
} from "@triss/client-server-serializer";

import {AddInstance} from "./add-instance/add-instance";

const selectInstances = (state: State) => state.server.instances;

export const InstanceOverview = () => {
  const instances = useSelector(selectInstances);

  const dispatch = useThunkDispatch();

  const viewInstance = (instance: SimulationInstanceInformation) => {
    dispatch({
      type: "view-simulation-instance",
      id: instance.id,
      exportFor: [],
    });
  };

  const setOperatingState = (instanceId: number, toState: SimulationOperatingState) => {
    dispatch({
      type: "change-simulation-instance-operating-state",
      instanceId,
      toState,
    });
  };

  const mapState = (state: SimulationOperatingState): string => {
    switch (state) {
      case "running":
        return "Ausführend";

      case "paused":
        return "Pausiert";
    }

    return state;
  };

  const mapStateChange = (state: SimulationOperatingState): string => {
    switch (state) {
      case "running":
        return "Fortführen";

      case "paused":
        return "Pausieren";
    }

    return state;
  };

  return (
    <>
      <h2>Instanzen</h2>
      <div className="dash-item-container">
        {instances.map(inst => (
          <div className="dash-item grid-one-one entity-information" key={inst.id}>
            <h3>
              <span className="name">{inst.name}</span>
              <span className="id">{inst.id}</span>
            </h3>
            <div className="information-container">
              <div className="information-key">Zustand</div>
              <div className="information-value">{mapState(inst.operatingState)}</div>
            </div>
            <div className="information-container">
              <div className="information-key">Beschreibung</div>
              <div className="information-value">{inst.description}</div>
            </div>
            <div className="actions">
              {SimulationOperatingStateEnum.getAllValid()
                .filter(v => v != inst.operatingState)
                .map(v => (
                  <button
                    key={v}
                    className="choose button--inverse"
                    onClick={() => setOperatingState(inst.id, v)}
                  >
                    {mapStateChange(v)}
                  </button>
                ))}
              <button className="choose button--inverse" onClick={() => viewInstance(inst)}>
                Anschauen
              </button>
            </div>
          </div>
        ))}
      </div>
      <AddInstance />
    </>
  );
};
