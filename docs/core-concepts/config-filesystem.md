# Config Filesystem

The virtual config filesystem makes it possible to include configuration or other static files directly in your edge deployment, which is essential for platforms that don't support traditional file access. This system bundles files at build time and makes them available through a simple filesystem API at runtime.

## Overview

Edge computing platforms like Cloudflare Workers and Vercel Edge Functions don't have traditional filesystem access. The config filesystem solves this by:

1. **Build-time bundling** - Files are read and embedded into your deployment bundle
2. **Runtime access** - Files are accessible through a virtual filesystem API
3. **Cross-platform compatibility** - Works identically across all supported edge platforms

**Important:** This is not intended for serving static content to clients (use the [Static Content](./static-content.md) system for that), but for smaller configuration files, templates, and data that your application needs at runtime.

## Configuration

Specify files to include in your `mikrokat.json`:

```json
{
  "files": [
    "config.json",
    "templates/*.html", 
    "data/seed.sql",
    "certs/*.pem"
  ]
}
```

## File Patterns

The config filesystem supports several pattern types:

### Exact Files
```json
{
  "files": [
    "config.json",
    "database.sql",
    "template.html"
  ]
}
```

### Glob Patterns
```json
{
  "files": [
    "templates/*.html",      // All HTML files in templates/
    "configs/*.json",        // All JSON files in configs/
    "data/**/*.csv",         // All CSV files in data/ and subdirectories
    "assets/*.{png,jpg}"     // PNG and JPG files in assets/
  ]
}
```

### Directory Patterns
```json
{
  "files": [
    "locales/**/*",          // Everything in locales/ directory
    "schemas/**/*.json"      // All JSON files in schemas/ and subdirectories
  ]
}
```

## Runtime API

Access files in your handlers using the `fs` parameter:

```javascript
export async function onFetch({request, fs}) {
    // Read a JSON configuration file
    const config = JSON.parse(fs.readFileSync("config.json", "utf-8"));
    
    // Read an HTML template
    const template = fs.readFileSync("templates/email.html", "utf-8");
    
    // Read binary data
    const imageBuffer = fs.readFileSync("assets/logo.png");
    
    return new Response("Configuration loaded");
}
```

### Available Methods

#### readFileSync(path, encoding?)

Reads a file synchronously.

**Parameters:**
- `path` - File path relative to project root
- `encoding` - Optional encoding (`"utf-8"`, `"base64"`, etc.)

**Returns:**
- If `encoding` is specified: String
- If no encoding: Uint8Array buffer

```javascript
// Read as string
const text = fs.readFileSync("config.txt", "utf-8");

// Read as buffer  
const buffer = fs.readFileSync("image.png");

// Read as base64
const base64 = fs.readFileSync("certificate.pem", "base64");
```

#### existsSync(path)

Checks if a file exists in the virtual filesystem.

```javascript
if (fs.existsSync("optional-config.json")) {
    const config = JSON.parse(fs.readFileSync("optional-config.json", "utf-8"));
}
```

## Common Use Cases

### Configuration Files

```json
// mikrokat.json
{
  "files": ["config.json", "config/*.yml"]
}
```

```javascript
// src/server.js
export async function onStart({fs, appData}) {
    // Load main configuration
    const config = JSON.parse(fs.readFileSync("config.json", "utf-8"));
    appData.config = config;
    
    // Load environment-specific config if it exists
    const envConfig = `config/${process.env.NODE_ENV || 'development'}.yml`;
    if (fs.existsSync(envConfig)) {
        const yaml = await import('yaml');
        const envSettings = yaml.parse(fs.readFileSync(envConfig, "utf-8"));
        Object.assign(appData.config, envSettings);
    }
}

export async function onFetch({request, appData}) {
    const apiKey = appData.config.apiKey;
    // Use configuration...
}
```

### Email Templates

```json
// mikrokat.json
{
  "files": ["templates/**/*.html"]
}
```

```javascript
// src/server.js
export async function onFetch({request, fs}) {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/send-email') {
        const template = fs.readFileSync("templates/welcome.html", "utf-8");
        
        // Replace template variables
        const personalizedEmail = template
            .replace("{{name}}", userData.name)
            .replace("{{email}}", userData.email);
        
        await sendEmail(personalizedEmail);
        return new Response("Email sent");
    }
}
```

### Database Schema and Seeds

```json
// mikrokat.json
{
  "files": ["database/**/*.sql"]
}
```

```javascript
// src/server.js
export async function onStart({fs, imports, appData}) {
    if (imports.Database) {
        const db = new imports.Database(":memory:");
        
        // Load schema
        const schema = fs.readFileSync("database/schema.sql", "utf-8");
        db.exec(schema);
        
        // Load seed data
        const seedData = fs.readFileSync("database/seeds.sql", "utf-8");
        db.exec(seedData);
        
        appData.db = db;
    }
}
```

### Localization Files

```json
// mikrokat.json  
{
  "files": ["locales/**/*.json"]
}
```

