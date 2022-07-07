/* eslint-disable @typescript-eslint/ban-ts-comment */
import {useSelector} from "react-redux";
import React, {ChangeEventHandler, FormEvent, useEffect, useRef, useState} from "react";

import {CreationState, FinishedVehicleAgentCreationA, State} from "@triss/state-management";
import {useThunkDispatch} from "../../../../hooks/use-thunk";

const getName = (file: File) => (file as any).webkitRelativePath || file.name;

const viewSelector = (state: State) => state.client.view;

export const AddVehicleAgent = () => {
  const dispatch = useThunkDispatch();
  // const [name, setName] = useState("");
  // const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  // const [entry, setEntry] = useState(0);

  const [lastCreationState, setLastCreationState] = useState<CreationState>({
    state: "initialized"
  });

  const view = useSelector(viewSelector);

  if (view.name != "main-menu/server/vehicle-agents")
    throw new Error(
      "AddVehicleAgent can not be used when the view is not main-menu/server/vehicle-agents"
    );

  const creationState = view.creationState;

  const formRef = useRef<HTMLFormElement | null>();

  useEffect(() => {
    if (lastCreationState.state == "send-request" && creationState.state != "send-request") {
      if (formRef.current != null) {
        // setName("");
        // setDescription("");
        setFiles([]);
        // setEntry(0);
        formRef.current.reset();
      }
    }

    if (lastCreationState.state != creationState.state) setLastCreationState(creationState);
  }, [lastCreationState, creationState, formRef, formRef.current]);

  const canSubmit = creationState.state != "send-request";

  const canBeSubmitted = files.length > 0;

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault();

    if (!canSubmit || !canBeSubmitted) return;

    (async () => {
      const associatedFiles: FinishedVehicleAgentCreationA["associatedFiles"] = (
        await Promise.all(files.map(f => f.text()))
      ).map((str, i) => ({
        fileName: getName(files[i]),
        fileContent: str
      }));

      dispatch({
        type: "finished-vehicle-agent-creation",
        associatedFiles: associatedFiles
      });
    })();
  };

  const filesChanges: ChangeEventHandler<HTMLInputElement> = ev => {
    const currentFiles = ev.target.files;
    if (!currentFiles) {
      if (files.length != 0) {
        setFiles([]);
      }
    } else {
      const files = Array.from(currentFiles);
      setFiles(files);
    }
  };

  return (
    <div className="add-entity container">
      <h2>Fahrzeug Agenten erstellen</h2>

      <form onSubmit={onSubmit} ref={ref => (formRef.current = ref)}>
        <label htmlFor="agent-files">Programm Dateien</label>
        <input
          disabled={!canSubmit}
          id="agent-files"
          type="file"
          accept=".js,application/javascript"
          onChange={filesChanges}
          multiple
          // @ts-ignore
          webkitdirectory="true"
          // @ts-ignore
          directory="true"
          required
        />
        <div className="validation-notice">Es muss mindestens eine Datei hochgeladen werden.</div>

        <input disabled={!canSubmit} type="submit" value="erstellen" />
      </form>

      {creationState.state == "was-unsuccessful" ? (
        <p className="unable-to-create-reason">{creationState.reason}</p>
      ) : undefined}
    </div>
  );
};
