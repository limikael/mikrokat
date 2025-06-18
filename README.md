# mikrokat

**Mikrokat solves the problem of platform fragmentation in edge computing by letting developers build universal, service-bound, edge-native applications from a single codebase.**

Mikrokat compiles a universal request handler into platform-specific edge runtimes, letting you write once and deploy anywhere.

- Multi-platform build targets, currently supports: Cloudflare, Vercel, Fastly and Netlify.
- Unified API handler - Write a single `onFetch` handler that works across platforms.
- Bindable services - Unified access to services like databases, AI, and payments (WIP).

## What Problem Does Mikrokat Solve?

Modern web developers increasingly want to deploy lightweight, full-featured applications directly to edge platforms like Cloudflare Workers, Vercel Edge Functions, Fastly Compute@Edge, and Netlify. These platforms offer high performance, scalability, and global reach — but each has its own configuration formats, build pipelines, and deployment quirks.

As a result:

- Developers must learn platform-specific APIs and deploy flows.
- Applications must be restructured or rewritten to match the target platform.
- Shared functionality like database access, AI integration, and HTTP fetch proxies must be re-implemented or manually adapted for each target.
- Service binding declarations are not standardized, making multi-platform development cumbersome and error-prone.
- There is no unified way to run and test the app locally in a way that mirrors edge deployment behavior.

## Mikrokat’s Solution

Mikrokat introduces a universal edge runtime abstraction. Developers write a single entrypoint, `onFetch(ev)` and declare services in a standardized format, `mikrokat.json`. Mikrokat then:

- Compiles platform-specific entrypoints (Cloudflare, Vercel, Fastly, etc.)
- Handles static file bundling and injection
- Generates configuration files (wrangler.toml, fastly.toml, etc.)
- Normalizes service bindings into `env.SERVICE` APIs (e.g., env.DB.query(...), env.AI.fetch(...))
- Enables local development and testing

This allows developers to build edge-native applications once and deploy them to any supported platform without modification - eliminating lock-in and reducing friction.

## Getting Started

### 1. Initialize your project

```bash
mkdir my-app
cd my-app
mikrokat init
```

This creates a `package.json` with dependencies and a default `server.js` entrypoint.  
You'll need to manually install the dependencies:

```bash
npm install
# or
yarn install
```

### 2. Add a deployment target

```bash
mikrokat init --target=cloudflare
```

This will:
- Create a platform-specific config (e.g. `wrangler.json`)
- Add scripts to `package.json` like `dev:cloudflare` and `deploy:cloudflare`

### 3. Run and deploy your app

To run the app in a local node environment, run:

```bash
npm run start
```

To run the app locally, in a simulated edge environment, run:

```bash
npm run dev:cloudflare
```

And to the deploy the app on edge, run:

```bash
npm run deploy:cloudflare
```

Where `cloudflare` is the deploy target. Replace with `vercel`, `netlify` or `fastly`, depending on your provider.

## Writing Your Handler

Your `server.js` should export a single async function named `onFetch`. It receives `{request, env}` and returns a standard `Response`.

```js
export async function onFetch({request, env}) {
  return new Response("Hello from mikrokat!");
}
```

## Mini Filesystem (WIP)

The virtual filesystem makes it possible to include configuration or other static files directly in your edge deployment, which is essential for platforms that don’t support traditional file access.

You can bundle additional files (e.g. `config.json` or other config files) into your edge functions.

Please note that this is not intended for serving static content to the client, but for smaller pieces of
information, such as configuration files, that needs to be available at runtime.

```bash
mikrokat build --files=config.json,info.txt
```

These files are available at runtime using:

```js
const config = JSON.parse(ev.fs.readFileSync("config.json", "utf-8"));
```

This allows edge functions to access configuration or data without requiring a traditional file system.

## Bindable Services (WIP)

Bindable services provide a unified interface to external resources like databases, AI models, or payments, allowing your code to stay portable and vendor-agnostic - helping you avoid lock-in to specific platform APIs.

Mikrokat will support service bindings through a unified runtime interface. Example:

```js
const result = await env.DB.query("SELECT * FROM users");
const summary = await env.AI.complete({ prompt: "Summarize this" });
await env.PAYMENT.charge({ amount: 1000, currency: "USD" });
```

This enables writing portable code that integrates with external services (databases, AI, payments, vector search, etc.) without platform-specific boilerplate.
