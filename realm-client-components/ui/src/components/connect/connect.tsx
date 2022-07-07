import {useDispatch, useSelector} from "react-redux";
import React, {Dispatch, FormEvent, useState} from "react";

import {AllActionTypes, isView, State, TryToConnectConnectA} from "@triss/state-management";
import {ConnectionState} from "@triss/message-transport";

const ownUrl = window.location;

const protocol = ownUrl.protocol == "https:" ? "wss:" : "ws:";
const domain = ownUrl.host;

let placeHolder = protocol + "//" + domain;

if (placeHolder.endsWith(":3000")) placeHolder = placeHolder.replace(":3000", ":8080");

const viewSelector = (state: State) => state.client.view;

const canConnect = (state: ConnectionState) =>
  (["uninitialized", "closed"] as ConnectionState[]).includes(state);

export const Connect = () => {
  const dispatch = useDispatch() as Dispatch<AllActionTypes>;

  const [address, setAddress] = useState(placeHolder);
  const view = useSelector(viewSelector);
  if (!isView(view, "connecting")) throw new Error("The state is not connecting");

  // const noticeState = useDecay(view.lastFailMessage, 4500);

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    dispatch({type: "connect", url: address} as TryToConnectConnectA);
  };

  return (
    <>
      <div className="ui-container">
        <div className="form-wrapper container">
          <h2>Verbinden</h2>

          <form className="connect-form" onSubmit={onSubmit}>
            <label>Adresse</label>
            <input
              defaultValue={address}
              onChange={ev => setAddress(ev.target.value)}

              // disabled={!canConnect(view)}
            />

            <input type="submit" value="Verbinden" disabled={!canConnect} />
          </form>

          {view.lastFailMessage ? <div>{view.lastFailMessage}</div> : undefined}
        </div>
      </div>
    </>
  );
};
