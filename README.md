# mikrokat

**Mikrokat solves the problem of platform fragmentation in edge computing by letting developers build universal, service-bound, edge-native applications from a single codebase.**

* [What Problem Does Mikrokat Solve?](#what-problem-does-mikrokat-solve)
* [Mikrokat’s Solution](#mikrokats-solution)
* [Getting Started](#getting-started)
* [Writing Your Handler](#writing-your-handler)
* [Middlewares](#middlewares)
* [Static Content](#static-content)
* [Conditional Imports](#conditional-imports)
* [Bindable Services](#bindable-services)
* [Config Filesystem](#config-filesystem)

Mikrokat compiles a universal request handler into platform-specific edge runtimes, letting you write once and deploy anywhere.

- Multi-platform build targets, currently supports: Cloudflare, Vercel, Fastly and Netlify.
- Unified API handler - Write a single `onFetch` handler that works across platforms.

One way of unserstanding Mikrokat is that is it similar to [serverless](https://www.serverless.com/), but for [Edge Computing](https://en.wikipedia.org/wiki/Edge_computing).

Another way to understand Mikrokat is that it is like Docker for edge platforms. It provides a consistent way to package, build, and deploy edge applications across Cloudflare, Vercel, Fastly, and Netlify while orchestrating bindable services and environment injection automatically. With edge services already auto-scaling, Mikrokat fulfills the orchestration role in spirit by handling service integration, environment injection, and uniform builds across edge environments.

## What Problem Does Mikrokat Solve?

Modern web developers increasingly want to deploy lightweight, full-featured applications directly to edge platforms like Cloudflare Workers, Vercel Edge Functions, Fastly Compute@Edge, and Netlify. These platforms offer high performance, scalability, and global reach — but each has its own configuration formats, build pipelines, and deployment quirks.

As a result:

- Developers must learn platform-specific APIs and deploy flows.
- Applications must be restructured or rewritten to match the target platform.
- Service binding declarations are not standardized, making multi-platform development cumbersome and error-prone.
- There is no unified way to run and test the app locally in a way that mirrors edge deployment behavior.

## Mikrokat’s Solution

Mikrokat introduces a universal edge runtime abstraction. Developers write a single entrypoint, `onFetch(ev)` and declare services in a standardized format, `mikrokat.json`. Mikrokat then:

- Compiles platform-specific entrypoints (Cloudflare, Vercel, Fastly, etc.)
- Handles static file bundling and injection
- Generates configuration files (wrangler.toml, fastly.toml, etc.)
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

### 2. Add a deployment platform

```bash
mikrokat init --platform=cloudflare
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
mikrokat dev --platform=cloudflare
```

And to the deploy the app on edge, run:

```bash
mikrokat deploy --platform=cloudflare
```

Where `cloudflare` is the deploy target. Replace with `vercel`, `netlify` or `fastly`, depending on your provider.

Note, if you run `yarn` or `pnpm` rather than `npm`, you can run the above with `yarn deploy --platform=cloudflare` as well.

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
- `env` - Contains environment variables and service bindings (if supported by the underlying platform).
- `fs` - A "mini filesystem" for configuration files. See [Config Filesystem](#config-filesystem).
- `appData` - An object where you can store runtime info. It is initiated to`{}`, so it is totally up to you what you want to store there.
- `cron` - The cron expression that triggered a scheduled event. Only sent to the `onSchedule` function.
- `imports` - Contains references to the resolved and bundled conditional imports. See [Conditional Imports](#conditional-imports).

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

## Static Content

By strong convention, all files in the `public` directory will be served statically. Incoming requests for existing static content will
be served directly, and your handler will not be invoked.

## Conditional Imports

Mikrokat supports conditional imports declared in your `mikrokat.json` file. This lets you specify platform-dependent module bindings that are 
resolved at buildtime and passed into your handler functions.

When deploying to edge platforms like those Mikrokat targets, the code is bundled before deployment. This means you can't use dynamic `import()` 
with runtime conditions like `if (platform === 'node')`. All imports must be statically analyzable.

Conditional imports in Mikrokat solve this by allowing you to declaratively map platform-specific modules,
which are resolved at build time and passed into your app at runtime.

Declare conditional imports in your `mikrokat.json` file:

```json
{
  "imports": [
    {
      "import": "Database",
      "from": "better-sqlite3",
      "if": {
        "platform": "node"
      }
    }
  ]
}
```

The default export from `better-sqlite3` will now available in your handlers like this:

```js
export function onFetch({env, platform, imports}) {
    if (platform=="node")
        env.DB=new imports.Database("local.sqlite");
}
```

## Bindable Services

Mikrokat supports Bindable Services so your app can cleanly declare and connect to cloud resources while staying portable across platforms.

Declare your services in mikrokat.json mikrokat.services. Mikrokat will inject these during runtime into your environment. 

Example:

```json
{
  "services": {
    "DB": [
      {
        "type": "better-sqlite3",
        "filename": "mylocalstagingdatabase.db",
        "if": {"platform": "node"}
      },
      {
        "type": "neon",
        "url": "...",
        "if": {"platform": "netlify"}
      }
    ]
  }
}
```

This will make the database available under `env.DB` at runtime.

## Config Filesystem

The virtual config filesystem makes it possible to include configuration or other static files directly in your edge deployment, which is essential for platforms that don’t support traditional file access.

Please note that this is not intended for serving static content to the client, but for smaller pieces of
information, such as configuration files, that needs to be available at runtime. For serving static content, see [Static Content](#static-content).

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
