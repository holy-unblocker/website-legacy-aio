import { rammerhead, website, spawnAsync } from '../util.js';
import chalk from 'chalk';

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
