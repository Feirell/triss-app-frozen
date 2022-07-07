const chalk = require("chalk");
const {spawnSync} = require("node:child_process");
const {AliasMap} = require("./alias-map.cjs");
const {getWorkspaces} = require("./workspace-helper.cjs");

function* aliasForName(name) {
  yield name;
  yield name.replace(/^@.+?\//, "");
}

async function wCommandRunner(ids, command, {recursive, verbose}) {
  const fullCommand = command.join(" ");
  // IMPORTANT: there needs to be a trailing "," in the pattern, otherwise it does not consider this a pattern
  // if only one entry is contained and does not find any workspaces.
  const idGlob = "{" + ids.join(",") + ",}";

  const options = [
    "workspaces", "foreach",
    "--verbose", "--parallel"
  ];

  if (recursive)
    options.push("--topological-dev", "--recursive");

  options.push("--from", idGlob);
  options.push(...command);

  const fullScript = options.join(" ");

  if (verbose) {
    console.log("executing " + chalk.cyan(fullCommand) + " on " + ids.map(i => chalk.cyan(i)).join(", "));
    console.log(chalk.grey("executing") + " " + chalk.italic.grey(fullScript));
  }

  spawnSync("yarn", options, {stdio: "inherit", shell: true});
}

exports.command = async function wCommand() {
  const workspaces = await getWorkspaces();
  const aliasMap = new AliasMap();

  for (const {name} of workspaces) {
    let addedOne = false;

    for (const alias of aliasForName(name)) {
      aliasMap.assignAlias(name, alias);
      addedOne = true;
    }

    if (!addedOne)
      throw new Error("Could not create any alias for the workspace " + name + ", all alias were already used");
  }

  const packageChoices = Array.from(aliasMap.allAliases()).sort((a, b) => {
    if (a.startsWith("@") && !b.startsWith("@"))
      return 1;
    else if (!a.startsWith("@") && b.startsWith("@"))
      return -1;
    else
      return a.localeCompare(b);
  });

  const pCOMMAND = "command";
  const oRECURSIVE = "recursive";
  const oVERBOSE = "verbose";
  const oID = "id";

  return [{
    command: `$0 <${pCOMMAND}..>`,
    description: "Execute command on packages, the first argument can also be a package name, ids are then disabled",
    builder: yargs => yargs
      .positional(pCOMMAND, {
        description: "The command you want to run on the packages, the first argument can also be a id / alias, if you don't supply any --id",
        type: "string"
      })
      .option(oRECURSIVE, {
        alias: ["rec", "r"],
        default: false,
        description: "Execute the command for each package recursively",
        type: "boolean"
      })
      .option(oVERBOSE, {
        alias: ["v"],
        default: false,
        description: "Enable verbose logging",
        type: "boolean"
      })
      .option(oID, {
        alias: ["i"],
        description: "Specify the package ids",
        type: "array",
        choices: packageChoices,
        requiresArg: true,
        nargs: 1
      }),
    handler: (args) => {
      const {
        [oID]: ids = [],
        [pCOMMAND]: command = [],
        [oRECURSIVE]: recursive = false,
        [oVERBOSE]: verbose = false,
        "--": escaped = [], ...rest
      } = args;

      const resolvedIds = [];
      let allCommandArgs = command;

      if (ids.length > 0)
        resolvedIds.push(...ids.map(id => aliasMap.getOriginal(id)));
      else if (aliasMap.hasAlias(allCommandArgs[0]))
        resolvedIds.push([aliasMap.getOriginal(allCommandArgs.shift())]);
      else
        throw new Error("There are no --id given and the first argument is not a valid alias");

      if (escaped.length > 0)
        allCommandArgs = [...allCommandArgs, "--", ...escaped];

      wCommandRunner(resolvedIds, allCommandArgs, {recursive, verbose}, rest);
    }
  }];
};
