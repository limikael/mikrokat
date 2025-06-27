# Conditional Imports

Conditional imports allow you to use different modules based on the deployment target or environment. This is essential for edge platforms where code is bundled at build time and you can't use dynamic `import()` statements with runtime conditions.

## The Problem

When deploying to edge platforms, your code is bundled before deployment, making dynamic imports with runtime conditions impossible:

```javascript
// ❌ This doesn't work in edge environments
if (target === 'node') {
    const Database = await import('better-sqlite3');
} else if (target === 'cloudflare') {
    const Database = await import('@neondatabase/serverless');
}
```

Edge bundlers can't resolve these dynamic imports because the conditions are only known at runtime, not build time.

## Mikrokat's Solution

Conditional imports solve this by declaring platform-specific modules in your `mikrokat.json` file. Mikrokat resolves these at build time and makes them available in your handlers:

```json
{
  "imports": [
    {
      "import": "Database",
      "from": "better-sqlite3",
      "if": { "target": "node" }
    },
    {
      "import": "Database", 
      "from": "@neondatabase/serverless",
      "if": { "target": "cloudflare" }
    }
  ]
}
```

```javascript
// ✅ This works - imports are resolved at build time
export async function onFetch({imports, env}) {
    if (imports.Database) {
        const db = new imports.Database(env.DATABASE_URL);
        // Use database...
    }
}
```

## Basic Configuration

### Single Default Export

Import a module's default export:

```json
{
  "imports": [
    {
      "import": "Database",
      "from": "better-sqlite3",
      "if": { "target": "node" }
    }
  ]
}
```

```javascript
// Available as imports.Database
export async function onStart({imports, appData}) {
    if (imports.Database) {
        appData.db = new imports.Database('app.db');
    }
}
```

### Named Exports

Import specific named exports:

```json
{
  "imports": [
    {
      "import": ["connect", "query", "close"],
      "from": "my-database-lib",
      "if": { "target": "cloudflare" }
    }
  ]
}
```

```javascript
// Available as imports.connect, imports.query, imports.close
export async function onFetch({imports, env}) {
    if (imports.connect) {
        const connection = await imports.connect(env.DB_URL);
        const result = await imports.query(connection, 'SELECT * FROM users');
        await imports.close(connection);
    }
}
```

### Named Exports with Aliases

Import and rename exports:

```json
{
  "imports": [
    {
      "import": {
        "default": "Redis",
        "createClient": "redisClient", 
        "parseURL": "parseRedisURL"
      },
      "from": "redis",
      "if": { "target": "node" }
    }
  ]
}
```

```javascript
// Available as imports.Redis, imports.redisClient, imports.parseRedisURL
export async function onStart({imports, env, appData}) {
    if (imports.Redis && imports.redisClient) {
        appData.redis = imports.redisClient({
            url: env.REDIS_URL
        });
    }
}
```

## Conditional Logic

### Target-based Conditions

Import different modules for different deployment targets:

```json
{
  "imports": [
    {
      "import": "Database",
      "from": "better-sqlite3",
      "if": { "target": "node" }
    },
    {
      "import": "Database",
      "from": "@neondatabase/serverless", 
      "if": { "target": "cloudflare" }
    },
    {
      "import": "Database",
      "from": "@vercel/postgres",
      "if": { "target": "vercel" }
    }
  ]
}
```

### Environment-based Conditions

Use different modules for development vs production:

```json
{
  "imports": [
    {
      "import": "Logger",
      "from": "./utils/dev-logger.js",
      "if": { "env": "development" }
    },
    {
      "import": "Logger", 
      "from": "./utils/prod-logger.js",
      "if": { "env": "production" }
    }
  ]
}
```

### Multiple Conditions

Combine multiple conditions:

```json
{
  "imports": [
    {
      "import": "Database",
      "from": "better-sqlite3",
      "if": { 
        "target": "node",
        "env": "development" 
      }
    },
    {
      "import": "Database",
      "from": "@planetscale/database",
      "if": {
        "target": "node", 
        "env": "production"
      }
    }
  ]
}
```

### No Conditions (Always Import)

Import modules that should always be available:

```json
{
  "imports": [
    {
      "import": ["utils", "helpers"],
      "from": "./lib/common.js"
    }
  ]
}
```

## Available Conditions

### target

The deployment target platform:

| Value | Platform |
|-------|----------|
| `"node"` | Local Node.js development |
| `"cloudflare"` | Cloudflare Workers |
| `"vercel"` | Vercel Edge Functions |
| `"fastly"` | Fastly Compute@Edge |
| `"netlify"` | Netlify Edge Functions |

### env

The environment (from `NODE_ENV` or custom environment variable):

| Value | Description |
|-------|-------------|
| `"development"` | Development environment |
| `"production"` | Production environment |
| `"test"` | Testing environment |
| Custom values | Any custom environment name |

## Common Patterns

### Database Abstraction

```json
{
  "imports": [
    {
      "import": "Database",
      "from": "better-sqlite3",
      "if": { "target": "node" }
    },
    {
      "import": { "neon": "Database" },
      "from": "@neondatabase/serverless",
      "if": { "target": "cloudflare" }
    },
    {
      "import": { "sql": "Database" },
      "from": "@vercel/postgres", 
      "if": { "target": "vercel" }
    }
  ]
}
```

