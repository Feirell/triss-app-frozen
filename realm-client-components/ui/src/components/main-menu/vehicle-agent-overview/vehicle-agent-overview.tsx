import {useSelector} from "react-redux";
import React from "react";

import {State} from "@triss/state-management";

import {AddVehicleAgent} from "./add-vehicle-agent/add-vehicle-agent";

const vehicleAgentSelector = (state: State) => state.server.vehicleAgents;

export const VehicleAgentOverview = () => {
  const agents = useSelector(vehicleAgentSelector);

  return (
    <>
      <h2>Fahrzeug Agenten</h2>
      <div className="dash-item-container">
        {agents.map(inst => (
          <div className="dash-item grid-one-one entity-information" key={inst.id}>
            <h3>
              <span className="name">{inst.name}</span>
              <span className="id">{inst.id}</span>
            </h3>
            <div className="information-container">
              <div className="information-key">Beschreibung</div>
              <div className="information-value">{inst.description}</div>
            </div>
            <div className="actions"></div>
          </div>
        ))}
      </div>
      <AddVehicleAgent />
    </>
  );
};
