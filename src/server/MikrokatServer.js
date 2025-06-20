import MiniFs from "../utils/MiniFs.js";

export default class MikrokatServer {
	constructor({mod, env, target, cwd, services, serviceClasses, fileContent}) {
		this.mod=mod;
		this.env={...env};
		this.cwd=cwd;
		this.target=target;
		this.fs=new MiniFs(fileContent);
		this.appData={};
		this.middlewares=[];

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

	use=async (middleware, options={})=>{
		this.middlewares.push({...options, middleware});
	}

	handleStart=async ()=>{
		if (this.mod.onStart)
			await this.mod.onStart({
				...this.createEv(),
				use: this.use
			});
	}

	handleRequest=async ({request, ctx})=>{
		if (!request)
			throw new Error("handleRequest was called without a request!");

		if (!this.startPromise)
			this.startPromise=this.handleStart();

		await this.startPromise;

		let ev={
			...this.createEv(),
			request: request,
			ctx: ctx,
		};

		let handlers=[
			...this.middlewares.filter(m=>!m.fallback).map(m=>m.middleware),
			...this.mod.onFetch?[this.mod.onFetch]:[],
			...this.middlewares.filter(m=>m.fallback).map(m=>m.middleware)
		];

		try {
			for (let handler of handlers) {
				let response=await handler(ev);
				if (response)
					return response;
			}
		}

		catch (e) {
			return new Response(e.message,{status: 500, headers: {"content-type": "text/html"}});
		}
	}
}
