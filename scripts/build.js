import '../util/prod.js';
import '../config/env.js';

import chalk from 'chalk';

import appName from '../config/appName.js';
import { rammerhead, website } from '../config/paths.js';
import spawnAsync from '../config/spawnAsync.js';

await spawnAsync('npm', ['run', 'build'], {
	stdio: 'inherit',
	cwd: website,
});

await spawnAsync('npm', ['run', 'build'], {
	stdio: 'inherit',
	cwd: rammerhead,
});

console.log();
console.log(chalk.green('Built successfully.'));
console.log();

console.log(`You can now start ${chalk.bold(appName)}:`);
console.log();

console.log(`  ${chalk.cyan('npm')} start`);
console.log();
