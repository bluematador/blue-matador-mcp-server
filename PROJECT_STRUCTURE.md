# Project Structure Overview

This document provides an overview of the organized folder structure for local development and testing.

## Directory Structure

```
bluematador-mcp-server/
├── src/                           # Source code (TypeScript)
│   ├── index.ts                  # Main MCP server implementation
│   ├── api-client.ts            # Bluematador API client
│   └── types.ts                 # TypeScript type definitions
│
├── dist/                          # Built JavaScript files (generated)
│   ├── index.js                 # Compiled main server
│   ├── api-client.js           # Compiled API client
│   └── types.js                # Compiled type definitions
│
├── dev/                           # Development environment
│   ├── configs/                 # Development configurations
│   │   └── development.json     # Dev server configuration
│   └── scripts/                 # Development scripts
│       ├── start-dev.sh        # Start development server
│       └── watch-dev.sh        # Start with auto-restart
│
├── test/                          # Testing environment
│   ├── unit/                    # Unit tests (future)
│   ├── integration/             # Integration tests
│   │   └── test-mute-monitors.js # Mute monitors functionality test
│   ├── fixtures/                # Test data and mock responses
│   │   └── sample-responses.json # Mock API responses
│   └── configs/                 # Test configurations
│       └── test.json           # Test environment config
│
├── examples/                      # Examples and setup
│   ├── configs/                 # Example Claude configurations
│   │   ├── claude-config-dev.json   # Development Claude config
│   │   └── claude-config-test.json  # Testing Claude config
│   └── scripts/                 # Setup and utility scripts
│       └── setup-dev-env.sh    # Development environment setup
│
├── docs/                          # Documentation
│   ├── DEVELOPMENT.md           # Development guide
│   ├── TESTING.md              # Testing guide
│   └── PROJECT_STRUCTURE.md    # This file
│
├── package.json                   # Project dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Main project documentation
```

## Key Files and Their Purpose

### Source Code (`src/`)
- **index.ts**: Main MCP server with all tool handlers
- **api-client.ts**: HTTP client for Bluematador API
- **types.ts**: TypeScript interfaces and type definitions

### Development (`dev/`)
- **configs/development.json**: Development server configuration
- **scripts/start-dev.sh**: Quick development server startup
- **scripts/watch-dev.sh**: Auto-restart development server

### Testing (`test/`)
- **integration/test-mute-monitors.js**: Tests the new mute functionality
- **fixtures/sample-responses.json**: Mock API responses for testing
- **configs/test.json**: Test environment configuration

### Examples (`examples/`)
- **configs/claude-config-*.json**: Example Claude Desktop configurations
- **scripts/setup-dev-env.sh**: Automated development environment setup

### Documentation (`docs/`)
- **DEVELOPMENT.md**: Comprehensive development guide
- **TESTING.md**: Testing strategies and procedures
- **PROJECT_STRUCTURE.md**: This overview document

## Environment-Specific Usage

### Development
```bash
# Quick setup
./examples/scripts/setup-dev-env.sh

# Start development server
npm run start:dev

# Start with auto-restart
npm run watch:dev
```

### Testing
```bash
# Run all tests
npm run test

# Run integration tests only
npm run test:integration
```

### Production
```bash
# Build and start
npm run build
npm start
```
