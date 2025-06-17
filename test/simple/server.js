export async function onFetch({request}) {
	return new Response("hello again yyy: "+request.url);
}