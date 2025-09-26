#!/usr/bin/env node

// Simple test script to verify MCP server functionality
// This simulates how the MCP server would be called

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Testing Bluematador MCP Server...\n');

// Test if the server can start and list tools
function testServer() {
  const serverPath = path.join(__dirname, 'dist', 'index.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      BLUEMATADOR_API_KEY: 'test-key-for-initialization'
    }
  });

  let output = '';
  let errorOutput = '';

  server.stdout.on('data', (data) => {
    output += data.toString();
  });

  server.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  // Send initialize request
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  server.stdin.write(JSON.stringify(initRequest) + '\n');

  // Send list tools request after a short delay
  setTimeout(() => {
    const listToolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };

    server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

    // Close stdin and wait for response
    setTimeout(() => {
      server.stdin.end();

      setTimeout(() => {
        server.kill();

        console.log('=== Server Output ===');
        if (output) {
          console.log(output);
        }

        if (errorOutput) {
          console.log('=== Server Errors ===');
          console.log(errorOutput);
        }

        // Basic validation
        if (errorOutput.includes('Bluematador MCP server running')) {
          console.log('\n✅ Server started successfully');
        } else {
          console.log('\n❌ Server may not have started properly');
        }

        if (output.includes('create_aws_integration') || output.includes('create_azure_integration')) {
          console.log('✅ Tools are properly defined');
        } else {
          console.log('❌ Tools may not be properly defined');
        }

        console.log('\nTest completed. Check the output above for any errors.');
      }, 1000);
    }, 500);
  }, 500);

  server.on('error', (error) => {
    console.error('Failed to start server:', error);
  });
}

// First, try to build the project
console.log('Building project...');
const buildProcess = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  cwd: __dirname
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Build successful\n');
    console.log('Starting server test...\n');
    testServer();
  } else {
    console.log('❌ Build failed with code', code);
    process.exit(1);
  }
});

buildProcess.on('error', (error) => {
  console.error('Build process error:', error);
  process.exit(1);
});