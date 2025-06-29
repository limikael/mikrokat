import {mikrokatServe, mikrokatInit} from "../../src/main/mikrokat-commands.js";
import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

describe("mikrokat-system",()=>{
	it("can run cloudflare",async()=>{
		let projectDir=path.join(__dirname,"testproject");

		await fsp.rm(path.join(projectDir,".target"),{recursive: true, force: true});
		await fsp.rm(path.join(projectDir,"wrangler.json"),{recursive: true, force: true});

		await mikrokatInit({
			cwd: projectDir,
			target: "cloudflare",
			quiet: true
		});

		let server=await mikrokatServe({
			cwd: projectDir,
			target: "cloudflare"
		});

		let response=await fetch("http://localhost:3000")
		let responseBody=await response.text();

		expect(responseBody).toEqual("The project starts here");

		await server.stop();
	});
})

