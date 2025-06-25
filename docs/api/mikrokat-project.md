# MikrokatProject Class

The `MikrokatProject` class is the core class that manages project configuration, building, and serving. It handles the lifecycle of a Mikrokat application from initialization to deployment.

## Constructor

```javascript
import MikrokatProject from 'mikrokat/src/main/MikrokatProject.js';

const project = new MikrokatProject({
    cwd: '/path/to/project',
    main: 'src/server.js',
    target: 'cloudflare',
    port: 3000,
    log: console.log
});
```

### Constructor Options

#### cwd
- **Type:** `string`
- **Default:** `process.cwd()`
- **Description:** Current working directory for the project

#### main
- **Type:** `string`
- **Default:** Value from `mikrokat.json`
- **Description:** Path to the main entrypoint file relative to `cwd`

#### target
- **Type:** `string`
- **Default:** `"node"`
- **Options:** `"node"`, `"cloudflare"`, `"vercel"`, `"fastly"`, `"netlify"`
- **Description:** Target platform for building and serving

#### port
- **Type:** `number`
- **Default:** `3000`
- **Description:** Port number for local development server

#### log
- **Type:** `function | boolean`
- **Default:** `console.log`
- **Description:** Logging function. Set to `false` to disable logging

## Properties

### config
- **Type:** `object`
- **Description:** Loaded configuration from `mikrokat.json`
- **Read-only:** Set by `load()` method

### httpServer
- **Type:** `http.Server`
- **Description:** HTTP server instance when serving locally
- **Read-only:** Set by `serve()` method

## Methods

### load()

Loads and parses the `mikrokat.json` configuration file.

```javascript
await project.load();
console.log(project.config);
```

**Returns:** `Promise<void>`

**Throws:** 
- `Error` if `mikrokat.json` is invalid JSON
- `DeclaredError` if no entrypoint is configured

### getEntrypoint()

Returns the absolute path to the main entrypoint file.

```javascript
const entrypoint = project.getEntrypoint();
// Returns: "/path/to/project/src/main/server.js"
```

**Returns:** `string` - Absolute path to entrypoint

**Throws:** 
- `Error` if config is not loaded
- `DeclaredError` if no entrypoint is configured

### serve()

Starts a local development server.

```javascript
await project.serve();
// Server is now listening on the configured port
```

**Returns:** `Promise<void>`

**Features:**
- Serves static files from `public/` directory
- Handles dynamic requests through your handlers
- Supports hot reloading of entrypoint module
- Includes conditional imports
- Provides virtual filesystem access

**Example with custom port:**
```javascript
const project = new MikrokatProject({ port: 8080 });
await project.load();
await project.serve();
console.log('Server running on http://localhost:8080');
```

### close()

Stops the local development server.

```javascript
await project.close();
```

**Returns:** `Promise<void>`

**Throws:** `Error` if server is not running

### build()

Builds platform-specific artifacts for deployment.

```javascript
const project = new MikrokatProject({ target: 'cloudflare' });
await project.load();
await project.build();
```

**Returns:** `Promise<void>`

**Behavior:**
- For `target: "node"` - No build artifacts (logs message)
- For other targets - Generates platform-specific entrypoint in `.target/` directory

### init()

Initializes a new project or adds target-specific configuration.

```javascript
const project = new MikrokatProject({ target: 'cloudflare' });
await project.init();
```

**Returns:** `Promise<void>`

**Creates/Updates:**
- `package.json` with Mikrokat dependencies and scripts
- `mikrokat.json` with default configuration
- Main entrypoint file with basic handler
- `.gitignore` with appropriate entries
- `public/.gitkeep` for static assets
- Platform-specific configuration files

### writeStub(outfile, content)

Writes a processed stub file with template replacements.

```javascript
const stubContent = `
import * as mod from $ENTRYPOINT;
const fileContent = $FILECONTENT;
$IMPORTS
`;

await project.writeStub('.target/stub.js', stubContent);
```

**Parameters:**
- `outfile` (`string`) - Output file path relative to project root
- `content` (`string`) - Template content with placeholders

**Template Placeholders:**
- `$ENTRYPOINT` - Replaced with relative path to entrypoint
- `$FILECONTENT` - Replaced with JSON of bundled files
- `$IMPORTS` - Replaced with conditional import statements

### processProjectFile(filename, format, processor)

Processes project configuration files with format-specific parsing.

```javascript
// Update package.json
await project.processProjectFile("package.json", "json", async pkg => {
    pkg.scripts = pkg.scripts || {};
    pkg.scripts.dev = "mikrokat serve";
    return pkg;
});

// Update .gitignore
await project.processProjectFile(".gitignore", "lines", lines => {
    if (!lines.includes("node_modules")) {
        lines.push("node_modules");
    }
    return lines;
});
```

**Parameters:**
- `filename` (`string`) - File path relative to project root
- `format` (`string`) - File format: `"json"`, `"lines"`, `"toml"`, or `null`
- `processor` (`function`) - Function to modify file content

**Returns:** `Promise<any>` - Processed content

### getConditionalImports()

Creates a ConditionalImports instance for the current configuration.

```javascript
const conditionalImports = project.getConditionalImports();
const imports = await conditionalImports.loadImports();
```

**Returns:** `ConditionalImports` instance

### getFileContent()

Loads all files specified in the `files` configuration.

```javascript
const fileContent = await project.getFileContent();
console.log(fileContent); // { "config.json": "...", "template.html": "..." }
```

**Returns:** `Promise<object>` - Object mapping file paths to content

## Usage Examples

### Basic Local Development

```javascript
import MikrokatProject from 'mikrokat/src/main/MikrokatProject.js';

const project = new MikrokatProject({
    cwd: process.cwd(),
    port: 3000
});

await project.load();
await project.serve();

console.log('Development server started on http://localhost:3000');

// Stop server when done
process.on('SIGINT', async () => {
    await project.close();
    process.exit(0);
});
```

### Building for Production

```javascript
const project = new MikrokatProject({
    target: 'cloudflare',
    log: false // Disable logging
});

await project.load();
await project.build();

console.log('Build completed for Cloudflare Workers');
```

### Project Initialization

```javascript
const project = new MikrokatProject({
    cwd: '/path/to/new/project',
    target: 'vercel'
});

await project.init();
console.log('Project initialized with Vercel target');
```

### Custom Configuration Processing

```javascript
const project = new MikrokatProject();

// Add custom npm script
await project.processProjectFile("package.json", "json", pkg => {
    pkg.scripts = pkg.scripts || {};
    pkg.scripts.test = "jest";
    return pkg;
});

// Add custom ignore patterns
await project.processProjectFile(".gitignore", "lines", lines => {
    lines.push("*.log", "coverage/");
    return lines;
});
```

## Error Handling

The class throws different types of errors:

```javascript
try {
    await project.load();
    await project.serve();
} catch (error) {
    if (error.declared) {
        // User-facing error with helpful message
        console.error('Error:', error.message);
    } else {
        // Unexpected error, re-throw
        throw error;
    }
}
```

## Integration with CLI

The MikrokatProject class is used internally by the CLI commands:

- `mikrokat init` → `project.init()`
- `mikrokat serve` → `project.serve()`
- `mikrokat build` → `project.build()`

## Related Classes

- [MikrokatServer](./mikrokat-server.md) - Request handling and middleware
- [Target Classes](./targets.md) - Platform-specific implementations
- [ConditionalImports](../configuration/conditional-imports.md) - Import resolution