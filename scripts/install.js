import chalk from 'chalk';

import appName from '../config/appName.js';
import { bare_server, rammerhead, website } from '../config/paths.js';
import spawnAsync from '../config/spawnAsync.js';

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
