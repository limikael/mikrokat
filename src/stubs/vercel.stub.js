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