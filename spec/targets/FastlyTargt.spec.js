import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";
import {mikrokatInit} from "../../src/main/mikrokat-commands.js";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("FastlyTaget",()=>{
	it("fastly can be initialized",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}");

		await mikrokatInit({cwd: projectDir, target: "fastly", quiet: true});
	});
})