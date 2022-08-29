import address from 'address';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { expand } from 'dotenv-expand';
import { config } from 'dotenv-flow';
import express from 'express';
import proxy from 'express-http-proxy';
import { createServer } from 'net';
import { join } from 'path';
import { websitePath } from 'website';

// what a dotenv in a project like this serves: .env.local file containing developer port
expand(config());

function clearConsole() {
	process.stdout.write(
		process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H'
	);
}

console.log(`${chalk.cyan('Starting the server...')}\n`);

const server = express();

function tryBind(port, hostname) {
	return new Promise((resolve, reject) => {
		const server = createServer();

		server.on('error', (error) => {
			reject(error);
		});

		server.on('listening', () => {
			server.close(() => resolve());
		});

		server.listen(port, hostname);
	});
}

// root <= 1024
const portMin = 1025;
const portMax = 65536;

async function createPort(hostname) {
	for (let i = 0; i < 1000; i++) {
		const port = ~~(Math.random() * (portMax - portMin)) + portMin;

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

spawn('npx', ['rammerhead'], {
	stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
	env: {
		...process.env,
		PORT: rhPort,
		CROSS_DOMAIN_PORT: rhCrossDomainPort,
	},
});

server.use('/api/bare', proxy(`http://localhost:${barePort}`));
server.use(
	'/api/db',
	proxy(`https://static.holy.how/`, {
		proxyReqPathResolver: (req) => `/db/${req.url}`,
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
	console.log(
		`You can now view ${chalk.bold('website-aio')} in the browser.\n`
	);
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
