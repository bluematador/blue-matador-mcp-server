#!/usr/bin/env node

// Direct test script for Bluematador MCP server tools
// Tests list_mute_rules, get_active_events, and list_integrations using direct JSON-RPC

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test credentials (replace with your actual values)
const ACCOUNT_ID = process.env.BLUEMATADOR_TEST_ACCOUNT_ID || 'your-account-id-here';
const API_KEY = process.env.BLUEMATADOR_TEST_API_KEY || 'your-api-key-here';

console.log('🧪 Testing Bluematador MCP Server Tools...\n');

function testMCPTools() {
  const serverPath = path.join(__dirname, '..', '..', 'dist', 'index.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      BLUEMATADOR_API_KEY: API_KEY
    }
  });

  let output = '';
  let errorOutput = '';
  let responseCount = 0;
  const responses = [];

  server.stdout.on('data', (data) => {
    const dataStr = data.toString();
    output += dataStr;

    // Parse JSON responses
    const lines = dataStr.trim().split('\n');
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        responses.push(response);
        responseCount++;
      } catch (e) {
        // Not JSON, probably debug output
      }
    }
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

  console.log('📤 Sending initialize request...');
  server.stdin.write(JSON.stringify(initRequest) + '\n');

  // Send tools/list request
  setTimeout(() => {
    const listToolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };

    console.log('📤 Sending tools/list request...');
    server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

    // Test list_mute_rules
    setTimeout(() => {
      const listMuteRulesRequest = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'list_mute_rules',
          arguments: {
            accountId: ACCOUNT_ID,
            apiKey: API_KEY,
            includeInactive: true
          }
        }
      };

      console.log('📤 Testing list_mute_rules...');
      server.stdin.write(JSON.stringify(listMuteRulesRequest) + '\n');

      // Test get_active_events
      setTimeout(() => {
        const getActiveEventsRequest = {
          jsonrpc: '2.0',
          id: 4,
          method: 'tools/call',
          params: {
            name: 'get_active_events',
            arguments: {
              accountId: ACCOUNT_ID,
              apiKey: API_KEY
            }
          }
        };

        console.log('📤 Testing get_active_events...');
        server.stdin.write(JSON.stringify(getActiveEventsRequest) + '\n');

        // Test list_integrations
        setTimeout(() => {
          const listIntegrationsRequest = {
            jsonrpc: '2.0',
            id: 5,
            method: 'tools/call',
            params: {
              name: 'list_integrations',
              arguments: {
                accountId: ACCOUNT_ID,
                apiKey: API_KEY
              }
            }
          };

          console.log('📤 Testing list_integrations...');
          server.stdin.write(JSON.stringify(listIntegrationsRequest) + '\n');

          // Close stdin and wait for all responses
          setTimeout(() => {
            server.stdin.end();

            // Give time to collect all responses
            setTimeout(() => {
              server.kill();

              console.log('\n=== Test Results ===');

              // Analyze responses
              let initSuccess = false;
              let toolsListSuccess = false;
              let muteRulesSuccess = false;
              let activeEventsSuccess = false;
              let integrationsSuccess = false;

              responses.forEach(response => {
                console.log(`\n📥 Response ID ${response.id}:`);

                switch (response.id) {
                  case 1: // Initialize
                    if (response.result && response.result.protocolVersion) {
                      initSuccess = true;
                      console.log('✅ Initialize: SUCCESS');
                    } else if (response.error) {
                      console.log(`❌ Initialize: FAILED - ${response.error.message}`);
                    }
                    break;

                  case 2: // Tools list
                    if (response.result && response.result.tools) {
                      toolsListSuccess = true;
                      const toolNames = response.result.tools.map(t => t.name);
                      console.log(`✅ Tools List: SUCCESS - Found ${response.result.tools.length} tools`);
                      console.log(`   Available tools: ${toolNames.slice(0, 5).join(', ')}${toolNames.length > 5 ? '...' : ''}`);

                      // Check for required tools
                      const requiredTools = ['list_mute_rules', 'get_active_events', 'list_integrations'];
                      const missing = requiredTools.filter(tool => !toolNames.includes(tool));
                      if (missing.length === 0) {
                        console.log('   ✅ All required tools are available');
                      } else {
                        console.log(`   ⚠️  Missing tools: ${missing.join(', ')}`);
                      }
                    } else if (response.error) {
                      console.log(`❌ Tools List: FAILED - ${response.error.message}`);
                    }
                    break;

                  case 3: // list_mute_rules
                    if (response.result && response.result.content) {
                      muteRulesSuccess = true;
                      console.log('✅ list_mute_rules: SUCCESS');
                      response.result.content.forEach(content => {
                        if (content.type === 'text') {
                          const text = content.text;
                          if (text.length > 200) {
                            console.log(`   📋 ${text.substring(0, 200)}...`);
                          } else {
                            console.log(`   📋 ${text}`);
                          }
                        }
                      });
                    } else if (response.error) {
                      console.log(`❌ list_mute_rules: FAILED - ${response.error.message}`);
                    }
                    break;

                  case 4: // get_active_events
                    if (response.result && response.result.content) {
                      activeEventsSuccess = true;
                      console.log('✅ get_active_events: SUCCESS');
                      response.result.content.forEach(content => {
                        if (content.type === 'text') {
                          const text = content.text;
                          if (text.length > 200) {
                            console.log(`   📋 ${text.substring(0, 200)}...`);
                          } else {
                            console.log(`   📋 ${text}`);
                          }
                        }
                      });
                    } else if (response.error) {
                      console.log(`❌ get_active_events: FAILED - ${response.error.message}`);
                    }
                    break;

                  case 5: // list_integrations
                    if (response.result && response.result.content) {
                      integrationsSuccess = true;
                      console.log('✅ list_integrations: SUCCESS');
                      response.result.content.forEach(content => {
                        if (content.type === 'text') {
                          const text = content.text;
                          if (text.length > 200) {
                            console.log(`   📋 ${text.substring(0, 200)}...`);
                          } else {
                            console.log(`   📋 ${text}`);
                          }
                        }
                      });
                    } else if (response.error) {
                      console.log(`❌ list_integrations: FAILED - ${response.error.message}`);
                    }
                    break;
                }
              });

              // Summary
              console.log('\n📊 Test Results Summary:');
              console.log(`Initialize: ${initSuccess ? '✅ PASS' : '❌ FAIL'}`);
              console.log(`Tools List: ${toolsListSuccess ? '✅ PASS' : '❌ FAIL'}`);
              console.log(`list_mute_rules: ${muteRulesSuccess ? '✅ PASS' : '❌ FAIL'}`);
              console.log(`get_active_events: ${activeEventsSuccess ? '✅ PASS' : '❌ FAIL'}`);
              console.log(`list_integrations: ${integrationsSuccess ? '✅ PASS' : '❌ FAIL'}`);

              const passCount = [initSuccess, toolsListSuccess, muteRulesSuccess, activeEventsSuccess, integrationsSuccess].filter(Boolean).length;
              console.log(`\n🎯 Overall: ${passCount}/5 tests passed`);

              if (errorOutput.includes('Bluematador MCP server running')) {
                console.log('\n✅ Server started successfully');
              } else {
                console.log('\n⚠️  Server startup status unclear');
              }

              if (errorOutput && !errorOutput.includes('Bluematador MCP server running')) {
                console.log('\n⚠️  Server Errors:');
                console.log(errorOutput);
              }

              console.log('\n🏁 Testing completed');
            }, 2000);
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  }, 1000);

  server.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
  });
}

// Run the test
console.log('Starting MCP server test...\n');
testMCPTools();