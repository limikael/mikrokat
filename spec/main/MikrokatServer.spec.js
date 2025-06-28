import MikrokatServer from "../../src/main/MikrokatServer.js";
import BetterSqlite3Service from "../../src/services/BetterSqlite3Service.js";
import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("MikrokatServer",()=>{
	it("can handle a request",async ()=>{
		let mod={
			async onFetch({request, env, fs, imports}) {
				return new Response(
					fs.readFileSync("hello.txt")+
					await fs.promises.readFile("hello.txt")+
					imports.test()
				);
			}
		};

		let fileContent={
			"hello.txt": "world"
		};

		let imports={
			test() {return "hello123"}
		};

		let env={};
		let server=new MikrokatServer({modules: [mod],env,imports,fileContent});

		let request=new Request("http://hello.world");
		let response=await server.handleRequest({request: request});

		expect(await response.text()).toEqual("worldworldhello123");
	});

	it("has a local fetch",async ()=>{
		let mod={
			async onFetch({request, env, localFetch}) {
				let url=new URL(request.url);

				//console.log(url.pathname);
				if (url.pathname=="/testlocal") {
					return await localFetch("/hello");
				}

				return new Response("hello");
			}
		};

		let env={};
		let imports={};
		let fileContent={};
		let server=new MikrokatServer({modules: [mod],env,imports,fileContent});

		let request=new Request("http://test.com/testlocal");
		let response=await server.handleRequest({request: request});

		expect(await response.text()).toEqual("hello");
	});

	it("runs start",async ()=>{
		let mod={
			async onStart({env}) {
				env.setonstart=123;
			},

			async onFetch({env, fs}) {
				return new Response("hello: "+env.setonstart);
			}
		};

		let server=new MikrokatServer({
			modules: [mod],
			env: {},
			fileContent: {}
		});

		let response=await server.handleRequest({request: new Request("http://test")});
		expect(await response.text()).toEqual("hello: 123");
	});

	it("can use middlewares",async ()=>{
		async function middleware1({request}) {
			if (new URL(request.url).pathname=="/handle1")
				return new Response("I'm middleware 1");
		}

		async function middleware2({request}) {
			if (new URL(request.url).pathname=="/handle2")
				return new Response("I'm middleware 2");
		}

		async function fallbackmiddleware({request}) {
			return new Response("I'm the fallback");
		}

		let mod={
			async onStart({env, use}) {
				use(middleware1);
				use(middleware2);
				use(fallbackmiddleware,{fallback: true});
				env.setonstart=123;
			},

			async onFetch({request, env, fs}) {
				if (new URL(request.url).pathname=="/handlemain")
					return new Response("hello: "+env.setonstart);
			}
		};

		let server=new MikrokatServer({
			modules: [mod],
			env: {},
			fileContent: {}
		});

		let response1=await server.handleRequest({request: new Request("http://test/handle2")});
		//expect(await response.text()).toEqual("hello: 123");
		expect(await response1.text()).toEqual("I'm middleware 2");

		let response2=await server.handleRequest({request: new Request("http://test/handle1")});
		//expect(await response.text()).toEqual("hello: 123");
		expect(await response2.text()).toEqual("I'm middleware 1");

		let response3=await server.handleRequest({request: new Request("http://test/handlemain")});
		//expect(await response.text()).toEqual("hello: 123");
		expect(await response3.text()).toEqual("hello: 123");

		let response4=await server.handleRequest({request: new Request("http://test/bythefallback")});
		//expect(await response.text()).toEqual("hello: 123");
		expect(await response4.text()).toEqual("I'm the fallback");
	});

	it("handles errors",async ()=>{
		let mod={
			async onFetch({request, env, fs}) {
				throw new Error("This is an error");
			}
		};

		let server=new MikrokatServer({
			modules: [mod],
			env: {},
			fileContent: {}
		});

		let response=await server.handleRequest({request: new Request("http://test/handle2")});
		expect(await response.text()).toEqual("This is an error");
		expect(response.status).toEqual(500);
	});

	it("works with services",async ()=>{
		let tmpDir=path.join(__dirname,"../tmp");

		await fsp.rm(tmpDir,{force:true, recursive: true});
		await fsp.mkdir(tmpDir,{recursive: true});

		let mod={
			async onFetch({request, env, fs}) {
				env.DB.prepare("create table test (val integer)").run();
				env.DB.prepare("insert into test (val) values (?)").run(1);
				let res=env.DB.prepare("select * from test").all();
				return Response.json(res);
			}
		};

		let serviceClasses={
			sqlite: BetterSqlite3Service
		};

		let services={
			DB: {
				type: "sqlite",
				filename: "test.sqlite"
			}
		}

		let server=new MikrokatServer({
			modules: [mod],
			env: {},
			fileContent: {},
			serviceClasses,
			services,
			cwd: tmpDir
		});

		let response=await server.handleRequest({request: new Request("http://bla/test")});
		let responseText=await response.text();
		//console.log(responseText);
		expect(responseText).toEqual(`[{"val":1}]`);
	});
});