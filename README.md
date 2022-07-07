# TRISS - Traffic Interaction Simulation Software

This is a simulation plattform, to test out simulation agents, for controlling traffic flow and driving individual vehicles.

Its core feature is to efficiently serialize and transport the world state to a client which can render it.
There are two `./applications/` which house those features.
They are composed of JavaScript `./realms/` (domains within a runtime).

## Usage

You can use this application in many ways. You can fork and modify it, you could just connect to a already running server, write your own `SimulationHandler` or just implement an agent and supply that via the web interface.

The simplest way to start is to start the two Docker container which each contain one of the applications.

```bash
# You need a container runtime, have a look at the https://docs.docker.com/get-docker/
# if you dont have one

# Starting the client
docker run -it -p   80:80   trissapp/triss-client
# and the server
docker run -it -p 8080:8080 trissapp/triss-server
```

The client is a standard http server, which delivers the static artifacts to display the webpage. The server provides a custom communication protocol interface via a websocket channel.

Once started open your browser and navigate to the webpage (if you started the container locally you probably can use http://localhost). After the assets loaded you should be able to connect to the server. If you started the server on you local machine then you should be able to use the address ws://localhost:8080.

If everything worked out you should now be presented with the main menu and its three main entities.

## Main Entities

### `Simulation`

The simulation is the stateful combination of an agent and a layout. It contains a current time, frame number and vehicle as well as tile and tag states.

There are a couple of standard simulation the first one is meant to tax the system as much as feasible to demonstrate the performance.

The other combine the default agent `random-exit-driver` with smaller layouts.

Start the simulation and then use the inspect button to see the simulation state.

### `Layout`

The layout is a static collection of tiles and tags.

It can either be generated or be changed or created manually, via the create layout option in the main menu.

### `Vehicle Agent`

The vehicle agent has the structure of a node module (https://docs.npmjs.com/about-packages-and-modules) which you can provide either statically by including it in the `./example-agents/` directory or by uploading a directory via the web interface.

This agent will be loaded and instantiated. It receives the current world state and is expected to compute the resulting state.  

Have a look at the `./create-a-vehicle-agent.md` for more information on how you can define one.

## Minor Entities

Those main entities are composed of other, minor, entities.
Those include the vehicles, tiles, tags, paths and path pieces as well as exported agent data.

### `Vehicle`

The vehicle represents an actual vehicle in the simulation, including its current position, rotation, its model (and dimensions) and an id.

The agent supplies additional information, such as goal, velocity, etc. but this data structure is not predefined and agent internal.

Have a look at the `./modules/models/models/vehicles/` for an ideal on which vehicles models are available.

Many thanks to kenney and his https://www.kenney.nl/assets/car-kit from which I bought those models.

### `Tile`

The tiles are the base entity for the layout and can be used to let the user specify the road layout.

Those tiles are quadratic 3D models, for which I specified, for a select few, the paths which represent the road lanes.

Those lanes are just a suggestion and the agent is free to interpret them any way it likes. The `./example-agents/spawn-many/` for example ignores them completely.

Many thanks again to kenney and his https://www.kenney.nl/assets/3d-road-tiles from which I bought those models.

Those are really nice and simple, perfect for this application.

You can address any of those, the agent can place them, the layout generators (`./example-layouts/`) can use them in the generated output, just the layout creation view on the web page, does not provide a way to select them, yet at least.

### `Tag`

Tags are a way to set markers for the agent.
One example I provided is a spawn and despawn tag (`./modules/models/src/tag-scene-specifications.ts`), which the random-exit-driver uses.

You can extend them as you see fit and interpret them in any way you like.

### `Path`

As already mentioned, there are some predefined paths for some of the tile types.

They are specified in `./modules/entity-definition/src/tile-definition/tile-lane-definitions.ts` and use the `./modules/path-definition/` segments.

They are just suggestions and are just meant to help you get up and running with a new agent. But the agent can interpret them as he sees fit, and position vehicles on a complete different system.

Neither the server nor the client validates those positions.

## Applications and Realms

The `./application/server/` has three realms.
- First the `./realms/server-main/` is the actual server which has the WebSocket server and the logic to handle entities like the simulation instances, agents and defined layouts.
- Additionally the `./realms/agent-sandbox/` which is used to validate the correctness of the specified agent (syntax and exports).
- And finally the `./realms/agent-worker/` realm, which handles an actual simulation instance. This includes the loading of the agent and connecting to the server realm.

The `./application/client/` only consists of one realm.
- The `./realms/client-main/` contains a web ui and allows the user to interact with the server. It renders the state of the simulation with a 3D Representation and allows the exploration of the simulation state.

## Development

There are different kind of usages for this project.

If you only want to create an agent and combine them with layouts to test them, then you don't really need the development section.
Just have a look at the mentioned `./create-a-vehicle-agent.md` to get started.

But if you intend to add additional vehicle, tag or tile models or if you want to generate layouts or modify the actual plattform than you probably want to read this section.

The whole project is basing on yarn PnP (https://yarnpkg.com/features/pnp) and yarn workspaces (https://yarnpkg.com/features/workspaces). PnP allows the correct linking of workspaces when using windows and reduces the amount of files, which are written to the file system, by a lot!

You need to have node.js v16 (https://nodejs.org/en/download/) installed and placed in your path.
After that checkout this repository and navigate in its directory.

There you should be able to call:

```bash
yarn install
```

Which, after some time, fills the cache and allows you to use the npm dependencies which are required.

After that you should be able to call

```bash
yarn run applications-build
```

Which builds the server and client artifacts **and** all workspaces needed for them.
This may take a while.

After that many of the workspaces have a `lib` directory, which contain the transpiled (TypeScript => JavaScript) files, which your IDE should be able to find and use to provide you with typeahead suggestions. You may need to restart you TypeScript language server, depending on your IDE.

After this step you are ready to go to modify the application.

The resulting artifacts, from the build process, should not be run directly but via their respective Docker images.

If you are using Windows you can either install Docker Desktop (https://www.docker.com/products/docker-desktop/) or just install WSL 2 (https://docs.microsoft.com/en-us/windows/wsl/install), install a distribution like Ubuntu, follow the ubuntu steps (https://docs.docker.com/engine/install/ubuntu/#installation-methods) to install Docker and then run `service docker start` (each time you restart the WSL, at least with each Windows restart) and then do the following.

```bash
# starting docker
service docker start

# your windows C drive is mounted by default, if not then please have a look at the directions in your distribution documentation
# configure them as you see fit
export TRISS_WIN=/mnt/c/Users/<YOUR-USERNAME>/projects/triss/
export TRISS_LIN=/root/triss-synced/

#
# Re do for every change!
#

# copying the files from windows to linux, to enable layer caching and conform to the mnt usage, specified by WSL
rsync -vtr --exclude /.git --exclude /.idea --exclude /dist --exclude lib --exclude lib-bin $TRISS_WIN $TRISS_LIN

#
# Start here if you are using a native linux distribution
#

# Build the client
docker buildx build --target client --tag dev-client --file $TRISS_LIN/multi.Dockerfile $TRISS_LIN

# Build the server
docker buildx build --target server --tag dev-server --file $TRISS_LIN/multi.Dockerfile $TRISS_LIN

# and then you can start them, as you would have done with the container from the repository:

# Starting the client
docker run -it -p   80:80   dev-client

# and the server
docker run -it -p 8080:8080 dev-server
```

The first build takes some time the later ones are faster, since it will cache the multistage layers (at least the installation layer).

You need to redo all steps beginning with `rsync` or `docker buildx` respectively after every change to the code, to apply them.
One problem I have not worked on yet, is that this build will not cache the result of each workspace build result, even if it did not change, it will rebuild every workspace.

When working on just one workspace (module) you can use `yarn w <workspace-name> <command>` which is an alias to `yarn workspaces foreach --verbose --topological-dev --from @triss/<workspace-name> <command>` to issue a command like `run build` `add chalk` etc.

Be aware that you **NEED** to add the `run` before `run build` otherwise you call the `build` command from the https://yarn.build/ plugin, which is similar to the `yarn workspaces foreach --verbose --recursive --topological-dev --parallel run build` command but does not work for the CI / CD pipeline and therefor is not used. Just the `yarn bundle` command from the same plugin is used, since it allows for a smaller image size for the server, which needs to keep its workspace structure. 

You can also use `yarn workspaces foreach --since --topological-dev <command>` to issue a command on all workspaces in which you have (git-) changes.

This helps you to detect compile issues locally and somewhat faster.

You can run the server and the client in a local dev mode but this is unstable not recommended for the final check, use the docker approach above to make sure your changes work for everybody.

For the client you can do so by

```bash
yarn w client run dev
# or, if you are in the ./applications/client/ directory
yarn run dev

# after that you can watch a submodule and webpack will recompile and reload the page
# eg. you are working on the 3d-rendering module
yarn w 3d-rendering run build --watch
```

For the server this is not as trivial. The reason is, that the server needs to keep the yarn workspace structure to be able to load agents provided by the user via the web interface.

So the server is not bundled into a bundle.js but is pretty much just transpiled by typescript and then copied.
This is not ideal, but a pretty robust solution.

So you need to keep several things in mind.
The running server will modify the package json of the package loader, to allow it to resolve the agents.
This is needed for the example agents as well as for the dynamically provided ones.
Additionally, the server will extend the workspace directory for each uploaded agent.

Those changes should not be comitted, if you remove them after you are finished then you can start it just like the container does.

```bash
# build does more than needed for dev
yarn w server tsc --watch 

yarn w server run start

# after that you can watch a submodule, you need to restart the server after the submodule has compiled
# eg. you are working on the agent-sandbox
yarn w agent-sandbox run build --watch
```

Have a look at the specific package on what to build and how to watch the building process. 

## Further Development

There are some things I don't exactly like and which I would like to change some time in the future.

### Deployment of the Server

The current deployment pushes to many files to the Docker container which are unused and not needed.
One way to mitigate this is to recursivly select all workspaces which are used by `@triss/server`, build those and then instead of copying the whole directly of the project to just `yarn pack` them and provide them with a local `resoluations` (https://yarnpkg.com/configuration/manifest#resolutions) field which points to the `.tgz` file which is placed in the deployment directory. On the first start they are installed as required and can then be referenced as is done now.

The difference is that the `files` (https://yarnpkg.com/configuration/manifest#files) field would result in minimal exported pushed files and therefor a smaller image overall.

### Build Process of the Workspaces

There are several ways to speed up the build process of the system. On which would be quite significant is to split the `multi.Dockerfile` stages into each seperate workspace and therefore be able to cache them. The main problem with that is, that you would need to seperately select each workspace **and** the dependencies and then copy only those in the layer or otherwise you would trip the cache discarding algorithm.

Because even if you only made changes in one workspace, copying the whole directory over would result in a different layer hash and therefore in a discarding of the cache.

So this is not as trivial as it seems initially.
And you need to keep the selection and partial copying time lower than the actual build time of the particular workspace.

### Better Debugging of the Agent

Currently, there are two ways to debug the agent. The first is to use the Logger functionality to print status messages and the second is to use the `ExportAgentData` to present debug information for each entity.

Both are not good in terms of actually debugging JavaScript code. At some point I would like to allow the user to attach the debugger to the worker directly and be able to stop it, inspect it and run performance measurements (heap usage, heap snapshots, performance probes, etc.) and debugging operations defined in the V8 inspector protocol (https://chromedevtools.github.io/devtools-protocol/v8/Debugger/).
