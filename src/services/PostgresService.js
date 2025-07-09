import pg from 'pg';

export default class PostgresService {
	constructor({url}) {
		this.pool=new pg.Pool({connectionString: url});
		this.api=this.pool;
	}
}