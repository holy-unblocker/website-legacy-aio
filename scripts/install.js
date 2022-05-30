import chalk from 'chalk';
import { website, rammerhead, bare_server } from '../config/paths.js';
import { spawnAsync } from '../config/util.js';

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

console.log(`You can now build ${chalk.bold('website-aio')}:`);
console.log();

console.log(`  ${chalk.cyan('npm')} run build`);
console.log();
