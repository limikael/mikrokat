import path from "node:path";
import Database from "better-sqlite3";

export default class BetterSqlite3Service {
	constructor({cwd, filename}) {
		//console.log("better cwd: "+cwd);
		//console.log("better filename: "+filename);

		let filenameAbs=path.resolve(cwd,filename);
		this.db=new Database(filenameAbs);
		this.api=this.db;
	}
}