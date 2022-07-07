import React, {useState} from "react";

import {CreateLayoutA} from "@triss/state-management";
import {useThunkDispatch} from "../../../../hooks/use-thunk";
import {LayoutInformation} from "@triss/client-server-serializer";

export const AddLayout = ({layouts}: {layouts: LayoutInformation[]}) => {
  const [basingOn, setBasingOn] = useState<undefined | number>(layouts[0]?.id);

  const dispatch = useThunkDispatch();

  const createNew = (basingOn: number | undefined = undefined) => {
    dispatch({
      type: "create-layout",
      basingOn: basingOn
    } as CreateLayoutA);
  };

  return (
    <>
      {layouts.length > 0 ? (
        <div className="add-entity container">
          <h2>Layout erweitern</h2>
          <form className="from-another" onSubmit={() => createNew(basingOn)}>
            <label htmlFor="basing-on">Basierend auf:</label>
            <select
              id="basing-on"
              onChange={ev => setBasingOn(Number.parseInt(ev.target.value))}
              value={basingOn}
            >
              {layouts.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name + " #" + l.id}
                </option>
              ))}
            </select>
            <input type="submit" className="button--inverse" value="Layout erweitern" />
          </form>
        </div>
      ) : undefined}
      <div className="add-entity container">
        <h2>Layout hinzufügen</h2>
        <form className="from-scratch" onSubmit={() => createNew()}>
          <input type="submit" className="button--inverse" value="Neues Layout erstellen" />
        </form>
      </div>
    </>
  );
};
