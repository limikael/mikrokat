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
			async onFetch({request, env, fs}) {
				return new Response(
					fs.readFileSync("hello.txt")+
					await fs.promises.readFile("hello.txt")+
					await env.MYSERVICE.test()
				);
			}
		};

		let serviceClasses={
			myservice: MyService
		};

		let services={
			MYSERVICE: {type: "myservice", hello: 123}
		}

		let fileContent={
			"hello.txt": "world"
		};

		let env={};
		let server=new MikrokatServer({mod,env,services,serviceClasses,fileContent});

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
			services: {},
			serviceClasses: {},
			fileContent: {}
		});

		let response=await server.handleRequest(new Request("http://test"));
		expect(await response.text()).toEqual("hello: 123");
	});
});