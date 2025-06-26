import {mikrokatInit, mikrokatServe} from "../../src/main/mikrokat-commands.js";
import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("MikrokatProject multimain",()=>{
	it("can have several main files",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/projectmulti");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}");

		await fsp.mkdir(path.join(projectDir,"src/main"),{recursive: true});

		await fsp.writeFile(path.join(projectDir,"src/main/server1.js"),`
			export function onFetch(ev) {
				let pathname=new URL(ev.request.url).pathname;

				if (pathname=="/first")
					return new Response("first server");
			}
		`);

		await fsp.writeFile(path.join(projectDir,"src/main/server2.js"),`
			export function onFetch(ev) {
				return new Response("second server");
			}
		`);

		await fsp.writeFile(path.join(projectDir,"mikrokat.json"),`
			{
				"main": ["src/main/server1.js","src/main/server2.js"]
			}
		`);

		await mikrokatInit({cwd: projectDir, silent: true});

		let server=await mikrokatServe({cwd: projectDir, port: 3000, silent: true});

		let res1=await fetch("http://localhost:3000/first");
		let resBody1=await res1.text();
		expect(resBody1).toEqual("first server")
		//console.log(resBody1);

		let res2=await fetch("http://localhost:3000");
		let resBody2=await res2.text();
		expect(resBody2).toEqual("second server")
		//console.log(resBody2);

		await server.stop();
	});
});