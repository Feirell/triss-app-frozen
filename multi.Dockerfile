# This Dockerfile is heavily influenced by
# https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#use-multi-stage-builds
# It is meant to be build via BuildKit
# To do this in GitHub actions you can use
# https://github.com/docker/buildx with

FROM alpine:3.16 as skeleton

WORKDIR /split
COPY . full

# I would have liked to just copy the package jsons, to have a more stable layer for the install step
# as is suggested here: https://docs.docker.com/get-started/09_image_best/#react-example
# Otherwise every change in any file, would trigger a full rebuild of every following step, including the install step.
# But as is stated in the issue https://github.com/moby/moby/issues/15858
# the directory structure is not preserved when using COPY with subdirectories, which does not allow us to just copy the
# package jsons from the many mono repo packages.

# So I am using another build stage as a workaround as is described here:
# https://github.com/moby/moby/issues/15858#issuecomment-614157331
# which allows us to do a more fine grained copy and therefore a stabler layer for the install.
RUN mkdir skeleton && \
    cp -r full/.yarn         skeleton/.yarn      && \
    cp    full/package.json  skeleton/           && \
    cp    full/.pnp.*js      skeleton/           && \
    cp    full/yarn.lock     skeleton/           && \
    cp    full/.yarnrc.yml   skeleton/           && \
    cd full                                      && \
      cp --parents */*/package.json ../skeleton  && \
    cd ..

FROM node:16 AS install-only

WORKDIR /app
# Copy only the prepared packages jsons and yarn pnp items
COPY --from=skeleton /split/skeleton/ .
# If you encounter an issue, this command might help in seeing what is saved in this layer
# RUN find .  \
#       -path ./.git            -prune -o \
#       -path ./.yarn/cache     -prune -o \
#       -path ./.yarn/unplugged -prune -o \
#       -type f                 -print
RUN yarn run applications-install

FROM node:16 AS installed

WORKDIR /app

# Copy all files in the repository in the image
COPY . /app

# Copy only the prepared packages jsons and yarn pnp items
# This overwrites and creates the install state
# But install-only only depents on the pnp config files and the .yarn directory
COPY --from=install-only /app /app

FROM installed as build

RUN yarn run applications-build

FROM build as build-client

# Add other commands, specific to the client build here

FROM build as build-server

# Add other commands, specific to the server build here

FROM node:16-alpine as server

EXPOSE 8080

WORKDIR /app

COPY --from=build-server /app/dist/server/bundle.zip /bundle.zip
RUN unzip -q -d /unpackged /bundle.zip && \
    rm /bundle.zip && \
    cd / && rm -r /app && \
    mv /unpackged/bundle /app

CMD yarn workspace @triss/server run start

FROM nginx:1.21-alpine as client

EXPOSE 80
WORKDIR /app
COPY --from=build-client /app/applications/client/nginx.conf /etc/nginx/nginx.conf
COPY --from=build-client /app/dist/client                    /app

# CMD not needed since the nginx has an entry point to start itself
