import '../config/prod.js';
import '../config/env.js';
import { website } from '../config/paths.js';
import { spawnAsync } from '../config/util.js';

await spawnAsync('npm', ['run', 'build'], {
	stdio: 'inherit',
	cwd: website,
	env: process.env,
});
