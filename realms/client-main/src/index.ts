import {createRoot} from "react-dom/client";

import {Entry} from "@triss/ui";

import "@triss/state-management/lib/reducer/handler-bundle";

function disableContextMenu() {
  document.addEventListener("contextmenu", ev => {
    ev.preventDefault();
  });
}

// import {addActionListener} from "@triss/state-management";
// function enableAutoConnect() {
//   addActionListener("assets-loaded", (action, dispatch, getState) => {
//     setTimeout(() => dispatch({
//       type: "connect",
//       url: "ws://localhost:8080"
//     }), 0);
//   });
// }

function initialize() {
  disableContextMenu();

  addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("react-root")!;
    const root = createRoot(container);
    root.render(Entry);
  });

}

initialize();
