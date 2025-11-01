# Remote Server Quick Start

## What Changed?

Your Bluematador MCP server now supports **remote access via Streamable HTTP** in addition to the traditional local stdio mode. This means users can connect to a hosted server without installing anything via npm.

## Key Files Added

1. **`src/server-http.ts`** - Streamable HTTP server implementation
2. **`src/index-stdio.ts`** - Original stdio implementation (refactored)
3. **`src/index.ts`** - Now just exports from index-stdio.ts
4. **`Dockerfile`** - Container configuration for deployment
5. **`docker-compose.yml`** - Easy Docker deployment
6. **`.env.example`** - Environment variable template
7. **`DEPLOYMENT.md`** - Complete deployment guide
8. **`REMOTE-SERVER-QUICKSTART.md`** - This file

## How It Works

### Architecture

```
┌─────────────────┐
│  Claude Desktop │
└────────┬────────┘
         │
    ┌────┴────────────────────────┐
    │                             │
    │  Local Mode                 │  Remote Mode
    │  (stdio)                    │  (Streamable HTTP)
    │                             │
    ▼                             ▼
┌─────────────────┐     ┌──────────────────┐
│ Local npm       │     │  Remote Server   │
│ Installation    │     │  (your-url.com)  │
└─────────────────┘     └──────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
              ┌──────▼──────┐
              │ Bluematador │
              │     API     │
              └─────────────┘
```

### Transport Comparison

| Feature | stdio (Local) | Streamable HTTP (Remote) |
|---------|---------------|-------------------|
| Client install | `npm install -g` | None - just URL |
| Access | Local only | Network access |
| Config | Command + env vars | URL only |
| Use case | Individual users | Teams/orgs |

## Testing Locally

### 1. Start the HTTP server

```bash
npm run dev:http
```

Output:
```
🚀 Bluematador MCP Server running on port 3000
📡 Streamable HTTP endpoint: http://localhost:3000/mcp
❤️  Health check: http://localhost:3000/health
```

### 2. Test the health endpoint

```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "ok",
  "name": "bluematador-mcp-server",
  "version": "1.0.0",
  "transport": "Streamable HTTP"
}
```

### 3. Configure Claude Desktop

Update `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bluematador": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### 4. Restart Claude Desktop

Quit and restart Claude Desktop, then test with a query like:
> "List my Bluematador integrations"

## Deployment Options

### Option 1: Docker (Easiest)

```bash
# Build the app
npm run build

# Build and run with Docker
docker build -t bluematador-mcp .
docker run -p 3000:3000 bluematador-mcp

# Or use docker-compose
docker-compose up -d
```

### Option 2: Cloud Platform

#### Railway
1. Push to GitHub
2. Connect repo to Railway
3. Set PORT=3000
4. Deploy
5. Use railway.app URL

#### Render/Heroku/etc
See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions

## npm Scripts Added

- `npm run dev:http` - Run HTTP server in development mode
- `npm run start:http` - Run built HTTP server

## Security Notes

### Public Deployment
- **DO NOT** set `BLUEMATADOR_API_KEY` or `BLUEMATADOR_ACCOUNT_ID` as environment variables
- Users provide credentials per-request through Claude

### Private/Team Deployment
- Set default credentials via environment variables
- Use firewall rules to restrict access
- Consider VPN or private network
- Enable HTTPS with proper certificates

## User Experience

### Before (Local Mode)
```bash
# User needs to:
npm install -g bluematador-mcp-server

# Configure claude_desktop_config.json:
{
  "mcpServers": {
    "bluematador": {
      "command": "bluematador-mcp-server",
      "env": {
        "BLUEMATADOR_API_KEY": "...",
        "BLUEMATADOR_ACCOUNT_ID": "..."
      }
    }
  }
}
```

### After (Remote Mode)
```json
# User only needs to:
# Configure claude_desktop_config.json:
{
  "mcpServers": {
    "bluematador": {
      "url": "https://your-server.com/sse"
    }
  }
}
```

That's it! No npm, no local credentials, no Node.js required.

## Benefits for Users

1. ✅ **No Installation** - Just add a URL
2. ✅ **Cross-Platform** - Works anywhere Claude Desktop runs
3. ✅ **Centralized Updates** - Update server once for all users
4. ✅ **Team Management** - Single deployment for entire organization
5. ✅ **Simplified Onboarding** - Easier for non-technical users

## Next Steps

1. **Test locally** with `npm run dev:http`
2. **Choose deployment platform** (see DEPLOYMENT.md)
3. **Deploy** using Docker or cloud platform
4. **Share URL** with your users
5. **Monitor** using the `/health` endpoint

## Troubleshooting

### Server won't start
- Check port 3000 is not in use: `lsof -i :3000`
- Check build succeeded: `ls -la dist/server-http.js`

### Can't connect from Claude
- Verify health endpoint works: `curl http://your-server/health`
- Check firewall allows incoming connections on port 3000
- Test MCP endpoint: `curl -X POST http://your-server/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1}'`

### Import errors
- Make sure you built first: `npm run build`
- Check all `.js` imports have `.js` extension
- Verify MCP SDK is updated to v1.10+ for Streamable HTTP support

## Questions?

- See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guide
- See [README.md](./README.md) for general usage
- File issues at: https://github.com/bluematador/blue-matador-mcp-server/issues
