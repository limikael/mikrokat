# mikrokat.json Configuration Reference

The `mikrokat.json` file is the central configuration file for your Mikrokat application. This document provides a complete reference of all available configuration options.

## File Location

The `mikrokat.json` file should be placed in the root directory of your project, alongside your `package.json`.

## Basic Structure

```json
{
  "main": "src/main/server.js",
  "files": [],
  "imports": [],
  "services": {}
}
```

## Configuration Options

### main

- **Type:** `string`
- **Required:** Yes (unless specified via CLI)
- **Description:** Path to your main server entrypoint file relative to project root

```json
{
  "main": "src/main/server.js"
}
```

The main file should export the handler functions (`onFetch`, `onStart`, `onSchedule`).

### files

- **Type:** `string[]`
- **Default:** `[]`
- **Description:** Array of file patterns to include in the virtual filesystem

```json
{
  "files": [
    "config.json",
    "templates/*.html",
    "data/users.json",
    "configs/*.yml"
  ]
}
```

**Supported patterns:**
- Exact files: `"config.json"`
- Glob patterns: `"templates/*.html"`
- Directory patterns: `"data/**/*.json"`

**Usage in code:**
```javascript
export async function onFetch({fs}) {
    const config = JSON.parse(fs.readFileSync("config.json", "utf-8"));
    const template = fs.readFileSync("templates/index.html", "utf-8");
    return new Response(template);
}
```

### imports

- **Type:** `ImportDefinition[]`
- **Default:** `[]`
- **Description:** Conditional imports for platform-specific modules

```json
{
  "imports": [
    {
      "import": "Database",
      "from": "better-sqlite3",
      "if": {
        "target": "node"
      }
    },
    {
      "import": "Database",
      "from": "@neondatabase/serverless",
      "if": {
        "target": "cloudflare"
      }
    }
  ]
}
```

#### ImportDefinition Properties

##### import

- **Type:** `string | string[] | object`
- **Required:** Yes
- **Description:** Specifies what to import from the module

**String (default export):**
```json
{
  "import": "Database",
  "from": "better-sqlite3"
}
```

**Array (named exports):**
```json
{
  "import": ["connect", "query", "close"],
  "from": "my-db-lib"
}
```

**Object (named exports with aliases):**
```json
{
  "import": {
    "default": "DB",
    "connect": "dbConnect"
  },
  "from": "database-lib"
}
```

##### from

- **Type:** `string`
- **Required:** Yes
- **Description:** Module specifier (npm package name or relative path)

```json
{
  "import": "MyUtil",
  "from": "./utils/helper.js"
}
```

##### if

- **Type:** `object`
- **Default:** `{}` (always matches)
- **Description:** Conditions that must be met for this import to be included

```json
{
  "import": "Database",
  "from": "better-sqlite3",
  "if": {
    "target": "node",
    "env": "development"
  }
}
```

**Available condition keys:**
- `target` - Deployment target (`node`, `cloudflare`, `vercel`, `fastly`, `netlify`)
- `env` - Environment (`development`, `production`, or custom values)

### services

- **Type:** `object`
- **Default:** `{}`
- **Description:** Service bindings and external service configurations

```json
{
  "services": {
    "database": {
      "type": "d1",
      "binding": "DB"
    },
    "storage": {
      "type": "r2",
      "binding": "BUCKET"
    },
    "kv": {
      "type": "kv",
      "binding": "CACHE"
    }
  }
}
```

**Note:** Service configuration is platform-specific and may require additional setup in platform configuration files (e.g., `wrangler.json` for Cloudflare).

## Complete Example

```json
{
  "main": "src/main/server.js",
  "files": [
    "config/app.json",
    "templates/**/*.html",
    "data/seed.sql",
    "certs/*.pem"
  ],
  "imports": [
    {
      "import": "Database",
      "from": "better-sqlite3",
      "if": {
        "target": "node"
      }
    },
    {
      "import": "Database",
      "from": "@neondatabase/serverless",
      "if": {
        "target": "cloudflare"
      }
    },
    {
      "import": ["Logger", "formatLog"],
      "from": "./utils/logger.js"
    },
    {
      "import": {
        "default": "Redis",
        "createClient": "redisClient"
      },
      "from": "redis",
      "if": {
        "target": "node"
      }
    }
  ],
  "services": {
    "database": {
      "type": "d1",
      "binding": "DB"
    },
    "cache": {
      "type": "kv",
      "binding": "CACHE"
    },
    "storage": {
      "type": "r2",
      "binding": "ASSETS"
    }
  }
}
```

## Environment-Specific Configuration

You can create environment-specific configuration files:

- `mikrokat.json` - Base configuration
- `mikrokat.development.json` - Development overrides
- `mikrokat.production.json` - Production overrides

Mikrokat will merge these configurations based on the current environment.

## Validation

Mikrokat validates your configuration file when loading. Common validation errors:

### Missing main

```
Error: No entrypoint. Pass it on the command line using --main, or put it in mikrokat.json
```

**Solution:** Add a `main` field or use `--main` CLI option.

### Invalid file patterns

```
Error: File pattern 'invalid/**pattern' could not be resolved
```

**Solution:** Check that file patterns are valid and files exist.

### Import resolution errors

```
Error: Cannot resolve module 'non-existent-package'
```

**Solution:** Ensure all imported modules are installed or paths are correct.

## Best Practices

1. **Use relative paths** - Always use relative paths for local imports
2. **Organize files** - Group related configuration files in subdirectories
3. **Platform-specific imports** - Use conditional imports for platform-specific dependencies
4. **Minimal file inclusion** - Only include necessary files to reduce bundle size
5. **Document services** - Comment your service bindings for clarity
6. **Version control** - Include `mikrokat.json` in version control
7. **Environment separation** - Use environment-specific configs for different deployment stages

## JSON5 Support

Mikrokat supports JSON5 format, allowing:

```json5
{
  // Comments are allowed
  main: "src/main/server.js", // No quotes needed for keys
  files: [
    "config.json",
    // Multi-line strings
    `templates/**/*.html`,
  ], // Trailing commas allowed
}
```

## Related Documentation

- [Conditional Imports Guide](./conditional-imports.md)
- [File System Integration](./file-system.md)
- [Platform-specific Configuration](../platforms/overview.md)
- [CLI Reference](../cli/overview.md)