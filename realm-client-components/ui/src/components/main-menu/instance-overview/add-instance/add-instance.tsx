import {useSelector} from "react-redux";
import React, {FormEvent, useEffect, useRef, useState} from "react";

import {CreationState, State} from "@triss/state-management";
import {useThunkDispatch} from "../../../../hooks/use-thunk";

const getName = (file: File) => (file as any).webkitRelativePath || file.name;

const viewSelector = (state: State) => state.client.view;

const agentSelector = (state: State) => state.server.vehicleAgents;
const layoutSelector = (state: State) => state.server.layouts;

export const AddInstance = () => {
  const dispatch = useThunkDispatch();
  const agents = useSelector(agentSelector);
  const layouts = useSelector(layoutSelector);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [layoutId, setLayoutId] = useState<undefined | number>(undefined);
  const [agentId, setAgentId] = useState<undefined | number>(undefined);

  const [lastCreationState, setLastCreationState] = useState<CreationState>({
    state: "initialized",
  });

  const view = useSelector(viewSelector);

  if (view.name != "main-menu/server/instances")
    throw new Error("AddInstance can not be used when the view is not main-menu/server/instances");

  const creationState = view.creationState;

  const formRef = useRef<HTMLFormElement | null>();

  useEffect(() => {
    if (lastCreationState.state == "send-request" && creationState.state != "send-request") {
      if (formRef.current != null) {
        setName("");
        setDescription("");
        setLayoutId(undefined);
        setAgentId(undefined);
        formRef.current.reset();
      }
    }

    if (lastCreationState.state != creationState.state) setLastCreationState(creationState);
  }, [lastCreationState, creationState, formRef, formRef.current]);

  const canSubmit = creationState.state != "send-request";

  const canBeSubmitted = name.length > 3 && layoutId !== undefined && agentId !== undefined;

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault();

    if (!canSubmit || !canBeSubmitted) return;

    (async () => {
      dispatch({
        type: "finished-simulation-instance-creation",
        name: name,
        description: description,
        agent: agentId!,
        layout: layoutId!,
      });
    })();
  };

  return (
    <div className="add-entity container">
      <h2>Simulations Instanz erstellen</h2>

      <form onSubmit={onSubmit} ref={ref => (formRef.current = ref)}>
        <label htmlFor="instance-name">Name</label>
        <input
          disabled={!canSubmit}
          placeholder="Name"
          id="instance-name"
          type="text"
          required
          minLength={3}
          value={name}
          onChange={ev => setName(ev.target.value)}
        />
        <div className="validation-notice">Der Name muss mindestens drei Zeichen lang sein.</div>

        <label htmlFor="instance-description">Beschreibung</label>
        <textarea
          disabled={!canSubmit}
          id="instance-description"
          placeholder="Beschreibung der Instanz"
          value={description}
          onChange={ev => setDescription(ev.target.value)}
        />

        <label htmlFor="instance-layout">Das Layout für die Instanz</label>
        <select
          id="instance-layout"
          onChange={ev =>
            setLayoutId(ev.target.value == "" ? undefined : Number.parseInt(ev.target.value))
          }
          value={layoutId == undefined ? "" : "" + layoutId}
        >
          <option value="">Layout auswählen</option>
          {layouts.map(l => (
            <option key={l.id} value={l.id}>
              {l.name + " #" + l.id}
            </option>
          ))}
        </select>

        <label htmlFor="instance-agent">Der Agenten für die Instanz</label>
        <select
          id="instance-agent"
          onChange={ev =>
            setAgentId(ev.target.value == "" ? undefined : Number.parseInt(ev.target.value))
          }
          value={agentId == undefined ? "" : "" + agentId}
        >
          <option value="">Agenten auswählen</option>
          {agents.map(a => (
            <option key={a.id} value={a.id}>
              {a.name + " #" + a.id}
            </option>
          ))}
        </select>

        <input disabled={!canSubmit || !canBeSubmitted} type="submit" value="erstellen" />
      </form>

      {creationState.state == "was-unsuccessful" ? (
        <p className="unable-to-create-reason">{creationState.reason}</p>
      ) : undefined}
    </div>
  );
};
