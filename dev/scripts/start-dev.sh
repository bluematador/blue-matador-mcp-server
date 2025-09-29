#!/bin/bash

# Development startup script for Bluematador MCP Server
echo "🚀 Starting Bluematador MCP Server in development mode..."

# Check if dist directory exists
if [ ! -d "dist" ]; then
  echo "📦 Building project first..."
  npm run build
fi

# Set development environment variables
export NODE_ENV=development
export DEBUG=true

# Start the server with development configuration
echo "🔧 Starting server with development configuration..."
node dist/index.js

echo "✅ Development server started"