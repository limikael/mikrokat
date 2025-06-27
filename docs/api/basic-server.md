# Basic HTTP Server

This example demonstrates how to create a simple HTTP server with Mikrokat that handles different routes and HTTP methods.

## Project Setup

Initialize a new Mikrokat project:

```bash
mkdir basic-server-example
cd basic-server-example
mikrokat init
npm install
```

## Basic Handler

Edit `src/main/server.js`:

```javascript
export async function onFetch({request, env}) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Route handling
    if (path === '/') {
        return new Response(getHomePage(), {
            headers: { 'Content-Type': 'text/html' }
        });
    }

    if (path === '/api/hello') {
        return handleHello(request);
    }

    if (path === '/api/time') {
        return handleTime();
    }

    if (path.startsWith('/api/echo')) {
        return handleEcho(request);
    }

    // Static file handling is automatic for files in public/

    return new Response('Not Found', { status: 404 });
}

function getHomePage() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Basic Mikrokat Server</title>
</head>
<body>
    <h1>Welcome to Mikrokat!</h1>
    <p>Try these endpoints:</p>
    <ul>
        <li><a href="/api/hello">/api/hello</a> - Simple greeting</li>
        <li><a href="/api/time">/api/time</a> - Current time</li>
        <li><a href="/api/echo/test">/api/echo/test</a> - Echo URL path</li>
    </ul>
</body>
</html>
    `.trim();
}

async function handleHello(request) {
    const url = new URL(request.url);
    const name = url.searchParams.get('name') || 'World';
    
    const response = {
        message: `Hello, ${name}!`,
        timestamp: new Date().toISOString(),
        method: request.method
    };

    return new Response(JSON.stringify(response, null, 2), {
        headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

function handleTime() {
    const now = new Date();
    
    const response = {
        iso: now.toISOString(),
        unix: Math.floor(now.getTime() / 1000),
        formatted: now.toLocaleString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    return new Response(JSON.stringify(response, null, 2), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function handleEcho(request) {
    const url = new URL(request.url);
    const echoPath = url.pathname.replace('/api/echo', '');
    
    const response = {
        path: echoPath,
        query: Object.fromEntries(url.searchParams),
        method: request.method,
        headers: Object.fromEntries(request.headers),
        url: request.url
    };

    // If it's a POST request, include the body
    if (request.method === 'POST') {
        try {
            const contentType = request.headers.get('content-type') || '';
            
            if (contentType.includes('application/json')) {
                response.body = await request.json();
            } else if (contentType.includes('text/')) {
                response.body = await request.text();
            } else {
                response.body = '[Binary data]';
            }
        } catch (error) {
            response.bodyError = error.message;
        }
    }

    return new Response(JSON.stringify(response, null, 2), {
        headers: { 'Content-Type': 'application/json' }
    });
}
```

## Error Handling

Add comprehensive error handling:

```javascript
export async function onFetch({request}) {
    try {
        return await handleRequest(request);
    } catch (error) {
        console.error('Request failed:', error);
        
        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            message: error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleRequest(request) {
    const url = new URL(request.url);
    
    // Validate request
    if (url.pathname.length > 1000) {
        throw new Error('Request path too long');
    }
    
    // Your route handling logic here...
}
```

## CORS Support

Add CORS support for API endpoints:

```javascript
function createCORSResponse(data, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        ...options.headers
    };

    return new Response(JSON.stringify(data, null, 2), {
        status: options.status || 200,
        headers
    });
}

export async function onFetch({request}) {
    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    }

    // Your regular request handling...
    const response = { message: 'Hello World' };
    return createCORSResponse(response);
}
```

## Request Logging

Add request logging with middleware:

```javascript
export async function onStart({use}) {
    // Add request logging middleware
    use(async ({request}) => {
        const start = Date.now();
        const url = new URL(request.url);
        
        console.log(`→ ${request.method} ${url.pathname}${url.search}`);
        
        // Store start time for response logging
        request.startTime = start;
        
        // Return undefined to continue to next handler
    });

    // Add response logging middleware (fallback)
    use(async ({request}) => {
        const duration = Date.now() - (request.startTime || Date.now());
        console.log(`← ${request.method} completed in ${duration}ms`);
    }, { fallback: true });
}
```

## Static Files

Create a simple HTML page in `public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mikrokat Basic Server</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 2rem; }
        .api-test { margin: 1rem 0; padding: 1rem; background: #f5f5f5; }
        button { padding: 0.5rem 1rem; margin: 0.5rem; }
    </style>
</head>
<body>
    <h1>Mikrokat Basic Server</h1>
    
    <div class="api-test">
        <h3>Test API Endpoints</h3>
        <button onclick="testAPI('/api/hello')">Test Hello</button>
        <button onclick="testAPI('/api/time')">Test Time</button>
        <button onclick="testAPI('/api/echo/test?param=value')">Test Echo</button>
        
        <pre id="result"></pre>
    </div>

    <script>
        async function testAPI(endpoint) {
            try {
                const response = await fetch(endpoint);
                const data = await response.text();
                document.getElementById('result').textContent = data;
            } catch (error) {
                document.getElementById('result').textContent = 'Error: ' + error.message;
            }
        }
    </script>
</body>
</html>
```

## Testing

Start the development server:

```bash
npm run start
```

Test the endpoints:

```bash
# Test basic endpoints
curl http://localhost:3000/api/hello
curl http://localhost:3000/api/hello?name=Alice
curl http://localhost:3000/api/time
curl http://localhost:3000/api/echo/test?param=value

# Test POST with JSON
curl -X POST http://localhost:3000/api/echo/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "email": "john@example.com"}'
```

## Deployment

Deploy to your preferred platform:

```bash
# Initialize target
mikrokat init --target cloudflare

# Build and deploy
npm run build
npm run deploy:cloudflare
```

## Complete Example

Here's the complete `server.js` with all features:

```javascript
export async function onStart({use}) {
    // Request logging
    use(async ({request}) => {
        const start = Date.now();
        console.log(`→ ${request.method} ${new URL(request.url).pathname}`);
        request.startTime = start;
    });

    // Response logging (fallback)
    use(async ({request}) => {
        const duration = Date.now() - (request.startTime || Date.now());
        console.log(`← Completed in ${duration}ms`);
    }, { fallback: true });
}

export async function onFetch({request}) {
    try {
        return await handleRequest(request);
    } catch (error) {
        console.error('Request failed:', error);
        return createErrorResponse(error);
    }
}

async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return createCORSResponse(null);
    }

    // Route handling
    switch (path) {
        case '/':
            return new Response(getHomePage(), {
                headers: { 'Content-Type': 'text/html' }
            });
        case '/api/hello':
            return handleHello(request);
        case '/api/time':
            return handleTime();
        default:
            if (path.startsWith('/api/echo')) {
                return handleEcho(request);
            }
            return new Response('Not Found', { status: 404 });
    }
}

// ... (rest of the handler functions from above)
```

This basic server example demonstrates:
- Route handling
- Query parameter processing
- JSON responses
- Error handling
- CORS support
- Request logging
- Static file serving
- POST request handling

## Next Steps

- [API with Database](./api-database.md) - Add database integration
- [Static Site with Dynamic Routes](./static-dynamic.md) - Mix static and dynamic content
- [Middleware Guide](../core-concepts/middleware.md) - Advanced middleware patterns