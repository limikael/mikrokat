import MikrokatProject from "./MikrokatProject.js";
import {getEffectiveCwd} from "../utils/node-util.js";

async function initOptions(options) {
	options={...options};

	if ((options.silent || options.quiet) && !options.log)
		options.log=false;

	return options;
}

export async function mikrokatInit(options) {
	options=await initOptions(options);
	let project=new MikrokatProject(options);

	await project.init();
}

export async function mikrokatCreateProvisionEnv(options) {
	options=await initOptions(options);
	let project=new MikrokatProject(options);
	await project.load();

	return await project.createProvisionEnv();
}

export async function mikrokatServe(options) {
	options.cwd=await getEffectiveCwd(options.cwd);
	options=await initOptions(options);
	let project=new MikrokatProject(options);
	await project.load();
	await project.serve();

	async function stop() {
		await project.close();
	}

	return {stop};
}

export async function mikrokatBuild(options) {
	options.cwd=await getEffectiveCwd(options.cwd);
	options=await initOptions(options);
	let project=new MikrokatProject(options);
	await project.load();

	await project.build();
}