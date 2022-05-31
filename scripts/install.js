import { open } from 'node:fs/promises';
import { join } from 'node:path';

import chalk from 'chalk';

import appName from '../config/appName.js';
import { bare_server, rammerhead, website } from '../config/paths.js';
import spawnAsync from '../config/spawnAsync.js';

// no package = install parent dir (run this script again) = infinite loop
async function testSubmodule(dir, sm) {
	try {
		await open(join(dir, 'package.json'));
	} catch (error) {
		if (error.code === 'ENOENT') {
			throw new Error(`Submodules were not updated and cloned. (${sm})`);
		}

		throw error;
	}
}

await testSubmodule(website, 'website-aio-fork');
await testSubmodule(rammerhead, 'rammerhead-fork-aio');
await testSubmodule(bare_server, 'bare-server-node');

await spawnAsync('npm', ['install'], {
	stdio: 'inherit',
	cwd: website,
});

await spawnAsync('npm', ['install'], {
	stdio: 'inherit',
	cwd: rammerhead,
});

await spawnAsync('npm', ['install'], {
	stdio: 'inherit',
	cwd: bare_server,
});

console.log();
console.log(chalk.green('Modules installed successfully.'));
console.log();

console.log(`You can now build ${chalk.bold(appName)}:`);
console.log();

console.log(`  ${chalk.cyan('npm')} run build`);
console.log();
