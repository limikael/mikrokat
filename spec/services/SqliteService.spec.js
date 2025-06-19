import SqliteService from "../../src/services/SqliteService.js";
import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";
import {testDatabaseService} from "./test-database-service.js";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("SqliteService",()=>{
	it("can service sqlite",async ()=>{
		let tmpDir=path.join(__dirname,"../tmp");

		await fsp.rm(tmpDir,{force:true, recursive: true});
		await fsp.mkdir(tmpDir,{recursive: true});

		let sqliteService=new SqliteService({
			filename: path.join(tmpDir,"test.sqlite")
		});

		await testDatabaseService(sqliteService);
	});
})