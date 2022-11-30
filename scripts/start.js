import address from 'address';
import chalk from 'chalk';
import { fork } from 'child_process';
import { expand } from 'dotenv-expand';
import { config } from 'dotenv-flow';
import express from 'express';
import proxy from 'express-http-proxy';
import { createServer } from 'http';
import { createRequire } from 'module';
import { join } from 'path';
import { websitePath } from 'website';

const require = createRequire(import.meta.url);

// what a dotenv in a project like this serves: .env.local file containing developer port
expand(config());

console.log(`${chalk.cyan('Starting the server...')}\n`);

const server = express();

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
const barePort = await findPort();

fork(require.resolve('@tomphttp/bare-server-node/bin.js'), {
	stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
	env: {
		...process.env,
		PORT: barePort,
	},
});

fork(require.resolve('rammerhead/bin.js'), {
	stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
	env: {
		...process.env,
		PORT: rhPort,
		CROSS_DOMAIN_PORT: rhCrossDomainPort,
	},
});

server.use('/api/bare', proxy(`http://0.0.0.0:${barePort}`));
server.use(
	'/api/db',
	proxy(`https://static.holy.how/`, {
		proxyReqPathResolver: (req) => `/db/${req.url}`,
	})
);
server.use(
	'/cdn',
	proxy(`https://static.holy.how/`, {
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
]) {
	server.use(url, rammerheadProxy);
}

server.use(express.static(websitePath, { fallthrough: false }));

server.use((error, req, res, next) => {
	if (error.statusCode === 404)
		return res.sendFile(join(websitePath, '404.html'));

	next();
});

const http = createServer();

http.on('request', (req, res) => {
	server(req, res);
});

const tryListen = (port) =>
	new Promise((resolve, reject) => {
		const cleanup = () => {
			http.off('error', errorListener);
			http.off('listening', listener);
		};

		const errorListener = (err) => {
			cleanup();
			reject(err);
		};

		const listener = () => {
			cleanup();
			resolve();
		};

		http.on('error', errorListener);
		http.on('listening', listener);

		http.listen({
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

		const addr = http.address();

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
