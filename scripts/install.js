import { access, rmdir } from 'node:fs/promises';
import { join } from 'node:path';

import chalk from 'chalk';

import appName from '../config/appName.js';
import { bare_server, isRepo, rammerhead, website } from '../config/paths.js';
import spawnAsync from '../config/spawnAsync.js';

// no package = install parent dir (run this script again) = infinite loop
async function testSubmodule(dir, name, repo, sslVerify = true) {
	try {
		await access(join(dir, 'package.json'));
	} catch (error) {
		if (error.code === 'ENOENT') {
			if (isRepo) {
				try {
					await access(dir);

					// dir exists but no package.json
					// not initialized
					console.warn(`Submodule ${chalk.bold(name)} was not initialized.`);

					try {
						await spawnAsync('git', ['submodule', 'update', '--init', name], {
							stdio: 'inherit',
						});

						return;
					} catch (error) {
						console.error(
							`Failure initializing ${chalk.bold(
								name
							)}, falling back to cloning\n`
						);

						await rmdir(dir);
					}
				} catch (error) {
					if (error.code !== 'ENOENT') {
						throw error;
					}
				}
			} else {
				console.warn(`Module ${chalk.bold(name)} was not cloned\n`);
			}

			console.log('Cloning module...\n');

			await spawnAsync(
				'git',
				[
					...(!sslVerify ? ['-c', 'http.sslVerify=false'] : []),
					'clone',
					repo,
					name,
					'--depth',
					'1',
				],
				{
					stdio: 'inherit',
				}
			);

			if (!sslVerify) {
				console.log('Disabling SSL verification\n');

				await spawnAsync('git', ['config', 'http.sslVerify', 'false'], {
					stdio: 'inherit',
					cwd: dir,
				});
			}
		}
	}
}

await testSubmodule(
	website,
	'website',
	'https://git.holy.how/holy/website-fork-aio.git',
	false
);

await testSubmodule(
	rammerhead,
	'rammerhead',
	'https://github.com/e9x/rammerhead-fork-aio.git'
);

await testSubmodule(
	bare_server,
	'bare-server-node',
	'https://github.com/tomphttp/bare-server-node'
);

await spawnAsync('npm', ['install', '--omnit=dev'], {
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
