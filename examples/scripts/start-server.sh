#!/bin/bash

# Bluematador MCP Server Startup Script
# This script provides a wrapper that might help with Claude Desktop connectivity

# Set environment variables
export NODE_ENV=production
export PATH="/Users/jsarrelli/.nvm/versions/node/v18.18.0/bin:$PATH"

# Change to the correct directory
cd "$(dirname "$0")"

# Start the server
exec /Users/jsarrelli/.nvm/versions/node/v18.18.0/bin/node dist/index.js