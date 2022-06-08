'use strict';

try {
	const husky = require('husky');
	husky.prepare();
} catch (error) {
	console.warn('Husky not installed');
}
