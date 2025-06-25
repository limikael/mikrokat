# Cloudflare Workers

Mikrokat provides first-class support for Cloudflare Workers, allowing you to deploy your edge applications to Cloudflare's global network.

## Quick Start

Initialize Cloudflare target in your project:

```bash
mikrokat init --target cloudflare
```

This sets up:
- `wrangler.json` configuration
- NPM scripts for development and deployment
- Dependencies for Cloudflare Workers

## Configuration Files

### wrangler.json

After initialization, your `wrangler.json` will look like:

```json
{
  "name": "my-app",
  "main": ".target/entrypoint.cloudflare.js",
  "build": {
    "command": "TARGET=cloudflare npm run build"
  },
  "compatibility_date": "2024-01-01",
  "assets": {
    "directory": "./public"
  }
}
```

### mikrokat.json

Configure Cloudflare-specific features:

```json
{
  "main": "src/main/server.js",
  "imports": [
    {
      "import": "Database",
      "from": "@neondatabase/serverless",
      "if": {
        "target": "cloudflare"
      }
    }
  ],
  "services": {
    "database": {
      "type": "d1",
      "binding": "DB"
    },
    "storage": {
      "type": "r2",
      "binding": "BUCKET"
    },
    "cache": {
      "type": "kv",
      "binding": "CACHE"
    }
  }
}
```

## Development Workflow

### Local Development

Start local development with Wrangler:

```bash
npm run dev:cloudflare
```

This uses Wrangler's local development server with your Mikrokat handlers.

### Building

Build your application for Cloudflare:

```bash
npm run build
# or
TARGET=cloudflare mikrokat build
```

### Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy:cloudflare
# or
wrangler deploy
```

## Cloudflare-Specific Features

### Service Bindings

Cloudflare Workers support various service bindings that can be configured in your `wrangler.json`:

#### D1 Database

```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-database",
      "database_id": "your-database-id"
    }
  ]
}
```

Usage in your handler:

```javascript
export async function onFetch({request, env}) {
  const result = await env.DB.prepare("SELECT * FROM users").all();
  return new Response(JSON.stringify(result));
}
```

#### KV Storage

```json
{
  "kv_namespaces": [
    {
      "binding": "CACHE",
      "id": "your-kv-namespace-id"
    }
  ]
}
```

Usage:

```javascript
export async function onFetch({request, env}) {
  const cached = await env.CACHE.get("key");
  if (cached) {
    return new Response(cached);
  }
  
  const data = await fetchData();
  await env.CACHE.put("key", data, { expirationTtl: 3600 });
  return new Response(data);
}
```

#### R2 Storage

```json
{
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "my-bucket"
    }
  ]
}
```

Usage:

```javascript
export async function onFetch({request, env}) {
  if (request.method === 'PUT') {
    const data = await request.arrayBuffer();
    await env.BUCKET.put("file.jpg", data);
    return new Response("File uploaded");
  }
  
  const file = await env.BUCKET.get("file.jpg");
  if (file) {
    return new Response(file.body, {
      headers: { 'Content-Type': 'image/jpeg' }
    });
  }
  
  return new Response("Not found", { status: 404 });
}
```

### Environment Variables

Set environment variables in `wrangler.json`:

```json
{
  "vars": {
    "API_KEY": "your-api-key",
    "DEBUG": "true"
  }
}
```

Or use secrets for sensitive data:

```bash
wrangler secret put API_SECRET
```

Access in your code:

```javascript
export async function onFetch({request, env}) {
  const apiKey = env.API_KEY;
  const secret = env.API_SECRET;
  // Use environment variables
}
```

### Cron Triggers

Configure scheduled events in `wrangler.json`:

```json
{
  "triggers": {
    "crons": ["0 0 * * *"]
  }
}
```

Handle in your code:

```javascript
export async function onSchedule({cron, env}) {
  console.log(`Cron triggered: ${cron}`);
  // Perform scheduled work
}
```

### Durable Objects

Configure Durable Objects:

```json
{
  "durable_objects": {
    "bindings": [
      {
        "name": "COUNTER",
        "class_name": "Counter"
      }
    ]
  }
}
```

Use conditional imports for Durable Object classes:

```json
{
  "imports": [
    {
      "import": "Counter",
      "from": "./durable-objects/counter.js",
      "if": {
        "target": "cloudflare"
      }
    }
  ]
}
```

## Static Assets

Cloudflare Workers Assets (formerly Workers Sites) are automatically configured:

```json
{
  "assets": {
    "directory": "./public"
  }
}
```

Files in your `public/` directory are automatically served by Cloudflare's CDN.

## Performance Optimization

### Bundle Size

Monitor your bundle size to stay within Cloudflare's limits:

```bash
wrangler deploy --dry-run
```

### Cold Start Optimization

- Minimize the size of your `onStart` handler
- Use lazy loading for large dependencies
- Consider using conditional imports

```javascript
export async function onStart({imports, appData}) {
  // Minimal startup code
  appData.initialized = true;
}

export async function onFetch({request, imports, appData}) {
  // Lazy load heavy dependencies
  if (!appData.heavyLib) {
    appData.heavyLib = imports.HeavyLibrary;
  }
}
```

## Debugging

### Local Debugging

Use Wrangler's local development mode:

```bash
wrangler dev --local
```

### Remote Debugging

View logs in real-time:

```bash
wrangler tail
```

### Error Handling

Implement proper error handling for production:

```javascript
export async function onFetch({request}) {
  try {
    return await handleRequest(request);
  } catch (error) {
    console.error('Request failed:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      requestId: crypto.randomUUID()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

## Deployment Strategies

### Preview Deployments

Deploy to a preview environment:

```bash
wrangler deploy --env preview
```

Configure preview environment in `wrangler.json`:

```json
{
  "env": {
    "preview": {
      "name": "my-app-preview",
      "vars": {
        "ENVIRONMENT": "preview"
      }
    }
  }
}
```

### Custom Domains

Configure custom domains:

```json
{
  "routes": [
    "api.example.com/*",
    "example.com/api/*"
  ]
}
```

### CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Deploy to Cloudflare Workers
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Limitations

Be aware of Cloudflare Workers limitations:

- **CPU Time:** 50ms for free tier, 30 seconds for paid
- **Memory:** 128MB
- **Bundle Size:** 1MB compressed
- **Subrequests:** 1000 per request
- **Duration:** 15 minutes for cron triggers

## Troubleshooting

### Common Issues

**Module not found:**
```bash
wrangler deploy
✘ [ERROR] Could not resolve "node:fs"
```
Solution: Use browser-compatible modules or conditional imports.

**Exceeded CPU time:**
```
Error: The script exceeded the CPU time limit
```
Solution: Optimize async operations and reduce computation time.

**Bundle too large:**
```
Error: Bundle size exceeds the limit
```
Solution: Use conditional imports and tree shaking.

## Best Practices

1. **Use TypeScript** - Add type safety with `@cloudflare/workers-types`
2. **Handle errors gracefully** - Always catch and handle exceptions
3. **Optimize bundle size** - Use conditional imports for platform-specific code
4. **Cache aggressively** - Use KV storage for caching
5. **Monitor performance** - Use Wrangler analytics
6. **Test locally** - Use `wrangler dev` for development
7. **Use secrets** - Never hardcode sensitive data

## Next Steps

- [Vercel Edge Functions](./vercel.md)
- [Fastly Compute@Edge](./fastly.md)
- [Netlify Edge Functions](./netlify.md)
- [Advanced Topics](../advanced/static-assets.md)