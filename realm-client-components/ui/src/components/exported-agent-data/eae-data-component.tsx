import React from "react";

import {
  BooleanEntry,
  EAEBase,
  EAEData,
  EAEDataArray,
  EAEDataArrayEntry,
  EAEDataObject,
  EAEDataObjectEntry,
  FloatEntry,
  IntegerEntry,
  isEAEData,
  PathEntry,
  PercentageEntry,
  StringEntry,
  TagRefEntry,
  TileRefEntry,
  VehicleRefEntry,
} from "@triss/dto";

const percFrm = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: "percent",
});

export const PercentageEntryComponent = ({entry}: {entry: PercentageEntry}) => (
  <div className="base-percentage-entry">{percFrm.format(entry.value)}</div>
);

const floatFrm = new Intl.NumberFormat("en-US", {
  style: "decimal",
});

export const FloatEntryComponent = ({entry}: {entry: FloatEntry}) => (
  <div className="base-float-entry">{floatFrm.format(entry.value)}</div>
);

const integerFrm = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  style: "decimal",
});

export const IntegerEntryComponent = ({entry}: {entry: IntegerEntry}) => (
  <div className="base-integer-entry">{integerFrm.format(entry.value)}</div>
);

export const StringEntryComponent = ({entry}: {entry: StringEntry}) => (
  <div className="base-string-entry">&quot;{entry.value}&quot;</div>
);

export const BooleanEntryComponent = ({entry}: {entry: BooleanEntry}) => (
  <div className="base-Boolean-entry">{entry.value ? "true" : "false"}</div>
);

export const PathEntryComponent = ({entry}: {entry: PathEntry}) => (
  <div className="base-path-entry">Path Entry is currently not supported</div>
);

export const VehicleRefEntryComponent = ({entry}: {entry: VehicleRefEntry}) => (
  <div className="base-vehicle-ref-entry">Vehicle ID: {entry.value}</div>
);

export const TileRefEntryComponent = ({entry}: {entry: TileRefEntry}) => (
  <div className="base-tile-ref-entry">Tile ID: {entry.value}</div>
);

export const TagRefEntryComponent = ({entry}: {entry: TagRefEntry}) => (
  <div className="base-tag-ref-entry">Tag ID: {entry.value}</div>
);

export const EAEBaseComponent = ({data}: {data: EAEBase}) => {
  switch (data.type) {
    case "percentage":
      return <PercentageEntryComponent entry={data} />;
    case "float":
      return <FloatEntryComponent entry={data} />;
    case "integer":
      return <IntegerEntryComponent entry={data} />;

    case "string":
      return <StringEntryComponent entry={data} />;

    case "boolean":
      return <BooleanEntryComponent entry={data} />;

    case "path":
      return <PathEntryComponent entry={data} />;

    case "vehicle-ref":
      return <VehicleRefEntryComponent entry={data} />;
    case "tile-ref":
      return <TileRefEntryComponent entry={data} />;
    case "tag-ref":
      return <TagRefEntryComponent entry={data} />;

    default:
      throw new Error(
        "could not find a matching base type component for type " + (data as any).type
      );
  }
};

export const EAEDataArrayEntryComponent = ({entry}: {entry: EAEDataArrayEntry}) => {
  return (
    <div className="eae-entry-entry">
      <div className="entry-entry-label">{entry.index}</div>
      {isEAEData(entry.value) ? (
        <EaeDataComponent data={entry.value} />
      ) : (
        <EAEBaseComponent data={entry.value} />
      )}
    </div>
  );
};

export const EAEDataArrayComponent = ({array}: {array: EAEDataArray}) => {
  return (
    <div className="eae-data-object">
      {array.entries.map((e, i) => (
        <EAEDataArrayEntryComponent entry={e} key={i} />
      ))}
    </div>
  );
};

export const EAEDataObjectEntryComponent = ({entry}: {entry: EAEDataObjectEntry}) => {
  return (
    <div className="eae-object-entry">
      <div className="object-entry-label">{entry.label}</div>
      {isEAEData(entry.value) ? (
        <EaeDataComponent data={entry.value} />
      ) : (
        <EAEBaseComponent data={entry.value} />
      )}
    </div>
  );
};

export const EAEDataObjectComponent = ({object}: {object: EAEDataObject}) => {
  return (
    <div className="eae-data-object">
      {object.entries.map((e, i) => (
        <EAEDataObjectEntryComponent entry={e} key={i} />
      ))}
    </div>
  );
};

export const EaeDataComponent = ({data}: {data: EAEData}) => {
  let elem;
  switch (data.type) {
    case "data-array":
      elem = <EAEDataArrayComponent array={data} />;
      break;

    case "data-object":
      elem = <EAEDataObjectComponent object={data} />;
      break;

    default:
      throw new Error("could not find a matching data component for type " + (data as any).type);
  }

  return <div className="eae-data-component">{elem}</div>;
};
