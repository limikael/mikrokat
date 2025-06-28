import path from "node:path";
import Database from "better-sqlite3";

export default class SqliteService {
	constructor({cwd, filename}) {
		throw new Error("not impl...");

		let filenameAbs=path.resolve(cwd,filename);
		this.api=this.db;
	}
}