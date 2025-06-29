import {mikrokatServe, mikrokatInit} from "../../src/main/mikrokat-commands.js";
import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

describe("mikrokat-system",()=>{
	it("can run cloudflare",async()=>{
		let projectDir=path.join(__dirname,"testproject");

		await fsp.rm(path.join(projectDir,".target"),{recursive: true, force: true});
		await fsp.rm(path.join(projectDir,"wrangler.json"),{recursive: true, force: true});

		await mikrokatInit({
			cwd: projectDir,
			platform: "cloudflare",
			quiet: true
		});

		let server=await mikrokatServe({
			cwd: projectDir,
			platform: "cloudflare",
			port: 3456
		});

		let response=await fetch("http://localhost:3456")
		let responseBody=await response.text();

		expect(responseBody).toEqual("Hello from platform: cloudflare");

		await server.stop();
	});

	it("can run vercel",async()=>{
		let projectDir=path.join(__dirname,"testproject");

		await fsp.rm(path.join(projectDir,".target"),{recursive: true, force: true});

		await mikrokatInit({
			cwd: projectDir,
			platform: "vercel",
			quiet: true
		});

		let server=await mikrokatServe({
			cwd: projectDir,
			platform: "vercel",
			port: 3456
		});

		let response=await fetch("http://localhost:3456")
		let responseBody=await response.text();

		expect(responseBody).toEqual("Hello from platform: vercel");

		await server.stop();
	});

	it("can run netlify",async()=>{
		let projectDir=path.join(__dirname,"testproject");

		await fsp.rm(path.join(projectDir,".target"),{recursive: true, force: true});

		await mikrokatInit({
			cwd: projectDir,
			platform: "netlify",
			quiet: true
		});

		let server=await mikrokatServe({
			cwd: projectDir,
			platform: "netlify",
			port: 3456
		});

		let response=await fetch("http://localhost:3456")
		let responseBody=await response.text();

		expect(responseBody).toEqual("Hello from platform: netlify");

		await server.stop();
	});

	it("can run fastly",async()=>{
		let projectDir=path.join(__dirname,"testproject");

		await fsp.rm(path.join(projectDir,".target"),{recursive: true, force: true});

		await mikrokatInit({
			cwd: projectDir,
			platform: "fastly",
			quiet: true
		});

		let server=await mikrokatServe({
			cwd: projectDir,
			platform: "fastly",
			port: 3456
		});

		console.log("*** fastly started, sending req")

		let response=await fetch("http://localhost:3456")
		let responseBody=await response.text();

		expect(responseBody).toEqual("Hello from platform: fastly");

		console.log("got response from fastly, stopping");

		await server.stop();

		console.log("fastly stopped");
	});
});

