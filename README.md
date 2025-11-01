# Bluematador for Claude Desktop

Connect your Bluematador monitoring directly to Claude Desktop with complete access to your infrastructure monitoring, alerting, and management capabilities.

## 🖥️ **Compatibility**

### ✅ **Works With**
- **Claude Desktop** - Full integration with all monitoring tools
- **Claude Dev (VS Code)** - Complete compatibility in VS Code environment

### ❌ **Does Not Work With**
- **Claude Web (claude.ai)** - Web version doesn't support integrations
- **ChatGPT** - Different platform, not compatible
- **Other AI chatbots** - Only works with Claude Desktop applications

## What You Can Do

Ask Claude to help you with your Bluematador monitoring using natural language. You get access to all Bluematador features:

### 🔗 **Cloud Integration Management**
- Set up and manage AWS and Azure monitoring connections
- Enable, disable, or update your cloud integrations
- View integration status and troubleshoot issues

### 📊 **Monitoring & Alerts**
- Check active alerts and events in real-time
- Query historical monitoring data and trends
- Get summaries of your infrastructure health
- View metrics and performance data

### 🔕 **Alert Management**
- Create rules to mute specific alerts or resources
- Mute monitors by service type (SQS, RDS, EC2, etc.)
- Use wildcard patterns to mute multiple resources at once
- Manage alert visibility and notification preferences
- Control when and how you receive alerts

### 🔔 **Notification Setup**
- Configure email, PagerDuty, OpsGenie notifications
- Set up AWS SNS, VictorOps, SquadCast integrations
- Manage ServiceNow and other notification channels
- Control alert severity levels and delivery

### 👥 **Team & Project Management**
- Invite team members and manage permissions
- Organize monitoring by projects
- View user access and activity

## Installation & Setup

You have two options for using the Bluematador MCP server:

### Option 1: Local Installation (Traditional)

Install via npm and run locally on your machine:

```bash
npm install -g bluematador-mcp-server
```

### Option 2: Remote Server (No Installation Required) ⭐ NEW

Use a hosted Bluematador MCP server - **no local installation needed!**

Simply configure Claude Desktop to connect to the remote server URL. See [DEPLOYMENT.md](./DEPLOYMENT.md) for hosting your own server, or contact Bluematador for a hosted solution.

**Benefits of remote mode:**
- ✅ No npm installation required
- ✅ Works on any device with Claude Desktop
- ✅ Centralized updates and management
- ✅ Easier for team deployments

---

## Setup (Local Mode)

### 1. Get Your Bluematador Credentials

1. Log into your [Bluematador account](https://app.bluematador.com)
2. Go to **Settings** → **API Keys**
3. Create a new API key
4. Copy your **API Key** and **Account ID** (UUID format)

### 2. Configure Claude Desktop

Find your Claude Desktop config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

### 3. Choose Your Configuration

#### Option A: Store Credentials (Easier)
Your credentials are saved and used automatically:

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

#### Option B: Provide Credentials Per Request (More Secure)
You provide credentials with each request:

```json
{
  "mcpServers": {
    "bluematador": {
      "command": "bluematador-mcp-server"
    }
  }
}
```

### 4. Restart Claude Desktop

Completely quit and restart Claude Desktop to load the integration.

---

## Setup (Remote Mode)

### Using a Remote Bluematador MCP Server

If you're connecting to a hosted MCP server, configuration is even simpler:

#### 1. Get the Server URL

Get the server URL from your administrator or hosting platform (e.g., `https://your-server.com/mcp`)

#### 2. Configure Claude Desktop

Find your Claude Desktop config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

Add this configuration:

```json
{
  "mcpServers": {
    "bluematador": {
      "url": "https://your-server.com/mcp"
    }
  }
}
```

#### 3. Restart Claude Desktop

That's it! No npm install, no local credentials needed.

### Hosting Your Own Remote Server

Want to deploy your own Bluematador MCP server for your team?

See the complete [DEPLOYMENT.md](./DEPLOYMENT.md) guide for:
- Docker deployment
- Cloud platform deployment (Railway, Render, Heroku, AWS, GCP, Azure)
- Security best practices
- Environment configuration
- Monitoring and scaling

**Quick start for testing locally:**

```bash
npm run dev:http
# Server starts at http://localhost:3000
```

Then configure Claude Desktop:
```json
{
  "mcpServers": {
    "bluematador": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

## How to Use

Once installed, ask Claude to help you with your Bluematador monitoring using natural language:

### 🔍 **Check Your Infrastructure**

**With stored credentials:**
```
"What active alerts do I have right now?"
"Show me events from the last 24 hours"
"List all my AWS integrations and their status"
```

**With per-request credentials:**
```
"Show my active alerts. My API key is abc123 and account ID is 12345678-1234-1234-1234-123456789abc"
"List my integrations using API key abc123 and account ID 12345678-1234-1234-1234-123456789abc"
```

### 🔕 **Manage Alerts**

```
"Mute all SQS monitors for the next hour"
"Create a mute rule for production EC2 instances"
"Mute all resources matching the pattern 'prod-*'"
"Mute all SQS queues starting with 'test-'"
"Mute resources ending with '-staging' pattern"
"Show me what monitors are available for muting"
"Delete the mute rule for my test servers"
```

### 🔔 **Set Up Notifications**

```
"Create an email notification for critical alerts to ops@company.com"
"Set up a PagerDuty integration for our production service"
"Configure SNS notifications for our alerts topic"
"Show me all my current notification settings"
```

### 🔗 **Manage Integrations**

```
"Create a new AWS integration for my production account"
"Show me the status of all my cloud integrations"
"Disable the integration for my staging environment"
"Update my Azure integration settings"
```

### 👥 **Team Management**

```
"Who are the users in my account?"
"Invite john@company.com as an admin user"
"What projects do we have set up?"
"Show me recent user activity"
```

### 📊 **View Metrics and Data**

```
"Get CPU utilization metrics for the last week"
"Show me a summary of events for the past month"
"What's the current health status of my infrastructure?"
"Query memory usage trends for my production servers"
```

## Troubleshooting

### Common Issues

**"Integration not working"**
- Restart Claude Desktop completely (quit and reopen)
- Check that your API key and Account ID are correct
- Verify your Bluematador account is active

**"Authentication failed"**
- Double-check your API key format
- Ensure your Account ID is in UUID format (12345678-1234-1234-1234-123456789abc)
- Try logging into Bluematador web interface to verify account access

**"No response from Claude"**
- Make sure you restarted Claude Desktop after configuration
- Check that the integration is listed in Claude's status
- Try asking a simple question like "List my integrations"

### Getting Help

- **Bluematador Support**: [support.bluematador.com](https://support.bluematador.com)
- **Claude Desktop Help**: [Claude Desktop Documentation](https://docs.anthropic.com/claude/docs)

## Security & Privacy

- Your API credentials are only used to connect to your Bluematador account
- No data is stored or transmitted outside of Claude Desktop and Bluematador
- Choose the credential configuration that matches your security requirements

## License

MIT License - see the full license in the package documentation.