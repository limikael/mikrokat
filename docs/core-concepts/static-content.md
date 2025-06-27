# Static Content

Mikrokat provides automatic static file serving through a conventional `public` directory. Files placed in this directory are served directly without invoking your request handlers, making it perfect for assets, images, stylesheets, and client-side JavaScript.

## How It Works

By strong convention, all files in the `public` directory will be served statically. When a request comes in:

1. **Check for static file** - Mikrokat first checks if a file exists in `public/` matching the request path
2. **Serve directly** - If found, the file is served immediately with appropriate headers
3. **Continue to handlers** - If not found, the request continues to your `onFetch` handler

This means your handler will **not** be invoked for existing static content, improving performance and reducing unnecessary processing.

## Directory Structure

```
my-mikrokat-app/
├── public/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── images/
│   │   ├── logo.png
│   │   └── hero.jpg
│   └── assets/
│       ├── fonts/
│       └── icons/
├── src/
│   └── server.js
└── mikrokat.json
```

## URL Mapping

Static files are served at paths matching their location in the `public` directory:

| File Path | URL |
|-----------|-----|
| `public/index.html` | `/index.html` |
| `public/styles.css` | `/styles.css` |
| `public/images/logo.png` | `/images/logo.png` |
| `public/assets/fonts/main.woff2` | `/assets/fonts/main.woff2` |

## Common Use Cases

### Web Assets

```
public/
├── index.html          # Main page
├── app.css            # Stylesheets
├── app.js             # Client-side JavaScript
└── favicon.ico        # Browser icon
```

### Images and Media

```
public/
├── images/
│   ├── hero.jpg
│   ├── gallery/
│   │   ├── photo1.jpg
│   │   └── photo2.jpg
│   └── thumbnails/
└── videos/
    └── intro.mp4
```

### Progressive Web App Assets

```
public/
├── manifest.json      # PWA manifest
├── sw.js             # Service worker
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

## Content Types

Mikrokat automatically sets appropriate `Content-Type` headers based on file extensions:

| Extension | Content-Type |
|-----------|--------------|
| `.html` | `text/html` |
| `.css` | `text/css` |
| `.js` | `application/javascript` |
| `.json` | `application/json` |
| `.png` | `image/png` |
| `.jpg`, `.jpeg` | `image/jpeg` |
| `.gif` | `image/gif` |
| `.svg` | `image/svg+xml` |
| `.woff`, `.woff2` | `font/woff`, `font/woff2` |
| `.txt` | `text/plain` |

For files with unknown extensions, `application/octet-stream` is used.

## Cache Headers

Static files are automatically served with appropriate caching headers to improve performance:

```
Cache-Control: public, max-age=31536000
ETag: "abc123..."
```

This tells browsers and CDNs to cache static assets for one year, with ETag support for conditional requests.

## Combining with Dynamic Routes

Static files take precedence over dynamic routes. If you have both `public/api/data.json` and a handler for `/api/data`, the static file will be served.

```javascript
export async function onFetch({request}) {
    const url = new URL(request.url);
    
    // This will only run if no static file exists at this path
    if (url.pathname === '/api/users') {
        return new Response(JSON.stringify([
            { id: 1, name: 'John' }
        ]), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    return new Response('Not Found', { status: 404 });
}
```

## Dynamic Static Content

For cases where you need to serve static-like content dynamically, you can still use your handlers:

```javascript
export async function onFetch({request, fs}) {
    const url = new URL(request.url);
    
    // Serve template files dynamically
    if (url.pathname.startsWith('/templates/')) {
        const templateName = url.pathname.slice(11); // Remove '/templates/'
        
        try {
            const template = fs.readFileSync(`templates/${templateName}`, 'utf-8');
            return new Response(template, {
                headers: { 'Content-Type': 'text/html' }
            });
        } catch {
            return new Response('Template not found', { status: 404 });
        }
    }
}
```

## SPA (Single Page Application) Support

For SPAs that use client-side routing, you can serve your main HTML file for all routes:

```javascript
export async function onFetch({request, fs}) {
    const url = new URL(request.url);
    
    // Serve SPA routes
    if (!url.pathname.startsWith('/api/') && 
        !url.pathname.includes('.') && 
        url.pathname !== '/') {
        
        // Return the main SPA HTML file
        const html = fs.readFileSync('public/index.html', 'utf-8');
        return new Response(html, {
            headers: { 'Content-Type': 'text/html' }
        });
    }
}
```

Note: This assumes your SPA files are in the config filesystem via `mikrokat.json` files array, not the public directory.

## Platform Considerations

### Cloudflare Workers
- Static assets are served from Cloudflare's global CDN
- Excellent performance worldwide
- Supports large files through R2 integration

### Vercel Edge Functions
- Static files are served through Vercel's CDN
- Automatic optimization for images
- Integrated with Vercel's build system

### Fastly Compute@Edge
- Assets served through Fastly's CDN
- Advanced caching configuration options
- Support for edge-side includes (ESI)

### Netlify Edge Functions
- Files served through Netlify's global CDN
- Automatic image optimization available
- Integration with Netlify's deployment pipeline

## Best Practices

1. **Keep it lightweight** - Only include necessary static files to reduce bundle size
2. **Optimize images** - Compress images before adding to `public/`
3. **Use appropriate file names** - Include version hashes for cache busting when needed
4. **Consider CDN** - For large assets, consider external CDN services
5. **Security** - Don't put sensitive files in `public/` as they're publicly accessible
6. **Organization** - Use subdirectories to organize different types of assets

## File Size Limits

Different platforms have different limits for static assets:

- **Cloudflare Workers**: 25MB per script (including assets)
- **Vercel Edge Functions**: 1MB per function
- **Fastly Compute@Edge**: 50MB per package
- **Netlify Edge Functions**: 50MB per function

For larger assets, consider:
- External CDN services
- Platform-specific object storage (R2, S3, etc.)
- Dynamic loading through your handlers

## Example: Complete Static Site

```
public/
├── index.html
├── about.html
├── contact.html
├── css/
│   ├── main.css
│   └── components.css  
├── js/
│   ├── app.js
│   └── utils.js
├── images/
│   ├── logo.svg
│   ├── team/
│   └── products/
└── assets/
    ├── fonts/
    └── documents/
        └── brochure.pdf
```

With this structure, you can serve a complete static site while still having the option to add dynamic functionality through your handlers.

## Next Steps

- [Config Filesystem](./config-filesystem.md) - Learn about including files in your application bundle
- [Request Handlers](./handlers.md) - Handle dynamic requests alongside static content
- [Deployment Guide](../configuration/overview.md) - Deploy your static + dynamic application