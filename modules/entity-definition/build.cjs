const {mkdirSync, writeFileSync} = require("fs");
const {execSync} = require("child_process");

const isExecError = (val) =>
  typeof val == "object" && val !== null && ("status" in val) && ("stdout" in val);

function readableExecSync(command) {
  try {
    execSync(command, {
      encoding: "utf-8"
    });
  } catch (e) {
    if (isExecError(e)) {
      const {status, stdout} = e;
      const stdoutString = typeof stdout == "string" ? stdout : stdout.toString("utf-8");
      const indentedStdout = stdoutString.replace(/\n/g, "  \n");

      throw new Error("Encountered an error (code " + status + ")  while executing the command:\n" + command + "\n\n  " + indentedStdout);
    } else
      throw e;
  }
}

function createLibAnchor() {
  mkdirSync("lib", {recursive: true});
  writeFileSync("lib/index.js", "");
}

function buildBin() {
  readableExecSync("yarn tsc -p tsconfig.bin.json");
}

function runBin() {
  readableExecSync("yarn node lib-bin/bin.js");
}

function buildLib() {
  readableExecSync("yarn tsc -p tsconfig.lib.json");
}

function timer() {
  const start = Date.now();

  const frm = new Intl.NumberFormat("en", {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });

  function frmSeconds(ms) {
    return frm.format(ms / 1000).padStart(5, " ") + "s";
  }

  let last = start;

  function timestamp() {
    const now = Date.now();
    const l = last;
    last = now;

    return "Since start: " + frmSeconds(now - start) + " delta: " + frmSeconds(now - l);
  }

  return {timestamp};
}

function build() {
  const t = timer();

  createLibAnchor();
  console.log(t.timestamp(), "Created lib anchor");

  buildBin();
  console.log(t.timestamp(), "Build bin");

  runBin();
  console.log(t.timestamp(), "Run build");

  buildLib();
  console.log(t.timestamp(), "Build lib");
}


build();
