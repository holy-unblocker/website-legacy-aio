import { rammerhead, website, spawnAsync } from '../util.js';
import chalk from 'chalk';
import { access } from 'fs/promises';
import { join } from 'path';
import rimraf from 'rimraf';

let isRepo;

try {
	await access('.git');
	isRepo = true;
} catch (err) {
	if (err?.code !== 'ENOENT') throw err;
	isRepo = false;
}

// no package = install parent dir (run this script again) = infinite loop
async function testSubmodule(dir, name, repo, sslVerify = true) {
	try {
		await access(join(dir, 'package.json'));
	} catch (err) {
		if (err?.code === 'ENOENT') {
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

						await new Promise((resolve, reject) =>
							rimraf(dir, (err) => {
								if (err) reject(err);
								else resolve();
							})
						);
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

await spawnAsync('npm', ['install'], {
	stdio: 'inherit',
	cwd: website,
	shell: true,
});

await spawnAsync('npm', ['install'], {
	stdio: 'inherit',
	cwd: rammerhead,
	shell: true,
});

console.log();
console.log(chalk.green('Modules installed successfully.'));
console.log();

console.log(`You can now build ${chalk.bold('website-aio')}:`);
console.log();

console.log(`  ${chalk.cyan('npm')} run build`);
console.log();
