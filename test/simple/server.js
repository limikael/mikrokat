export async function onFetch({request}) {
	return new Response("hello again2: "+request.url);
}