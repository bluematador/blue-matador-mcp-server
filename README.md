# Bluematador MCP Server

A comprehensive Model Context Protocol (MCP) server that provides complete access to the Bluematador API for monitoring, alerting, and infrastructure management.

## 🖥️ **Platform Support**

### ✅ **Fully Supported**
- **Claude Desktop** - Native MCP integration with all 34 tools
- **Claude Dev (VS Code)** - Full compatibility in VS Code environment
- **Other MCP-compatible clients** - Standard MCP protocol support

### ❌ **Not Supported**
- **Claude Web (claude.ai)** - No MCP server support
- **ChatGPT/OpenAI** - Different protocol (not MCP compatible)
- **Other AI platforms** (Gemini, Bing, etc.) - No MCP support

**Note**: This server uses the Model Context Protocol (MCP) which is specifically designed for Claude platforms. For other AI platforms, direct API integration would be required.

## Features

This MCP server provides **34 tools** covering all Bluematador capabilities:

### 🔗 **Integration Management (8 tools)**
- **create_aws_integration** - Create a new AWS integration
- **create_azure_integration** - Create a new Azure integration
- **list_integrations** - List all integrations for an account
- **update_aws_integration** - Update an existing AWS integration
- **update_azure_integration** - Update an existing Azure integration
- **enable_integration** - Enable an integration
- **disable_integration** - Disable an integration
- **delete_integration** - Delete an integration

### 📊 **Events & Monitoring (4 tools)**
- **get_opened_events** - Get events opened within a specific time period
- **get_active_events** - Get currently active events
- **get_active_events_summary** - Get summary of events for the last 30 days
- **get_metrics** - Query metrics data with flexible filtering

### 📁 **Project Management (1 tool)**
- **list_projects** - List all projects for an account

### 👥 **User Management (2 tools)**
- **list_users** - List all users in an account
- **invite_users** - Invite new users to an account

### 🔔 **Notification Management (11 tools)**
- **list_notifications** - List all notification integrations
- **create_email_notification** - Create email notifications
- **create_pagerduty_notification** - Create PagerDuty notifications
- **create_opsgenie_notification** - Create OpsGenie notifications
- **create_sns_notification** - Create AWS SNS notifications
- **create_victorops_notification** - Create VictorOps notifications
- **create_squadcast_notification** - Create SquadCast notifications
- **create_servicenow_notification** - Create ServiceNow notifications
- **enable_notification** - Enable a notification integration
- **disable_notification** - Disable a notification integration
- **delete_notification** - Delete a notification integration

### 🔇 **Mute Rules (8 tools)**
- **list_mute_rules** - List alert mute rules
- **create_mute_rule** - Create rules to suppress specific alerts
- **delete_mute_rule** - Delete existing mute rules
- **get_mute_regions** - Get available AWS/Azure regions for muting
- **get_mute_monitors** - Get available monitors for muting
- **get_mute_resources** - Get available resources for muting
- **mute_monitors_by_service** - Easily mute monitors for specific services (e.g., SQS, RDS, EC2)

## Installation

### NPM Installation (Recommended)
```bash
npm install -g bluematador-mcp-server
```

### Manual Installation
1. Clone this repository
2. Install dependencies: `npm install`
3. Build the server: `npm run build`

## Configuration

### Option 1: Per-Request API Key (Recommended)
You can provide the API key with each tool call, which is ideal for multi-user scenarios:

```json
{
  "name": "create_aws_integration",
  "arguments": {
    "apiKey": "your-api-key-here",
    "accountId": "12345678-1234-1234-1234-123456789abc",
    "name": "My AWS Integration",
    "roleArn": "arn:aws:iam::123456789012:role/BluematadorRole",
    "externalId": "unique-external-id"
  }
}
```

### Option 2: Environment Variables
Alternatively, set environment variables (less secure for multi-user setups):

```bash
export BLUEMATADOR_API_KEY="your-api-key-here"
# Optional: set custom base URL (defaults to https://app.bluematador.com)
export BLUEMATADOR_BASE_URL="https://app.bluematador.com"
```

## Usage

