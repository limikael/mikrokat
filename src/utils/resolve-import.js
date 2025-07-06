import path from 'path';
import fs from 'fs';
import resolve from 'resolve';
import {resolve as resolveExports} from 'resolve.exports';

/**
 * Resolve any specifier as Node would from a given base path.
 * @param {string} specifier - What to resolve ('lodash', './foo.js', '/abs/path').
 * @param {string} fromPath - File or directory path to resolve from.
 * @param {string[]} conditions - Array of conditions for 'exports' (default: ['import']).
 * @returns {Promise<string>} - Absolute path of the resolved module.
 */
export async function resolveImport(specifier, fromPath, conditions = ['import']) {
    const isBare =
        !specifier.startsWith('.') &&
        !specifier.startsWith('/') &&
        !path.isAbsolute(specifier);

    const baseDir = fs.existsSync(fromPath) && fs.statSync(fromPath).isDirectory()
        ? fromPath
        : path.dirname(fromPath);

    if (!isBare) {
        // Relative or absolute path specifier
        return path.resolve(baseDir, specifier);
    }

    // Bare specifier
    const parts = specifier.split('/');
    const pkgName = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
    const subpath = parts.slice(pkgName.startsWith('@') ? 2 : 1).join('/');

    // Find the package directory using 'resolve' with 'basedir'
    let pkgMainPath;
    try {
        pkgMainPath = resolve.sync(`${pkgName}/package.json`, { basedir: baseDir });
    } catch {
        throw new Error(`Package "${pkgName}" not found from ${baseDir}`);
    }

    const pkgDir = path.dirname(pkgMainPath);
    const pkgJson = JSON.parse(fs.readFileSync(pkgMainPath, 'utf-8'));

    if (pkgJson.exports) {
        const exportPath = resolveExports(pkgJson, `./${subpath}`, {
            conditions,
            unsafe: true, // fallback to legacy if no match
        });

        if (!exportPath || !exportPath.length) {
            throw new Error(`Unable to resolve "${specifier}" using exports from "${pkgName}"`);
        }
        return path.resolve(pkgDir,exportPath[0]);
    }

    // Fallback legacy 'main' resolution using 'resolve' directly
    return await new Promise((resolvePromise, reject) => {
        resolve(specifier, { basedir: baseDir }, (err, res) => {
            if (err) reject(err);
            else resolvePromise(res);
        });
    });
}
