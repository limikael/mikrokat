import MikrokatProject from "../../src/main/MikrokatProject.js";
import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("MikrokatProject",()=>{
	/*it("can get the version",async ()=>{
		let cli=new MikrokatCli();
		//console.log(await cli.getProgramVersion());
		let ver=await cli.getProgramVersion();
		let verParts=ver.split(".");
		expect(verParts[0]).toEqual("1");
		expect(verParts[1]).toEqual("0");
	});*/

	it("can initialize a new project",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}")

		let project=new MikrokatProject({cwd: projectDir, log: false});
		//expect(await cli.getEffectiveCwd()).toEqual(projectDir);

		await project.init();
		await project.load();

		expect(project.config).toEqual({
			main: "src/main/server.js",
		});

		expect(fs.existsSync(path.join(projectDir,"src/main/server.js"))).toBeTrue();
		expect(await fsp.readFile(path.join(projectDir,".gitignore"),"utf8")).toEqual(".target\nnode_modules\n");
	});

	it("can read file content",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}");
		await fsp.writeFile(path.join(projectDir,"myfile.txt"),"hello world");

		let project=new MikrokatProject({cwd: projectDir, log: false});
		await project.init();

		await fsp.writeFile(path.join(projectDir,"mikrokat.json"),`
			{
				"main": "something...",
				"files": ["myfile.txt"],
			}
		`);

		await project.load();

		let fileContent=await project.getFileContent();
		expect(fileContent).toEqual({"myfile.txt":"hello world"});
	});

	it("can serve static assets",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project1");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.mkdir(path.join(projectDir,"public"),{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}");
		await fsp.writeFile(path.join(projectDir,"public/test.txt"),"hello world");
		await fsp.writeFile(path.join(projectDir,"public/image.jpg"),"mock image");

		let project=new MikrokatProject({cwd: projectDir, port: 3000, log: false});
		await project.init();

		await project.serve();

		let response=await fetch("http://localhost:3000/test.txt");
		expect(response.headers.get("content-type")).toEqual("text/plain");
		expect(response.headers.get("content-length")).toEqual("11");

		let responseBody=await response.text();
		expect(responseBody).toEqual("hello world");

		let response2=await fetch("http://localhost:3000/image.jpg");
		expect(response2.headers.get("content-type")).toEqual("image/jpeg");

		await project.close();
	});

	it("can reply to a request",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project2");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}")
		await fsp.writeFile(path.join(projectDir,"myfile.txt"),"hello world");

		let project=new MikrokatProject({
			cwd: projectDir, 
			port: 3000, 
			dependencies: {mikrokat: "^1.2.3"},
			log: false
		});

		await project.init();

		await fsp.writeFile(path.join(projectDir,"mikrokat.json"),`
			{
				"main": "src/main/server.js",
				"files": "myfile.txt",
				"imports": [
					{"import": "Database", "from": "better-sqlite3", "if": {"target": "node"}}
				]
			}
		`);

		await project.load();

		await fsp.writeFile(path.join(projectDir,"src/main/server.js"),`
			export async function onFetch({request, env, fs, imports}) {
				env.DB=new imports.Database("${path.join(projectDir,"test.sqlite")}");
				let res=env.DB.prepare("CREATE TABLE test (val initeger)").run();
				let res2=env.DB.prepare("INSERT INTO test (val) VALUES (123)").run();
				let res3=env.DB.prepare("SELECT * FROM test").all();

				let txt=JSON.stringify(res3)+fs.readFileSync("myfile.txt");

				return new Response(txt);
			}
		`);

		await project.serve();

		let response=await fetch("http://localhost:3000");
		let responseBody=await response.text();

		expect(responseBody).toEqual(`[{"val":123}]hello world`);

		await project.close();
	});
})