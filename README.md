# mikrokat

**A minimal meta-framework for deploying portable edge functions.**

Mikrokat compiles a universal request handler into platform-specific edge runtimes, letting you write once and deploy anywhere. Designed for zero-config simplicity with maximum flexibility.

- Multi-platform build targets, currently supports: Cloudflare, Vercel, Fastly and Netlify.
- Unified API handler - Write a single `onFetch` handler that works across platforms.
- Mini virtual filesystem - Bundle config files directly into your edge function (WIP). 
- Bindable services - Unified access to services like databases, AI, and payments (WIP).

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

```bash
npm run dev:cloudflare
npm run deploy:cloudflare
```


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
