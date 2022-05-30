# website-aio

> If you're seeing "Detecting language" on Replit, refresh!

Holy Unblocker bundle for deployment on single server productions and IDEs (Replit, Heroku, etc...)

[![Run on Repl.it](https://repl.it/badge/github/e9x/website-aio)](https://repl.it/github/e9x/website-aio)

### Table of Contents

1. [Setup](#setup)
2. [Install](#install)
3. [Build](#build)
4. [Start](#start)

## Setup

To setup this repository (after cloning into an IDE), you must run the init script. This will update and checkout all submodules.

```sh
> ./init.sh
```

> This process may take up to 10 minutes.

## Install

Install dependencies.

```sh
> npm install submodules
> npm install
```

> This process may take up to 10 minutes.

## Build

Once this repository is setup, you can run the build script in order to compile the website's source code and Rammerhead's client.

```sh
> npm run build
```

> This process may take up to 10 minutes.

## Start

Once this repository is built, you can select the "Run" button on Replit or run:

```sh
> npm start
```
