import {Blob} from "node:buffer";
import process from "node:process";

// Polyfilling since three js requires certain global Objects to be present because it was written to be
// used in a browser environment

(global as any).Blob = Blob;

// This is a minimal polyfill for three.js GLTFExporter
// see: https://github.com/mrdoob/three.js/blob/860af3c012915be534f8a5c37d745e2dff339e04/examples/jsm/exporters/GLTFExporter.js#L462-L526

(global as any).FileReader = class FileReader {
  public onloadend: () => void = () => undefined;
  public result: ArrayBuffer = undefined as any;

  public readAsArrayBuffer(blob: Blob) {
    blob
      .arrayBuffer()
      .then(ab => {
        this.result = ab;
        setTimeout(() => this.onloadend());
      })
      .catch(e => {
        console.error(e);
        process.exit(1);
      });
  }
};
