# Create a Vehicle Agent

This document is meant to give you a quick introduction in how to write and deploy a vehicle agent to this plattform.

There are two ways to do so.

## Development

To develop such an agent you need to essentially just need to implement a function, implement an interface and finally specify a package.json.

An example for the minimal needed structure can be found in the `./example-exp-agent/` directory.

Since you probably want a more sophisticated approach you can have a look at the `./example-agents` subdirectories.

The `./example-agents/random-exit-driver` is a somewhat involved example, which has spawning and despawning of vehicles, route finding, collision detection and some performance optimisation via a bounding volume hierarchy like structure and route caching.

It also utilizes the agent data export, which can be accessed by clicking on a vehicle in the 3D representation. It can be pretty handy when debugging the behaviour of a vehicle.

The server does not validate the resulting world and will not enforce any rules if your agent misbehaves it will just be rendered.

The internal state of the agent is arbitrary and not defined by the server or the plattform in general.

The `agentData` field in the `VARandomExitDriver` is just one possible option. But this highly depends on what kind algorithm your agent uses to calculate the next state.
A neural net would need something completely different.

The server will create a worker and then load the agent NPM package via a `require` call, which load the `main` entry file.

After that it will use the `createAgent` named export, which needs to return a class (or function) which it will call with the `new` operator. 

This class needs to implement the interface `Agent` defined in `realm-server-components/agent-interface/src/agent.ts`.

You need to call the given `changedTraffic` and `changedLayout` respectively when changing those section of the world.

Everything else is up to you and can be implemented as you see fit.

I would probably start by copying and modifying the random-exit-driver.

## Deployment

### Deployment via Web Interface

The simplest way is to use the web interface.
When the server and the client are started you can connect to the server with the web interface and navigate to the agents entry in the main menu.

There you can upload a directory.
The directory is required to include a package.json in the root directory.
This package.json provides the needed metadata to actually load the agent.

The minimal required fields are `name`, `version` and `main`.
The name and version are mostly there so yarn can install and reference them, the main is needed to be able to require your package.

The main field needs to point to a JavaScript file which is the entry as described in the development section.
So if you have written your agent in Typescript you need to transpile it before you upload it.

You could still utilize this repository by using type definitions of the workspaces, just like the `random-exit-driver` does.
You would need to register it as a workspace to utilize the linking, so you need to add your directory in the `./package.json` `workspace` field to allow the resolution of local packages and therefore the type checking via `tsc`.

Be aware that for the type check to work you need to compile all packages once. You can do so by using `yarn run applications-build` after you have run `yarn run applications-install`. This creates the needed `.d.ts` files for TypeScript to check your implementation against.
You might need to restart you TypeScript language server after that (dependent on your IDE).

After you build it you can upload the aforementioned JavaScript files and your `pacakge.json` via the interface.

### Deployment via Static Ref

You can also provide your agent at build time. But this requires you to rebuild and redeploy the whole server each time you make a change to the agent.

You can put the agent essentially anywhere you would like in the workspaces. The designated directory is the `example-agent` directory but feel free to create a new one and then to add that directory to the `workspaces` field in the `./package.json`.

After that you need to add this agent to the build process by adding it as a dependency in `./realm-sever-components/example-agents-loader/package.json`. This forces the build of your agent and makes it known so it can be imported at runtime.

After that you need to add your agent name in the `./realm-server-components/example-agents-loader/src/index.ts`, which you then need to use in the `./realms/server-main/src/index.ts` to load your agent. You technically don't need to call it then and there but there is no command provided via the WS channel to load it some time else. 
