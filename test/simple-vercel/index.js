export const config = {
  runtime: 'edge',
};

export default function handler(req) {
  console.log("Edge function hit:", new Date());

  return new Response("Hello from root, url="+req.url, {
  	status: 200,
    headers: { "content-type": "text/plain" }
  });
}