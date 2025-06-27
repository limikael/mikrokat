import MikrokatServer from "./MikrokatServer.js";
import {createNodeRequestListener} from "serve-fetch";
import {readPackageUp} from 'read-package-up';
import {safeResolveExports, pkgSetExport} from "../utils/npm-util.js";
import {DeclaredError, arrayify} from "../utils/js-util.js";
import path from "node:path";
import http from "node:http";
import targetClasses from "../targets/target-classes.js";
import fs, {promises as fsp} from "fs";
import * as TOML from '@ltd/j-toml';
import JSON5 from "json5";
import ConditionalImports from "../utils/ConditionalImports.js";
import {serverListenPromise, serverClosePromise, createStaticResponse} from "../utils/node-util.js";
import {fileURLToPath} from 'url';
import {getPackageVersion} from "../utils/node-util.js";
import {clauseMatch} from "../utils/clause.js";
import {getUsedServiceTypes, serviceImportFiles} from "../services/services.js";

let ENTRYPOINT_STUB=
`export async function onFetch({request}) {
    return new Response("The project starts here");
}
`;

const __dirname=path.dirname(fileURLToPath(import.meta.url));

export default class MikrokatProject {
	constructor({cwd, main, target, port, log, config, env}={}) {
		this.main=main;
		this.cwd=cwd;
		this.target=target;
		this.port=port;
		this.paramConfig=config;
		this.env=env;

		if (!this.target)
			this.target="node";

		if (typeof log=="function")
			this.log=log;

		else if (log!==false)
			this.log=(...args)=>console.log(...args);

		else
			this.log=()=>{};
	}

	async load() {
		this.config={};

		if (this.paramConfig)
			this.config={...this.config,...this.paramConfig};

		if (fs.existsSync(path.join(this.cwd,"mikrokat.json"))) {
			this.config={
				...this.config,
				...JSON5.parse(await fsp.readFile(path.join(this.cwd,"mikrokat.json")))
			};
		}

		if (!this.config.services)
			this.config.services={};

		this.getEntrypoints();
	}

	getEntrypoints() {
		if (!this.config)
			throw new Error("No config, can't get entrypoint");

		let main;

		if (this.main)
			main=arrayify(this.main);

		else
			main=arrayify(this.config.main);

		if (!main.length)
			throw new DeclaredError("No entrypoint. Pass it on the command line using --main, or put it in mikrokat.json");

		return main.map(m=>path.resolve(this.cwd,m));
	}

	getEntrypointImports() {
		let s="";

		let eps=this.getEntrypoints();
		for (let i=0; i<eps.length; i++)
			s+=`import * as __Module${i} from ${JSON.stringify(eps[i])};\n`

		return ({
			imports: s,
			vars: `const modules=[${eps.map((_,i)=>`__Module${i}`).join(",")}];\n`
		});
	}

	getServiceImports() {
		let applicableServices=this.getApplicableServices();
		let serviceImports="";
		let serviceClasses="const serviceClasses={\n";
		let serviceTypes=getUsedServiceTypes(applicableServices);

		for (let serviceType of serviceTypes) {
			if (!serviceImportFiles[serviceType])
				throw new DeclaredError("Unknown service type: "+serviceType);

			let servicePathAbs=path.join(__dirname,"../services/",serviceImportFiles[serviceType]);
			//let servicePathRel=path.relative(path.dirname(outfileAbs),servicePathAbs);
			serviceImports+=`import Service_${serviceType} from ${JSON.stringify(servicePathAbs)};\n`;
			serviceClasses+=`\"${serviceType}\": Service_${serviceType},\n`;
		}

		serviceClasses+="}\n";

		return ({
			imports: serviceImports,
			vars: serviceClasses
		});
	}

	async getStubVars() {
		let applicableServices=this.getApplicableServices();

		let epsImports=this.getEntrypointImports();
		let condImports=this.getConditionalImports().getImportStub();
		let serviceImports=this.getServiceImports();
		let fileContent=`const fileContent=${JSON.stringify(await this.getFileContent(),null,2)};\n`;
		let servicesContent=`const services=${JSON.stringify(applicableServices,null,2)};\n`;

		let imports=
			epsImports.imports+
			condImports.imports+
			serviceImports.imports+
			epsImports.vars+
			condImports.vars+
			serviceImports.vars+
			fileContent+
			servicesContent;

		return imports;
	}

	async writeStub(outfile, content) {
		let outfileAbs=path.resolve(this.cwd,outfile);
		await fsp.mkdir(path.dirname(outfileAbs),{recursive: true});

		content=content.replaceAll("$VARS",await this.getStubVars());

		/*content=content.replaceAll("$FILECONTENT",JSON.stringify(await this.getFileContent(),null,2));

		let eps=this.getEntrypointImports();
		let cond=this.getConditionalImports().getImportStub();
		let imports=eps.imports+cond.imports+eps.vars+cond.vars;
		content=content.replaceAll("$IMPORTS",imports);*/

		await fsp.writeFile(outfileAbs,content);
	}

	getClauseTruth() {
		return ({target: this.target});
	}

	getConditionalImports() {
		return new ConditionalImports({
			cwd: this.cwd,
			truth: this.getClauseTruth(),
			imports: this.config.imports
		});
	}

