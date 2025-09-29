#!/bin/bash

# Development watch script for Bluematador MCP Server
echo "👀 Starting Bluematador MCP Server in watch mode for development..."

# Set development environment variables
export NODE_ENV=development
export DEBUG=true

# Start the server in development mode with auto-restart
echo "🔧 Starting server with auto-restart on file changes..."
npm run dev

echo "✅ Development watch mode started"