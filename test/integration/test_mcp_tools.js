#!/usr/bin/env node

// Test script for Bluematador MCP server tools
// Tests list_mute_rules, get_active_events, and list_integrations

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test credentials (replace with your actual values)
const ACCOUNT_ID = process.env.BLUEMATADOR_TEST_ACCOUNT_ID || 'your-account-id-here';
const API_KEY = process.env.BLUEMATADOR_TEST_API_KEY || 'your-api-key-here';

console.log('🧪 Testing Bluematador MCP Server Tools...\n');

class MCPTester {
  constructor() {
    this.server = null;
    this.requestId = 1;
    this.responses = new Map();
    this.serverOutput = '';
    this.serverErrors = '';
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      const serverPath = path.join(__dirname, '..', '..', 'dist', 'index.js');

      this.server = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          BLUEMATADOR_API_KEY: API_KEY
        }
      });

      this.server.stdout.on('data', (data) => {
        const output = data.toString();
        this.serverOutput += output;

        // Parse JSON-RPC responses
        const lines = output.trim().split('\n');
        for (const line of lines) {
          try {
            const response = JSON.parse(line);
            if (response.id && response.id !== 'notification') {
              this.responses.set(response.id, response);
            }
          } catch (e) {
            // Not JSON, probably debug output
          }
        }
      });

      this.server.stderr.on('data', (data) => {
        this.serverErrors += data.toString();
      });

      this.server.on('error', (error) => {
        console.error('❌ Failed to start server:', error);
        reject(error);
      });

      // Give server time to start
      setTimeout(() => {
        if (this.serverErrors.includes('Bluematador MCP server running')) {
          console.log('✅ Server started successfully');
          resolve();
        } else {
          console.log('⚠️  Server may not have started properly, continuing anyway...');
          resolve();
        }
      }, 1000);
    });
  }

  async sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      console.log(`📤 Sending ${method} request (ID: ${id})`);
      console.log(`   Params: ${JSON.stringify(params, null, 2)}`);

      this.server.stdin.write(JSON.stringify(request) + '\n');

      // Wait for response
      const checkForResponse = () => {
        if (this.responses.has(id)) {
          const response = this.responses.get(id);
          console.log(`📥 Received response for ${method} (ID: ${id})`);
          resolve(response);
        } else {
          setTimeout(checkForResponse, 100);
        }
      };

      setTimeout(checkForResponse, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.responses.has(id)) {
          reject(new Error(`Timeout waiting for response to ${method}`));
        }
      }, 10000);
    });
  }

  async initialize() {
    const response = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    });

    if (response.error) {
      throw new Error(`Initialize failed: ${response.error.message}`);
    }

    console.log('✅ MCP server initialized successfully');
    return response;
  }

  async listTools() {
    const response = await this.sendRequest('tools/list');

    if (response.error) {
      throw new Error(`List tools failed: ${response.error.message}`);
    }

    console.log(`✅ Found ${response.result.tools.length} available tools`);
    return response.result.tools;
  }

  async testListMuteRules() {
    console.log('\n🔍 Testing list_mute_rules...');

    try {
      const response = await this.sendRequest('tools/call', {
        name: 'list_mute_rules',
        arguments: {
          accountId: ACCOUNT_ID,
          apiKey: API_KEY,
          includeInactive: true
        }
      });

      if (response.error) {
        console.log(`❌ list_mute_rules failed: ${response.error.message}`);
        return false;
      }

      console.log('✅ list_mute_rules executed successfully');
      if (response.result?.content) {
        console.log('📋 Response content:');
        response.result.content.forEach(content => {
          if (content.type === 'text') {
            console.log(content.text);
          }
        });
      }
      return true;
    } catch (error) {
      console.log(`❌ list_mute_rules error: ${error.message}`);
      return false;
    }
  }

  async testGetActiveEvents() {
    console.log('\n🔍 Testing get_active_events...');

    try {
      const response = await this.sendRequest('tools/call', {
        name: 'get_active_events',
        arguments: {
          accountId: ACCOUNT_ID,
          apiKey: API_KEY,
          limit: 5
        }
      });

      if (response.error) {
        console.log(`❌ get_active_events failed: ${response.error.message}`);
        return false;
      }

      console.log('✅ get_active_events executed successfully');
      if (response.result?.content) {
        console.log('📋 Response content:');
        response.result.content.forEach(content => {
          if (content.type === 'text') {
            console.log(content.text.substring(0, 200) + '...');
          }
        });
      }
      return true;
    } catch (error) {
      console.log(`❌ get_active_events error: ${error.message}`);
      return false;
    }
  }

  async testListIntegrations() {
    console.log('\n🔍 Testing list_integrations...');

    try {
      const response = await this.sendRequest('tools/call', {
        name: 'list_integrations',
        arguments: {
          accountId: ACCOUNT_ID,
          apiKey: API_KEY
        }
      });

      if (response.error) {
        console.log(`❌ list_integrations failed: ${response.error.message}`);
        return false;
      }

      console.log('✅ list_integrations executed successfully');
      if (response.result?.content) {
        console.log('📋 Response content:');
        response.result.content.forEach(content => {
          if (content.type === 'text') {
            console.log(content.text);
          }
        });
      }
      return true;
    } catch (error) {
      console.log(`❌ list_integrations error: ${error.message}`);
      return false;
    }
  }

  async cleanup() {
    if (this.server) {
      this.server.stdin.end();
      this.server.kill();
    }
  }

  async runTests() {
    try {
      await this.startServer();
      await this.initialize();

      const tools = await this.listTools();
      const requiredTools = ['list_mute_rules', 'get_active_events', 'list_integrations'];
      const availableTools = tools.map(tool => tool.name);

      console.log('\n📋 Checking for required tools:');
      for (const toolName of requiredTools) {
        if (availableTools.includes(toolName)) {
          console.log(`✅ ${toolName} - Available`);
        } else {
          console.log(`❌ ${toolName} - Missing`);
        }
      }

      const results = {
        listMuteRules: await this.testListMuteRules(),
        getActiveEvents: await this.testGetActiveEvents(),
        listIntegrations: await this.testListIntegrations()
      };

      console.log('\n📊 Test Results Summary:');
      console.log(`list_mute_rules: ${results.listMuteRules ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`get_active_events: ${results.getActiveEvents ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`list_integrations: ${results.listIntegrations ? '✅ PASS' : '❌ FAIL'}`);

      const passCount = Object.values(results).filter(Boolean).length;
      console.log(`\n🎯 Overall: ${passCount}/3 tests passed`);

      if (this.serverErrors) {
        console.log('\n⚠️  Server Errors:');
        console.log(this.serverErrors);
      }

    } catch (error) {
      console.error('💥 Test suite failed:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the tests
const tester = new MCPTester();
tester.runTests().then(() => {
  console.log('\n🏁 Testing completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Testing failed:', error);
  process.exit(1);
});