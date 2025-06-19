import BaseTarget from "./BaseTarget.js";
import packageVersions from "../cli/package-versions.js";

let VERCEL_STUB=`
import * as mod from "$ENTRYPOINT";
import {MikrokatServer} from "mikrokat";

$SERVICEIMPORTS
let serviceClasses=$SERVICECLASSES;
let services=$SERVICES;

let server=new MikrokatServer({
	target: "vercel",
	mod, 
	serviceClasses,
	services
});

export default async function handler(request) {
	return await server.handleRequest({
		request: request
	});
}

export const config = {
	runtime: 'edge',
};
`;

export default class VercelTarget extends BaseTarget {
	constructor(arg) {
		super(arg);
	}

	async build() {
		await this.cli.writeStub("api/entrypoint.vercel.js",VERCEL_STUB);
	}

	async init() {
		await this.cli.processProjectFile("package.json","json",async pkg=>{
			if (!pkg.scripts) pkg.scripts={};
			if (!pkg.scripts["dev:vercel"])
				pkg.scripts["dev:vercel"]="TARGET=vercel npm run build && vercel dev";

			if (!pkg.scripts["deploy:vercel"])
				pkg.scripts["deploy:vercel"]="TARGET=vercel npm run build && vercel deploy";

			if (!pkg.dependencies) pkg.dependencies={};
			pkg.dependencies["vercel"]="^"+packageVersions["vercel"];
		});

		await this.cli.processProjectFile("vercel.json","json",async vercel=>{
			if (!vercel) vercel={};

			//vercel.buildCommand="TARGET=vercel mikrokat build";
			vercel.buildCommand="";

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

		await this.cli.processProjectFile(".gitignore","lines",async ignore=>{
			if (!ignore.includes(".vercel")) ignore.push(".vercel");
			if (!ignore.includes("api")) ignore.push("api");
		});

		this.cli.log("Vercel initialized. Start a dev server with:");
		this.cli.log();
		this.cli.log("  npm run dev:vercel");
		this.cli.log();
		this.cli.log("Deploy with:");
		this.cli.log();
		this.cli.log("  npm run deploy:vercel");
		this.cli.log();
	}
}