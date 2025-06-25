# Quick Start Guide

Get up and running with Mikrokat in just a few minutes.

## What is Mikrokat?

Mikrokat is a universal edge framework that lets you write once and deploy anywhere. It compiles your application into platform-specific edge runtimes for Cloudflare Workers, Vercel Edge Functions, Fastly Compute@Edge, and Netlify Edge Functions.

## Installation

Install Mikrokat globally via npm:

```bash
npm install -g mikrokat
```

Or use it directly with npx:

```bash
npx mikrokat --version
```

## Create Your First App

### 1. Initialize a New Project

```bash
mkdir my-edge-app
cd my-edge-app
mikrokat init
```

This creates:
- `package.json` with Mikrokat dependencies
- `mikrokat.json` configuration file
- `src/main/server.js` with a basic handler
- `public/` directory for static assets

### 2. Install Dependencies

```bash
npm install
```

### 3. Add a Platform Target

Choose your deployment platform and initialize it:

```bash
# For Cloudflare Workers
mikrokat init --target=cloudflare

# For Vercel Edge Functions
mikrokat init --target=vercel

# For Fastly Compute@Edge
mikrokat init --target=fastly

# For Netlify Edge Functions
mikrokat init --target=netlify
```

This adds platform-specific configuration files and npm scripts.

### 4. Start Development

Run your app locally in Node.js:

```bash
npm run start
```

Or run in a simulated edge environment:

```bash
# Replace 'cloudflare' with your target platform
npm run dev:cloudflare
```

Your app will be available at `http://localhost:3000`.

### 5. Deploy to Edge

Build and deploy your app:

```bash
npm run deploy:cloudflare
```

## Your First Handler

Edit `src/main/server.js`:

```javascript
export async function onFetch({request, env}) {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/hello') {
        return new Response(JSON.stringify({
            message: 'Hello from Mikrokat!',
            timestamp: new Date().toISOString(),
            platform: env.PLATFORM || 'local'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    return new Response('Not Found', { status: 404 });
}

// Optional: Run initialization code
export async function onStart({use}) {
    console.log('App starting...');
    
    // Register middleware
    use(async ({request}) => {
        console.log(`${request.method} ${request.url}`);
        // Return undefined to continue to next handler
    });
}
```

## Next Steps

- Learn about [Request Handlers](../core-concepts/handlers.md)
- Explore [Configuration Options](../configuration/mikrokat-json.md)
- Add [Static Assets](../advanced/static-assets.md)
- Implement [Middleware](../core-concepts/middleware.md)
- Deploy to [Multiple Platforms](../platforms/overview.md)

## Common Commands

```bash
# Initialize project
mikrokat init

# Add platform target
mikrokat init --target=cloudflare

# Start local development
npm run start

# Start platform-specific development
npm run dev:cloudflare

# Build for platform
npm run build

# Deploy to platform
npm run deploy:cloudflare

# Show help
mikrokat --help
```