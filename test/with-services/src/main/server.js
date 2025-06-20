export async function onFetch({request, env}) {
	let res="";

	res+="<b>hello</b>";

	let dbres=await env.DB.prepare("SELECT * FROM things").all();
	res+="<pre>"+JSON.stringify(dbres,null,2)+"</pre>";

	let neonres=await (await env.NEON.prepare("SELECT * FROM things")).all([]);
	res+="<pre>"+JSON.stringify(neonres,null,2)+"</pre>";

    return new Response(res,{headers: {"content-type": "text/html"}});
}
