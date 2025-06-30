import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";
import {mikrokatInit, mikrokatBuild, mikrokatClean} from "../../src/main/mikrokat-commands.js";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("NetlifyTaget",()=>{
	it("netlify can be initialized",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}");

		await mikrokatInit({cwd: projectDir, platform: "netlify", quiet: true});

		let pkg;
		pkg=JSON.parse(await fsp.readFile(path.join(projectDir,"package.json"),"utf8"));
		//console.log(pkg);
		expect(pkg.dependencies["netlify-cli"]).toBeDefined();

		await mikrokatClean({cwd: projectDir, platform: "netlify", purge: true});

		pkg=JSON.parse(await fsp.readFile(path.join(projectDir,"package.json"),"utf8"));
		//console.log(pkg);
		expect(pkg.dependencies["netlify-cli"]).toBe(undefined);
	});

	it("netlify can be built",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project5");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}");

		await mikrokatInit({cwd: projectDir, platform: "netlify", quiet: true});
		await mikrokatBuild({cwd: projectDir, platform: "netlify", quiet: true});
	});
})