import MikrokatCli from "../../src/cli/MikrokatCli.js";
import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("MikrokatCli",()=>{
	it("can get the version",async ()=>{
		let cli=new MikrokatCli();
		//console.log(await cli.getProgramVersion());
		let ver=await cli.getProgramVersion();
		let verParts=ver.split(".");
		expect(verParts[0]).toEqual("1");
		expect(verParts[1]).toEqual("0");
	});

	it("can initialize a new project",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}")
		await fsp.writeFile(path.join(projectDir,"mikrokat.json"),JSON.stringify({
			services: {
				DB: "hello"
			}
		}));

		let cli=new MikrokatCli({options: {cwd: projectDir}});
		expect(await cli.getEffectiveCwd()).toEqual(projectDir);

		//console.log(await cli.getConfig());
		expect(await cli.getConfig()).toEqual({ services: { DB: 'hello' } });

		await cli.init();

		expect(fs.existsSync(path.join(projectDir,"src/main/server.js"))).toBeTrue();
		expect(await fsp.readFile(path.join(projectDir,".gitignore"),"utf8")).toEqual(".target\nnode_modules\n");
	});

	it("can reply to a request",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}")

		let cli=new MikrokatCli({options: {cwd: projectDir, port: 3000}});
		await cli.init();

		await fsp.writeFile(path.join(projectDir,"mikrokat.json"),`
			{
				"services": {
					"DB": {
						"type": "sqlite",
						"filename": "test.sqlite"
					}
				}
			}
		`);

		await fsp.writeFile(path.join(projectDir,"src/main/server.js"),`
			export async function onFetch({request, env}) {
				return new Response("Testing: "+env.DB.test());
			}
		`);

		await cli.serve();

		let response=await fetch("http://localhost:3000");
		let responseBody=await response.text();

		expect(responseBody).toEqual("Testing: test");

	});
})