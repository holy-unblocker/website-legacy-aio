import { rammerhead, website, spawnAsync } from '../util.js';
import chalk from 'chalk';

await spawnAsync('npm', ['run', 'build'], {
	stdio: 'inherit',
	cwd: website,
	shell: true,
});

await spawnAsync('npm', ['run', 'build'], {
	stdio: 'inherit',
	cwd: rammerhead,
	shell: true,
});

console.log();
console.log(chalk.green('Built successfully.'));
console.log();

console.log(`You can now start ${chalk.bold('website-aio')}:`);
console.log();

console.log(`  ${chalk.cyan('npm')} start`);
console.log();
