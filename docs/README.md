# Mikrokat Documentation

Welcome to the comprehensive documentation for Mikrokat, a multi-provider edge micro framework that solves platform fragmentation in edge computing.

## Table of Contents

### Getting Started
- [Quick Start Guide](./getting-started/quick-start.md) - Get up and running in minutes
- [Installation](./getting-started/installation.md) - Detailed installation instructions
- [Your First App](./getting-started/first-app.md) - Build your first Mikrokat application

### Core Concepts
- [Architecture Overview](./core-concepts/architecture.md) - How Mikrokat works under the hood
- [Request Handlers](./core-concepts/handlers.md) - Writing onFetch, onStart, and onSchedule handlers
- [Event Object](./core-concepts/event-object.md) - Understanding the event parameter
- [Middleware System](./core-concepts/middleware.md) - Request middleware and processing pipeline

### Configuration
- [mikrokat.json Reference](./configuration/mikrokat-json.md) - Complete configuration file reference
- [Conditional Imports](./configuration/conditional-imports.md) - Platform-specific module loading
- [File System Integration](./configuration/file-system.md) - Working with the virtual filesystem
- [Environment Variables](./configuration/environment.md) - Managing environment variables and secrets

### Platform Targets
- [Supported Platforms](./platforms/overview.md) - Overview of all supported platforms
- [Cloudflare Workers](./platforms/cloudflare.md) - Cloudflare-specific configuration and deployment
- [Vercel Edge Functions](./platforms/vercel.md) - Vercel-specific configuration and deployment
- [Fastly Compute@Edge](./platforms/fastly.md) - Fastly-specific configuration and deployment
- [Netlify Edge Functions](./platforms/netlify.md) - Netlify-specific configuration and deployment

### CLI Reference
- [Command Line Interface](./cli/overview.md) - Complete CLI command reference
- [mikrokat init](./cli/init.md) - Initialize projects and targets
- [mikrokat build](./cli/build.md) - Build platform-specific artifacts
- [mikrokat serve](./cli/serve.md) - Local development server

### API Reference
- [MikrokatProject Class](./api/mikrokat-project.md) - Core project management class
- [MikrokatServer Class](./api/mikrokat-server.md) - Request handling and middleware
- [Target Classes](./api/targets.md) - Platform-specific target implementations
- [Utility Functions](./api/utilities.md) - Helper functions and utilities

### Advanced Topics
- [Static Asset Handling](./advanced/static-assets.md) - Serving static files and assets
- [Local Fetch API](./advanced/local-fetch.md) - Internal request routing
- [Custom Target Development](./advanced/custom-targets.md) - Creating custom platform targets
- [Testing Strategies](./advanced/testing.md) - Testing Mikrokat applications

### Examples
- [Basic HTTP Server](./examples/basic-server.md) - Simple request/response handling
- [API with Database](./examples/api-database.md) - Building APIs with database integration
- [Static Site with Dynamic Routes](./examples/static-dynamic.md) - Mixing static and dynamic content
- [Multi-Service Application](./examples/multi-service.md) - Complex applications with multiple services

### Troubleshooting
- [Common Issues](./troubleshooting/common-issues.md) - Solutions to frequent problems
- [Platform-Specific Issues](./troubleshooting/platform-issues.md) - Platform-specific troubleshooting
- [Debugging Guide](./troubleshooting/debugging.md) - Debugging techniques and tools

### Migration & Compatibility
- [Migration Guide](./migration/migration-guide.md) - Migrating existing applications
- [Version Compatibility](./migration/compatibility.md) - Version compatibility matrix
- [Breaking Changes](./migration/breaking-changes.md) - Breaking changes between versions

## Quick Links

- [GitHub Repository](https://github.com/your-org/mikrokat)
- [NPM Package](https://www.npmjs.com/package/mikrokat)
- [Issue Tracker](https://github.com/your-org/mikrokat/issues)

## Contributing

See our [Contributing Guide](../CONTRIBUTING.md) for information on how to contribute to Mikrokat.