import MikrokatServer from "./MikrokatServer.js";
import {createNodeRequestListener} from "serve-fetch";
import {readPackageUp} from 'read-package-up';
import {safeResolveExports, pkgSetExport} from "../utils/npm-util.js";
import {DeclaredError, arrayify} from "../utils/js-util.js";
import path from "node:path";
import http from "node:http";
import targetClasses from "../targets/target-classes.js";
import fs, {promises as fsp} from "fs";
import {fileURLToPath} from 'url';
import * as TOML from '@ltd/j-toml';
import JSON5 from "json5";
import ConditionalImports from "../utils/ConditionalImports.js";
import {serverListenPromise, serverClosePromise, createStreamBody} from "../utils/node-util.js";
import mime from 'mime/lite';

const __dirname=path.dirname(fileURLToPath(import.meta.url));

let ENTRYPOINT_STUB=
`export async function onFetch({request}) {
    return new Response("The project starts here");
}
`;

export default class MikrokatCli {
	constructor({program, options}={}) {
		this.options={};
		if (program)
			this.options={...this.options,...program.opts()};

		this.options={...this.options,...options};

		if (!this.options.target)
			this.options.target="node";
	}

	log(...args) {
		if (this.options.quiet)
			return;

		console.log(...args);
	}

	async getProgramVersion() {
		let pkg=JSON.parse(await fsp.readFile(path.join(__dirname,"../../package.json")));
		return pkg.version;
	}

	async getPackageInfo() {
		return await readPackageUp({cwd: this.options.cwd});
	}

	async getEffectiveCwd({silent}={}) {
		let packageInfo=await this.getPackageInfo();
		if (!packageInfo) {
			if (silent)
				return;

			throw new DeclaredError("No package.json found.")
		}

		return path.dirname(packageInfo.path);
	}

	async getConfig() {
		let cwd=await this.getEffectiveCwd();
		let config={};

		if (fs.existsSync(path.join(cwd,"mikrokat.json")))
			config={...config,...JSON5.parse(await fsp.readFile(path.join(cwd,"mikrokat.json")))}

		return config;
	}

	async getAbsoluteEntrypoint() {
		if (this.options.main)
			return path.resolve(this.options.cwd,this.options.main);

		let config=await this.getConfig();
		if (!config.main)
			throw new DeclaredError("No entrypoint. Pass it on the command line using --main, or put it in mikrokat.json");

		let pkgInfo=await this.getPackageInfo();

		return path.resolve(path.dirname(pkgInfo.path),config.main);
	}

	async writeStub(outfile, content) {
		let config=await this.getConfig();
		let cwd=await this.getEffectiveCwd();
		let entrypointAbs=await this.getAbsoluteEntrypoint();
		let outfileAbs=path.resolve(cwd,outfile);
		await fsp.mkdir(path.dirname(outfileAbs),{recursive: true});

		let conditionalImports=await this.getConditionalImports();

		content=content.replaceAll("$FILECONTENT",JSON.stringify(await this.getFileContent(),null,2));
		content=content.replaceAll("$IMPORTS",conditionalImports.getImportStub());
		content=content.replaceAll("$ENTRYPOINT",JSON.stringify(path.relative(path.dirname(outfileAbs),entrypointAbs)));

		await fsp.writeFile(outfileAbs,content);
	}

	async getConditionalImports() {
		let config=await this.getConfig();
		return new ConditionalImports({
			cwd: await this.getEffectiveCwd(),
			truth: {target: this.options.target},
			imports: config.imports
		});
	}

	async serve() {
		let config=await this.getConfig();
		let conditionalImports=await this.getConditionalImports();
		let mod=await import(await this.getAbsoluteEntrypoint());
		let server=new MikrokatServer({
			target: "node",
			cwd: await this.getEffectiveCwd(),
			mod: mod,
			imports: await conditionalImports.loadImports(),
			fileContent: await this.getFileContent()
		});

		let cwd=await this.getEffectiveCwd();
		let listener=createNodeRequestListener(async request=>{
			let url=new URL(request.url);
			let assetAbs=path.join(cwd,"public",url.pathname);
			if (fs.existsSync(assetAbs) &&
					fs.statSync(assetAbs).isFile()) {

	    	    let stat=fs.statSync(assetAbs);        

				let headers=new Headers();
	    	    headers.set("content-type",mime.getType(assetAbs.slice(assetAbs.lastIndexOf(".")+1)));
		        headers.set("content-length",stat.size);

				let body=createStreamBody(fs.createReadStream(assetAbs));

				return new Response(body,{headers});
			}

			return await server.handleRequest({request});
		});
		this.httpServer=http.createServer(listener);

		await serverListenPromise(this.httpServer,this.options.port);

		this.log("Listening to port: "+this.options.port);
	}

	async close() {
		if (!this.httpServer)
			throw new Error("Not running");

		await serverClosePromise(this.httpServer);
		this.httpServer=null;
	}

	async build() {
		if (this.options.target=="node") {
			this.log("Nothing to build for node.");
			return;
		}

		let target=new targetClasses[this.options.target]({cli: this});

		await target.build();
	}

	async init() {
		if (!await this.getEffectiveCwd({silent: true})) {
			this.log("Initializing new project...");
			await fsp.writeFile(path.join(this.options.cwd,"package.json"),"{}");
		}

		await this.processProjectFile("package.json","json",async pkg=>{
			if (!pkg.name)
				pkg.name=path.basename(await this.getEffectiveCwd());

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
				pkg.dependencies.mikrokat="^"+await this.getProgramVersion();

			return pkg;
		});

		await this.processProjectFile("mikrokat.json","json",async mikrokat=>{
			if (!mikrokat)
				mikrokat={};

			if (!mikrokat.main)
				mikrokat.main="src/main/server.js";

			return mikrokat;
		});

		await this.processProjectFile(await this.getAbsoluteEntrypoint(),null,content=>{
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

		if (this.options.target && this.options.target!="node") {
			let target=new targetClasses[this.options.target]({cli: this});
			await target.init();
		}
	}

	async processProjectFile(filename, format, processor) {
		let filenameAbs=path.resolve(await this.getEffectiveCwd(),filename);

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

		return content;
	}

	async getFileContent() {
		let config=await this.getConfig();
		let cwd=await this.getEffectiveCwd();

		let contentFiles={};
		for (let file of arrayify(config.files))
			contentFiles[file]=await fsp.readFile(path.join(cwd,file),"utf8");

		return contentFiles;
	}
}