import MiniFs from "../utils/MiniFs.js";

export default class MikrokatServer {
	constructor({mod, env, target, cwd, services, serviceClasses, fileContent}) {
		this.mod=mod;
		this.env=env;
		this.cwd=cwd;
		this.target=target;
		this.fs=new MiniFs(fileContent);

		if (!this.env)
			this.env={};

		for (let k in services) {
			let def=services[k];
			let cls=serviceClasses[def.type];
			let service=new cls({cwd, target, ...def});

			if (service.api)
				this.env[k]=service.api;

			else
				this.env[k]=service;
		}
	}

	handleRequest=async ({request, ctx})=>{
		let ev={
			app: this,
			request: request,
			ctx: ctx,
			env: this.env,
			fs: this.fs
		};

		return await this.mod.onFetch(ev);
	}
}
