import * as resolve from 'resolve.exports';
import {responseAssert, DeclaredError} from "./js-util.js";
import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';

export function safeResolveExports(...args) {
	try {
		return resolve.exports(...args);
	}

	catch (e) {
		if (e.message.startsWith("No known conditions"))
			return;

		if (e.message.startsWith("Missing"))
			return;

		throw e;
	}
}

export function pkgSetExport(pkg, {importPath, conditions, target}={}) {
	if (!pkg.exports)
		pkg.exports={};

	let	exps=pkg.exports;

	if (!conditions)
		conditions=[];

	if (conditions.length)
		throw new Error("Can't handle conditions yet");

	if (!importPath.startsWith("."))
		importPath="./"+importPath;

	if (!target.startsWith("."))
		target="./"+target;

	if (!Object.keys(exps)[0] ||
			Object.keys(exps)[0].startsWith(".")) {
		exps[importPath]=target;
		return pkg;
	}

	if (!exps.default)
		exps.default={};

	exps.default[importPath]=target;
	return pkg;
}

export async function getPackageInfo(pkgName) {
	let url=new URL("https://registry.npmjs.com/"+pkgName);
	let response=await fetch(url);
	await responseAssert(response);

	let result=await response.json();
	return result;
}

export function getInstalledDepVersion(depName, cwd) {
    let currentDir = cwd;

    while (true) {
        const depPackageJson = path.join(currentDir, "node_modules", depName, "package.json");
        if (fs.existsSync(depPackageJson)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(depPackageJson, "utf8"));
                return pkg.version;
            } catch (err) {
                throw new Error(`Failed to parse ${depPackageJson}: ${err.message}`);
            }
        }

        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
            // Reached filesystem root
            return null;
        }
        currentDir = parentDir;
    }
}

export async function checkDependenciesUpToDate(cwd) {
    const pkgPath = path.join(cwd, 'package.json');
    const pkgData = JSON.parse(await fs.promises.readFile(pkgPath, 'utf8'));
    const deps = pkgData.dependencies || {};

    const results = {};

    for (const [name, declaredRange] of Object.entries(deps)) {
        if (!semver.validRange(declaredRange))
            continue;

        let installedVersion=getInstalledDepVersion(name,cwd);

        if (!installedVersion) {
            results[name] = { status: 'missing', declared: declaredRange, installed: null };
            continue;
        }

        /*const modulePkgPath = path.join(cwd, 'node_modules', name, 'package.json');
        let installedVersion;
        try {
            const modulePkgData = JSON.parse(await fs.promises.readFile(modulePkgPath, 'utf8'));
            installedVersion = modulePkgData.version;
        } catch (e) {
            results[name] = { status: 'missing', declared: declaredRange, installed: null };
            continue;
        }*/

        const isSatisfied = semver.satisfies(installedVersion, declaredRange, { includePrerelease: true });
        results[name] = {
            status: isSatisfied ? 'up-to-date' : 'outdated',
            declared: declaredRange,
            installed: installedVersion
        };
    }

    return results;
}

export async function assertDependenciesUpToDate(cwd) {
    const results = await checkDependenciesUpToDate(cwd);

    const problems = [];
    for (const [name, info] of Object.entries(results)) {
        if (info.status === 'missing') {
            problems.push(`- ${name} is missing (declared: ${info.declared})`);
        } else if (info.status === 'outdated') {
            problems.push(`- ${name} is outdated (declared: ${info.declared}, installed: ${info.installed})`);
        }
    }

    if (problems.length > 0) {
        const message = `Dependencies not up to date:\n` + problems.join('\n');
        throw new DeclaredError(message);
    }
}