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

		let cli=new MikrokatCli({options: {cwd: projectDir}});
		expect(await cli.getEffectiveCwd()).toEqual(projectDir);

		await cli.init();

		expect(await cli.getConfig()).toEqual({
			main: "src/main/server.js",
			services: {}
		});

		expect(fs.existsSync(path.join(projectDir,"src/main/server.js"))).toBeTrue();
		expect(await fsp.readFile(path.join(projectDir,".gitignore"),"utf8")).toEqual(".target\nnode_modules\n");
	});

	it("can compute applicable services",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}")
		await fsp.writeFile(path.join(projectDir,"mikrokat.json"),JSON.stringify({
			services: {
				DB1: {type: "database"},
				DB2: {type: "database", if: {target: "hello"}},
				DB3: {type: "database", if: {target: "some other target"}},
				DB4: [
					{type: "database", if: {target: "not this one"}},
					{type: "database", if: {target: "hello"}},
				]
			}
		}));

		let cli=new MikrokatCli({options: {cwd: projectDir, target: "hello"}});
		expect(await cli.getApplicableServices()).toEqual({
			DB1: { type: 'database' },
			DB2: { type: 'database', if: { target: 'hello' } },
			DB4: { type: 'database', if: { target: 'hello' } }
		});

		//console.log(await cli.getApplicableServices());
	});

	it("can reply to a request",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}")
		await fsp.writeFile(path.join(projectDir,"myfile.txt"),"hello world");

		let cli=new MikrokatCli({options: {cwd: projectDir, port: 3000, quiet: true}});
		await cli.init();

		await fsp.writeFile(path.join(projectDir,"mikrokat.json"),`
			{
				"main": "src/main/server.js",
				"files": "myfile.txt",
				"services": {
					"DB": {
						"type": "sqlite",
						"filename": "test.sqlite",
						"exposeApi": "d1"
					},
					"DB2": [
						{
							"target": "hello",
							"type": "sqlite",
							"filename": "test.sqlite",
							"exposeApi": "d1"
						},
						{
							"type": "sqlite",
							"filename": "test2.sqlite",
							"exposeApi": "d1"
						}
					]
				}
			}
		`);

		await fsp.writeFile(path.join(projectDir,"src/main/server.js"),`
			export async function onFetch({request, env, fs}) {
				let res=await env.DB.prepare("CREATE TABLE test (val initeger)").run();
				let res2=await env.DB.prepare("INSERT INTO test (val) VALUES (123)").run();
				let res3=await env.DB.prepare("SELECT * FROM test").all();

				let res4=await env.DB2.prepare("CREATE TABLE test2 (val initeger)").run();

				let txt=JSON.stringify(res3.results)+fs.readFileSync("myfile.txt");

				return new Response(txt);
			}
		`);

		await cli.serve();

		let response=await fetch("http://localhost:3000");
		let responseBody=await response.text();

		expect(responseBody).toEqual(`[{"val":123}]hello world`);
	});

	it("can read file content",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}");
		await fsp.writeFile(path.join(projectDir,"myfile.txt"),"hello world");

		let cli=new MikrokatCli({options: {cwd: projectDir, port: 3000, quiet: true}});
		await cli.init();

		await fsp.writeFile(path.join(projectDir,"mikrokat.json"),`
			{
				"files": ["myfile.txt"],
			}
		`);

		let fileContent=await cli.getFileContent();
		expect(fileContent).toEqual({"myfile.txt":"hello world"});
	});
})