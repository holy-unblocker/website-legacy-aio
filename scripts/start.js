import '../util/prod.js';
import '../config/env.js';

import { fork, spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { join } from 'node:path';

import address from 'address';
import chalk from 'chalk';
import cookie from 'cookie';
import express from 'express';
import proxy from 'express-http-proxy';

import appName from '../config/appName.js';
import { rammerhead, website_build } from '../config/paths.js';
import clearConsole from '../util/clearConsole.js';

console.log(`${chalk.cyan('Starting the server...')}\n`);

const server = express();

function tryBind(port, hostname) {
	return new Promise((resolve, reject) => {
		const server = createServer();

		server.on('error', error => {
			reject(error);
		});

		server.on('listening', () => {
			server.close(() => resolve());
		});

		server.listen(port, hostname);
	});
}

// root <= 1024
const PORT_MIN = 1025;
const PORT_MAX = 65536;

async function createPort(hostname) {
	for (let i = 0; i < 1000; i++) {
		const port = ~~(Math.random() * (PORT_MAX - PORT_MIN)) + PORT_MIN;

		try {
			await tryBind(port, hostname);
			return port;
		} catch (error) {
			continue;
		}
	}

	throw new Error('Unable to find available port');
}

const barePort = await createPort();

spawn('npx', ['bare-server-node'], {
	stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
	env: {
		...process.env,
		PORT: barePort,
	},
});

const rhPort = await createPort();
const rhCrossDomainPort = await createPort();

fork(join(rammerhead, 'src', 'server', 'index.js'), {
	cwd: rammerhead,
	stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
	env: {
		PORT: rhPort,
		CROSS_DOMAIN_PORT: rhCrossDomainPort,
	},
});

server.use('/api/bare', proxy(`http://localhost:${barePort}`));
server.use(
	'/api/db',
	proxy(`https://static.holy.how/`, {
		proxyReqPathResolver: req => `/db/${req.url}`,
	})
);

const rammerhead_proxy = proxy(`http://127.0.0.1:${rhPort}`, {
	proxyReqPathResolver: req =>
		req.originalUrl.replace(/^\/[a-z0-9]{32}\/.*?:\/(?!\/)/, '$&/'),
});

const rammerhead_session = '/([a-z0-9]{32})*';

server.use(rammerhead_session, (req, res, next) => {
	if (req.headers['sec-fetch-mode'] === 'navigate') {
		const cookies = cookie.parse(req.headers.cookie || '');

		if (!('auth_proxy' in cookies)) {
			res.status(401);
			res.send('Unauthorized');
			return;
		}
	}

	next();
});

for (const url of [
	rammerhead_session,
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
]) {
	server.use(url, rammerhead_proxy);
}

server.use(express.static(website_build, { fallthrough: false }));

server.use((error, req, res, next) => {
	if (error.statusCode === 404) {
		return res.sendFile(join(website_build, '404.html'));
	}

	next();
});

let port = process.env.PORT || 80;
const hostname = process.env.hostname || '0.0.0.0';

try {
	await tryBind(port);
} catch (error) {
	const newPort = await createPort(hostname);
	console.error(
		`${chalk.yellow(
			chalk.bold(
				`Address ${hostname}:${port} cannot be used. Binding to ${hostname}:${newPort} instead.`
			)
		)}\n`
	);
	port = newPort;
}

const urls = {};

urls.localUrlForTerminal = `http://${
	hostname === '0.0.0.0' ? 'localhost' : hostname
}:${chalk.bold(port)}`;
urls.localUrlForConfig = `http://${hostname}:${port}`;

if ('REPL_SLUG' in process.env) {
	urls.replUrlForTerminal = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
	urls.replUrlForConfig = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
}

try {
	urls.lanUrlForTerminal = `http://${address.ip()}:${chalk.bold(port)}`;
	urls.lanUrlForConfig = `http://${address.ip()}:${port}`;
	// eslint-disable-next-line no-empty
} catch (_error) {}

server.listen(port, hostname, () => {
	clearConsole();
	console.log(`You can now view ${chalk.bold(appName)} in the browser.\n`);
	console.log(
		[
			`  ${chalk.bold('Local:')}            ${urls.localUrlForTerminal}\n`,
			urls.lanUrlForTerminal &&
				`  ${chalk.bold('On Your Network:')}  ${urls.lanUrlForTerminal}\n`,
			urls.replUrlForTerminal &&
				`  ${chalk.bold('Replit:')}           ${urls.replUrlForTerminal}\n`,
		]
			.filter(Boolean)
			.join('')
	);
});
