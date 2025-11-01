# Remote Deployment Guide

This guide explains how to deploy the Bluematador MCP Server remotely so users can access it without installing anything locally.

## Overview

The Bluematador MCP Server supports two modes:

1. **Local Mode (stdio)** - Traditional npm install, runs locally
2. **Remote Mode (Streamable HTTP)** - Deployed to a server, accessed via URL

## Quick Start - Remote Mode

### 1. Build the Server

```bash
npm run build
```

### 2. Run Locally for Testing

```bash
npm run start:http
# Or for development with auto-reload:
npm run dev:http
```

The server will start on `http://localhost:3000`

### 3. Configure Claude Desktop (Remote)

Update your Claude Desktop config to use the remote server:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "bluematador": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

## Deployment Options

### Option 1: Docker

**Build and run with Docker:**

```bash
# Build the application first
npm run build

# Build Docker image
docker build -t bluematador-mcp-server .

# Run the container
docker run -p 3000:3000 \
  -e BLUEMATADOR_API_KEY=your-key \
  -e BLUEMATADOR_ACCOUNT_ID=your-account-id \
  bluematador-mcp-server
```

**Or use Docker Compose:**

```bash
# Build first
npm run build

# Start with docker-compose
docker-compose up -d
```

### Option 2: Cloud Platforms

#### Railway

1. Connect your GitHub repository to [Railway](https://railway.app)
2. Set environment variables:
   - `PORT=3000`
   - `BLUEMATADOR_API_KEY` (optional)
   - `BLUEMATADOR_ACCOUNT_ID` (optional)
3. Railway will automatically detect and build your Node.js app
4. Use the generated railway.app URL in your Claude config

#### Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your repository
3. Build command: `npm run build`
4. Start command: `npm run start:http`
5. Set environment variables as needed
6. Use the `*.onrender.com` URL in Claude config

#### Heroku

```bash
# Build first
npm run build

# Create Heroku app
heroku create your-app-name

# Deploy
git push heroku main

# Set environment variables (optional)
heroku config:set BLUEMATADOR_API_KEY=your-key
heroku config:set BLUEMATADOR_ACCOUNT_ID=your-account-id

# Your server will be at: https://your-app-name.herokuapp.com
```

#### AWS/GCP/Azure

Deploy as a containerized application:
1. Build Docker image
2. Push to container registry (ECR, GCR, ACR)
3. Deploy to container service (ECS, Cloud Run, Container Instances)
4. Expose port 3000
5. Optional: Set up load balancer with SSL

## Security Considerations

### Public Deployments

If deploying publicly, **DO NOT** set `BLUEMATADOR_API_KEY` or `BLUEMATADOR_ACCOUNT_ID` as environment variables. Instead, require users to provide credentials per request.

Users will provide credentials in their requests through Claude.

### Private Deployments

If deploying for a single team/organization:
1. Set default credentials via environment variables
2. Use firewall rules to restrict access
3. Consider using a VPN or private network
4. Enable HTTPS with proper certificates

### Authentication

The server currently uses Bluematador API keys for authentication. Consider adding:
- Rate limiting
- IP whitelisting
- Additional authentication layer
- Request logging

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | HTTP server port (default: 3000) |
| `BLUEMATADOR_API_KEY` | No* | Default API key for requests |
| `BLUEMATADOR_ACCOUNT_ID` | No* | Default account ID for requests |
| `BLUEMATADOR_BASE_URL` | No | Custom API URL (default: https://app.bluematador.com) |
| `NODE_ENV` | No | Node environment (production/development) |

\* Not required if users provide credentials per-request

## Client Configuration

### With Server-Side Credentials

If you've configured default credentials on the server:

```json
{
  "mcpServers": {
    "bluematador": {
      "url": "https://your-server.com/mcp"
    }
  }
}
```

### Without Server-Side Credentials

Users must provide credentials with each request. They'll be prompted by Claude when needed.

## Monitoring

### Health Check Endpoint

```bash
curl https://your-server.com/health
```

Response:
```json
{
  "status": "ok",
  "name": "bluematador-mcp-server",
  "version": "1.0.0",
  "transport": "SSE",
  "endpoints": {
    "sse": "/sse",
    "message": "/message",
    "health": "/health"
  }
}
```

### Logging

The server logs to stderr. Configure your deployment platform to capture and monitor logs.

## Troubleshooting

### Connection Issues

1. **Check server health**: `curl https://your-server.com/health`
2. **Verify MCP endpoint**: `curl -X POST https://your-server.com/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"ping","id":1}'`
3. **Check firewall rules**: Ensure port 3000 (or your PORT) is accessible
4. **Transport**: The server uses modern Streamable HTTP transport (not the deprecated SSE)

### Performance

- Each HTTP request creates a new MCP server instance (stateless mode)
- This is efficient and allows horizontal scaling
- Monitor memory usage and set appropriate limits for your deployment

## Comparison: Local vs Remote

| Feature | Local (stdio) | Remote (Streamable HTTP) |
|---------|---------------|-------------------|
| Installation | `npm install -g` required | No client installation |
| Access | Local machine only | Anywhere with network access |
| Security | Credentials in local config | Can be server-side or per-request |
| Performance | Fastest | Network latency |
| Scaling | One per user | Centralized, scalable |
| Updates | User must update | Update once on server |

## Next Steps

1. Choose your deployment platform
2. Build and deploy the server
3. Update Claude Desktop configurations
4. Test the connection
5. Monitor and scale as needed

For issues or questions, see: https://github.com/bluematador/blue-matador-mcp-server/issues
