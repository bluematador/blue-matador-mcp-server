# Deployment Guide

This guide covers deploying the Bluematador MCP Server to work with Claude Desktop.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Claude Desktop** application installed
3. **Bluematador API Key** from your account

## Installation Steps

### 1. Build the Production Server

```bash
# Navigate to your project directory
cd /path/to/bluematador-mcp-server

# Install dependencies
npm install

# Build the production version
npm run build

# Verify the build
ls -la dist/
```

### 2. Get Your Bluematador API Key

1. Log into your Bluematador account
2. Go to Settings → API Keys
3. Generate a new API key
4. Copy the API key and your Account ID

### 3. Configure Claude Desktop

#### Option A: Using Environment Variables (Recommended)

Create or edit your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "bluematador": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/path/to/bluematador-mcp-server/dist/index.js"],
      "env": {
        "BLUEMATADOR_API_KEY": "your-api-key-here",
        "BLUEMATADOR_BASE_URL": "https://app.bluematador.com"
      }
    }
  }
}
```

#### Option B: Per-Request API Keys

If you prefer to provide API keys with each request (more secure for multi-user setups):

```json
{
  "mcpServers": {
    "bluematador": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/path/to/bluematador-mcp-server/dist/index.js"]
    }
  }
}
```

### 4. Restart Claude Desktop

1. Quit Claude Desktop completely
2. Relaunch Claude Desktop
3. Look for the MCP server connection in the status

## Verification

### Test the Connection

1. Open Claude Desktop
2. Start a new conversation
3. Try a simple command:

```
List all my Bluematador integrations
```

Or if using per-request API keys:

```
Can you list my Bluematador integrations? My API key is YOUR_API_KEY and my account ID is YOUR_ACCOUNT_ID.
```

### Expected Response

You should see a response listing your integrations, or instructions on what information is needed.

## Production Deployment Options

### Option 1: Local Installation (Simplest)

- Install directly on the machine running Claude Desktop
- Use the configuration above
- Good for personal use

### Option 2: Network Service

For team environments, you can run the MCP server as a network service:

1. **Set up a server** (Linux/macOS)
2. **Install Node.js** on the server
3. **Deploy the code** to the server
4. **Configure as a system service**

Example systemd service file (`/etc/systemd/system/bluematador-mcp.service`):

```ini
[Unit]
Description=Bluematador MCP Server
After=network.target

[Service]
Type=simple
User=mcp-user
WorkingDirectory=/opt/bluematador-mcp-server
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=BLUEMATADOR_API_KEY=your-api-key
Environment=BLUEMATADOR_BASE_URL=https://app.bluematador.com

[Install]
WantedBy=multi-user.target
```

### Option 3: Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built application
COPY dist/ ./dist/
COPY src/ ./src/

# Expose port (if needed)
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
```

## Security Considerations

### API Key Security

1. **Never commit API keys** to version control
2. **Use environment variables** for sensitive data
3. **Rotate API keys** regularly
4. **Limit API key permissions** if possible

### File Permissions

```bash
# Secure the configuration file
chmod 600 ~/.config/claude/claude_desktop_config.json

# Secure the application directory
chmod -R 755 /path/to/bluematador-mcp-server
chmod 644 /path/to/bluematador-mcp-server/dist/*
```

### Network Security

If deploying as a network service:
- Use HTTPS/TLS
- Implement authentication
- Use firewalls to restrict access
- Monitor access logs

## Troubleshooting

### Common Issues

#### "MCP server not found"
- Check the path in your Claude Desktop config
- Ensure the `dist/index.js` file exists and is executable
- Verify Node.js is installed and in PATH

#### "Authentication failed"
- Verify your API key is correct
- Check your account ID format (should be UUID)
- Test API key with curl:
  ```bash
  curl -H "Authorization: YOUR_API_KEY" \
       https://app.bluematador.com/zi/api/accounts/YOUR_ACCOUNT_ID/projects
  ```

#### "Connection refused"
- Check if the server is running
- Verify the correct port/address
- Check firewall settings

#### "Permission denied"
- Check file permissions on the MCP server files
- Ensure the user has execute permissions

### Debug Mode

Enable debug logging by setting environment variables:

```json
{
  "mcpServers": {
    "bluematador": {
      "command": "node",
      "args": ["/path/to/bluematador-mcp-server/dist/index.js"],
      "env": {
        "DEBUG": "true",
        "NODE_ENV": "development",
        "BLUEMATADOR_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Logs

Check Claude Desktop logs:
- **macOS**: `~/Library/Logs/Claude/`
- **Windows**: `%LOCALAPPDATA%/Claude/logs/`

## Maintenance

### Updates

To update the MCP server:

```bash
# Pull latest changes
git pull

# Rebuild
npm run rebuild

# Restart Claude Desktop
```

### Monitoring

Monitor the MCP server:
- Check Claude Desktop connection status
- Monitor API rate limits
- Review error logs
- Test functionality periodically

### Backup

Backup important configurations:
- Claude Desktop config file
- Environment variables
- API keys (securely)
- Custom configurations