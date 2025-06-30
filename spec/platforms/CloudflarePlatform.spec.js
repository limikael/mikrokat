//import MikrokatCli from "../../src/main/MikrokatCli.js";
import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";
import {mikrokatInit, mikrokatBuild} from "../../src/main/mikrokat-commands.js";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("CloudflarePlatform",()=>{
	it("cloudflare can be initialized",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}");

		await mikrokatInit({cwd: projectDir, platform: "cloudflare", silent: true})

		let pkg=await JSON.parse(await fsp.readFile(path.join(projectDir,"package.json")));
		expect(pkg.dependencies.wrangler).toEqual("^4.20.1");
	});

	it("cloudflare can be built",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}");
		await fsp.writeFile(path.join(projectDir,"mikrokat.json"),`
			{
				"imports": [
					{"import": "A", "from": "./src/something.js", "if": {"platform": "cloudflare"}}
				]
			}
		`);

		await mikrokatInit({cwd: projectDir, silent: true});

		await expectAsync(
			mikrokatBuild({cwd: projectDir, platform: "cloudflare", silent: true})
		).toBeRejectedWith(new Error("Cloudflare not initialized, no wrangler.json. Run init."));

		await mikrokatInit({cwd: projectDir, platform: "cloudflare", silent: true});
		await mikrokatBuild({cwd: projectDir, platform: "cloudflare", silent: true});

		let out=await fsp.readFile(path.join(projectDir,".target/entrypoint.cloudflare.js"),"utf8");
		//console.log(out);
		expect(out).toContain("__Module0");
		expect(out).toContain("__A");
	});
});