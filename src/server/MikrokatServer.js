export default class MikrokatServer {
	constructor({mod, env, services, serviceClasses}) {
		this.mod=mod;
		this.env=env;

		if (!this.env)
			this.env={};

		for (let k in services) {
			let def=services[k];
			let cls=serviceClasses[def.type];
			this.env[k]=new cls(def);
		}
	}

	handleRequest=async ({request, ctx})=>{
		let ev={
			app: this,
			request: request,
			ctx: ctx,
			env: this.env
		};

		return await this.mod.onFetch(ev);
	}
}