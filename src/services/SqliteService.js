import path from "node:path";
import Database from "better-sqlite3";

class Statement {
	constructor(statement) {
		this.statement=statement;
	}

	async run(params=[]) {
		let results=this.statement.run(...params);

		return {
			success: true,
			meta: {
			},
			results: results
		}
	}

	async all(params=[]) {
		let results=this.statement.all(...params);

		return {
			success: true,
			meta: {
			},
			results: results
		}
	}
}

export default class SqliteService {
	constructor({cwd, filename}) {
		let filenameAbs=path.resolve(cwd,filename);
		this.db=new Database(filenameAbs);
	}

	async prepare(query) {
		return new Statement(this.db.prepare(query));
	}
}