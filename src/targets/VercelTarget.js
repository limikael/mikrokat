import BaseTarget from "./BaseTarget.js";

let VERCEL_STUB=`
import * as mod from "$ENTRYPOINT";
import {MikrokatServer} from "mikrokat";

export const config = {
	runtime: 'edge',
};

let server=new MikrokatServer({mod: mod});

export default async function handler(req) {
	return await server.handleRequest({
		request: req
	});
}
`;

export default class CloudflareTarget extends BaseTarget {
	constructor(arg) {
		super(arg);
	}

	async build() {
		await this.cli.initFile("public/.keep","");
		await this.cli.writeStub("api/entrypoint.vercel.js",VERCEL_STUB);
	}

	async init() {
		await this.cli.updateJsonConfig("vercel.json",async vercel=>{
			if (!vercel) vercel={};
			vercel.buildCommand="TARGET=vercel npx mikrokat build";

			if (!vercel.routes) {
				vercel.routes=[
					{
						"src": "/.*",
						"dest": "api/entrypoint.vercel.js"
					}
				];
			}

			return vercel;
		});

		await this.cli.writeStub("api/entrypoint.vercel.js",VERCEL_STUB);

		await this.cli.updateLineArrayConfig(".gitignore",async lines=>{
			if (!lines.includes(".vercel")) lines.push(".vercel");
			if (!lines.includes("api")) lines.push("api");
			return lines;
		});

		console.log("Vercel initialized. Start a dev server with:");
		console.log();
		console.log("  vercel dev");
		console.log();
	}
}