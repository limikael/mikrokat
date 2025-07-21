import LibSqlService from "../../src/services/LibSqlService.js";
import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("LibSqlService",()=>{
	it("can service libsql",async ()=>{
		let tmpDir=path.join(__dirname,"../tmp");

		await fsp.rm(tmpDir,{force:true, recursive: true});
		await fsp.mkdir(tmpDir,{recursive: true});

		let libsqlService=new LibSqlService({
			filename: path.join(tmpDir,"test.sqlite")
		});

		console.log(libsqlService.api);
		await libsqlService.api.execute("create table test (val integer)");
		await libsqlService.api.execute("insert into test (val) values (?)",[1]);
		let res=await libsqlService.api.execute("select * from test");
		expect(res.rows).toEqual([ { val: 1 } ]);
		//console.log(res);
	});
});