### Running the Server

```bash
npm start
```

For development:
```bash
npm run dev
```

### Using with Claude Desktop

Add this server to your Claude Desktop configuration file (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

**If installed via NPM:**
```json
{
  "mcpServers": {
    "bluematador": {
      "command": "bluematador-mcp-server"
    }
  }
}
```

**If installed manually:**
```json
{
  "mcpServers": {
    "bluematador": {
      "command": "node",
      "args": ["/path/to/bluematador-mcp-server/dist/index.js"]
    }
  }
}
```

**Note:** With the per-request API key approach, you don't need to set environment variables in the config. Each user can provide their own API key when making requests.

### API Key

You can obtain your Bluematador API key from the API keys page in your Bluematador account dashboard.

## Tool Examples

### Integration Management

```typescript
// Create AWS Integration
{
  "name": "create_aws_integration",
  "arguments": {
    "apiKey": "your-api-key",
    "accountId": "12345678-1234-1234-1234-123456789abc",
    "name": "My AWS Production Environment",
    "roleArn": "arn:aws:iam::123456789012:role/BluematadorRole",
    "externalId": "unique-external-id"
  }
}

// List all integrations
{
  "name": "list_integrations",
  "arguments": {
    "apiKey": "your-api-key",
    "accountId": "12345678-1234-1234-1234-123456789abc"
  }
}
```

### Events & Monitoring

```typescript
// Get active events
{
  "name": "get_active_events",
  "arguments": {
    "apiKey": "your-api-key",
    "accountId": "12345678-1234-1234-1234-123456789abc"
  }
}

// Get events in time range
{
  "name": "get_opened_events",
  "arguments": {
    "apiKey": "your-api-key",
    "accountId": "12345678-1234-1234-1234-123456789abc",
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-02T00:00:00Z"
  }
}
```

### User Management

```typescript
// List users
{
  "name": "list_users",
  "arguments": {
    "apiKey": "your-api-key",
    "accountId": "12345678-1234-1234-1234-123456789abc"
  }
}

// Invite users
{
  "name": "invite_users",
  "arguments": {
    "apiKey": "your-api-key",
    "accountId": "12345678-1234-1234-1234-123456789abc",
    "users": [
      {"email": "user1@company.com", "admin": false},
      {"email": "admin@company.com", "admin": true}
    ]
  }
}
```

### Notification Management

```typescript
// Create email notification
{
  "name": "create_email_notification",
  "arguments": {
    "apiKey": "your-api-key",
    "accountId": "12345678-1234-1234-1234-123456789abc",
    "email": "alerts@company.com",
    "severities": ["alert", "warning"]
  }
}

// Create PagerDuty notification
{
  "name": "create_pagerduty_notification",
  "arguments": {
    "apiKey": "your-api-key",
    "accountId": "12345678-1234-1234-1234-123456789abc",
    "name": "Production Alerts",
    "account": "mycompany",
    "serviceName": "Bluematador Service",
    "serviceSecret": "pagerduty-integration-key",
    "severities": ["alert"]
  }
}

// Create OpsGenie notification
{
  "name": "create_opsgenie_notification",
  "arguments": {
    "apiKey": "your-api-key",
    "accountId": "12345678-1234-1234-1234-123456789abc",
    "name": "OpsGenie Alerts",
    "apiKey": "opsgenie-api-key",
    "severities": ["alert", "warning"]
  }
}

// Create AWS SNS notification
{
  "name": "create_sns_notification",
  "arguments": {
    "apiKey": "your-api-key",
    "accountId": "12345678-1234-1234-1234-123456789abc",
    "name": "SNS Alerts",
    "topicArn": "arn:aws:sns:us-east-1:123456789012:bluematador-alerts",
    "severities": ["alert"]
  }
}

// Create VictorOps notification
{
  "name": "create_victorops_notification",
  "arguments": {
    "apiKey": "your-api-key",
    "accountId": "12345678-1234-1234-1234-123456789abc",
    "name": "VictorOps Alerts",
    "apiKey": "victorops-api-key",
    "routingKey": "bluematador",
    "severities": ["alert"]
  }
}
```

### Mute Rules

```typescript
// List mute rules
{
  "name": "list_mute_rules",
  "arguments": {
    "apiKey": "your-api-key",
    "accountId": "12345678-1234-1234-1234-123456789abc"
  }
}

// Create mute rule for specific resource
{
  "name": "create_mute_rule",
  "arguments": {
    "apiKey": "your-api-key",
    "accountId": "12345678-1234-1234-1234-123456789abc",
    "hide": true,
    "resource": {
      "arn": "arn:aws:ec2:us-east-1:123456789012:instance/i-1234567890abcdef0",
      "refType": "aws_arn"
    }
  }
}

// Get available regions for muting
{
  "name": "get_mute_regions",
  "arguments": {
    "apiKey": "your-api-key",
    "accountId": "12345678-1234-1234-1234-123456789abc"
  }
}

// Get available monitors for muting
{
  "name": "get_mute_monitors",
  "arguments": {
    "apiKey": "your-api-key",
    "accountId": "12345678-1234-1234-1234-123456789abc"
  }
}

// Mute monitors by service (NEW!)
{
  "name": "mute_monitors_by_service",
  "arguments": {
    "apiKey": "your-api-key",
    "accountId": "12345678-1234-1234-1234-123456789abc",
    "serviceName": "sqs",
    "hide": false,
    "monitorNames": ["queue.depth.high", "queue.age.high"]
  }
}

// Delete mute rule
{
  "name": "delete_mute_rule",
  "arguments": {
    "apiKey": "your-api-key",
    "accountId": "12345678-1234-1234-1234-123456789abc",
    "ruleId": "rule-uuid-here"
  }
}
```

### Metrics & Monitoring

```typescript
// Query metrics data
{
  "name": "get_metrics",
  "arguments": {
    "apiKey": "your-api-key",
    "accountId": "12345678-1234-1234-1234-123456789abc",
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-02T00:00:00Z",
    "metricNames": ["cpu.utilization", "memory.utilization"],
    "aggregation": "avg"
  }
}
```

## Development

### Quick Setup
For local development and testing, run:
```bash
./examples/scripts/setup-dev-env.sh
```

### Project Structure

```
bluematador-mcp-server/
├── src/                    # Source code
│   ├── index.ts           # Main MCP server implementation
│   ├── api-client.ts      # Bluematador API client
│   └── types.ts           # TypeScript type definitions
├── dist/                   # Built JavaScript files
├── dev/                    # Development tools and configs
│   ├── configs/           # Development configurations
│   └── scripts/           # Development scripts
├── test/                   # Testing files
│   ├── integration/       # Integration tests
│   ├── fixtures/          # Test data and mock responses
│   └── configs/           # Test configurations
├── examples/               # Example configurations and scripts
│   ├── configs/           # Example Claude configurations
│   └── scripts/           # Setup and utility scripts
└── docs/                   # Documentation
    ├── DEVELOPMENT.md     # Development guide
    └── TESTING.md         # Testing guide
```

### Development Commands

```bash
# Building and running
npm run build              # Build TypeScript to JavaScript
npm run rebuild            # Clean and rebuild
npm run start              # Start production server
npm run start:dev          # Start development server
npm run watch:dev          # Start with auto-restart on changes
npm run dev                # Start with tsx (TypeScript execution)

# Testing
npm run test               # Run all tests
npm run test:integration   # Run integration tests

# Code quality
npm run typecheck          # Check TypeScript types
npm run lint               # Run linter (when configured)
```

### Development Workflow

1. **Setup**: Run `./examples/scripts/setup-dev-env.sh`
2. **Develop**: Use `npm run watch:dev` for auto-restart
3. **Test**: Run `npm run test` to validate changes
4. **Build**: Use `npm run build` for production

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed development guide and [docs/TESTING.md](docs/TESTING.md) for testing procedures.

## Error Handling

The server provides comprehensive error handling and will return appropriate MCP errors for:

- Authentication failures (401)
- Resource not found (404)
- Bad requests (400)
- Internal server errors (500)

## License

MIT