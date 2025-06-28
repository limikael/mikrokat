import BetterSqlite3Service from "../../src/services/BetterSqlite3Service.js";
import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("BetterSqlite3Service",()=>{
	it("can service sqlite",async ()=>{
		let tmpDir=path.join(__dirname,"../tmp");

		await fsp.rm(tmpDir,{force:true, recursive: true});
		await fsp.mkdir(tmpDir,{recursive: true});

		let sqliteService=new BetterSqlite3Service({
			filename: path.join(tmpDir,"test.sqlite")
		});

		//console.log(sqliteService.api);
		sqliteService.api.prepare("create table test (val integer)").run();
		sqliteService.api.prepare("insert into test (val) values (?)").run(1);
		let res=sqliteService.api.prepare("select * from test").all();
		expect(res).toEqual([ { val: 1 } ]);
		//console.log(res);
	});
});
