import { neon } from '@neondatabase/serverless';
import SqlBackendPostgres from "../bridge/SqlBackendPostgres.js";
import {createSqlFrontend} from "../bridge/sql-frontend-factory.js";

export default class NeonService {
	constructor({url, exposeApi}) {
		this.sql=neon(url);

		if (exposeApi) {
			this.backend=new SqlBackendPostgres(this.sql);
			this.api=createSqlFrontend(exposeApi,this.backend);
		}

		else {
			this.api=this.sql;
		}
	}
}