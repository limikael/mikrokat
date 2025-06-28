import NodeStorageService from "../../src/services/NodeStorageService.js";
import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("NodeStorageService",()=>{
	it("works",async ()=>{
		let dirname=path.join(__dirname,"tmp/test-storage-dir");

		await fsp.rm(dirname,{force:true, recursive: true});
		await fsp.mkdir(dirname,{recursive: true});

		let nodeStorage=new NodeStorageService({
			cwd: __dirname,
			dirname: "tmp/test-storage-dir"
		});

		//await nodeStorage.put("hello.txt","hello world");
		await nodeStorage.put("hello.txt",new TextEncoder().encode("hello world").buffer);
		//await nodeStorage.put("hello.TXT",new TextEncoder().encode("hello world").buffer);

		let o=await nodeStorage.get("hello.txt");
		let h=new Headers();
		o.writeHttpMetadata(h);
		//console.log(h);
		expect(h.get("content-type")).toEqual("text/plain");
		expect(await o.text()).toEqual("hello world");

		let list=await nodeStorage.list();
		expect(list).toEqual({objects: [{key: "hello.txt", size: 11}]});
		//console.log(list);

		await nodeStorage.delete("hello.txt");
	});
});
