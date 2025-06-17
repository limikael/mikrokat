import MikrokatServer from "../server/MikrokatServer.js";
import {createNodeRequestListener} from "serve-fetch";
import {readPackageUp} from 'read-package-up';
import {safeResolveExports, pkgSetExport} from "../utils/npm-util.js";
import {DeclaredError} from "../utils/js-util.js";
import path from "node:path";
import http from "node:http";
import targetClasses from "../targets/target-classes.js";
import fs, {promises as fsp} from "fs";

let ENTRYPOINT_STUB=
`export async function onFetch({request}) {
    return new Response("The project starts here");
}
`;

export default class MikrokatCli {
	constructor({program, options}) {
		this.options={...program.opts(), ...options};
	}

	async getPackageInfo() {
		return await readPackageUp({cwd: this.options.cwd});
	}

	async getEffectiveCwd() {
		let packageInfo=await this.getPackageInfo();
		if (!packageInfo)
			throw new DeclaredError("No package.json found.")

		return path.dirname(packageInfo.path);
	}

	async getAbsoluteEntrypoint() {
		if (this.options.entrypoint)
			return path.resolve(this.options.cwd,this.options.entrypoint);

		let pkgInfo=await this.getPackageInfo();
		let res=safeResolveExports(pkgInfo.packageJson,"./entrypoint");
		if (!res || !res.length)
			throw new DeclaredError("No entrypoint.");

		return path.resolve(path.dirname(pkgInfo.path),res[0]);
	}

	async writeStub(outfile, content) {
		let cwd=await this.getEffectiveCwd();
		let entrypointAbs=await this.getAbsoluteEntrypoint();
		let outfileAbs=path.resolve(cwd,outfile);
		await fsp.mkdir(path.dirname(outfileAbs),{recursive: true});

		content=content.replaceAll("$ENTRYPOINT",path.relative(path.dirname(outfileAbs),entrypointAbs));

		await fsp.writeFile(outfileAbs,content);
	}

	async serve() {
		let mod=await import(await this.getAbsoluteEntrypoint());
		let server=new MikrokatServer({mod});
		let listener=createNodeRequestListener(request=>server.handleRequest({request}));
		let httpServer=http.createServer(listener);
		httpServer.listen(this.options.port,err=>{
			console.log("Listening to port: "+this.options.port);
		});
	}

	async build() {
		let target=new targetClasses[this.options.target]({cli: this});

		await target.build();
	}

	async init() {
		await this.updateJsonConfig("package.json",pkg=>{
			if (!pkg.scripts) pkg.scripts={};

			if (!pkg.scripts.start)
				pkg.scripts.start="npx mikrokat serve";

			pkg.type="module";

			if (!safeResolveExports(pkg,"./entrypoint")) {
				pkgSetExport(pkg,{
					importPath: "./entrypoint",
					target: "./src/main/server.js"
				});
			}

			return pkg;
		});

		await this.initFile(await this.getAbsoluteEntrypoint(),ENTRYPOINT_STUB);

		if (this.options.target) {
			let target=new targetClasses[this.options.target]({cli: this});
			await target.init();
		}
	}

	async initFile(filename, stubContent) {
		let filenameAbs=path.resolve(await this.getEffectiveCwd(),filename);

		if (!fs.existsSync(filenameAbs)) {
			let ep=await this.getAbsoluteEntrypoint();
			await fsp.mkdir(path.dirname(filenameAbs),{recursive: true});
			await fsp.writeFile(filenameAbs,stubContent);
		}
	}

	async updateJsonConfig(filename, fn) {
		let filenameAbs=path.resolve(await this.getEffectiveCwd(),filename);

		let content;
		if (fs.existsSync(filenameAbs))
			content=JSON.parse(await fsp.readFile(filenameAbs,"utf8"));

		content=await fn(content);
		await fsp.writeFile(filenameAbs,JSON.stringify(content,null,2));
	}

	async updateLineArrayConfig(filename, fn) {
		let filenameAbs=path.resolve(await this.getEffectiveCwd(),filename);

		let content=[];
		if (fs.existsSync(filenameAbs))
			content=(await fsp.readFile(filenameAbs,"utf8")).split("\n").filter(l=>!!l);

		content=await fn(content);
		await fsp.writeFile(filenameAbs,content.join("\n")+"\n");
	}
}