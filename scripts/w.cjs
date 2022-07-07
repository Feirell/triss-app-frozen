const yargs = require("yargs");
const {hideBin} = require("yargs/helpers");

function baseCLIInterface() {
  return yargs()
    .epilogue("w executes a command in a workspace and allows to use certain shortcuts")
    .demandCommand()
    .help()
    .fail(function(msg, err, yargs) {
      if (err) throw err; // preserve stack
      console.error("An error occurred parsing your arguments:\n" + msg);
      console.error(yargs.help());
      process.exit(1);
    })
    .wrap(100)
    .parserConfiguration({
      "populate--": true,
      "unknown-options-as-args": true,
    })
    ;
}

async function w(args) {
  await baseCLIInterface()
    .command(await require("./w-command.cjs").command())
    .parseAsync(hideBin(args));

  //
  // const [nodePath, scriptPath, ...rest] = args;
  //
  // const recognizedOptions = {
  //   recursive: false
  // };
  //
  //
  // const parsed = parse(rest, {
  //   "--": true,
  //   "boolean": Object.entries(recognizedOptions).filter(([k, v]) => typeof v === "boolean").map(([k, v]) => k),
  //   "alias": {
  //     "recursive": ["r", "rec"]
  //   }
  // });
  //
  // const [workspace, command] = parsed._;
  //
  // const specifiedOptions = [];
  //
  // for (const e of Object.keys(parsed))
  //   if (e != "_" && e != "--")
  //     if (!(e in recognizedOptions))
  //       console.warn("unknown parameter", e);
  //     else if (typeof recognizedOptions[e] !== typeof parsed[e])
  //       console.error("Could not apply specified option because it defaults to a " + (typeof recognizedOptions[e]) + " value and the argument defined a " + (typeof parsed[e]) + "value");
  //     else {
  //       recognizedOptions[e] = typeof parsed[e];
  //       specifiedOptions.push(e);
  //     }
  //
  // if (parsed._.length > 2)
  //   console.warn("unknown additional arguments", parsed._.slice(2));

  // const availableWorkspacesResponse = await getWorkspaces();

  // console.log("arg", args);
  // console.log("available workspaces", availableWorkspacesResponse);
}

w(process.argv)
  .catch(e => {
    console.error(e);
    process.exit(1);
  });


