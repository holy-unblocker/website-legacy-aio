#!/bin/bash

git config --global http.sslverify false
git clone https://github.com/tomphttp/bare-server-node bare-server-node --depth 1
git clone https://git.holy.how/holy/website-fork-aio.git website --depth 1
git clone https://github.com/e9x/rammerhead-fork-aio.git rammerhead --depth 1