export async function onFetch({request, platform}) {
    return new Response("Hello from platform: "+platform);
}
