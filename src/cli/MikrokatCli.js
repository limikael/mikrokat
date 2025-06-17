import MikrokatServer from "../server/MikrokatServer.js";
import {createNodeRequestListener} from "serve-fetch";
import {readPackageUp} from 'read-package-up';
import {safeResolveExports} from "../utils/node-util.js";
import {DeclaredError} from "../utils/js-util.js";
import path from "node:path";
import http from "node:http";
import targetClasses from "../targets/target-classes.js";

export default class MikrokatCli {
	constructor({program, options}) {
		this.options={...program.opts(), ...options};
	}

	async getAbsoluteEntrypoint() {
		if (this.options.entrypoint)
			return path.resolve(this.options.cwd,this.options.entrypoint);

		let pkgInfo=await readPackageUp({cwd: this.options.cwd});
		let res=safeResolveExports(pkgInfo.packageJson,"./entrypoint",{silent: true});
		if (!res || !res.length)
			throw new DeclaredError("No entrypoint");

		return path.resolve(path.dirname(pkgInfo.path),res[0]);
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
}