# website-aio

### Who this repository is for

This repository is for people looking for a convenient way to deploy Holy Unblocker.

The frontend [website repository](https://git.holy.how/holy/website) can run without other scripts being installed, however functionality will be limited. We configured all scripts to run [locally](#compromises)

### Compromises

Because the common build environments we worked with have very limited storage, we had to trim down the size of this repository and its submodules.

- Only the latest commits in submodules are kept (`--depth 1`)
- Theatre files (games, apps) are hosted on GitHub's CDN
- Our official db-server instance is being proxied to allow redeeming vouchers and fetching the latest theatre data

### Dependencies

These scripts are already setup when you deploy an instance.

- [DB server](https://git.holy.how/holy/db-server)
- [Theatre](https://git.holy.how/holy/theatre)
- [Bare Server Node](https://github.com/tomphttp/bare-server-node)
- [Rammerhead](https://github.com/binary-person/rammerhead)

### Deployment

[![Deploy to Heroku](https://binbashbanana.github.io/deploy-buttons/buttons/remade/heroku.svg)](https://heroku.com/deploy/?template=https://github.com/e9x/website-aio)
[![Run on Replit](https://binbashbanana.github.io/deploy-buttons/buttons/remade/replit.svg)](https://github.com/e9x/website-aio/wiki/Deploy-to-Replit)
[![Deploy on Railway](https://binbashbanana.github.io/deploy-buttons/buttons/remade/railway.svg)](https://railway.app/new/template?template=https://github.com/e9x/website-aio)

If you are deploying to an alternative service, please refer to the [wiki](https://github.com/e9x/website-aio/wiki) before [opening an issue](https://github.com/e9x/website-aio/issues).
