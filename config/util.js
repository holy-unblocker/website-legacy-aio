import { spawn } from 'node:child_process';

export function spawnAsync(...args) {
	return new Promise((resolve, reject) => {
		const process = spawn(...args);
		process.on('exit', code => {
			if (code === 0) {
				resolve(code);
			} else {
				reject(code);
			}
		});
		process.on('error', reject);
	});
}
