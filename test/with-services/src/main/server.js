import {Kysely, SqliteDialect} from "kysely";
import {D1Dialect} from 'kysely-d1';
import {NeonDialect} from "kysely-neon";

const NEONURL="postgresql://neondb_owner:npg_gf5O3qtuIQpB@ep-shy-haze-a1lriwas-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

export async function onStart({target, env, imports}) {
	let dialect;

	console.log("starting, target="+target);

	switch (target) {
		case "node":
			//dialect=new NeonDialect({connectionString: NEONURL});
			dialect=new SqliteDialect({database: new imports.Database("test.sqlite")});
			break;

		case "cloudflare":
			dialect=new D1Dialect({database: env.DB});
			break;

		case "fastly":
		case "netlify":
		case "vercel":
			dialect=new NeonDialect({connectionString: NEONURL});
			break;
	}

	env.db=new Kysely({dialect});
}

export async function onFetch({request, env}) {
	let res="";

	res+="<b>hello</b>";

	let dbres=await env.db.selectFrom("test").select(["hello"]).execute();
	res+="<pre>"+JSON.stringify(dbres,null,2)+"</pre>";

    return new Response(res,{headers: {"content-type": "text/html"}});
}
