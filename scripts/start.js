import '../config/prod.js';
import '../config/env.js';
import {
	theatre,
	website_build,
	bare_server,
	rammerhead,
} from '../config/paths.js';
import express from 'express';
import proxy from 'express-http-proxy';
import { createServer } from 'node:net';
import { fork } from 'node:child_process';
import { join } from 'node:path';

const server = express();

function tryBind(port, host) {
	return new Promise((resolve, reject) => {
		const server = createServer();

		server.on('error', error => {
			reject(error);
		});

		server.on('listening', () => {
			server.close(() => resolve());
		});

		server.listen(port, host);
	});
}

// root <= 1024
const PORT_MIN = 1025;
const PORT_MAX = 65536;

async function createPort() {
	for (let i = 0; i < 1000; i++) {
		const port = ~~(Math.random() * (PORT_MAX - PORT_MIN)) + PORT_MIN;

		try {
			await tryBind(port);
			return port;
		} catch (error) {
			continue;
		}
	}

	throw new Error('Unable to find available port');
}

const barePort = await createPort();

fork(join(bare_server, 'app.js'), {
	env: {
		PORT: barePort,
	},
});

const rhPort = await createPort();
const rhCrossDomainPort = await createPort();

fork(join(rammerhead, 'src', 'server', 'index.js'), {
	cwd: rammerhead,
	env: {
		PORT: rhPort,
		CROSS_DOMAIN_PORT: rhCrossDomainPort,
	},
});

server.use('/theatre', express.static(join(theatre, 'public')));
server.use('/api/bare', proxy(`http://localhost:${barePort}`));
server.use(
	'/api/db',
	proxy(`https://static.holy.how/`, {
		proxyReqPathResolver: req => `/db/${req.url}`,
	})
);

for (let url of [
	'/([a-z0-9]{32})*',
	'/rammerhead.js',
	'/hammerhead.js',
	'/transport-worker.js',
	'/task.js',
	'/sessionexists',
	'/deletesession',
	'/newsession',
	'/editsession',
	'/needpassword',
	'/syncLocalStorage',
	'/api/shuffleDict',
]) {
	server.use(
		url,
		proxy(`http://127.0.0.1:${rhPort}`, {
			proxyReqPathResolver: req => req.originalUrl,
		})
	);
}

server.use(express.static(website_build));
const port = process.env.PORT;
const address = process.env.ADDRESS;

server.listen(port, address, error => {
	if (error) {
		console.error(error);
		process.exit(1);
	}

	console.log(`Listening on ${address}:${port}`);
});
