#!/usr/bin/env node

/**
 * HTTP Server for Bluematador MCP using Streamable HTTP Transport
 *
 * This server exposes the Bluematador MCP server over HTTP using the modern
 * Streamable HTTP transport, allowing remote access without requiring npm
 * installation on the client side.
 *
 * The server reuses all the tool handlers from the main index.ts implementation.
 */

import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

// Import the stdio server class - we'll reuse its logic
import { BluematadorMCPServer as StdioServer } from './index-stdio.js';

class BluematadorHTTPServer {
  async createHttpServer(port: number = 3000): Promise<any> {
    const app = express();
    app.use(express.json());

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        name: 'bluematador-mcp-server',
        version: '1.0.0',
        transport: 'Streamable HTTP',
        endpoint: '/mcp',
        description: 'Bluematador MCP Server - Remote Access via Streamable HTTP'
      });
    });

    // Main MCP endpoint using Streamable HTTP transport
    app.post('/mcp', async (req, res) => {
      try {
        // Create a new transport for each request to prevent request ID collisions
        // Different clients may use the same JSON-RPC request IDs
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined, // Stateless mode
          enableJsonResponse: true
        });

        res.on('close', () => {
          transport.close();
        });

        // Create a new MCP server instance for this connection
        const mcpServer = new StdioServer();
        await mcpServer.connect(transport);

        // Handle the request
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error'
            },
            id: null
          });
        }
      }
    });

    return new Promise((resolve) => {
      const server = app.listen(port, () => {
        console.error(`🚀 Bluematador MCP Server running on port ${port}`);
        console.error(`📡 Streamable HTTP endpoint: http://localhost:${port}/mcp`);
        console.error(`❤️  Health check: http://localhost:${port}/health`);
        console.error('');
        console.error('To use this server remotely, configure your Claude Desktop:');
        console.error(JSON.stringify({
          mcpServers: {
            bluematador: {
              url: `http://localhost:${port}/mcp`
            }
          }
        }, null, 2));
        resolve(server);
      }).on('error', (error: Error) => {
        console.error('Server error:', error);
        process.exit(1);
      });
    });
  }
}

// Start the server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parseInt(process.env.PORT || '3000', 10);
  const server = new BluematadorHTTPServer();
  server.createHttpServer(port).catch(console.error);
}

export { BluematadorHTTPServer };
