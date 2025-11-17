# Bluematador MCP Server

[![npm version](https://badge.fury.io/js/blue-matador-mcp-server.svg)](https://www.npmjs.com/package/blue-matador-mcp-server)

Connect your Bluematador monitoring to Claude Desktop and Claude Code **securely** with your credentials stored locally.

---

## 🚀 Quick Start

### Requirements

- **Node.js**: 16.x or higher

### Installation

Install the Bluematador MCP server as an npm package:

```bash
npm install -g blue-matador-mcp-server
```

📦 [View on npm](https://www.npmjs.com/package/blue-matador-mcp-server)

### Configuration

1. Get your **API Key** and **Account ID** from [Bluematador Settings → API Keys](https://app.bluematador.com/ur/app#/account/apikeys)

2. Open **Claude Desktop** → **Settings** → **Developer** → **Edit Config**

3. Add the Bluematador MCP server to your configuration:

```json
{
  "mcpServers": {
    "bluematador": {
      "command": "bluematador-mcp-server",
      "env": {
        "BLUEMATADOR_API_KEY": "your-api-key-here",
        "BLUEMATADOR_ACCOUNT_ID": "your-account-id-here"
      }
    }
  }
}
```

4. Save the file and restart Claude Desktop

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

- **[API Reference](./docs/API-REFERENCE.md)** - Complete tool reference

---

## 🔒 Security & Privacy

- **Per-user credentials** - Each user provides their own API keys in their local configuration
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

## 🛠️ For Developers

If you want to contribute or run the server locally for development, see [DEV-README.md](./DEV-README.md)

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
