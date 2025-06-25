# Command Line Interface

Mikrokat provides a comprehensive CLI for managing your edge applications. This document covers all available commands and options.

## Installation

Install Mikrokat globally to use the CLI:

```bash
npm install -g mikrokat
```

Or use it directly with npx:

```bash
npx mikrokat --help
```

## Global Options

These options are available for all commands:

### --cwd <directory>

Run commands as if started from the specified directory.

```bash
mikrokat --cwd /path/to/project serve
```

### --silent

Suppress output during command execution.

```bash
mikrokat --silent build
```

### --version

Print the current version of Mikrokat.

```bash
mikrokat --version
```

### --help

Show help information for commands.

```bash
mikrokat --help
mikrokat serve --help
```

## Commands

### mikrokat (default)

When run without a command, shows help information.

```bash
mikrokat
```

**Options:**
- `--version` - Print version and exit
- `--help` - Show help and exit

### mikrokat init

Initialize a new project or add platform-specific configuration.

```bash
# Initialize new project
mikrokat init

# Add platform target
mikrokat init --target cloudflare
```

**Options:**
- `--target <platform>` - Platform to initialize (`cloudflare`, `vercel`, `fastly`, `netlify`)

**What it does:**
1. Creates or updates `package.json` with dependencies and scripts
2. Creates `mikrokat.json` with default configuration
3. Creates main entrypoint file if it doesn't exist
4. Sets up `.gitignore` with appropriate entries
5. Creates `public/` directory for static assets
6. Adds platform-specific configuration files (if target specified)

**Examples:**
```bash
# Basic project initialization
mkdir my-app && cd my-app
mikrokat init

# Initialize with Cloudflare target
mikrokat init --target cloudflare

# Add Vercel target to existing project
mikrokat init --target vercel
```

### mikrokat serve

Start a local development server.

```bash
mikrokat serve
```

**Aliases:** `dev`

**Options:**
- `--main <entrypoint>` - Server entrypoint file
- `--port <port>` - Listening port (default: 3000, env: `PORT`)

**Features:**
- Serves static files from `public/` directory
- Hot reloads handler code changes
- Processes requests through your `onFetch` handler
- Supports middleware and conditional imports
- Provides virtual filesystem access

**Examples:**
```bash
# Start with default settings
mikrokat serve

# Use custom port
mikrokat serve --port 8080

# Use custom entrypoint
mikrokat serve --main dist/server.js

# Use environment variable for port
PORT=3000 mikrokat serve
```

### mikrokat build

Build platform-specific artifacts for deployment.

```bash
mikrokat build --target cloudflare
```

**Options:**
- `--main <entrypoint>` - Server entrypoint file
- `--target <platform>` - Target platform (env: `TARGET`)

**Supported targets:**
- `cloudflare` - Cloudflare Workers
- `vercel` - Vercel Edge Functions
- `fastly` - Fastly Compute@Edge
- `netlify` - Netlify Edge Functions
- `node` - Node.js (no build required)

**Output:**
Creates platform-specific files in the `.target/` directory:
- `entrypoint.cloudflare.js` - Cloudflare Workers entry
- `entrypoint.vercel.js` - Vercel Edge Functions entry
- `entrypoint.fastly.js` - Fastly Compute@Edge entry
- `entrypoint.netlify.js` - Netlify Edge Functions entry

**Examples:**
```bash
# Build for Cloudflare
mikrokat build --target cloudflare

# Build with custom entrypoint
mikrokat build --target vercel --main src/app.js

# Build using environment variable
TARGET=fastly mikrokat build
```

## Environment Variables

Several CLI options can be set via environment variables:

- `PORT` - Default port for serve command
- `TARGET` - Default target for build command

```bash
# Set default port
export PORT=8080
mikrokat serve

# Set default target
export TARGET=cloudflare
mikrokat build
```

## Command Composition

You can chain commands using shell operators:

```bash
# Build and then serve
mikrokat build --target cloudflare && mikrokat serve

# Initialize and install dependencies
mikrokat init && npm install

# Build for multiple targets
mikrokat build --target cloudflare && mikrokat build --target vercel
```

## NPM Scripts Integration

After initialization, your `package.json` will include convenient npm scripts:

```json
{
  "scripts": {
    "start": "mikrokat serve",
    "build": "mikrokat build",
    "dev:cloudflare": "wrangler dev",
    "deploy:cloudflare": "wrangler deploy"
  }
}
```

Use these scripts for common workflows:

```bash
# Start local development
npm run start

# Build for deployment
npm run build

# Platform-specific development
npm run dev:cloudflare

# Deploy to platform
npm run deploy:cloudflare
```

## Error Handling

The CLI provides helpful error messages for common issues:

### Missing Configuration

```bash
$ mikrokat serve
Error: No entrypoint. Pass it on the command line using --main, or put it in mikrokat.json
```

**Solution:** Add `--main` option or create `mikrokat.json` with `main` field.

### Invalid Target

```bash
$ mikrokat build --target invalid
Error: Invalid target 'invalid'. Choose from: cloudflare, vercel, fastly, netlify
```

**Solution:** Use a supported target platform.

### Missing Dependencies

```bash
$ mikrokat serve
Error: Cannot find module 'your-module'
```

**Solution:** Run `npm install` to install dependencies.

## Debug Mode

Enable debug output by setting the `DEBUG` environment variable:

```bash
DEBUG=mikrokat:* mikrokat serve
```

This provides detailed logging for troubleshooting.

## Exit Codes

The CLI uses standard exit codes:

- `0` - Success
- `1` - General error
- `2` - Invalid command or options

## Shell Completion

Generate shell completion scripts:

```bash
# Bash
mikrokat completion bash > /etc/bash_completion.d/mikrokat

# Zsh
mikrokat completion zsh > ~/.zsh/completions/_mikrokat

# Fish
mikrokat completion fish > ~/.config/fish/completions/mikrokat.fish
```

## Configuration Files

The CLI respects these configuration files in order of precedence:

1. Command line options
2. Environment variables
3. `mikrokat.json` configuration
4. Default values

## Working Directory

All commands operate relative to the current working directory unless `--cwd` is specified:

```bash
# Run from specific directory
mikrokat --cwd /path/to/project serve

# Equivalent to
cd /path/to/project && mikrokat serve
```

## Programmatic Usage

You can also use the CLI programmatically:

```javascript
import { program } from 'mikrokat/src/main/mikrokat.js';

// Parse custom arguments
await program.parseAsync(['node', 'script.js', 'serve', '--port', '3000']);
```

## Related Documentation

- [mikrokat init](./init.md) - Detailed init command reference
- [mikrokat serve](./serve.md) - Detailed serve command reference  
- [mikrokat build](./build.md) - Detailed build command reference
- [Configuration](../configuration/mikrokat-json.md) - Configuration file reference