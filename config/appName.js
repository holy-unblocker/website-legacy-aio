import { readFile } from 'fs/promises';

import { appPackageJson } from './paths.js';

export default JSON.parse(await readFile(appPackageJson)).name;
