import Path from 'path';
import Os from 'os';
import Fs from 'fs';
import { companyName, productName } from './constants.mjs';

export const dataRootDir = (() => {
	const homeDir = Os.homedir();
	if(process.platform !== 'win32')
		throw 'Platforms other than Windows are not yet supported.';
	const roamingDir = Path.join(homeDir, 'AppData', 'Roaming');
	return EnsureDir(Path.join(roamingDir, companyName, productName));
})();

function EnsureDir(path) {
	if (!Fs.existsSync(path))
		Fs.mkdirSync(path, { recursive: true });
	return path;
}

export function EnsureDataDir(subpath) {
	const fullPath = Path.join(dataRootDir, subpath);
	return EnsureDir(fullPath);
}

export const userDir = EnsureDataDir('users');
export const dictDir = EnsureDataDir('dictionaries');
