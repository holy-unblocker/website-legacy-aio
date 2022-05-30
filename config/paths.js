import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd } from 'node:process';

const appDirectory = realpathSync(cwd());

function resolveApp(relativePath) {
	return resolve(appDirectory, relativePath);
}

export const dotenv = resolveApp('.env');
export const appPackageJson = resolveApp('package.json');
export const website = resolveApp('website');
export const website_build = resolveApp('website/build');
export const db_server = resolveApp('db-server');
export const theatre = resolveApp('theatre');
export const rammerhead = resolveApp('rammerhead');
export const bare_server = resolveApp('bare-server-node');
