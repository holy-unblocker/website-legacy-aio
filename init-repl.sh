#!/bin/bash

git submodule update --init --recursive
npm install --save-dev node@18
npm config set prefix=$(pwd)/node_modules/node && export PATH=$(pwd)/node_modules/node/bin:$PATH
npm install