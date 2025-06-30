import MikrokatProject from "./MikrokatProject.js";
import {getEffectiveCwd} from "../utils/node-util.js";
import platformClasses from "../platforms/platform-classes.js";

async function initOptions(options) {
	options={...options};

	if (!options.port)
		options.port=3000;

	if ((options.silent || options.quiet) && !options.log)
		options.log=false;

	return options;
}

export async function mikrokatInit(options) {
	options=await initOptions(options);
	let project=new MikrokatProject(options);

	await project.init();
}

export function mikrokatGetPlatforms() {
	return Object.keys(platformClasses)
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
	return await project.serve();
}

export async function mikrokatBuild(options) {
	options.cwd=await getEffectiveCwd(options.cwd);
	options=await initOptions(options);
	let project=new MikrokatProject(options);

	await project.load();
	await project.build();
}

export async function mikrokatDeploy(options) {
	options.cwd=await getEffectiveCwd(options.cwd);
	options=await initOptions(options);
	let project=new MikrokatProject(options);

	await project.load();
	await project.deploy();
}

export async function mikrokatClean(options) {
	options.cwd=await getEffectiveCwd(options.cwd);
	options=await initOptions(options);
	let project=new MikrokatProject(options);

	await project.clean();
}