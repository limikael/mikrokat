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
			async onFetch({request, env}) {
				return new Response(await env.MYSERVICE.test());
			}
		};

		let serviceClasses={
			myservice: MyService
		};

		let services={
			MYSERVICE: {type: "myservice", hello: 123}
		}

		let env={};
		let server=new MikrokatServer({mod,env,services,serviceClasses});

		let request=new Request("http://hello.world");
		let response=await server.handleRequest({request: request});

		expect(await response.text()).toEqual("hello123");
	});
})