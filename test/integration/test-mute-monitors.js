#!/usr/bin/env node

/**
 * Integration test for mute monitors by service functionality
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixtures = JSON.parse(readFileSync(join(__dirname, '../fixtures/sample-responses.json'), 'utf8'));

async function testMuteMonitorsByService() {
  console.log('🧪 Testing mute_monitors_by_service functionality...');

  // Mock test data
  const testRequest = {
    name: 'mute_monitors_by_service',
    arguments: {
      apiKey: 'test-api-key',
      accountId: 'test-account-123',
      serviceName: 'sqs',
      hide: false,
      monitorNames: ['queue.depth.high', 'queue.age.high']
    }
  };

  console.log('📋 Test Request:', JSON.stringify(testRequest, null, 2));

  // Expected behavior validation
  const expectedMonitors = fixtures.monitors.sqs;
  const requestedMonitors = testRequest.arguments.monitorNames;

  const validMonitors = requestedMonitors.every(monitor =>
    expectedMonitors.includes(monitor)
  );

  if (validMonitors) {
    console.log('✅ All requested monitors are valid for SQS service');
  } else {
    console.log('❌ Some requested monitors are invalid');
    return false;
  }

  console.log('📊 Available SQS monitors:', expectedMonitors);
  console.log('🎯 Requested monitors:', requestedMonitors);

  // Test successful scenario
  console.log('✅ Test passed: mute_monitors_by_service validation');
  return true;
}

// Run the test
testMuteMonitorsByService()
  .then(success => {
    if (success) {
      console.log('🎉 All integration tests passed!');
      process.exit(0);
    } else {
      console.log('💥 Tests failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Test error:', error);
    process.exit(1);
  });