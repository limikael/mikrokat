# Mikrokat Overview

**Mikrokat solves the problem of platform fragmentation in edge computing by letting developers build universal, service-bound, edge-native applications from a single codebase.**

## What Problem Does Mikrokat Solve?

Modern web developers increasingly want to deploy lightweight, full-featured applications directly to edge platforms like Cloudflare Workers, Vercel Edge Functions, Fastly Compute@Edge, and Netlify Edge Functions. These platforms offer high performance, scalability, and global reach — but each has its own configuration formats, build pipelines, and deployment quirks.

As a result:

- **Platform-specific learning curve** - Developers must learn platform-specific APIs and deploy flows
- **Code restructuring** - Applications must be restructured or rewritten to match the target platform
- **Service binding complexity** - Service binding declarations are not standardized, making multi-platform development cumbersome and error-prone
- **Development environment gaps** - There is no unified way to run and test the app locally in a way that mirrors edge deployment behavior

## Mikrokat's Solution

Mikrokat introduces a universal edge runtime abstraction. Developers write a single entrypoint, `onFetch(ev)` and declare services in a standardized format, `mikrokat.json`. Mikrokat then:

- **Compiles platform-specific entrypoints** - Automatically generates Cloudflare, Vercel, Fastly, and Netlify-compatible code
- **Handles static file bundling** - Automatically bundles and injects static files from your `public` directory
- **Generates configuration files** - Creates platform-specific config files (`wrangler.toml`, `fastly.toml`, etc.)
- **Enables local development** - Provides unified local development and testing environment

This allows developers to build edge-native applications once and deploy them to any supported platform without modification - eliminating vendor lock-in and reducing friction.

## Key Concepts

### Universal Handler Functions

Write three simple handler functions that work across all platforms:

```javascript
// Handle HTTP requests
export async function onFetch({request, env}) {
  return new Response("Hello from any edge platform!");
}

// Initialize your app
export async function onStart({use}) {
  // Register middleware, set up services
}

// Handle scheduled events (where supported)
export async function onSchedule({cron, env}) {
  // Run background tasks
}
```

### Platform Abstraction

One codebase, multiple deployment targets:

- **Cloudflare Workers** - Deploy to Cloudflare's global edge network
- **Vercel Edge Functions** - Integrate with Vercel's deployment pipeline
- **Fastly Compute@Edge** - Leverage Fastly's CDN and edge computing
- **Netlify Edge Functions** - Deploy alongside Netlify's JAMstack platform

### Unified Configuration

Configure everything in a single `mikrokat.json` file:

```json
{
  "main": "src/server.js",
  "files": ["config.json", "templates/*.html"],
  "imports": [
    {
      "import": "Database",
      "from": "better-sqlite3",
      "if": { "target": "node" }
    }
  ]
}
```

## How It Works

1. **Write your handlers** - Create your `onFetch`, `onStart`, and `onSchedule` functions
2. **Configure your app** - Set up `mikrokat.json` with files, imports, and services
3. **Add deployment targets** - Use `mikrokat init --target=cloudflare` for each platform
4. **Deploy anywhere** - Run `npm run deploy:cloudflare` (or vercel, fastly, netlify)

## Architecture Benefits

### Write Once, Deploy Anywhere
No need to maintain separate codebases for different edge platforms. Your application logic stays the same regardless of deployment target.

### Platform-Specific Optimization
Mikrokat generates optimized code for each platform, handling the nuances of different runtimes automatically.

### Local Development Parity
Test your edge applications locally with the same behavior you'll get in production, regardless of target platform.

### Service Binding Abstraction
Declare service dependencies once and let Mikrokat handle platform-specific binding configuration.

## Comparison to Alternatives

### vs. Platform-Specific Solutions
- **Traditional approach**: Write separate applications for Cloudflare Workers, Vercel Edge Functions, etc.
- **Mikrokat approach**: Write once, deploy to any edge platform

### vs. Serverless Frameworks
Mikrokat is similar to [Serverless Framework](https://www.serverless.com/), but specifically designed for edge computing rather than traditional cloud functions.

### vs. Isomorphic Solutions
Unlike universal JavaScript frameworks that run the same code on client and server, Mikrokat focuses on running the same code across different edge platforms.

## When to Use Mikrokat

**Perfect for:**
- Edge-native applications requiring global distribution
- Multi-platform deployment strategies
- Teams wanting to avoid vendor lock-in
- Applications needing consistent local development experience

**Consider alternatives for:**
- Simple static sites (use platform-specific tools)
- Traditional server applications (use standard Node.js frameworks)
- Single-platform deployments with heavy platform-specific features

## Next Steps

- [Quick Start Guide](./quick-start.md) - Get your first app running
- [Request Handlers](../core-concepts/handlers.md) - Learn the core programming model
- [Configuration Reference](../configuration/mikrokat-json.md) - Master the configuration system