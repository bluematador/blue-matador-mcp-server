# Bluematador MCP Server - Development Guide

## 🛠️ Development

### Project Structure

```
bluematador-mcp-server/
├── src/
│   ├── index.ts              # Entry point
│   ├── index-stdio.ts        # Core MCP server implementation
│   ├── api-client.ts         # Bluematador API client
│   └── types.ts              # TypeScript types
├── docs/
│   └── API-REFERENCE.md      # API reference
└── dist/                     # Built files
```

### Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

### Local Development

Run the development server:
```bash
npm run dev
```

Configure Claude Desktop to use your local development version:

```json
{
  "mcpServers": {
    "bluematador": {
      "command": "node",
      "args": ["/path/to/bluematador-mcp-server/dist/index.js"],
      "env": {
        "BLUEMATADOR_API_KEY": "your-api-key-here",
        "BLUEMATADOR_ACCOUNT_ID": "your-account-id-here"
      }
    }
  }
}
```

### Available Scripts

- `npm run build` - Build the TypeScript project
- `npm run dev` - Run in development mode with tsx
- `npm run clean` - Remove the dist directory
- `npm run rebuild` - Clean and rebuild
- `npm run typecheck` - Run TypeScript type checking
- `npm run docs` - Regenerate `docs/API-REFERENCE.md` from the tool list. `npm test` fails until you commit the result after changing a tool
- `npm test` - Build, then run the unit tests

### Testing

The unit tests drive the real server through an in-memory MCP client and point it at a local HTTP stub, so they need no credentials or network access:
```bash
npm test
```

Run specific test files:
```bash
npm run test:mcp-direct
npm run test:mcp-tools
```

---

## 🌐 Transport Protocol

This server uses the **stdio** transport as specified in the MCP protocol.

- **Protocol Version**: 2026-07-28. Clients on 2025-11-25, 2025-06-18, 2025-03-26, and 2024-11-05 still connect through the older handshake.
- **Transport**: stdio (Standard Input/Output)

---

## 📦 Requirements

- **Node.js**: 20.x or higher
- **TypeScript**: 5.x
- **Bluematador Account**: With API access for testing

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Run type checking: `npm run typecheck`
6. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow existing code formatting
- Add JSDoc comments for public APIs
- Write tests for new features

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details
