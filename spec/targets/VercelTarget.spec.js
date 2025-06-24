import MikrokatCli from "../../src/main/MikrokatCli.js";
import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("VercelTaget",()=>{
	it("vercel can be initialized",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}");

		let cli=new MikrokatCli({options: {cwd: projectDir, target: "vercel", quiet: true}});

		await cli.init();

		//await cli.init();

		//let pkg=await JSON.parse(await fsp.readFile(path.join(projectDir,"package.json")));
		//expect(pkg.dependencies.wrangler).toEqual("^4.20.1");
	});
})