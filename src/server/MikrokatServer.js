//export default class MikrokatServer {}

export default class MikrokatServer {
	constructor({mod, env, target, cwd, services, serviceClasses}) {
		this.mod=mod;
		this.env=env;
		this.cwd=cwd;
		this.target=target;

		if (!this.env)
			this.env={};

		for (let k in services) {
			let def=services[k];
			let cls=serviceClasses[def.type];
			this.env[k]=new cls({cwd, target, ...def});
		}
	}

	handleRequest=async ({request, ctx})=>{
		console.log("handling request...");

		let ev={
			app: this,
			request: request,
			ctx: ctx,
			env: this.env
		};

		return await this.mod.onFetch(ev);
	}
}
