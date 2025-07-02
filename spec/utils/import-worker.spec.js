import {importWorker} from "../../src/utils/import-worker.js";
import path from "node:path";
import {fileURLToPath} from 'url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("import-worker",()=>{
	it("can import a worker",async ()=>{
		let myworker=await importWorker(path.join(__dirname,"myworker.js"));
		let val=await myworker.hello();
		expect(val).toEqual(123);

		let res=await myworker.terminate(321);
		expect(res).toEqual("i'm terminated321");
	});
});