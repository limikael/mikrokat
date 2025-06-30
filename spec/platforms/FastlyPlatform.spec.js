import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";
import {mikrokatInit, mikrokatClean} from "../../src/main/mikrokat-commands.js";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("FastlyTaget",()=>{
	it("fastly can be initialized",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}");

		await mikrokatInit({cwd: projectDir, platform: "fastly", quiet: true});

		let pkg;
		pkg=JSON.parse(await fsp.readFile(path.join(projectDir,"package.json"),"utf8"));
		//console.log(pkg);
		expect(pkg.dependencies["@fastly/cli"]).toBeDefined();

		await mikrokatClean({cwd: projectDir, platform: "fastly", purge: true});

		pkg=JSON.parse(await fsp.readFile(path.join(projectDir,"package.json"),"utf8"));
		//console.log(pkg);
		expect(pkg.dependencies["@fastly/cli"]).toBe(undefined);
	});
})