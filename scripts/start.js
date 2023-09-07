import { createBareServer } from '@tomphttp/bare-server-node';
import address from 'address';
import chalk from 'chalk';
import { expand } from 'dotenv-expand';
import { config } from 'dotenv-flow';
import express from 'express';
import proxy from 'express-http-proxy';
import { createServer } from 'node:http';
import { join } from 'node:path';
import createRammerhead from 'rammerhead/src/server/index.js';
import { websitePath } from 'website';

// what a dotenv in a project like this serves: .env.local file containing developer port
expand(config());

const rh = createRammerhead();

// used when forwarding the script
const rammerheadScopes = [
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
];

const rammerheadSession = /^\/[a-z0-9]{32}/;

console.log(`${chalk.cyan('Starting the server...')}\n`);

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

app.use(express.static(websitePath, { fallthrough: false }));

app.use((error, req, res, next) => {
	if (error.statusCode === 404)
		return res.sendFile(join(websitePath, '404.html'));

	next();
});

const server = createServer();

const bare = createBareServer('/api/bare/');

server.on('request', (req, res) => {
	if (bare.shouldRoute(req)) {
		bare.routeRequest(req, res);
	} else if (shouldRouteRh(req)) {
		routeRhRequest(req, res);
	} else {
		app(req, res);
	}
});

server.on('upgrade', (req, socket, head) => {
	if (bare.shouldRoute(req)) {
		bare.routeUpgrade(req, socket, head);
	} else if (shouldRouteRh(req)) {
		routeRhUpgrade(req, socket, head);
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

function randomPort() {
	return ~~(Math.random() * (65536 - 1024 - 1)) + 1024;
}

/**
 *
 * @param {import('node:http').IncomingRequest} req
 */
function shouldRouteRh(req) {
	const url = new URL(req.url, 'http://0.0.0.0');
	return (
		rammerheadScopes.includes(url.pathname) ||
		rammerheadSession.test(url.pathname)
	);
}

/**
 *
 * @param {import('node:http').IncomingRequest} req
 * @param {import('node:http').ServerResponse} res
 */
function routeRhRequest(req, res) {
	rh.emit('request', req, res);
}

/**
 *
 * @param {import('node:http').IncomingRequest} req
 * @param {import('node:stream').Duplex} socket
 * @param {Buffer} head
 */
function routeRhUpgrade(req, socket, head) {
	rh.emit('upgrade', req, socket, head);
}
