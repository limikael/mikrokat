import {createClient} from "@libsql/client/web";

export default class LibSqlService {
	constructor({cwd, url, authToken}) {
		this.api=createClient({url, authToken});
	}
}