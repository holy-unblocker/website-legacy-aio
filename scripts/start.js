import '../config/prod.js';
import '../config/env.js';
import {
	theatre,
	website_build,
	bare_server,
	rammerhead,
} from '../config/paths.js';
import Fastify from 'fastify';
import FastifyStatic from '@fastify/static';
import FasifyHTTPProxy from '@fastify/http-proxy';
import { createServer } from 'node:net';
import { fork } from 'node:child_process';
import { join } from 'node:path';

const server = new Fastify();

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

fork(join(rammerhead, 'src', 'server', 'index.js'), {
	cwd: rammerhead,
});

server.register(FastifyStatic, {
	root: website_build,
	decorateReply: false,
});

server.register(FastifyStatic, {
	root: join(theatre, 'public'),
	prefix: '/theatre/',
	decorateReply: false,
});

server.register(FasifyHTTPProxy, {
	upstream: `http://localhost:${barePort}`,
	prefix: '/api/bare', // optional
});

server.register(FasifyHTTPProxy, {
	upstream: `https://static.holy.how/db`,
	prefix: '/api/db', // optional
});

server.listen(process.env.PORT || 80, process.env.ADDRESS, (error, url) => {
	if (error) {
		console.error(error);
		process.exit(1);
	}

	console.log('View at', url);
});
