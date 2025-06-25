import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";
import {mikrokatInit, mikrokatBuild} from "../../src/main/mikrokat-commands.js";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("NetlifyTaget",()=>{
	it("netlify can be initialized",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}");

		await mikrokatInit({cwd: projectDir, target: "netlify", quiet: true});
	});

	it("netlify can be built",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project5");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}");

		await mikrokatInit({cwd: projectDir, target: "netlify", quiet: true});
		await mikrokatBuild({cwd: projectDir, target: "netlify", quiet: true});
	});
})