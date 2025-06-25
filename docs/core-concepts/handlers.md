# Request Handlers

Mikrokat applications are built around handler functions that respond to different types of events. This document covers all available handler types and their usage.

## Handler Types

### onFetch Handler

The `onFetch` handler is the primary request handler that processes incoming HTTP requests.

```javascript
export async function onFetch({request, env, ctx, fs, imports, appData, localFetch}) {
    // Handle HTTP request
    return new Response('Hello World!');
}
```

**Parameters:**
- `request` - Standard [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) object
- `env` - Environment variables and service bindings
- `ctx` - Platform-specific context (varies by platform)
- `fs` - Virtual filesystem for configuration files
- `imports` - Resolved conditional imports
- `appData` - Shared application data object
- `localFetch` - Function for internal requests

**Example:**
```javascript
export async function onFetch({request, env}) {
    const url = new URL(request.url);
    
    // Handle different routes
    switch (url.pathname) {
        case '/api/users':
            return handleUsers(request, env);
        case '/api/health':
            return new Response('OK');
        default:
            return new Response('Not Found', { status: 404 });
    }
}

async function handleUsers(request, env) {
    if (request.method === 'GET') {
        return new Response(JSON.stringify([
            { id: 1, name: 'John' },
            { id: 2, name: 'Jane' }
        ]), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    return new Response('Method Not Allowed', { status: 405 });
}
```

### onStart Handler

The `onStart` handler runs when your application instance starts. Use it for initialization tasks and middleware registration.

```javascript
export async function onStart({env, fs, imports, appData, use}) {
    // Initialize services
    if (imports.Database) {
        appData.db = new imports.Database(env.DATABASE_URL);
    }
    
    // Register middleware
    use(loggerMiddleware);
    use(corsMiddleware, { fallback: true });
}
```

**Important Notes:**
- Runs once per instance (not per request)
- Your handler may start/stop multiple times during its lifetime
- Don't rely on it running "once globally" - treat it as cache population
- Instances may run simultaneously in multiple global locations

**Parameters:**
- `env` - Environment variables and service bindings
- `fs` - Virtual filesystem for configuration files
- `imports` - Resolved conditional imports
- `appData` - Shared application data object (initially `{}`)
- `use` - Function to register middleware

### onSchedule Handler

The `onSchedule` handler processes scheduled events (cron jobs). Platform support varies.

```javascript
export async function onSchedule({cron, env, fs, imports, appData}) {
    console.log(`Scheduled task triggered: ${cron}`);
    
    // Perform scheduled work
    if (cron === '0 0 * * *') { // Daily at midnight
        await performDailyCleanup(env, appData);
    }
}

async function performDailyCleanup(env, appData) {
    // Clean up temporary data, send reports, etc.
    console.log('Performing daily cleanup...');
}
```

**Parameters:**
- `cron` - The cron expression that triggered the event
- `env` - Environment variables and service bindings
- `fs` - Virtual filesystem for configuration files
- `imports` - Resolved conditional imports
- `appData` - Shared application data object

## Event Object Properties

All handlers receive an event object with these common properties:

### request
- **Type:** `Request`
- **Available in:** `onFetch` only
- **Description:** Standard Web API Request object

### ctx
- **Type:** Platform-specific
- **Available in:** `onFetch` only
- **Description:** Platform-dependent context variable

### env
- **Type:** `Object`
- **Available in:** All handlers
- **Description:** Environment variables and service bindings

### fs
- **Type:** `MiniFs`
- **Available in:** All handlers
- **Description:** Virtual filesystem for accessing bundled configuration files

### imports
- **Type:** `Object`
- **Available in:** All handlers
- **Description:** Resolved conditional imports based on current platform

### appData
- **Type:** `Object`
- **Available in:** All handlers
- **Description:** Shared object for storing runtime data across requests

### localFetch
- **Type:** `Function`
- **Available in:** `onFetch` only
- **Description:** Function for making internal requests to your own handlers

### cron
- **Type:** `String`
- **Available in:** `onSchedule` only
- **Description:** The cron expression that triggered the scheduled event

## Handler Patterns

### Request Routing

```javascript
export async function onFetch({request}) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Route matching
    if (path.startsWith('/api/')) {
        return handleAPI(request, path.slice(5));
    }
    
    if (path.startsWith('/admin/')) {
        return handleAdmin(request, path.slice(7));
    }
    
    // Default handler
    return new Response('Not Found', { status: 404 });
}
```

### Method Handling

```javascript
export async function onFetch({request}) {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/data') {
        switch (request.method) {
            case 'GET':
                return getData();
            case 'POST':
                return createData(await request.json());
            case 'PUT':
                return updateData(await request.json());
            case 'DELETE':
                return deleteData();
            default:
                return new Response('Method Not Allowed', { status: 405 });
        }
    }
}
```

### Error Handling

```javascript
export async function onFetch({request}) {
    try {
        // Your application logic
        return await processRequest(request);
    } catch (error) {
        console.error('Request failed:', error);
        
        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
```

### Using localFetch

The `localFetch` function allows you to make internal requests to your own application:

```javascript
export async function onFetch({request, localFetch}) {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/aggregate') {
        // Make internal requests
        const [users, posts] = await Promise.all([
            localFetch('/api/users').then(r => r.json()),
            localFetch('/api/posts').then(r => r.json())
        ]);
        
        return new Response(JSON.stringify({
            users: users.length,
            posts: posts.length
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // Handle other routes...
}
```

## Best Practices

1. **Keep handlers async** - Always declare handlers as `async function`
2. **Handle errors gracefully** - Wrap logic in try/catch blocks
3. **Use meaningful status codes** - Return appropriate HTTP status codes
4. **Validate input** - Always validate request data before processing
5. **Minimize startup work** - Keep `onStart` lightweight for faster cold starts
6. **Share data via appData** - Use the `appData` object to share state between requests
7. **Return proper responses** - Always return a `Response` object from `onFetch`

## Next Steps

- Learn about [Middleware System](./middleware.md)
- Understand the [Event Object](./event-object.md) in detail
- Explore [Platform-specific features](../platforms/overview.md)