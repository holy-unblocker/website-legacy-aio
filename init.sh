#!/bin/bash

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