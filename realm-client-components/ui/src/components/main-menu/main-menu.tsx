import {useSelector} from "react-redux";
import React, {MouseEventHandler} from "react";

import {mainMenuViews, MainMenuViews, State} from "@triss/state-management";
import {useThunkDispatch} from "../../hooks/use-thunk";

import {VehicleAgentOverview} from "./vehicle-agent-overview/vehicle-agent-overview";
import {LayoutOverview} from "./layout-overview/layout-overview";
import {InstanceOverview} from "./instance-overview/instance-overview";

const SubView = ({subView}: {subView: MainMenuViews}) => {
  switch (subView) {
    case "server/vehicle-agents":
      return <VehicleAgentOverview />;

    case "server/layouts":
      return <LayoutOverview />;

    case "server/instances":
      return <InstanceOverview />;

    default:
      return <>There is no sub view registered with the name {subView}</>;
  }
};

interface NavItem {
  name: string;
}

interface NavGroup {
  name: string;
  items: (NavItem | NavGroup)[];
}

const isGroup = (n: any): n is NavGroup => typeof n == "object" && Array.isArray(n.items);

const readable = new Map<string, string>([
  ["server", "Server"],

  ["overview", "Übersicht"],
  ["instances", "Instanzen"],
  ["vehicle-agents", "Fahrzeug Agenten"],
  ["layouts", "Layouts"],
  ["other", "Sonstiges"],
  ["about", "Über"],
  ["documentation", "Dokumentation"],
  ["github", "GitHub"]
]);

const mapNavGroups = (items: string[]) => {
  const ret: (NavItem | NavGroup)[] = [];

  for (const v of items) {
    let prevGroupArr = ret;
    const split = v.split("/");
    for (let i = 0; i < split.length; i++) {
      const name = split[i];
      if (i < split.length - 1) {
        const foundGroup = prevGroupArr.find(v => isGroup(v) && v.name == name);
        if (foundGroup) {
          prevGroupArr = (foundGroup as NavGroup).items;
        } else {
          const group: NavGroup = {name, items: []};
          prevGroupArr.push(group);
          prevGroupArr = group.items;
        }
      } else {
        prevGroupArr.push({name} as NavItem);
      }
    }
  }

  return ret;
};

const navOptions = mapNavGroups(mainMenuViews.getAllValid() as string[]);

const mapToReadable = (str: string) => readable.get(str) || str;

const noop = () => undefined;

const NavItemCont = ({
                       item,
                       onChosen,
                       pathName = "",
                       chosen
                     }: {
  item: NavItem | NavGroup;
  onChosen: (name: MainMenuViews) => void;
  pathName?: string;
  chosen: MainMenuViews;
}) => {
  if (isGroup(item)) {
    pathName += (pathName != "" ? "/" : "") + item.name;
    return (
      <section key={item.name}>
        <h4>{mapToReadable(item.name)}</h4>
        <ul>
          {item.items.map(item => {
            const fullName = (pathName + "/" + item.name) as MainMenuViews;
            const clickListener: MouseEventHandler = isGroup(item)
              ? noop
              : () => onChosen(fullName);

            return (
              <li
                key={item.name}
                onClick={clickListener}
                className={chosen == fullName ? "chosen" : ""}
              >
                <NavItemCont item={item} onChosen={onChosen} pathName={pathName} chosen={chosen} />
              </li>
            );
          })}
        </ul>
      </section>
    );
  } else {
    return <>{mapToReadable(item.name)}</>;
  }
};

const NavOptions = ({
                      options,
                      onChoose,
                      chosen
                    }: {
  options: (NavItem | NavGroup)[];
  onChoose: (chosen: MainMenuViews) => void;
  chosen: MainMenuViews;
}) => (
  <nav>
    {options.map(o => (
      <NavItemCont key={o.name} item={o} onChosen={onChoose} chosen={chosen} />
    ))}
  </nav>
);

const viewSelector = (state: State) => state.client.view;

export const MainMenu = () => {
  const dispatch = useThunkDispatch();
  const view = useSelector(viewSelector);
  const subView = view.name.slice(view.name.indexOf("/") + 1);

  if (!mainMenuViews.isValidValue(subView)) return <h1>The chosen subview is invalid</h1>;

  const setSubView = (sv: MainMenuViews) => {
    const viewName = sv.split("/").pop()!;

    if (["layouts", "instances", "vehicle-agents"].includes(viewName))
      dispatch({type: "navigate-to-overview", view: viewName as any});
  };

  const disconnect = () => {
    // This is rather cheeky but works and is reliable
    window.location.reload();
  };

  return (
    <div className="ui-container">
      <header className="header">
        <button className="disconnect button" onClick={disconnect}>
          Verbindung trennen
        </button>
      </header>
      <aside className="sidenav">
        <span className="name">TRISS</span>
        <NavOptions options={navOptions} onChoose={setSubView} chosen={subView} />
      </aside>
      <main className={"main-content " + subView.replace(/\//g, "_")}>
        <SubView subView={subView} />
      </main>
    </div>
  );
};
