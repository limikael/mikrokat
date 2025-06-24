import MikrokatServer from "./MikrokatServer.js";
import {createNodeRequestListener} from "serve-fetch";
import {readPackageUp} from 'read-package-up';
import {safeResolveExports, pkgSetExport} from "../utils/npm-util.js";
import {DeclaredError, arrayify} from "../utils/js-util.js";
import path from "node:path";
import http from "node:http";
import targetClasses from "../targets/target-classes.js";
import fs, {promises as fsp} from "fs";
import {fileURLToPath} from 'url';
import * as TOML from '@ltd/j-toml';
import JSON5 from "json5";
import MikrokatProject from "./MikrokatProject.js";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

export default class MikrokatCli {
	constructor({program, options}={}) {
		this.options={};
		if (program)
			this.options={...this.options,...program.opts()};

		this.options={...this.options,...options};

		if (!this.options.target)
			this.options.target="node";
	}

	log=(...args)=>{
		if (this.options.quiet)
			return;

		console.log(...args);
	}

	async getProgramVersion() {
		let pkg=JSON.parse(await fsp.readFile(path.join(__dirname,"../../package.json")));
		return pkg.version;
	}

	async getPackageInfo() {
		return await readPackageUp({cwd: this.options.cwd});
	}

	async getEffectiveCwd({silent}={}) {
		let packageInfo=await this.getPackageInfo();
		if (!packageInfo) {
			if (silent)
				return;

			throw new DeclaredError("No package.json found.")
		}

		return path.dirname(packageInfo.path);
	}

	async createProject() {
		let project=new MikrokatProject({
			cwd: await this.getEffectiveCwd(),
			target: this.options.target,
			main: this.options.main,
			port: this.options.port,
			logger: this.log,
			dependencies: {
				mikrokat: "^"+await this.getProgramVersion()
			}
		});

		return project;
	}

	async build() {
		let project=await this.createProject();

		await project.load();
		await project.build();
	}

	async init() {
		if (!await this.getEffectiveCwd({silent: true})) {
			this.log("Initializing new project...");
			await fsp.writeFile(path.join(this.options.cwd,"package.json"),"{}");
		}

		let project=await this.createProject();
		await project.init();
	}
}