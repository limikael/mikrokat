# Common Issues and Solutions

This guide covers the most frequently encountered issues when working with Mikrokat and their solutions.

## Installation and Setup Issues

### Command Not Found

**Problem:**
```bash
$ mikrokat init
mikrokat: command not found
```

**Solutions:**

1. **Install globally:**
   ```bash
   npm install -g mikrokat
   ```

2. **Use npx:**
   ```bash
   npx mikrokat init
   ```

3. **Check PATH:**
   ```bash
   npm config get prefix
   # Add the bin directory to your PATH
   ```

### Missing Dependencies

**Problem:**
```bash
$ mikrokat serve
Error: Cannot find module 'commander'
```

**Solution:**
```bash
# Install project dependencies
npm install

# Or reinstall if corrupted
rm -rf node_modules package-lock.json
npm install
```

## Configuration Issues

### No Entrypoint Error

**Problem:**
```bash
$ mikrokat serve
Error: No entrypoint. Pass it on the command line using --main, or put it in mikrokat.json
```

**Solutions:**

1. **Add main to mikrokat.json:**
   ```json
   {
     "main": "src/main/server.js"
   }
   ```

2. **Use CLI option:**
   ```bash
   mikrokat serve --main src/server.js
   ```

3. **Check file exists:**
   ```bash
   ls -la src/main/server.js
   ```

### Invalid JSON Configuration

**Problem:**
```bash
$ mikrokat serve
Error: Unexpected token in JSON at position 45
```

**Solutions:**

1. **Validate JSON:**
   ```bash
   # Use a JSON validator
   cat mikrokat.json | python -m json.tool
   ```

2. **Common JSON errors:**
   ```json
   {
     "main": "server.js",    // ❌ Trailing comma
     "files": ["config.json"] // ✅ No trailing comma
   }
   ```

3. **Use JSON5 features correctly:**
   ```json5
   {
     main: "server.js",      // ✅ Unquoted keys
     files: [
       "config.json",        // ✅ Trailing comma allowed
     ],
   }
   ```

## Runtime Issues

### Module Resolution Errors

**Problem:**
```bash
Error: Cannot resolve module './utils/helper.js'
```

**Solutions:**

1. **Check file exists:**
   ```bash
   ls -la utils/helper.js
   ```

2. **Use correct relative paths:**
   ```javascript
   // From src/main/server.js to src/utils/helper.js
   import helper from '../utils/helper.js'; // ✅
   import helper from './utils/helper.js';  // ❌
   ```

3. **Check file extensions:**
   ```javascript
   import helper from './helper';     // ❌ Missing .js
   import helper from './helper.js';  // ✅
   ```

### Conditional Import Issues

**Problem:**
```bash
Error: Import condition not met for Database
```

**Solutions:**

1. **Check condition syntax:**
   ```json
   {
     "imports": [
       {
         "import": "Database",
         "from": "better-sqlite3",
         "if": {
           "target": "node"  // ✅ Correct condition
         }
       }
     ]
   }
   ```

2. **Verify target matches:**
   ```bash
   # Check current target
   TARGET=node mikrokat serve
   ```

3. **Add fallback imports:**
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

### Request Handler Errors

**Problem:**
```bash
TypeError: Cannot read property 'url' of undefined
```

**Solution:**
```javascript
export async function onFetch({request}) {
  // ✅ Check request exists
  if (!request) {
    return new Response('Bad Request', { status: 400 });
  }
  
  const url = new URL(request.url);
  // ... rest of handler
}
```

### Response Type Errors

**Problem:**
```bash
TypeError: Response constructor: At least one of init.body and input.body must be null
```

**Solution:**
```javascript
// ❌ Incorrect - body conflict
const response = new Response(body, {
  body: body // Don't set body in init
});

// ✅ Correct ways
const response1 = new Response(body);
const response2 = new Response(null, { status: 204 });
```

## Build Issues

### Build Target Not Found

**Problem:**
```bash
$ mikrokat build --target cloudflare
Error: Invalid target 'cloudflare'
```

**Solution:**
```bash
# Check available targets
mikrokat build --help

# Initialize target first
mikrokat init --target cloudflare
```

### Bundle Size Issues

**Problem:**
```bash
Error: Bundle size exceeds platform limit
```

**Solutions:**

1. **Use conditional imports:**
   ```json
   {
     "imports": [
       {
         "import": "HeavyLibrary",
         "from": "heavy-lib",
         "if": { "target": "node" }
       }
     ]
   }
   ```

2. **Dynamic imports in handlers:**
   ```javascript
   export async function onFetch({request}) {
     if (needsHeavyProcessing(request)) {
       const { processHeavy } = imports.HeavyLibrary;
       return processHeavy(request);
     }
   }
   ```

3. **Tree shaking optimization:**
   ```javascript
   // ✅ Import only what you need
   import { specific } from 'library';
   
   // ❌ Imports entire library
   import * as library from 'library';
   ```

## Development Server Issues

### Port Already in Use