	getApplicableServices() {
		if (!this.config)
			throw new Error("No config, project not loaded?");

		let resultServices={};
		let declaredServices=this.config.services;

		for (let k in declaredServices) {
			if (Array.isArray(declaredServices[k])) {
				let cands=declaredServices[k];
				let useCand=cands.find(c=>clauseMatch(c.if,this.getClauseTruth()));
				if (useCand)
					resultServices[k]=useCand;
			}

			else {
				if (clauseMatch(declaredServices[k].if,this.getClauseTruth()))
					resultServices[k]=declaredServices[k];
			}
		}

		return resultServices;
	}

	async serve() {
		let conditionalImports=this.getConditionalImports();
		let applicableServices=await this.getApplicableServices();
		let serviceTypes=getUsedServiceTypes(applicableServices);
		let serviceClasses={};

		for (let serviceType of serviceTypes) {
			if (!serviceImportFiles[serviceType])
				throw new DeclaredError("Unknown service type: "+serviceType);

			let serviceImport=path.join(__dirname,"../services/",serviceImportFiles[serviceType])
			serviceClasses[serviceType]=(await import(serviceImport)).default;
		}

		let modules=[];
		for (let ep of this.getEntrypoints())
			modules.push(await import(ep));

		let server=new MikrokatServer({
			target: "node",
			cwd: this.cwd,
			env: {...this.env, CWD: this.cwd},
			modules: modules,
			imports: await conditionalImports.loadImports(),
			fileContent: await this.getFileContent(),
			services: applicableServices,
			serviceClasses
		});

		await server.ensureStarted();

		let listener=createNodeRequestListener(async request=>{
			let assetResponse=await createStaticResponse({
				request: request,
				cwd: path.join(this.cwd,"public")
			});

			if (assetResponse)
				return assetResponse;

			return await server.handleRequest({request});
		});
		this.httpServer=http.createServer(listener);

		await serverListenPromise(this.httpServer,this.port);

		this.log("Listening to port: "+this.port);
	}

	async close() {
		if (!this.httpServer)
			throw new Error("Not running");

		await serverClosePromise(this.httpServer);
		this.httpServer=null;
	}

	async build() {
		if (this.target=="node") {
			this.log("Nothing to build for node.");
			return;
		}

		let target=new targetClasses[this.target]({cli: this});

		await target.build();
	}

	async init() {
		if (!fs.existsSync(path.join(this.cwd,"package.json"))) {
			this.log("Initializing new project: "+path.basename(this.cwd));
			await fsp.writeFile(path.join(this.cwd,"package.json"),"{}");
		}

		await this.processProjectFile("package.json","json",async pkg=>{
			if (!pkg.name)
				pkg.name=path.basename(this.cwd);

			if (!pkg.hasOwnProperty("private"))
				pkg.private=true;

			pkg.type="module";

			if (!pkg.scripts) pkg.scripts={};
			if (!pkg.scripts.start)
				pkg.scripts.start="mikrokat serve";

			if (!pkg.scripts.build)
				pkg.scripts.build="mikrokat build";

			if (!pkg.dependencies)
				pkg.dependencies={};

			if (!pkg.dependencies.mikrokat)
				pkg.dependencies.mikrokat="^"+await getPackageVersion(__dirname);

			return pkg;
		});

		await this.processProjectFile("mikrokat.json","json",async mikrokat=>{
			if (!mikrokat)
				mikrokat={};

			if (!mikrokat.main)
				mikrokat.main="src/main/server.js";

			return mikrokat;
		});

		await this.load();

		await this.processProjectFile(this.getEntrypoints()[0],null,content=>{
			if (!content)
				return ENTRYPOINT_STUB
		});

		await this.processProjectFile(".gitignore","lines",ignore=>{
			if (!ignore.includes(".target")) ignore.push(".target");
			if (!ignore.includes("node_modules")) ignore.push("node_modules");
		});

		await this.processProjectFile("public/.gitkeep",null,async ()=>{
			return "";
		});

		if (this.target && this.target!="node") {
			let target=new targetClasses[this.target]({cli: this});
			await target.init();
		}
	}

	async processProjectFile(filename, format, processor) {
		let filenameAbs=path.resolve(this.cwd,filename);

		let content;
		if (fs.existsSync(filenameAbs))
			content=await fsp.readFile(filenameAbs,"utf8");

		switch (format) {
			case "json": content=content?JSON.parse(content):content; break;
			case "lines": content=content?content.split("\n").filter(s=>!!s):[]; break;
			case "toml": content=TOML.parse(content?content:""); break;
			case null:
			case undefined:
				break;

			default: 
				throw new Error("Unknown config file format: "+format); 
				break;
		}

		if (processor) {
			let newContent=await processor(content);
			if (newContent!==undefined)
				content=newContent;
		}

		let textContent=content;
		switch (format) {
			case "json": textContent=JSON.stringify(textContent,null,2); break;
			case "lines": textContent=textContent.join("\n")+"\n"; break;
			case "toml":
				textContent=TOML.stringify(textContent,{
					newline: "\n",
					newlineAround: "section"
				});
				break;
		}

		await fsp.mkdir(path.dirname(filenameAbs),{recursive: true});
		await fsp.writeFile(filenameAbs,textContent);

		if (["mikrokat.json","package.json"].includes(filename))
			this.config=undefined;

		return content;
	}

	async getFileContent() {
		let contentFiles={};
		for (let file of arrayify(this.config.files))
			contentFiles[file]=await fsp.readFile(path.join(this.cwd,file),"utf8");

		return contentFiles;
	}
}