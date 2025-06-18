import * as resolve from 'resolve.exports';
import {responseAssert} from "./js-util.js";

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