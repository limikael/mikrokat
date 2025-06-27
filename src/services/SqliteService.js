import path from "node:path";
import Database from "better-sqlite3";

export default class SqliteService {
	constructor({cwd, filename, exposeApi}) {
		let filenameAbs=path.resolve(cwd,filename);
		this.db=new Database(filenameAbs);

		if (exposeApi) {
			this.backend=new SqlBackendBetterSqlite3(this.db);
			this.api=createSqlFrontend(exposeApi,this.backend);
		}

		else {
			this.api=this.db;
		}
	}
}