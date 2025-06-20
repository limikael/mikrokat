# mikrokat

**Mikrokat solves the problem of platform fragmentation in edge computing by letting developers build universal, service-bound, edge-native applications from a single codebase.**

* [What Problem Does Mikrokat Solve?](#what-problem-does-mikrokat-solve)
* [Mikrokat’s Solution](#mikrokats-solution)
* [Getting Started](#getting-started)
* [Writing Your Handler](#writing-your-handler)
* [Middlewares](#middlewares)
* [Bindable Services](#bindable-services)
* [Config Filesystem](#config-filesystem)

Mikrokat compiles a universal request handler into platform-specific edge runtimes, letting you write once and deploy anywhere.

- Multi-platform build targets, currently supports: Cloudflare, Vercel, Fastly and Netlify.
- Unified API handler - Write a single `onFetch` handler that works across platforms.
- Bindable services - Unified access to services like databases, AI, and payments (WIP).

One way of unserstanding mikrokat is that is it similar to [serverless](https://www.serverless.com/), but for [Edge Computing](https://en.wikipedia.org/wiki/Edge_computing).

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

Your `server.js` should export an async function named `onFetch`. It receives an event object with a `request` field, and
some other stuff, see below, and should return a standard `Response`. There are also a few other functions you can choose
to export:

```js
export async function onFetch({request, env}) {
  return new Response("Hello from mikrokat!");
}

export async function onStart(ev) { /* ... */ }

export async function onSchedule(ev) { /* ... */ }
```

While the `onFetch` function is the only one needed to be exported, there are some other functions that can be exported as well,
to listen to other events. They all receive a single event object, which mainly contain the same fields, but with some variations.

- `onStart` - Run on start of the instance. Note that our request handler will probably be started and stopped many times during its lifetime, which is beyond your
  control. Also, your handler might be globally distributed and run simultaneously in many different global locations. Don't rely on the function to run "once",
  but rather "once per instance". You can use it to set up things like ORMs or other things, but anything created here should be seen as cache being populated,
  rather than a state being set.
- `onFetch` - Invoked to handle each request.
- `onSchedule` - Invoked on scheduled events, if supported by the underlying platform. The mechanism how to schedule events is different for each platform.

The event object received by these function contains the following fields:

- `request` - The request to process. A standard [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) object. Only sent to the `onFetch` function.
- `ctx` - A platform dependent context variable related to the request. Only sent to the `onFetch` function. See platform documentation about what it contains.
- `env` - Contains your service bindings and environment variables.
- `fs` - A "mini filesystem" for configuration files. See [Config Filesystem](#config-filesystem).
- `appData` - An object where you can store runtime info. It is initiated to`{}`, so it is totally up to you what you want to store there.
- `cron` - The cron expression that triggered a scheduled event. Only sent to the `onSchedule` function.

## Middlewares

Mikrokat supports middleware functions that can intercept and handle incoming requests. Middleware is registered using the `use()` function inside `onStart()`.

A middleware is a function with the same signature as your main handler:

```js
async function myMiddleware(request, env, ctx) {
  if (shouldHandle(request)) {
    return new Response("Handled by middleware");
  }
  // Return undefined to fall through
}
```

You can register it like this:

```js
export function onStart({ use }) {
  use(myMiddleware);
}
```

If the middleware returns a `Response`, the request handling stops there. If it returns `undefined` or anything falsy, the next middleware (or main handler) is tried.

### Optional: Run middleware *after* the main handler

By default, middleware runs **before** your main handler. You can also register "fallback" middleware that runs **only if** the main handler (and earlier middleware) did not handle the request:

```js
export function onStart({ use }) {
  use(myFallbackMiddleware, { fallback: true });
}
```

This is useful for things like custom 404 pages, logging, or handling proxy-style fallthroughs.

## Bindable Services

Bindable services provide a unified interface to external resources like databases, AI models, or payments, allowing your code to stay portable and vendor-agnostic - helping you avoid lock-in to specific platform APIs.

Mikrokat supports service bindings through a unified runtime interface. These are available through the `env` field of all events triggered. Here is an example of
how to access services from inside the `onFetch` function:

```js
export function onFetch({env}) {
  const result = await env.DB.prepare("SELECT * FROM users").all();
  const summary = await env.AI.completion({ prompt: "Summarize this" });
  // ...
}
```

It is noteworthy that while there exist clear classes of services, such as SQL database, AI completion, etc, each vendor has their own API when accessing these
services, often with subtle variations which makes it difficult to use one service as a drop-in replacement for another. 
Mikrokat therefore has a translation layer, so you can access a kind of "least common denominator" for each class of service,
and wraps the interface of the service to expose its API in a configurable way. This way, you can access a SQL database from Neon using the API for Cloudflare D1,
or access AI completion services at DeepSeek using the API from OpenAI, without having to change your code. 

This enables writing portable code that integrates with external services (databases, AI, payments, vector search, etc.) without platform-specific boilerplate.

### Declaring service bindings

Service bindings are declared in the `mikrokat.json` file:

```json
{
  "services": {
    "DB": [
      {
        "type": "sqlite",
        "filename": "local.sqlite",
        "if": { "target": "node" },
        "exposeApi": "d1"
      },
      {
        "type": "neon",
        "url": "postgresql://...",
        "if": { "target": "netlify" },
        "exposeApi": "d1"
      }
    ],
    "AI": {
      "type": "openai",
      "apiKey": "...."
    }
  }
}
```

The `services` field of `mikrokat.json` is a dictionary with the binding name of the service as the key. The value is either a single service definition, or an array of service definitions. If an array is used, the first matching service wil be passed to the app.

- `type`: specifies the backend implementation of the service.<br/>
  Example values: `"sqlite"` (for better-sqlite3), `"neon"` (for Neon serverless Postgres)

- `exposeApi`: defines which API style should be exposed to your application code.<br/>
  Mikrokat can translate between different backend implementations and frontend APIs, allowing your code to use a consistent interface
  regardless of which service is active at runtime. This lets you use a consistent API (like D1) across different backends.<br/>
  Example: `"d1"` to expose a D1-style interface (with `.prepare().all()`, etc.)

- `if`: optional condition to select this binding for a specific target.<br/>
  Useful for providing platform-specific service definitions.<br/>
  Example: `{ "target": "node" }` to use this only when building for Node.

## Config Filesystem

The virtual config filesystem makes it possible to include configuration or other static files directly in your edge deployment, which is essential for platforms that don’t support traditional file access.

Please note that this is not intended for serving static content to the client, but for smaller pieces of
information, such as configuration files, that needs to be available at runtime.

In your `mikrokat.json`:

```json
{
  "files": ["config.json","info.yaml","conf/*.json"]
}
```

These files are then available at runtime using:

```js
const config = JSON.parse(ev.fs.readFileSync("config.json", "utf-8"));
```

This allows edge functions to access configuration or data without requiring a traditional file system.
