#!/bin/bash

repo=$(pwd)
git config --global http.sslverify false
git submodule update --init --recursive
npm install --save-dev node@17
npm config set prefix=$(pwd)/node_modules/node

cd node_modules/node/bin
	echo "{}" > ./package.json
	npm i npm@8
cd $repo

export PATH=$(pwd)/node_modules/node/bin:$PATH
export PATH=$(pwd)/node_modules/node/bin/node_modules/npm/bin:$PATH

npm install
npm run install-submodules