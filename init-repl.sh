#!/bin/bash

repo=$(pwd)
git config --global http.sslverify false
git submodule update --init --recursive

cd rammerhead
	git checkout
cd ..

cd bare-server-node
	git checkout
cd ..

cd website
	git checkout
cd ..

npm install --save-dev node@17
npm config set prefix=$repo/node_modules/node

cd node_modules/node/bin
	echo "{}" > ./package.json
	npm i npm@8
cd $repo

./node-env.sh

npm install
npm run install-submodules