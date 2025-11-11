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
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import the stdio server class - we'll reuse its logic
import { BluematadorMCPServer as StdioServer } from './index-stdio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
        description: 'Bluematador MCP Server - Remote Access via Streamable HTTP',
        icon: '/icon.svg'
      });
    });

    // Icon endpoint - serves the Bluematador SVG logo
    app.get('/icon.svg', (req, res) => {
      try {
        const iconPath = join(__dirname, '..', 'icon.svg');
        const icon = readFileSync(iconPath, 'utf-8');
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(icon);
      } catch (error) {
        console.error('Error serving icon:', error);
        res.status(404).send('Icon not found');
      }
    });

    // Main MCP endpoint using Streamable HTTP transport
    app.post('/mcp', async (req, res) => {
      try {
        // Extract credentials from HTTP headers (per-user credentials)
        const apiKey = req.headers['bluematador_api_key'] as string;
        const accountId = req.headers['bluematador_account_id'] as string;
        const baseUrl = req.headers['bluematador_base_url'] as string;

        // Validate credentials are provided
        if (!apiKey || !accountId) {
          res.status(401).json({
            jsonrpc: '2.0',
            error: {
              code: -32001,
              message: 'Missing credentials. Please provide BLUEMATADOR_API_KEY and BLUEMATADOR_ACCOUNT_ID headers.'
            },
            id: null
          });
          return;
        }

        // Create a new transport for each request to prevent request ID collisions
        // Different clients may use the same JSON-RPC request IDs
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined, // Stateless mode
          enableJsonResponse: true
        });

        res.on('close', () => {
          transport.close();
        });

        // Create a new MCP server instance with per-user credentials
        const mcpServer = new StdioServer(apiKey, accountId, baseUrl);
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
              url: `http://localhost:${port}/mcp`,
              headers: {
                'BLUEMATADOR_API_KEY': 'your-api-key-here',
                'BLUEMATADOR_ACCOUNT_ID': 'your-account-id-here'
              }
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