```javascript
// src/server.js
export async function onStart({fs, appData}) {
    appData.translations = {};
    
    // Load all translation files
    const languages = ['en', 'es', 'fr', 'de'];
    for (const lang of languages) {
        const translationFile = `locales/${lang}.json`;
        if (fs.existsSync(translationFile)) {
            appData.translations[lang] = JSON.parse(
                fs.readFileSync(translationFile, "utf-8")
            );
        }
    }
}

export async function onFetch({request, appData}) {
    const acceptLanguage = request.headers.get('Accept-Language') || 'en';
    const lang = acceptLanguage.split(',')[0].split('-')[0];
    
    const t = appData.translations[lang] || appData.translations['en'];
    
    return new Response(JSON.stringify({
        message: t.welcome || 'Welcome'
    }));
}
```

### Certificates and Keys

```json
// mikrokat.json
{
  "files": ["certs/*.pem", "keys/*.key"]
}
```

```javascript
// src/server.js
export async function onFetch({request, fs, env}) {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/secure') {
        // Load certificate for JWT verification
        const publicKey = fs.readFileSync("certs/public.pem", "utf-8");
        
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        
        try {
            const jwt = await import('jsonwebtoken');
            const payload = jwt.verify(token, publicKey);
            return new Response(`Hello ${payload.sub}`);
        } catch {
            return new Response('Unauthorized', { status: 401 });
        }
    }
}
```

## File Size Considerations

The config filesystem is designed for smaller files that need to be available at runtime. Consider these limits:

### Platform Limits
- **Cloudflare Workers**: 25MB total script size (including files)
- **Vercel Edge Functions**: 1MB per function
- **Fastly Compute@Edge**: 50MB per package
- **Netlify Edge Functions**: 50MB per function

### Best Practices
- Keep individual files under 1MB when possible
- Compress large text files (JSON, XML, etc.) before bundling
- Use external services for large datasets
- Consider lazy loading for optional files

## File Processing

Files are processed at build time, allowing for optimization:

### Automatic Compression
Text files are automatically compressed in the bundle and decompressed at runtime.

### Path Normalization  
File paths are normalized to use forward slashes regardless of the build platform.

### Build-time Validation
Invalid file patterns or missing files cause build errors, catching issues early.

## Error Handling

Handle file access errors gracefully:

```javascript
export async function onFetch({request, fs}) {
    try {
        const config = fs.readFileSync("config.json", "utf-8");
        const parsed = JSON.parse(config);
        return new Response("Config loaded");
    } catch (error) {
        console.error("Failed to load config:", error);
        
        // Return a default response or error
        return new Response("Configuration error", { status: 500 });
    }
}
```

## Comparison with Static Content

| Feature | Config Filesystem | Static Content |
|---------|------------------|----------------|
| **Purpose** | Application files | Client-served assets |
| **Access** | Runtime `fs` API | Direct URL serving |
| **Size** | Small files preferred | Any size supported |
| **Processing** | Build-time bundling | Runtime serving |
| **Visibility** | Private to application | Publicly accessible |
| **Examples** | Config, templates, schemas | Images, CSS, HTML |

## Security Considerations

1. **No sensitive data** - Don't include secrets, passwords, or API keys in bundled files
2. **Environment variables** - Use `env` parameter for sensitive configuration
3. **File validation** - Validate file contents before using
4. **Path traversal** - File paths are restricted to prevent directory traversal attacks

## Advanced Patterns

### Conditional File Loading

```javascript
export async function onStart({fs, appData}) {
    // Load different configs based on environment
    const configFile = process.env.NODE_ENV === 'production' 
        ? 'config/production.json'
        : 'config/development.json';
    
    if (fs.existsSync(configFile)) {
        appData.config = JSON.parse(fs.readFileSync(configFile, "utf-8"));
    }
}
```

### Template Compilation

```javascript
export async function onStart({fs, appData}) {
    // Pre-compile templates at startup
    appData.templates = {};
    
    const templateFiles = ['welcome.html', 'notification.html', 'error.html'];
    for (const template of templateFiles) {
        const templatePath = `templates/${template}`;
        if (fs.existsSync(templatePath)) {
            const content = fs.readFileSync(templatePath, "utf-8");
            appData.templates[template] = compileTemplate(content);
        }
    }
}
```

### File-based Routing

```javascript
export async function onFetch({request, fs}) {
    const url = new URL(request.url);
    const routeFile = `routes${url.pathname}.json`;
    
    if (fs.existsSync(routeFile)) {
        const routeConfig = JSON.parse(fs.readFileSync(routeFile, "utf-8"));
        return handleRoute(request, routeConfig);
    }
    
    return new Response('Not Found', { status: 404 });
}
```

## Next Steps

- [Static Content](./static-content.md) - Learn about serving client-facing assets
- [Conditional Imports](./conditional-imports.md) - Platform-specific module loading
- [Configuration Reference](../configuration/mikrokat-json.md) - Complete configuration options