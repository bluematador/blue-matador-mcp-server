#!/usr/bin/env node

/**
 * Bluematador MCP Server - stdio transport (default/local mode)
 *
 * This is the main entry point for the stdio transport version.
 * For remote/HTTP access, use server-http.ts instead.
 *
 * Credentials are read from environment variables:
 * - BLUEMATADOR_API_KEY
 * - BLUEMATADOR_ACCOUNT_ID
 * - BLUEMATADOR_BASE_URL (optional)
 */

import { BluematadorMCPServer } from './index-stdio.js';

// Credentials are passed from environment variables via constructor
// The constructor will validate and throw an error if credentials are missing
const server = new BluematadorMCPServer();
server.run().catch(console.error);

export * from './index-stdio.js';
