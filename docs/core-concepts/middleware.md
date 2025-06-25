# Middleware System

Mikrokat's middleware system allows you to intercept and process requests before they reach your main handler or after they've been processed. This enables cross-cutting concerns like logging, authentication, caching, and request transformation.

## Overview

Middleware in Mikrokat works as a pipeline:

1. **Pre-middleware** - Runs before your main `onFetch` handler
2. **Main handler** - Your `onFetch` function
3. **Fallback middleware** - Runs only if no previous handler returned a response

## Registering Middleware

Middleware is registered in the `onStart` handler using the `use()` function:

```javascript
export async function onStart({use}) {
    // Register pre-middleware
    use(loggerMiddleware);
    use(authMiddleware);
    use(corsMiddleware);
    
    // Register fallback middleware
    use(notFoundMiddleware, { fallback: true });
    use(errorHandlerMiddleware, { fallback: true });
}
```

## Middleware Functions

A middleware function has the same signature as your main handler:

```javascript
async function myMiddleware(event) {
    const {request, env, ctx, fs, imports, appData} = event;
    
    // Process the request
    if (shouldHandle(request)) {
        return new Response("Handled by middleware");
    }
    
    // Return undefined to continue to next handler
    return undefined;
}
```

**Important:** 
- If middleware returns a `Response`, the pipeline stops
- If middleware returns `undefined` or any falsy value, the next handler is tried

## Common Middleware Patterns

### Request Logging

```javascript
function loggerMiddleware({request}) {
    const url = new URL(request.url);
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}] ${request.method} ${url.pathname}${url.search}`);
    
    // Add request ID for tracing
    request.requestId = crypto.randomUUID();
    
    // Continue to next handler
    return undefined;
}

export async function onStart({use}) {
    use(loggerMiddleware);
}
```

### Authentication

```javascript
async function authMiddleware({request, env}) {
    const url = new URL(request.url);
    
    // Skip auth for public paths
    if (!url.pathname.startsWith('/api/protected/')) {
        return undefined;
    }
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({
            error: 'Unauthorized',
            message: 'Missing or invalid authorization header'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    const token = authHeader.slice(7);
    const user = await validateToken(token, env);
    
    if (!user) {
        return new Response(JSON.stringify({
            error: 'Unauthorized',
            message: 'Invalid token'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // Add user to request context
    request.user = user;
    
    // Continue to next handler
    return undefined;
}

async function validateToken(token, env) {
    // Implement your token validation logic
    // This could check against a database, JWT verification, etc.
    return { id: 1, name: 'John Doe' };
}
```

### CORS Handling

```javascript
function corsMiddleware({request}) {
    const url = new URL(request.url);
    
    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            }
        });
    }
    
    // For API routes, we'll add CORS headers in fallback middleware
    return undefined;
}

function corsResponseMiddleware({request}) {
    const url = new URL(request.url);
    
    // Only add CORS headers to API responses
    if (url.pathname.startsWith('/api/')) {
        return new Response('Internal Server Error', {
            status: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            }
        });
    }
    
    return undefined;
}

export async function onStart({use}) {
    use(corsMiddleware);
    use(corsResponseMiddleware, { fallback: true });
}
```

### Request Rate Limiting

```javascript
function rateLimitMiddleware({request, env, appData}) {
    const clientIP = request.headers.get('CF-Connecting-IP') || 
                    request.headers.get('X-Forwarded-For') || 
                    'unknown';
    
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 100;
    
    // Initialize rate limit store
    if (!appData.rateLimits) {
        appData.rateLimits = new Map();
    }
    
    const clientData = appData.rateLimits.get(clientIP) || {
        count: 0,
        resetTime: now + windowMs
    };
    
    // Reset if window expired
    if (now > clientData.resetTime) {
        clientData.count = 0;
        clientData.resetTime = now + windowMs;
    }
    
    clientData.count++;
    appData.rateLimits.set(clientIP, clientData);
    
    if (clientData.count > maxRequests) {
        return new Response(JSON.stringify({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded',
            retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        }), {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': Math.ceil((clientData.resetTime - now) / 1000).toString()
            }
        });
    }
    
    return undefined;
}
```

### Request Caching

```javascript
function cacheMiddleware({request, appData}) {
    const url = new URL(request.url);
    
    // Only cache GET requests
    if (request.method !== 'GET') {
        return undefined;
    }
    
    // Only cache specific paths
    if (!url.pathname.startsWith('/api/cache/')) {
        return undefined;
    }
    
    // Initialize cache
    if (!appData.cache) {
        appData.cache = new Map();
    }
    
    const cacheKey = url.pathname + url.search;
    const cached = appData.cache.get(cacheKey);
    
    if (cached && Date.now() < cached.expires) {
        console.log(`Cache hit: ${cacheKey}`);
        return new Response(cached.data, {
            headers: {
                'Content-Type': 'application/json',
                'X-Cache': 'HIT'
            }
        });
    }
    
    // Cache miss - continue to next handler
    return undefined;
}

