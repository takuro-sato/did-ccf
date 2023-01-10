#!/bin/bash

source set_vars.sh
npm run build
$ccf_path/sandbox.sh --js-app-bundle ./dist/