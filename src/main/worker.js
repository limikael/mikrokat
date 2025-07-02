import {mikrokatServe} from "./mikrokat-commands.js";

let server;

export async function serve(params) {
	if (params.platform!="node")
		throw new Error("Can only serve node in a worker.");

	if (params.worker)
		throw new Error("Can't spawn a worker in a worker!!!");

	if (server)
		throw new Error("Already serving...");

	server=await mikrokatServe(params);
}

export async function terminate() {
	if (!server)
		throw new Error("Not running!!!");

	await server.stop();
	server=null;
}