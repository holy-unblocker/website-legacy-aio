import createBareServer from '@tomphttp/bare-server-node';
import address from 'address';
import chalk from 'chalk';
import { expand } from 'dotenv-expand';
import { config } from 'dotenv-flow';
import express from 'express';
import proxy from 'express-http-proxy';
import { createRequire } from 'module';
import { fork } from 'node:child_process';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { websitePath } from 'website';

const require = createRequire(import.meta.url);

// what a dotenv in a project like this serves: .env.local file containing developer port
expand(config());

console.log(`${chalk.cyan('Starting the server...')}\n`);
// root <= 1024
const portMin = 1025;
const portMax = 65536;

const randomPort = () => ~~(Math.random() * (portMax - portMin)) + portMin;

const tryBind = (port) =>
	new Promise((resolve, reject) => {
		// http server.. net server, same thing!
		const server = createServer();

		server.on('error', (error) => {
			reject(error);
		});

		server.on('listening', () => {
			server.close(() => resolve());
		});

		server.listen({ port });
	});

const findPort = async () => {
	while (true) {
		const port = randomPort();

		try {
			await tryBind(port);
			return port;
		} catch (err) {
			// try again
		}
	}
};

const rhPort = await findPort();
const rhCrossDomainPort = await findPort();

fork(require.resolve('rammerhead/bin.js'), {
	stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
	env: {
		...process.env,
		PORT: rhPort,
		CROSS_DOMAIN_PORT: rhCrossDomainPort,
	},
});

const app = express();

app.use(
	'/api/db',
	proxy(`https://holyubofficial.net/`, {
		proxyReqPathResolver: (req) => `/db/${req.url}`,
	})
);
app.use(
	'/cdn',
	proxy(`https://holyubofficial.net/`, {
		proxyReqPathResolver: (req) => `/cdn/${req.url}`,
	})
);

const rammerheadProxy = proxy(`http://127.0.0.1:${rhPort}`, {
	proxyReqPathResolver: (req) =>
		req.originalUrl.replace(/^\/[a-z0-9]{32}\/.*?:\/(?!\/)/, '$&/'),
});

for (const url of [
	'/([a-z0-9]{32})*',
	'/rammerhead.js',
	'/hammerhead.js',
	'/transport-worker.js',
	'/task.js',
	'/iframe-task.js',
	'/worker-hammerhead.js',
	'/messaging',
	'/sessionexists',
	'/deletesession',
	'/newsession',
	'/editsession',
	'/needpassword',
	'/syncLocalStorage',
	'/api/shuffleDict',
])
	app.use(url, rammerheadProxy);

app.use(express.static(websitePath, { fallthrough: false }));

app.use((error, req, res, next) => {
	if (error.statusCode === 404)
		return res.sendFile(join(websitePath, '404.html'));

	next();
});

const server = createServer();

const bare = createBareServer('/api/bare/', {
	logErrors: false,
	localAddress: undefined,
	maintainer: {
		email: 'tomphttp@sys32.dev',
		website: 'https://github.com/tomphttp/',
	},
});

server.on('request', (req, res) => {
	if (bare.shouldRoute(req)) {
		bare.routeRequest(req, res);
	} else {
		app(req, res);
	}
});

server.on('upgrade', (req, socket, head) => {
	if (bare.shouldRoute(req)) {
		bare.routeUpgrade(req, socket, head);
	} else {
		socket.end();
	}
});

const tryListen = (port) =>
	new Promise((resolve, reject) => {
		const cleanup = () => {
			server.off('error', errorListener);
			server.off('listening', listener);
		};

		const errorListener = (err) => {
			cleanup();
			reject(err);
		};

		const listener = () => {
			cleanup();
			resolve();
		};

		server.on('error', errorListener);
		server.on('listening', listener);

		server.listen({
			port,
		});
	});

const ports = [80, 8080, 3000];

const envPort = Number(process.env.PORT);
if (!isNaN(envPort)) ports.unshift(envPort);

while (true) {
	const port = ports.shift() || randomPort();

	try {
		await tryListen(port);

		// clear console:
		process.stdout.write(
			process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H'
		);

		console.log(
			`You can now view ${chalk.bold('website-aio')} in the browser.`
		);

		console.log('');

		const addr = server.address();

		console.log(
			`  ${chalk.bold('Local:')}            http://${
				addr.family === 'IPv6' ? `[${addr.address}]` : addr.address
			}${addr.port === 80 ? '' : ':' + chalk.bold(addr.port)}`
		);

		console.log(
			`  ${chalk.bold('Local:')}            http://localhost${
				addr.port === 80 ? '' : ':' + chalk.bold(addr.port)
			}`
		);

		try {
			console.log(
				`  ${chalk.bold('On Your Network:')}  http://${address.ip()}${
					addr.port === 80 ? '' : ':' + chalk.bold(addr.port)
				}`
			);
		} catch (err) {
			// can't find LAN interface
		}

		if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
			console.log(
				`  ${chalk.bold('Replit:')}           https://${
					process.env.REPL_SLUG
				}.${process.env.REPL_OWNER}.repl.co`
			);
		}

		console.log('');
		break;
	} catch (err) {
		console.error(chalk.yellow(chalk.bold(`Couldn't bind to port ${port}.`)));
	}
}
