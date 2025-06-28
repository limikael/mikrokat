import MiniFs from "../utils/MiniFs.js";

export default class MikrokatServer {
	constructor({modules, env, target, cwd, imports, fileContent, services, serviceClasses, serviceMeta}) {
		this.modules=modules;
		this.env={...env};
		this.cwd=cwd;
		this.target=target;
		this.fs=new MiniFs(fileContent);
		//this.appData={}; // Should this be a thing?
		this.imports=imports;
		this.middlewares=[];

		//this.serviceMetaByService=new Map();
		this.serviceMetaByName={...serviceMeta};

		for (let k in services) {
			let def=services[k];
			let cls=serviceClasses[def.type];
			let service=new cls({cwd, target, ...def});

			service.type=def.type;

			if (service.api)
				this.env[k]=service.api;

			else
				this.env[k]=service;

			//this.serviceMetaByService.set(this.env[k],service);
			this.serviceMetaByName[k]=service;
		}
	}

	getServiceMeta=(service)=>{
		/*if (this.serviceMetaByService.get(service))
			return this.serviceMetaByService.get(service);*/

		if (this.serviceMetaByName[service])
			return this.serviceMetaByName[service];
	}

	createEv() {
		return ({
			app: this,
			env: this.env,
			fs: this.fs,
			imports: this.imports,
			appData: this.appData,
			target: this.target,
			localFetch: this.localFetch,
			getServiceMeta: this.getServiceMeta
		});
	}

	use=async (middleware, options={})=>{
		this.middlewares.push({...options, middleware});
	}

	handleStart=async ()=>{
		let ev={...this.createEv(), use: this.use};

		for (let mod of this.modules)
			if (mod.onStart)
				await mod.onStart(ev);
	}

	async ensureStarted() {
		if (!this.startPromise)
			this.startPromise=this.handleStart();

		await this.startPromise;
	}

	getFetchers() {
		let fetchers=[];

		for (let mod of this.modules)
			if (mod.onFetch)
				fetchers.push(mod.onFetch);

		return fetchers;
	}

	handleRequest=async ({request, ctx})=>{
		if (!request)
			throw new Error("handleRequest was called without a request!");

		await this.ensureStarted();

		let localFetch=async (requestOrUrl, options={})=>{
			if (requestOrUrl instanceof Request)
				return await this.handleRequest({request: requestOrUrl, ctx: ctx});

			//console.log("constructing url from: "+requestOrUrl);
			let requestUrl=new URL(request.url);
			let url=new URL(requestOrUrl,requestUrl.origin);
			//console.log("fetching from: "+url);

			let localRequest=new Request(url, options);
			return await this.handleRequest({request: localRequest, ctx: ctx});
		}

		let ev={
			...this.createEv(),
			request: request,
			localFetch: localFetch,
			ctx: ctx,
		};

		let handlers=[
			...this.middlewares.filter(m=>!m.fallback).map(m=>m.middleware),
			...this.getFetchers(),
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