**Problem:**
```bash
$ mikrokat serve
Error: listen EADDRINUSE :::3000
```

**Solutions:**

1. **Use different port:**
   ```bash
   mikrokat serve --port 3001
   ```

2. **Find and kill process:**
   ```bash
   # Find process using port 3000
   lsof -ti:3000
   kill -9 $(lsof -ti:3000)
   ```

3. **Use environment variable:**
   ```bash
   PORT=3001 mikrokat serve
   ```

### Static Files Not Served

**Problem:**
Static files in `public/` directory are not being served.

**Solutions:**

1. **Check directory structure:**
   ```
   project/
   ├── public/           # Must be named 'public'
   │   ├── index.html
   │   └── style.css
   └── mikrokat.json
   ```

2. **Check file permissions:**
   ```bash
   ls -la public/
   chmod 644 public/*
   ```

3. **Verify paths:**
   ```
   http://localhost:3000/index.html     # ✅
   http://localhost:3000/public/index.html # ❌
   ```

### Hot Reload Not Working

**Problem:**
Changes to handler code don't take effect without restart.

**Solutions:**

1. **Use file watching:**
   ```bash
   # Install nodemon
   npm install -g nodemon
   
   # Use with mikrokat
   nodemon --exec "mikrokat serve"
   ```

2. **Check file extensions:**
   ```javascript
   // Make sure files have .js extension
   // and use ES modules
   ```

## Platform-Specific Issues

### Cloudflare Workers

**Problem:**
```bash
Error: Uncaught ReferenceError: process is not defined
```

**Solution:**
```javascript
// ❌ Node.js specific code
const env = process.env.NODE_ENV;

// ✅ Use Mikrokat's env parameter
export async function onFetch({env}) {
  const nodeEnv = env.NODE_ENV;
}
```

### Vercel Edge Functions

**Problem:**
```bash
Error: Dynamic require of "fs" is not supported
```

**Solution:**
```javascript
// ❌ Node.js file system
import fs from 'fs';

// ✅ Use Mikrokat's virtual filesystem
export async function onFetch({fs}) {
  const config = fs.readFileSync('config.json', 'utf-8');
}
```

## Performance Issues

### Slow Cold Starts

**Problem:**
First request after deployment is very slow.

**Solutions:**

1. **Minimize startup code:**
   ```javascript
   export async function onStart({appData}) {
     // ✅ Minimal initialization
     appData.initialized = true;
   }
   
   export async function onFetch({appData, imports}) {
     // ✅ Lazy initialization
     if (!appData.db && imports.Database) {
       appData.db = new imports.Database();
     }
   }
   ```

2. **Use conditional imports:**
   ```json
   {
     "imports": [
       {
         "import": "Database",
         "from": "lightweight-db",
         "if": { "target": "cloudflare" }
       }
     ]
   }
   ```

### Memory Issues

**Problem:**
```bash
Error: Allocation failed - JavaScript heap out of memory
```

**Solutions:**

1. **Clean up resources:**
   ```javascript
   export async function onFetch({request, appData}) {
     try {
       return await processRequest(request);
     } finally {
       // Clean up temporary data
       if (appData.tempData) {
         delete appData.tempData;
       }
     }
   }
   ```

2. **Avoid memory leaks:**
   ```javascript
   // ❌ Potential memory leak
   const cache = new Map();
   export async function onFetch({request}) {
     cache.set(request.url, data); // Never cleaned
   }
   
   // ✅ With cleanup
   export async function onFetch({request, appData}) {
     if (!appData.cache) appData.cache = new Map();
     
     // Clean old entries
     if (appData.cache.size > 1000) {
       appData.cache.clear();
     }
   }
   ```

## Debugging Tips

### Enable Debug Logging

```bash
# Enable Mikrokat debug logs
DEBUG=mikrokat:* mikrokat serve

# Enable all debug logs
DEBUG=* mikrokat serve
```

### Request Tracing

```javascript
export async function onStart({use}) {
  use(({request}) => {
    request.startTime = Date.now();
    request.id = crypto.randomUUID();
    console.log(`[${request.id}] Request started`);
  });
}

export async function onFetch({request}) {
  console.log(`[${request.id}] Processing ${request.url}`);
  // ... handler logic
  console.log(`[${request.id}] Completed in ${Date.now() - request.startTime}ms`);
}
```

### Error Context

```javascript
export async function onFetch({request}) {
  try {
    return await handleRequest(request);
  } catch (error) {
    console.error('Request failed:', {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers),
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}
```

## Getting Help

If you can't resolve an issue:

1. **Check the logs** for detailed error messages
2. **Search existing issues** on GitHub
3. **Create a minimal reproduction** case
4. **Include environment details** (Node version, OS, Mikrokat version)
5. **Share configuration files** (remove sensitive data)

## Related Documentation

- [Platform-Specific Issues](./platform-issues.md)
- [Debugging Guide](./debugging.md)
- [CLI Reference](../cli/overview.md)
- [Configuration Reference](../configuration/mikrokat-json.md)