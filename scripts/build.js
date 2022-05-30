import '../config/prod.js';
import '../config/env.js';
import { rammerhead, website } from '../config/paths.js';
import { spawnAsync } from '../config/util.js';

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
