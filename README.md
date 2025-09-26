# Bluematador MCP Server

A Model Context Protocol (MCP) server that provides tools for managing AWS and Azure integrations in Bluematador.

## Features

This MCP server provides the following tools:

- **create_aws_integration** - Create a new AWS integration
- **create_azure_integration** - Create a new Azure integration
- **list_integrations** - List all integrations for an account
- **update_aws_integration** - Update an existing AWS integration
- **update_azure_integration** - Update an existing Azure integration
- **enable_integration** - Enable an integration
- **disable_integration** - Disable an integration
- **delete_integration** - Delete an integration

## Installation

1. Clone this repository or copy the server files
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the server:
   ```bash
   npm run build
   ```

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

### Create AWS Integration

```typescript
// Tool call example
{
  "name": "create_aws_integration",
  "arguments": {
    "accountId": "12345678-1234-1234-1234-123456789abc",
    "name": "My AWS Production Environment",
    "roleArn": "arn:aws:iam::123456789012:role/BluematadorRole",
    "externalId": "unique-external-id"
  }
}
```

### Create Azure Integration

```typescript
// Tool call example
{
  "name": "create_azure_integration",
  "arguments": {
    "accountId": "12345678-1234-1234-1234-123456789abc",
    "name": "My Azure Production Environment",
    "subscriptionId": "abcd1234-5678-90ab-cdef-123456789abc",
    "tenantId": "efgh5678-9012-34ef-ghij-567890123456",
    "applicationId": "ijkl9012-3456-78ij-klmn-901234567890",
    "secret": "your-client-secret"
  }
}
```

### List Integrations

```typescript
// Tool call example
{
  "name": "list_integrations",
  "arguments": {
    "accountId": "12345678-1234-1234-1234-123456789abc"
  }
}
```

## Development

### Project Structure

```
src/
├── index.ts          # Main MCP server implementation
├── api-client.ts     # Bluematador API client
└── types.ts          # TypeScript type definitions
```

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

## Error Handling

The server provides comprehensive error handling and will return appropriate MCP errors for:

- Authentication failures (401)
- Resource not found (404)
- Bad requests (400)
- Internal server errors (500)

## License

MIT