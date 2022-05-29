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

console.log('Installed dependencies for scripts');
