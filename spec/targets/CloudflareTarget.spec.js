import MikrokatCli from "../../src/cli/MikrokatCli.js";
import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("CloudflareTaget",()=>{
	it("cloudflare can be initialized",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}");

		let cli=new MikrokatCli({options: {cwd: projectDir, target: "cloudflare", quiet: true}});

		await cli.init();

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
					{"import": "A", "from": "./src/something.js", "if": {"target": "cloudflare"}}
				]
			}
		`);

		let cli=new MikrokatCli({options: {cwd: projectDir, target: "cloudflare", quiet: true}});

		await cli.init();
		await cli.build();
	});

})