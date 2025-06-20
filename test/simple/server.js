export async function onFetch({request, fs}) {
	return new Response("hello again yyy: "+request.url+fs.readFileSync("myfile.txt"));
}