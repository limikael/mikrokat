import MikrokatServer from "../../src/server/MikrokatServer.js";

describe("MikrokatServer",()=>{
	it("can handle a request",async ()=>{
		class MyService {
			constructor({hello}) {
				this.hello=hello;
			}

			test() {
				return "hello"+this.hello;
			}
		}

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
		let server=new MikrokatServer({mod,env,imports,fileContent});

		let request=new Request("http://hello.world");
		let response=await server.handleRequest({request: request});

		expect(await response.text()).toEqual("worldworldhello123");
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
			mod,
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
			mod,
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
			mod,
			env: {},
			fileContent: {}
		});

		let response=await server.handleRequest({request: new Request("http://test/handle2")});
		expect(await response.text()).toEqual("This is an error");
		expect(response.status).toEqual(500);
	});
});