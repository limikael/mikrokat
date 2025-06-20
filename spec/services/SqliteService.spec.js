import SqliteService from "../../src/services/SqliteService.js";
import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("SqliteService",()=>{
	it("can service sqlite",async ()=>{
		let tmpDir=path.join(__dirname,"../tmp");

		await fsp.rm(tmpDir,{force:true, recursive: true});
		await fsp.mkdir(tmpDir,{recursive: true});

		let sqliteService=new SqliteService({
			filename: path.join(tmpDir,"test.sqlite")
		});

		//console.log(sqliteService.api);
		sqliteService.api.prepare("create table test (val integer)").run();
		sqliteService.api.prepare("insert into test (val) values (?)").run(1);
		let res=sqliteService.api.prepare("select * from test").all();
		expect(res).toEqual([ { val: 1 } ]);
		//console.log(res);

		let sqliteService2=new SqliteService({
			filename: path.join(tmpDir,"test.sqlite"),
			exposeApi: "d1"
		});

		let res2=await sqliteService2.api.prepare("select * from test").all();
		//console.log(res2);
		expect(res2).toEqual({
			success: true,
			results: [ { val: 1 } ],
			changes: 0,
			last_insert_id: null
		});
	});
})