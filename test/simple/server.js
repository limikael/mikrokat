export async function onStart({appData}) {
	console.log("starting, init appData")
	appData.value=123;
}

export async function onFetch({request, fs, appData}) {
	return new Response("hello again yyy: "+request.url+fs.readFileSync("myfile.txt")+appData.value);
}