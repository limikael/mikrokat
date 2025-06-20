import MiniFs from "../utils/MiniFs.js";

export default class MikrokatServer {
	constructor({mod, env, target, cwd, services, serviceClasses, fileContent}) {
		this.mod=mod;
		this.env={...env};
		this.cwd=cwd;
		this.target=target;
		this.fs=new MiniFs(fileContent);
		this.appData={};

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

	createEv() {
		return ({
			app: this,
			env: this.env,
			fs: this.fs,
			appData: this.appData
		});
	}

	handleStart=async ()=>{
		if (this.mod.onStart)
			await this.mod.onStart(this.createEv());
	}

	handleRequest=async ({request, ctx})=>{
		if (!this.startPromise)
			this.startPromise=this.handleStart();

		await this.startPromise;

		let ev={
			...this.createEv(),
			request: request,
			ctx: ctx,
		};

		return await this.mod.onFetch(ev);
	}
}
