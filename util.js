import { spawn } from 'child_process';
import { expand } from 'dotenv-expand';
import { config } from 'dotenv-flow';
import { resolve } from 'path';

expand(config());

export function spawnAsync(...args) {
	return new Promise((resolve, reject) => {
		const process = spawn(...args);
		process.on('exit', (code) => {
			if (code === 0) {
				resolve(code);
			} else {
				reject(code);
			}
		});
		process.on('error', reject);
	});
}

export const website = resolve('website');
export const websiteBuild = resolve(website, 'build');
export const rammerhead = resolve('rammerhead');
