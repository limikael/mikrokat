#!/usr/bin/env node

import MikrokatServer from "../server/MikrokatServer.js";
import {createNodeRequestListener} from "serve-fetch";
import {program, Option} from "commander";
import path from "node:path";
import http from "http";
import fs from "fs";
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

program.name("mikrokat")
	.description("Multi provider edge mikro framework.");

program.command("serve")
	.description("Serve from this machine.")
	.argument("<entrypoint>","Server entrypoint.")
	.option("--port <port>","Listening port.",3000)
	.action(async (entrypoint, options)=>{
		let mod=await import(path.resolve(entrypoint));
		let server=new MikrokatServer({mod});
		let listener=createNodeRequestListener(request=>server.handleRequest({request}));
		let httpServer=http.createServer(listener);
		httpServer.listen(options.port,err=>{
			console.log("Listening to port: "+options.port);
		});
	});

program.command("build")
	.description("Build entrypoint stub for provider.")
	.argument("<entrypoint>","Server entrypoint.")
	.option("--port <port>","Listening port.",3000)
	.option("--outfile <outfile>","Where to write artifact.")
	.addOption(new Option("--target <provider>","Provider to build for.").choices(["cloudflare","fastly","vercel"]))
	.action(async (entrypoint, options)=>{
		let entrypointAbs=path.resolve(entrypoint);
		let base=entrypointAbs.substr(0,entrypointAbs.lastIndexOf("."));
		let ext=entrypointAbs.substr(entrypointAbs.lastIndexOf("."));
		let outfileAbs=base+"."+options.target+ext;
		if (options.outfile)
			outfileAbs=path.resolve(options.outfile)

		let stub=fs.readFileSync(path.join(__dirname,"/../stubs/",options.target+".stub.js"),"utf8");

		stub=stub.replaceAll("$ENTRYPOINT","./"+path.relative(path.dirname(outfileAbs),entrypointAbs));
		fs.writeFileSync(outfileAbs,stub);

		console.log("Wrote: "+outfileAbs)
	});

program.parse();
