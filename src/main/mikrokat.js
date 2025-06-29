#!/usr/bin/env node

import {program, Option} from "commander";
import path from "node:path";
import http from "http";
import fs from "fs";
import {fileURLToPath} from 'node:url';
import platformClasses from "../platforms/platform-classes.js";
import {getPackageVersion} from "../utils/node-util.js";
import {mikrokatInit, mikrokatBuild, mikrokatServe} from "./mikrokat-commands.js";
import {withProgramOptions} from "../utils/commander-util.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url));

program.name("mikrokat")
	.description("Multi provider edge mikro framework.")
	.passThroughOptions()
	.option("--cwd <cwd>","Run as if started from this dir.",process.cwd())
	.option("--silent","Suppress output.")
	.option("--version","Print version.")
	.action(async options=>{
		if (options.version)
			console.log(await getPackageVersion(__dirname));

		else
			program.outputHelp();
	});

program.command("serve")
	.alias("dev")
	.description("Serve from this machine.")
	.option("--main <entrypoint>","Server entrypoint.")
	.addOption(new Option("--port <port>","Listening port.").default(3000).env("PORT"))
	.addOption(new Option("--platform <provider>","Provider to start a dev server for.").choices(Object.keys(platformClasses)).env("PLATFORM"))
	.action(withProgramOptions(program,mikrokatServe));

program.command("build")
	.description("Build entrypoint stub for provider.")
	.option("--main <entrypoint>","Server entrypoint.")
	.addOption(new Option("--platform <provider>","Provider to build for.").choices(Object.keys(platformClasses)).env("PLATFORM"))
	.action(withProgramOptions(program,mikrokatBuild));

program.command("init")
	.description("Initialize project and/or platform.")
	.option("--no-init-project","Don't create package.json and mikrokat.json.")
	.addOption(new Option("--platform <provider>","Provider to initialize.").choices(Object.keys(platformClasses))/*.env("PLATFORM")*/)
	.action(withProgramOptions(program,mikrokatInit));

try {
	await program.parseAsync();
}

catch (e) {
	if (!e.declared)
		throw e;

	console.log("Error: "+e.message);
}