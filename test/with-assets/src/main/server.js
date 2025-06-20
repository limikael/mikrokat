export async function onFetch({request}) {
	console.log("here...");

    return new Response(`
    	<html>
    		<body>
    			here is a cat: <br/>
    			<img src="/cat.jpeg"/>
    		</body>
    	</html>
    `,{headers: {"content-type": "text/html"}});
}
