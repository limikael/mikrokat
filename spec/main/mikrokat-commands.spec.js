import {mikrokatInit, mikrokatServe, mikrokatBuild, mikrokatCreateProvisionEnv} from "../../src/main/mikrokat-commands.js";
import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";
import {getPackageVersion} from "../../src/utils/node-util.js";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("mikrokat-commands",()=>{
	it("can create a provision env",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project-for-provision");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}")
		await fsp.writeFile(path.join(projectDir,"mikrokat.json"),JSON.stringify({
			main: "something.js",
			services: {
				DB: {type: "better-sqlite3", filename: "database.sqlite", if: {platform: "node"}},
				BUCKET: {type: "node-storage", dirname: "upload"},
				DBX: {type: "better-sqlite3", filename: "database2.sqlite", if: {platform: "something-else"}},
			}
		}));

		let env=await mikrokatCreateProvisionEnv({cwd: projectDir/*, target: "something-else"*/});
		expect(typeof env.BUCKET.get).toEqual("function");

		expect(env.getServiceMeta("DB").type).toEqual("better-sqlite3");
		expect(env.getServiceMeta("BUCKET").type).toEqual("node-storage");
		expect(env.getServiceMeta("DBX")).toEqual(undefined);
	});

	it("can initialize a new project",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}")

		await mikrokatInit({cwd: projectDir, log: false, initProject: true});

		let pkg=JSON.parse(await fsp.readFile(path.join(projectDir,"package.json")));
		expect(pkg.dependencies.mikrokat).toEqual("^"+await getPackageVersion(__dirname));
		//console.log(pkg);

		let config=JSON.parse(await fsp.readFile(path.join(projectDir,"mikrokat.json")));
		expect(config).toEqual({
			main: "src/main/server.js",
		});

		expect(fs.existsSync(path.join(projectDir,"src/main/server.js"))).toBeTrue();
		expect(await fsp.readFile(path.join(projectDir,".gitignore"),"utf8")).toEqual(".target\nnode_modules\n");
	});

	it("can serve a request",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project3");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}")

		await mikrokatInit({cwd: projectDir, log: false});

		let server=await mikrokatServe({
			cwd: projectDir, 
			port: 3000, 
			log: false,
			dependencyCheck: false,
		});

		let response=await fetch("http://localhost:3000");
		let responseBody=await response.text();

		expect(responseBody).toEqual(`The project starts here`);

		await server.stop();
	});

	it("can build",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project_cf");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"package.json"),"{}")

		await mikrokatInit({cwd: projectDir, platform: "cloudflare", log: false});
		await mikrokatBuild({cwd: projectDir, platform: "cloudflare", log: false});

		expect(fs.existsSync(path.join(projectDir,".target/entrypoint.cloudflare.js")));
	});
})

