# Mikrokat Documentation

Welcome to the comprehensive documentation for Mikrokat, a multi-provider edge micro framework that solves platform fragmentation in edge computing.

## 🚀 Getting Started

New to Mikrokat? Start here to understand the framework and get your first application running.

- [Overview](./getting-started/overview.md) - What problem Mikrokat solves and how it works
- [Quick Start Guide](./getting-started/quick-start.md) - Get up and running in minutes with a simple example

## 📚 Core Framework

Learn the fundamental concepts that power Mikrokat applications.

- [Request Handlers](./core-concepts/handlers.md) - Writing onFetch, onStart, and onSchedule handlers to process HTTP requests, startup logic, and scheduled tasks
- [Middleware System](./core-concepts/middleware.md) - Request middleware and processing pipeline for authentication, logging, and request transformation
- [Static Content](./core-concepts/static-content.md) - Serving static files from the public directory
- [Config Filesystem](./core-concepts/config-filesystem.md) - Virtual filesystem for bundling configuration files and templates
- [Conditional Imports](./core-concepts/conditional-imports.md) - Platform-specific module loading and dependency management

## ⚙️ Configuration & Deployment

Configure your application and deploy to different edge platforms.

- [mikrokat.json Reference](./configuration/mikrokat-json.md) - Complete configuration file reference covering routing, middleware, and platform-specific settings
- [Cloudflare Workers](./configuration/cloudflare.md) - Deploy to Cloudflare Workers with wrangler integration and environment variables
- [CLI Overview](./configuration/overview.md) - Development server, build commands, and deployment tools

## 🔧 Developer Reference

Detailed technical documentation for building advanced applications.

- [MikrokatProject Class](./api/mikrokat-project.md) - Core project management class for programmatic control
- [Basic HTTP Server](./api/basic-server.md) - Simple request/response handling with routing and middleware

## 🛠️ Support & Community

Get help and contribute to the project.

- [Common Issues](./troubleshooting/common-issues.md) - Solutions to frequent problems including deployment issues and configuration errors
- [GitHub Repository](https://github.com/your-org/mikrokat) - Source code, issues, and discussions
- [NPM Package](https://www.npmjs.com/package/mikrokat) - Install and version information
- [Issue Tracker](https://github.com/your-org/mikrokat/issues) - Bug reports and feature requests
- [Contributing Guide](../CONTRIBUTING.md) - Guidelines for contributing code, documentation, and reporting issues