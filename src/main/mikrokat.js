#!/usr/bin/env node

import {program, Option} from "commander";
import path from "node:path";
import http from "http";
import fs from "fs";
import {fileURLToPath} from 'node:url';
import platformClasses from "../platforms/platform-classes.js";
import {getPackageVersion} from "../utils/node-util.js";
import {mikrokatInit, mikrokatBuild, mikrokatServe, mikrokatDeploy, mikrokatClean} from "./mikrokat-commands.js";
import {withProgramOptions} from "../utils/commander-util.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url));

program.name("mikrokat")
	.description("Multi provider edge mikro framework.")
	.passThroughOptions()
	.allowExcessArguments()
	.option("--cwd <cwd>","Run as if started from this dir.",process.cwd())
	.option("--silent","Suppress output.")
	.option("--version","Print version.")
	.action(async options=>{
		if (program.args.length)
			console.log("Unknown command: "+program.args[0]);

		else if (options.version)
			console.log(await getPackageVersion(__dirname));

		else
			program.outputHelp();
	});

program.command("serve")
	.alias("dev")
	.description("Serve from this machine.")
	.option("--main <entrypoint>","Server entrypoint, will override config.")
	.option("--no-dependency-check","Don't check if dependencies are up-to-date.")
	.option("--worker","Spawn server in a separate worker thread (only for node).")
	.addOption(new Option("--port <port>","Listening port.").default(3000).env("PORT"))
	.addOption(new Option("--platform <provider>","Provider to start a dev server for.").choices(Object.keys(platformClasses)).env("PLATFORM"))
	.action(withProgramOptions(program,mikrokatServe));

program.command("build")
	.description("Build entrypoint stub for provider.")
	.option("--main <entrypoint>","Server entrypoint.")
	.option("--no-dependency-check","Don't check if dependencies are up-to-date.")
	.addOption(new Option("--platform <provider>","Provider to build for.").choices(Object.keys(platformClasses)).env("PLATFORM"))
	.action(withProgramOptions(program,mikrokatBuild));

program.command("deploy")
	.description("Deploy to platform provider.")
	.option("--main <entrypoint>","Server entrypoint.")
	.option("--no-dependency-check","Don't check if dependencies are up-to-date.")
	.addOption(new Option("--platform <provider>","Provider to deploy to.").choices(Object.keys(platformClasses)).env("PLATFORM"))
	.action(withProgramOptions(program,mikrokatDeploy));

program.command("init")
	.description("Initialize project and/or platform.")
	.option("--no-init-project","Don't create package.json and mikrokat.json.")
	.addOption(new Option("--platform <provider>","Provider to initialize.").choices(Object.keys(platformClasses))/*.env("PLATFORM")*/)
	.action(withProgramOptions(program,mikrokatInit));

program.command("clean")
	.description("Remove build artifacts and/or platform config.")
	.option("--purge","Remove all files related to the platform.")
	.addOption(new Option("--platform <provider>","Clean up files for this platform.").choices(Object.keys(platformClasses))/*.env("PLATFORM")*/)
	.action(withProgramOptions(program,mikrokatClean));

try {
	await program.parseAsync();
}

catch (e) {
	if (!e.declared)
		throw e;

	console.log("Error: "+e.message);
}
