import { neon } from '@neondatabase/serverless';

export default class NeonService {
	constructor({url}) {
		this.sql=neon(url);
		this.api=this.sql;
	}
}