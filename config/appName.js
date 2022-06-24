import { appPackageJson } from './paths.js';
import { readFile } from 'fs/promises';

export default JSON.parse(await readFile(appPackageJson)).name;
