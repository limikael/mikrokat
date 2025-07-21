import path from "node:path";
import {createClient} from "@libsql/client";
import {pathToFileURL} from 'url';

export default class LibSqlService {
	constructor({cwd, url, filename}) {
		//console.log("better cwd: "+cwd);
		//console.log("better filename: "+filename);

		if (filename) {
			let filenameAbs=path.resolve(cwd,filename);
			url=pathToFileURL(filenameAbs);
		}

		this.api=createClient({url});
	}
}