#!/usr/bin/env node

/**
 * Bluematador MCP Server - stdio transport (default/local mode)
 *
 * This is the main entry point for the stdio transport version.
 * For remote/HTTP access, use server-http.ts instead.
 */

import { BluematadorMCPServer } from './index-stdio.js';

// Start the server
const server = new BluematadorMCPServer();
server.run().catch(console.error);

export * from './index-stdio.js';
