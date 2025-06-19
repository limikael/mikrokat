import { neon } from '@neondatabase/serverless';

class Statement {
	constructor({neon, query}) {
		this.neon=neon;
		this.query=query;
	}

	async all(params=[]) {
		let results=await this.neon.query(this.query);

		return {
			success: true,
			meta: {
			},
			results: results
		}
	}
}

export default class NeonService {
	constructor({url}) {
		this.sql=neon(url);
	}

	async prepare(query) {
		return new Statement({neon: this.sql, query: query});
	}
}