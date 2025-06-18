#!/usr/bin/env node

import {getPackageInfo} from "../src/utils/npm-util.js";
import fs, {promises as fsp} from "fs";

let packageNames=["wrangler","@fastly/cli","@fastly/js-compute","netlify-cli","vercel"];
let packageVersions={};

for (let packageName of packageNames) {
	let packageInfo=await getPackageInfo(packageName);

	let latestVersion=packageInfo["dist-tags"].latest;
	packageVersions[packageName]=latestVersion;
}

await fsp.writeFile("src/cli/package-versions.js",`
export default ${JSON.stringify(packageVersions,null,2)};
`);