// Cache response middleware (fallback)
function cacheResponseMiddleware({request, appData}) {
    const url = new URL(request.url);
    
    if (request.method === 'GET' && url.pathname.startsWith('/api/cache/')) {
        // This would run if no handler provided a response
        // You could implement cache-aside pattern here
        return new Response(JSON.stringify({
            error: 'Not Found',
            message: 'Resource not found and not cached'
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    return undefined;
}
```

### Request Transformation

```javascript
function requestTransformMiddleware({request}) {
    const url = new URL(request.url);
    
    // Normalize API paths
    if (url.pathname.startsWith('/v1/')) {
        // Rewrite v1 paths to current API
        const newPath = url.pathname.replace('/v1/', '/api/');
        url.pathname = newPath;
        
        // Create new request with modified URL
        const newRequest = new Request(url.toString(), {
            method: request.method,
            headers: request.headers,
            body: request.body
        });
        
        // Replace the request object
        Object.assign(request, newRequest);
    }
    
    return undefined;
}
```

## Fallback Middleware

Fallback middleware runs only if no previous handler (including your main `onFetch`) returned a response:

```javascript
function notFoundMiddleware({request}) {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('/api/')) {
        return new Response(JSON.stringify({
            error: 'Not Found',
            message: `API endpoint ${url.pathname} not found`,
            timestamp: new Date().toISOString()
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // Return HTML 404 for other paths
    return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>404 Not Found</title></head>
        <body>
            <h1>Page Not Found</h1>
            <p>The requested page could not be found.</p>
        </body>
        </html>
    `, {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
    });
}

export async function onStart({use}) {
    use(notFoundMiddleware, { fallback: true });
}
```

## Middleware Order

The order of middleware registration matters:

```javascript
export async function onStart({use}) {
    // This order is important:
    use(corsMiddleware);        // 1. Handle CORS first
    use(rateLimitMiddleware);   // 2. Rate limiting
    use(authMiddleware);        // 3. Authentication
    use(cacheMiddleware);       // 4. Check cache
    use(loggerMiddleware);      // 5. Log requests
    
    // Main onFetch handler runs here
    
    // Fallback middleware (reverse order often makes sense):
    use(cacheResponseMiddleware, { fallback: true });
    use(notFoundMiddleware, { fallback: true });
}
```

## Error Handling in Middleware

Handle errors gracefully in middleware:

```javascript
function safeMiddleware({request}) {
    try {
        return riskyOperation(request);
    } catch (error) {
        console.error('Middleware error:', error);
        
        // Return error response or continue
        return new Response(JSON.stringify({
            error: 'Middleware Error',
            message: 'An error occurred processing your request'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
```

## Advanced Patterns

### Conditional Middleware

```javascript
function conditionalMiddleware({request, env}) {
    // Only run in production
    if (env.ENVIRONMENT !== 'production') {
        return undefined;
    }
    
    // Only for specific routes
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/secure/')) {
        return undefined;
    }
    
    // Apply middleware logic
    return securityMiddleware({request, env});
}
```

### Middleware with Configuration

```javascript
function createAuthMiddleware(options = {}) {
    const {
        protectedPaths = ['/api/protected/'],
        allowedOrigins = ['*'],
        tokenHeader = 'Authorization'
    } = options;
    
    return async function authMiddleware({request, env}) {
        const url = new URL(request.url);
        
        // Check if path needs protection
        const needsAuth = protectedPaths.some(path => 
            url.pathname.startsWith(path)
        );
        
        if (!needsAuth) {
            return undefined;
        }
        
        // Implement auth logic with configuration
        // ...
    };
}

export async function onStart({use}) {
    const authMiddleware = createAuthMiddleware({
        protectedPaths: ['/api/admin/', '/api/user/'],
        allowedOrigins: ['https://myapp.com']
    });
    
    use(authMiddleware);
}
```

## Testing Middleware

Test middleware independently:

```javascript
// test/middleware.test.js
import { authMiddleware } from '../src/middleware/auth.js';

describe('Auth Middleware', () => {
    test('allows public paths', async () => {
        const request = new Request('https://example.com/api/public');
        const result = await authMiddleware({request, env: {}});
        
        expect(result).toBeUndefined();
    });
    
    test('blocks protected paths without auth', async () => {
        const request = new Request('https://example.com/api/protected/data');
        const result = await authMiddleware({request, env: {}});
        
        expect(result).toBeInstanceOf(Response);
        expect(result.status).toBe(401);
    });
});
```

## Best Practices

1. **Keep middleware focused** - Each middleware should have a single responsibility
2. **Order matters** - Register middleware in logical order
3. **Handle errors** - Always wrap risky operations in try/catch
4. **Performance** - Avoid expensive operations in frequently-called middleware
5. **Conditional execution** - Use guards to skip unnecessary processing
6. **Logging** - Log important middleware actions for debugging
7. **Testing** - Test middleware in isolation
8. **Documentation** - Document middleware behavior and configuration

## Next Steps

- [Event Object Reference](./event-object.md) - Understand all available event properties
- [Request Handlers](./handlers.md) - Learn about main handler functions
- [Advanced Examples](../examples/api-database.md) - See middleware in real applications