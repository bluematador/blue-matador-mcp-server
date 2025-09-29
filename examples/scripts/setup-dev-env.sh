#!/bin/bash

# Setup script for development environment
echo "🔧 Setting up Bluematador MCP Server development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🏗️ Building the project..."
npm run build

# Create .env file for development if it doesn't exist
if [ ! -f ".env.dev" ]; then
    echo "📝 Creating .env.dev file..."
    cat > .env.dev << EOF
NODE_ENV=development
DEBUG=true
BLUEMATADOR_API_KEY=your-api-key-here
BLUEMATADOR_BASE_URL=https://app.bluematador.com
EOF
    echo "⚠️ Please update .env.dev with your actual API key"
fi

echo "✅ Development environment setup complete!"
echo ""
echo "To start development:"
echo "  npm run start:dev    # Start server in development mode"
echo "  npm run watch:dev    # Start server with auto-restart"
echo "  npm run test         # Run tests"
echo ""
echo "Configuration files:"
echo "  dev/configs/         # Development configurations"
echo "  examples/configs/    # Example Claude configurations"