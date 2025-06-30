import MikrokatServer from "./MikrokatServer.js";
import {createNodeRequestListener} from "serve-fetch";
import {readPackageUp} from 'read-package-up';
import {safeResolveExports, pkgSetExport, assertDependenciesUpToDate} from "../utils/npm-util.js";
import {DeclaredError, arrayify} from "../utils/js-util.js";
import path from "node:path";
import http from "node:http";
import platformClasses from "../platforms/platform-classes.js";
import fs, {promises as fsp} from "fs";
import JSON5 from "json5";
import ConditionalImports from "../utils/ConditionalImports.js";
import {serverListenPromise, serverClosePromise, createStaticResponse} from "../utils/node-util.js";
import {fileURLToPath} from 'url';
import {getPackageVersion} from "../utils/node-util.js";
import {clauseMatch} from "../utils/clause.js";
import {getUsedServiceTypes, serviceImportFiles} from "../services/services.js";
import {processProjectFile} from "../utils/project-util.js";

let ENTRYPOINT_STUB=
`export async function onFetch({request}) {
    return new Response("The project starts here");
}
`;

const __dirname=path.dirname(fileURLToPath(import.meta.url));

export default class MikrokatProject {
	constructor({cwd, main, platform, port, log, config, env, initProject, target, purge, dependencyCheck}={}) {
		if (target)
			throw new Error("It is not called target, it is called platform");

		this.main=main;
		this.cwd=cwd;
		this.platform=platform;
		this.port=port;
		this.paramConfig=config;
		this.env=env;
		this.initProject=initProject;
		this.dependencyCheck=dependencyCheck;
		this.purge=purge;

		if (this.dependencyCheck===undefined)
			this.dependencyCheck=true;


		if (this.initProject===undefined)
			this.initProject=true;

		if (!this.env)
			this.env={};

		if (!this.platform)
			this.platform="node";

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

		//this.getEntrypoints();
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
			throw new DeclaredError("No entrypoint. Pass it on the command line using --main, or put it in the config.");

		return main.map(m=>path.resolve(this.cwd,m));
	}

	getEntrypointImports(dir) {
		let s="";

		let eps=this.getEntrypoints();
		for (let i=0; i<eps.length; i++)
			s+=`import * as __Module${i} from ${JSON.stringify(path.relative(dir,eps[i]))};\n`

		return ({
			imports: s,
			vars: `modules: [${eps.map((_,i)=>`__Module${i}`).join(",")}],\n`
		});
	}

	getServiceImports() {
		let applicableServices=this.getApplicableServices();
		let serviceImports="";
		let serviceClasses="serviceClasses: {\n";
		let serviceTypes=getUsedServiceTypes(applicableServices);

		for (let serviceType of serviceTypes) {
			if (!serviceImportFiles[serviceType])
				throw new DeclaredError("Unknown service type: "+serviceType);

			let servicePathAbs=path.join(__dirname,"../services/",serviceImportFiles[serviceType]);
			//let servicePathRel=path.relative(path.dirname(outfileAbs),servicePathAbs);
			serviceImports+=`import Service_${serviceType} from ${JSON.stringify(servicePathAbs)};\n`;
			serviceClasses+=`\"${serviceType}\": Service_${serviceType},\n`;
		}

		serviceClasses+="},\n";

		return ({
			imports: serviceImports,
			vars: serviceClasses
		});
	}

	async getStubVars(dir) {
		let applicableServices=this.getApplicableServices();

		let epsImports=this.getEntrypointImports(dir);
		let condImports=this.getConditionalImports().getImportStub();
		let serviceImports=this.getServiceImports();
		let fileContent=`fileContent: ${JSON.stringify(await this.getFileContent(),null,2)},\n`;
		let servicesContent=`services: ${JSON.stringify(applicableServices,null,2)},\n`;
		let envContent=`env: ${JSON.stringify(this.env,null,2)},\n`;

		let imports=
			epsImports.imports+
			condImports.imports+
			serviceImports.imports+
			"const MIKROKAT_SERVER_CONF={\n"+
			`platform: "${this.platform}",\n`+
			epsImports.vars+
			condImports.vars+
			serviceImports.vars+
			fileContent+
			servicesContent+
			envContent+
			"};\n";

		return imports;
	}

	async writeStub(outfile, content) {
		let outfileAbs=path.resolve(this.cwd,outfile);
		await fsp.mkdir(path.dirname(outfileAbs),{recursive: true});

		content=content.replaceAll("$VARS",await this.getStubVars(path.dirname(outfileAbs)));

		await fsp.writeFile(outfileAbs,content);
	}

