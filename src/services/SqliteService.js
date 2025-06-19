import path from "node:path";
import Database from "better-sqlite3";

class Statement {
	constructor(statement, ...params) {
		this.statement=statement;
		this.params=params.flat();
	}

	bind(...params) {
		return new Statement(this.statement,...params);
	}

	async run(params=[]) {
		let runResult=this.statement.run(...[...this.params,...params].flat());

		return {
			success: true,
			meta: {
				changes: runResult.changes,
				last_row_id: runResult.lastInsertRowid
			},
			results: null
		}
	}

	async all(...params) {
		if (!this.statement.reader)
			return await this.run(...params)

		this.statement.raw(false);
		let results=this.statement.all(...[...this.params,...params].flat());

		return {
			success: true,
			meta: {
			},
			results: results
		}
	}

	async raw(...params) {
		this.statement.raw(true);
		return this.statement.all(...[...this.params,...params].flat());
	}

	async first(...params) {
		this.statement.raw(false);
		return this.statement.get(...[...this.params,...params].flat());
	}
}

export default class SqliteService {
	constructor({cwd, filename}) {
		let filenameAbs=path.resolve(cwd,filename);
		this.db=new Database(filenameAbs);
	}

	prepare(query) {
		return new Statement(this.db.prepare(query));
	}

	async batch(statement) {
		let res=[];

		for (let s of statement)
			res.push(await s.all());

		return res;
	}

	async exec(queries) {
		this.db.exec(queries);
	}

	/*async query(query, ...params) {
		return await (await this.prepare(query)).all(...params);
	}*/
}