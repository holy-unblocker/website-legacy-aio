import '../config/prod.js';
import '../config/env.js';
import { rammerhead, website } from '../config/paths.js';
import { spawnAsync } from '../config/util.js';
import chalk from 'chalk';

await spawnAsync('npm', ['run', 'build'], {
	stdio: 'inherit',
	cwd: website,
	env: process.env,
});

await spawnAsync('npm', ['run', 'build'], {
	stdio: 'inherit',
	cwd: rammerhead,
	env: process.env,
});

console.log();
console.log(chalk.green('Built successfully.'));
console.log();

console.log(`You can now start ${chalk.bold('website-aio')}:`);
console.log();

console.log(`  ${chalk.cyan('npm')} start`);
console.log();
