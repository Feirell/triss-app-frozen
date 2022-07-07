#!/usr/bin/env bash

yarn workspaces foreach --verbose --topological --recursive --parallel --from "@triss/$2" run "$1"
