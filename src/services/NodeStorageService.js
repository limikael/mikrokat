import fs, {promises as fsp} from "node:fs";
import path from "node:path";
import mime from "mime";

export default class NodeStorageService {
	constructor({cwd, dirname}) {
		this.dirname=path.resolve(cwd,dirname);
	}

	resolve(key) {
		return path.join(this.dirname,key);
	}

	async get(key) {
		let content=await fsp.readFile(this.resolve(key));
		let object=new Response(content);

		object.writeHttpMetadata=headers=>{
			if (key.lastIndexOf(".")>=0) {
				let ext=key.slice(key.lastIndexOf(".")+1);
				headers.set("content-type",mime.getType(ext))
			}
		}

		return object;
	}

	async put(key, content) {
		if (content instanceof ArrayBuffer) {
			//console.log("it is array buffer!!!");
			content=new Uint8Array(content);
		}

		await fsp.writeFile(this.resolve(key),content);
	}

	async delete(key) {
		if (Array.isArray(key))
			throw new Error("array delete not impl");

		await fsp.rm(this.resolve(key));
	}

	async list() {
		let files=await fsp.readdir(this.dirname);
		let ret={objects:[]};

		for (let file of files) {
			let stat=await fsp.stat(this.resolve(file));
			ret.objects.push({
				key: file,
				size: stat.size
			});
		}

		return ret;
	}
}