import MikrokatProject from "./MikrokatProject.js";
import {getEffectiveCwd} from "../utils/node-util.js";

async function initOptions(options, {allowUninitialized}={}) {
	options={...options};

	options.cwd=await getEffectiveCwd(options.cwd,{allowUninitialized});

	if ((options.silent || options.quiet) && !options.log)
		options.log=false;

	return options;
}

export async function mikrokatInit(options) {
	options=await initOptions(options,{allowUninitialized: true});
	let project=new MikrokatProject(options);

	await project.init();
}

export async function mikrokatServe(options) {
	options=await initOptions(options,{allowUninitialized: true});
	let project=new MikrokatProject(options);
	await project.load();
	await project.serve();

	async function stop() {
		await project.close();
	}

	return {stop};
}

export async function mikrokatBuild(options) {
	options=await initOptions(options,{allowUninitialized: true});
	let project=new MikrokatProject(options);
	await project.load();

	await project.build();
}