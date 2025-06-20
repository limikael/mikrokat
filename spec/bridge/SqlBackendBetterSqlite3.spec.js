import SqlBackendBetterSqlite3 from "../../src/bridge/SqlBackendBetterSqlite3.js";
import path from "node:path";
import Database from "better-sqlite3";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("SqlBackendBetterSqlite3",()=>{
	it("can handle a request",async ()=>{
		let tmpDir=path.join(__dirname,"../tmp");

		await fsp.rm(tmpDir,{force:true, recursive: true});
		await fsp.mkdir(tmpDir,{recursive: true});

		let filenameAbs=path.join(tmpDir,"test.sqlite");
		let db=new Database(filenameAbs);

		let sqlBackend=new SqlBackendBetterSqlite3(db);

		await sqlBackend.query("create table hello (id integer not null primary key, val integer)",[]);
		let insertRes=await sqlBackend.query("insert into hello (val) values (1),(2),(3)");
		expect(insertRes).toEqual({ results: [], changes: 3, last_insert_id: 3 });
		//console.log(insertRes);

		let selectRes=await sqlBackend.query("select * from hello");
		//console.log(selectRes);
		expect(selectRes).toEqual({
			results: [ { id: 1, val: 1 }, { id: 2, val: 2 }, { id: 3, val: 3 } ],
			changes: 0,
			last_insert_id: null
		});
	});
})