import {useSelector} from "react-redux";
import React from "react";

import {State} from "@triss/state-management";

const progressSelector = (state: State) =>
  state.client.view.name == "loading-assets" ? state.client.view : undefined;

// const frm = new Intl.NumberFormat('en-US', {useGrouping: true}).format;
const frmPerc = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
}).format;

export const LoadingAssets = () => {
  const prog = useSelector(progressSelector);
  if (!prog) throw new Error("Currently not loading");

  // const totalFrm = frm(Math.ceil(prog.total / 1000));
  // const loadedFrm = frm(Math.ceil(prog.loaded / 1000)).padStart(totalFrm.length, ' ');

  const progressPerc = prog.total == 0 ? 0 : prog.loaded / prog.total;
  const progPerc = frmPerc(progressPerc * 100).padStart(6, " ") + "%";

  return (
    <div className="ui-container">
      <div className="overlap-wrapper">
        <h1 className="base">TRISS</h1>
        <h1 className="discover" style={{width: progPerc}}>
          TRISS
        </h1>
      </div>
    </div>
  );
};