```javascript
export async function onStart({imports, env, appData}) {
    if (imports.Database) {
        // Different initialization for each platform
        if (env.TARGET === 'node') {
            appData.db = new imports.Database('app.db');
        } else {
            appData.db = imports.Database(env.DATABASE_URL);
        }
    }
}
```

### Logging Systems

```json
{
  "imports": [
    {
      "import": { "default": "winston" },
      "from": "winston",
      "if": { "target": "node" }
    },
    {
      "import": { "default": "ConsoleLogger" },
      "from": "./utils/console-logger.js",
      "if": { "target": ["cloudflare", "vercel"] }
    }
  ]
}
```

```javascript
export async function onStart({imports, appData}) {
    if (imports.winston) {
        appData.logger = imports.winston.createLogger({
            level: 'info',
            transports: [new imports.winston.transports.Console()]
        });
    } else if (imports.ConsoleLogger) {
        appData.logger = new imports.ConsoleLogger();
    }
}
```

### HTTP Clients

```json
{
  "imports": [
    {
      "import": { "default": "axios" },
      "from": "axios",
      "if": { "target": "node" }
    },
    {
      "import": { "default": "fetchClient" },
      "from": "./utils/fetch-client.js",
      "if": { "target": ["cloudflare", "vercel", "fastly", "netlify"] }
    }
  ]
}
```

### File System Operations

```json
{
  "imports": [
    {
      "import": ["readFile", "writeFile"],
      "from": "fs/promises",
      "if": { "target": "node" }
    },
    {
      "import": { "default": "CloudflareR2" },
      "from": "./utils/r2-storage.js",
      "if": { "target": "cloudflare" }
    }
  ]
}
```

## Usage in Handlers

### Checking Availability

Always check if imports are available before using them:

```javascript
export async function onFetch({imports, request}) {
    if (!imports.Database) {
        return new Response('Database not available', { status: 500 });
    }
    
    const db = new imports.Database();
    // Use database...
}
```

### Graceful Fallbacks

Provide fallbacks when imports aren't available:

```javascript
export async function onFetch({imports, request}) {
    let logger;
    
    if (imports.winston) {
        logger = imports.winston.createLogger({...});
    } else if (imports.ConsoleLogger) {
        logger = new imports.ConsoleLogger();
    } else {
        logger = console; // Fallback to console
    }
    
    logger.info('Request received');
}
```

### Platform-Specific Logic

Use imports to determine available functionality:

```javascript
export async function onFetch({imports, env, request}) {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/upload') {
        if (imports.multer) {
            // Node.js file upload handling
            return handleNodeUpload(request, imports.multer);
        } else if (imports.CloudflareR2) {
            // Cloudflare R2 upload
            return handleR2Upload(request, imports.CloudflareR2, env);
        } else {
            return new Response('Upload not supported', { status: 501 });
        }
    }
}
```

## Local Development

During local development (`target: "node"`), you can import any Node.js module:

```json
{
  "imports": [
    {
      "import": { "default": "fs" },
      "from": "fs",
      "if": { "target": "node" }
    },
    {
      "import": { "default": "path" },
      "from": "path", 
      "if": { "target": "node" }
    }
  ]
}
```

```javascript
export async function onFetch({imports, request}) {
    if (imports.fs && imports.path) {
        // Local development - read from filesystem
        const filePath = imports.path.join(process.cwd(), 'data', 'users.json');
        const data = imports.fs.readFileSync(filePath, 'utf-8');
        return new Response(data);
    } else {
        // Production - use other data source
        return new Response('[]');
    }
}
```

## TypeScript Support

For TypeScript projects, you can type your imports:

```typescript
// types/imports.d.ts
declare module 'mikrokat' {
  interface Imports {
    Database?: typeof import('better-sqlite3').default;
    winston?: typeof import('winston');
    redis?: typeof import('redis');
  }
}
```

```typescript
// src/server.ts
export async function onFetch({imports}: {imports: Imports}) {
    if (imports.Database) {
        const db = new imports.Database('app.db'); // Fully typed
    }
}
```

## Best Practices

1. **Always check availability** - Use `if (imports.ModuleName)` before accessing imports
2. **Provide fallbacks** - Have backup plans when specific imports aren't available
3. **Keep it simple** - Don't over-complicate conditional logic
4. **Document platform requirements** - Note which platforms need which imports
5. **Test all targets** - Ensure your app works on all intended platforms
6. **Use TypeScript** - Get better IDE support and type safety
7. **Minimize platform differences** - Try to keep platform-specific code minimal

## Debugging

### Check Available Imports

Log available imports to understand what's loaded:

```javascript
export async function onStart({imports}) {
    console.log('Available imports:', Object.keys(imports));
}
```

### Conditional Debugging

```javascript
export async function onFetch({imports, env}) {
    if (env.NODE_ENV === 'development') {
        console.log('Target:', env.TARGET);
        console.log('Database available:', !!imports.Database);
        console.log('Logger available:', !!imports.winston);
    }
}
```

## Limitations

1. **Build-time resolution** - All conditions must be determinable at build time
2. **No dynamic conditions** - Can't use runtime values in conditions
3. **Import size** - Large imports increase bundle size for all platforms
4. **Platform compatibility** - Imported modules must be compatible with target platform

## Next Steps

- [Configuration Reference](../configuration/mikrokat-json.md) - Complete import configuration options
- [Request Handlers](./handlers.md) - Using imports in your handlers
- [Platform Guides](../configuration/overview.md) - Platform-specific deployment information