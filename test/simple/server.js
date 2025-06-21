async function middleware({request}) {
	if (new URL(request.url).pathname=="/middleware")
		return new Response("handled by middleware");
}

export async function onStart({appData, use}) {
	use(middleware);

	//console.log("starting, init appData")
	appData.value=123;
}

export async function onFetch({request, fs, appData}) {
	return new Response("hello again yyy: "+request.url+fs.readFileSync("myfile.txt")+appData.value);
}