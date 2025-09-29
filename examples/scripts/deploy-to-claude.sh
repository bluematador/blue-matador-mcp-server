#!/bin/bash

# Deployment script for Bluematador MCP Server to Claude Desktop
echo "🚀 Deploying Bluematador MCP Server to Claude Desktop..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the bluematador-mcp-server directory"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH"
    exit 1
fi

# Build the project
echo "📦 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix the errors and try again."
    exit 1
fi

# Get the current directory path
CURRENT_DIR=$(pwd)
DIST_PATH="${CURRENT_DIR}/dist/index.js"

# Check if dist/index.js exists
if [ ! -f "$DIST_PATH" ]; then
    echo "❌ Error: dist/index.js not found after build"
    exit 1
fi

# Detect OS and set Claude config path
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
    CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    CLAUDE_CONFIG_DIR="$APPDATA/Claude"
    CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
else
    # Linux
    CLAUDE_CONFIG_DIR="$HOME/.config/claude"
    CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
fi

echo "🔧 Claude Desktop config location: $CLAUDE_CONFIG_FILE"

# Create Claude config directory if it doesn't exist
mkdir -p "$CLAUDE_CONFIG_DIR"

# Check if config file exists
if [ -f "$CLAUDE_CONFIG_FILE" ]; then
    echo "📄 Existing Claude config found. Creating backup..."
    cp "$CLAUDE_CONFIG_FILE" "${CLAUDE_CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Backup created: ${CLAUDE_CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Prompt for API configuration choice
echo ""
echo "Choose your API key configuration method:"
echo "1) Store API key in config file (easier, less secure)"
echo "2) Use per-request API keys (more secure, requires providing key each time)"
echo ""
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo ""
        read -p "Enter your Bluematador API key: " api_key
        if [ -z "$api_key" ]; then
            echo "❌ API key cannot be empty"
            exit 1
        fi

        # Create config with API key
        cat > "$CLAUDE_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "bluematador": {
      "command": "node",
      "args": ["$DIST_PATH"],
      "env": {
        "BLUEMATADOR_API_KEY": "$api_key",
        "BLUEMATADOR_BASE_URL": "https://app.bluematador.com"
      }
    }
  }
}
EOF
        echo "✅ Configuration created with embedded API key"
        echo "⚠️  Note: Your API key is stored in the config file. Keep it secure!"
        ;;

    2)
        # Create config without API key
        cat > "$CLAUDE_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "bluematador": {
      "command": "node",
      "args": ["$DIST_PATH"]
    }
  }
}
EOF
        echo "✅ Configuration created for per-request API keys"
        echo "💡 You'll need to provide your API key and account ID with each request"
        ;;

    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

# Set secure permissions on config file
chmod 600 "$CLAUDE_CONFIG_FILE"

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Restart Claude Desktop completely"
echo "2. Open Claude Desktop and start a new conversation"
echo "3. Test with: 'List my Bluematador integrations'"
echo ""

if [ "$choice" == "2" ]; then
    echo "Remember: Since you chose per-request API keys, you'll need to include:"
    echo "- Your API key"
    echo "- Your account ID (UUID format)"
    echo ""
    echo "Example: 'List my integrations. My API key is YOUR_KEY and account ID is YOUR_ACCOUNT_ID'"
fi

echo ""
echo "Configuration file: $CLAUDE_CONFIG_FILE"
echo "MCP Server path: $DIST_PATH"
echo ""
echo "For troubleshooting, see: docs/DEPLOYMENT.md"