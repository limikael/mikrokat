export default class MikrokatServer {
	constructor({mod, env}) {
		this.mod=mod;
		this.env=env;
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