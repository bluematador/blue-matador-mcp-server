# Bluematador for Claude Desktop

Connect your Bluematador monitoring to Claude Desktop with **zero installation required**.

---

## 🚀 Quick Start

Add Bluematador to Claude Desktop in 30 seconds using the remote server:

1. Open **Claude Desktop** → **Settings** → **Connectors**
2. Click **"Add custom connector"**
3. Enter:
   - **Name**: `Bluematador`
   - **URL**: `https://your-server-url.com/mcp`
4. Click **"Add"**

That's it! No npm install, no local setup, no configuration files.

**Note**: The remote server is deployed on AWS App Runner, providing automatic HTTPS and scalability.

### 🔑 Providing Credentials

When using the remote server, you'll need to provide your Bluematador credentials with each request:

1. Get your **API Key** and **Account ID** from [Bluematador Settings → API Keys](https://app.bluematador.com/ur/app#/account/apikeys)

Then, when asking Claude to use Bluematador tools, include your credentials:

```
"Show my active integrations using API key: YOUR_API_KEY and account ID: YOUR_ACCOUNT_ID"
```

**Note**: Your credentials are only used for that conversation and are never stored by the server.

---

## 🖥️ Compatibility

### ✅ Works With
- **Claude Desktop** (macOS, Windows, Linux)
- **Claude Code** (CLI tool)
- **Claude Dev** (VS Code extension)

### ❌ Does Not Work With
- Claude Web (claude.ai)
- ChatGPT or other AI platforms

---

## ✨ What You Can Do

Ask Claude to help with your Bluematador monitoring using natural language:

### 🔗 Cloud Integration Management
- Set up and manage AWS/Azure monitoring
- Enable, disable, or update integrations
- View integration status and troubleshoot issues

### 📊 Monitoring & Alerts
- Check active alerts and events in real-time
- Query historical monitoring data
- Get infrastructure health summaries
- View metrics and performance data

### 🔕 Alert Management
- Create mute rules for specific alerts or resources
- Mute monitors by service type (SQS, RDS, EC2, etc.)
- Use wildcard patterns for bulk operations
- Control alert visibility and notifications

### 🔔 Notification Setup
- Configure Email, PagerDuty, OpsGenie
- Set up AWS SNS, VictorOps, SquadCast
- Manage ServiceNow integrations
- Control alert severity levels

### 👥 Team & Project Management
- Invite team members
- Manage user permissions
- Organize monitoring by projects

---

## 📚 Documentation

- **[User Guide](./docs/USER-GUIDE.md)** - How to use Bluematador with Claude
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Deploy your own server to AWS
- **[API Reference](./docs/API-REFERENCE.md)** - Complete tool reference

---

## 🏢 For Organizations

### Deploy Your Own Server

Want to host the Bluematador MCP server for your organization?

**Recommended**: Deploy to **AWS App Runner** in ~10 minutes with automatic HTTPS.

```bash
# Clone the repository
git clone https://github.com/bluematador/blue-matador-mcp-server.git
cd blue-matador-mcp-server

# Build the project
npm install
npm run build

# Deploy to AWS App Runner (see deployment guide)
```

📖 **[Complete Deployment Guide →](./docs/DEPLOYMENT.md)**

### Example Deployment

Your organization can provide a single URL to all team members:

```
https://bluematador-mcp.your-company.com/mcp
```

Users simply add this URL to Claude Desktop - no installation needed!

---

## 🔒 Security & Privacy

- **No credential storage** - Users provide API keys per-session
- **Direct API calls** - All requests go directly to Bluematador's API
- **HTTPS only** - All connections are encrypted
- **Audit trail** - All actions logged in your Bluematador account

---

## 💡 Example Usage

Once connected, use natural language with Claude:

```
You: "Show me active Bluematador alerts"
You: "Create a mute rule for all SQS monitors in us-east-1"
You: "List my AWS integrations"
You: "Invite john@company.com as an admin"
You: "What EC2 instances have high CPU?"
```

---

## 🛠️ Development

### Project Structure

```
bluematador-mcp-server/
├── src/
│   ├── index.ts              # Entry point (stdio mode)
│   ├── index-stdio.ts        # Core MCP server implementation
│   ├── server-http.ts        # HTTP server for remote access
│   ├── api-client.ts         # Bluematador API client
│   └── types.ts              # TypeScript types
├── docs/
│   ├── USER-GUIDE.md         # User documentation
│   ├── DEPLOYMENT.md         # Deployment guide
│   └── API-REFERENCE.md      # API reference
└── dist/                     # Built files
```

### Run Locally as MCP Server

To run the server locally for development or testing:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run as local stdio MCP server
npm run start
```

Then configure Claude Desktop to use the local server by editing your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bluematador": {
      "command": "node",
      "args": ["/absolute/path/to/bluematador-mcp-server/dist/index.js"]
    }
  }
}
```

**Note**: Replace `/absolute/path/to/` with the actual path to your project directory.

### npm Scripts

- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Run in development mode (stdio)
- `npm run dev:http` - Run HTTP server in development mode
- `npm run start` - Run built stdio server
- `npm run start:http` - Run built HTTP server

---

## 🌐 Transport Protocols

This server uses the **Streamable HTTP** transport as specified in the MCP protocol (2025-03-26 revision).

- **Protocol Version**: 2024-11-05
- **Transport**: Streamable HTTP
- **Endpoint**: `/mcp`
- **Health Check**: `/health`

---

## 📦 Requirements

- **Node.js**: 18.x or higher
- **Claude Desktop**: Latest version
- **Bluematador Account**: With API access

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

---

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/bluematador/blue-matador-mcp-server/issues)
- **Documentation**: [Bluematador Docs](https://docs.bluematador.com)
- **MCP Protocol**: [Model Context Protocol](https://modelcontextprotocol.io)

---


**Made with ❤️ by Bluematador**

[Website](https://bluematador.com) • [Documentation](https://docs.bluematador.com) • [GitHub](https://github.com/bluematador)