	getClauseTruth() {
		return ({platform: this.platform});
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

	async createProvisionEnv() {
		let applicableServices=await this.getApplicableServices();
		let meta={};

		let env={};
		for (let k in applicableServices) {
			let def=applicableServices[k];
			let serviceImport=path.join(__dirname,"../services/",serviceImportFiles[def.type]);
			let serviceClass=(await import(serviceImport)).default;

			let service=new serviceClass({
				cwd: this.cwd, 
				platform: this.platform, 
				...def
			});

			service.type=def.type;

			if (service.api)
				env[k]=service.api;

			else
				env[k]=service;

			meta[k]=service;
		}

		env.getServiceMeta=k=>meta[k];

		return env;
	}

	async serveNode() {
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
			platform: "node",
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

		return this;
	}

	async serve() {
		if (this.platform=="node") {
			await this.build();
			return await this.serveNode();
		}

		else {
			await this.build();

			let platform=new platformClasses[this.platform]({project: this});
			let server=await platform.devServer();

			return server;
		}
	}

	async deploy() {
		if (this.platform=="node") {
			this.log("Specify platform to deploy to using --platform=<platform>.");
			return;
		}

		else {
			await this.build();

			let platform=new platformClasses[this.platform]({project: this});
			let server=await platform.deploy();

			return server;
		}
	}

	async close() {
		if (!this.httpServer)
			throw new Error("Not running");

		await serverClosePromise(this.httpServer);
		this.httpServer=null;
	}

	async stop() {
		await this.close();
	}

	async build() {
		if (this.dependencyCheck)
			await assertDependenciesUpToDate(this.cwd);

		if (this.platform=="node") {
			//this.log("Nothing to build for node.");
			return;
		}

		let platform=new platformClasses[this.platform]({project: this});

		await platform.verifyInit();
		await platform.build();
	}

	async clean() {
		await fsp.rm(path.join(this.cwd,".target"),{recursive: true, force: true});

		if (this.platform!="node") {
			let platform=new platformClasses[this.platform]({project: this});
			await platform.clean({purge: this.purge});
		}
	}

	async init() {
		if (this.initProject) {
			await this.processProjectFile("package.json","json",async pkg=>{
				if (!pkg) {
					this.log("Initializing new project: "+path.basename(this.cwd));
					pkg={};
				}

				if (!pkg.name)
					pkg.name=path.basename(this.cwd);

				if (!pkg.hasOwnProperty("private"))
					pkg.private=true;

				pkg.type="module";

				if (!pkg.scripts) pkg.scripts={};
				if (!pkg.dependencies)
					pkg.dependencies={};

				if (!pkg.scripts.start)
					pkg.scripts.start="mikrokat serve";

				if (!pkg.scripts.build)
					pkg.scripts.build="mikrokat build";

				if (!pkg.dependencies.mikrokat)
					pkg.dependencies.mikrokat="^"+await getPackageVersion(__dirname);

				return pkg;
			});
		}

		if (this.initProject) {
			await this.processProjectFile("mikrokat.json","json",async mikrokat=>{
				if (!mikrokat)
					mikrokat={};

				if (!mikrokat.main)
					mikrokat.main="src/main/server.js";

				return mikrokat;
			});
		}

		await this.load();

		if (this.initProject) {
			await this.processProjectFile(this.getEntrypoints()[0],null,content=>{
				if (!content)
					return ENTRYPOINT_STUB
			});
		}

		await this.processProjectFile(".gitignore","lines",ignore=>{
			if (!ignore.includes(".target")) ignore.push(".target");
			if (!ignore.includes("node_modules")) ignore.push("node_modules");
		});

		await this.processProjectFile("public/.gitkeep",null,async ()=>{
			return "";
		});

		let programName=path.basename(process.argv[1]);

		if (this.platform && this.platform!="node") {
			let platform=new platformClasses[this.platform]({project: this});
			await platform.init();
			this.log(`Platform ${this.platform} initialized. Start a dev server with:`);
			this.log("");
			this.log(`  ${programName} dev --platform=${this.platform}`);
			this.log("");
			this.log(`Deploy with:`);
			this.log("");
			this.log(`  ${programName} deploy --platform=${this.platform}`);
			this.log("");
		}

		else {
			this.log("Project initialized. Start a dev server with:");
			this.log("");
			this.log(`  ${programName} dev`);
			this.log("");
		}
	}

	async processProjectFile(filename, format, processor) {
		let content=await processProjectFile({
			cwd: this.cwd,
			filename,
			format,
			processor
		});

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