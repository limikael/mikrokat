import MikrokatCli from "../../src/main/MikrokatCli.js";
import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("MikrokatCli",()=>{
	it("can get the version",async ()=>{
		let cli=new MikrokatCli();
		//console.log(await cli.getProgramVersion());
		let ver=await cli.getProgramVersion();
		let verParts=ver.split(".");
		expect(verParts[0]).toEqual("1");
		expect(verParts[1]).toEqual("0");
	});
});