# Testing Guide

This guide covers testing strategies and procedures for the Bluematador MCP Server.

## Testing Structure

### Test Organization
```
test/
├── unit/                  # Unit tests (isolated component testing)
├── integration/           # Integration tests (end-to-end functionality)
├── fixtures/              # Test data and mock responses
└── configs/               # Test-specific configurations
```

### Test Types

#### Integration Tests
- **Purpose**: Test complete workflows and API interactions
- **Location**: `test/integration/`
- **Example**: `test-mute-monitors.js` - Tests the mute monitors by service functionality

#### Unit Tests
- **Purpose**: Test individual functions and components in isolation
- **Location**: `test/unit/`
- **Status**: To be implemented

#### Fixtures
- **Purpose**: Provide consistent test data
- **Location**: `test/fixtures/`
- **Example**: `sample-responses.json` - Mock API responses

## Running Tests

### All Tests (Default - Mute Monitors Test)
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration      # Run mute monitors test
npm run test:mcp-direct      # Run direct MCP JSON-RPC tests
npm run test:mcp-tools       # Run MCP tools interaction tests
```

### Specific Test Files
```bash
node test/integration/test-mute-monitors.js  # Test mute monitors functionality
node test/integration/test_mcp_direct.js     # Direct JSON-RPC communication tests
node test/integration/test_mcp_tools.js      # Full MCP tools workflow tests
node test/integration/test.js                # Basic server tests
```

## Test Configuration

### Test Environment
Tests run with:
- `NODE_ENV=test`
- Mock API responses from fixtures for unit tests
- Environment variables for integration tests:
  - `BLUEMATADOR_TEST_ACCOUNT_ID` - Your test account ID
  - `BLUEMATADOR_TEST_API_KEY` - Your test API key

### Test Configuration File
`test/configs/test.json` contains:
- Test-specific server configuration
- Mock API settings
- Timeout and retry settings

## Writing Tests

### Integration Test Template
```javascript
#!/usr/bin/env node

const fixtures = require('../fixtures/sample-responses.json');

async function testYourFeature() {
  console.log('🧪 Testing your feature...');

  // Test setup
  const testRequest = {
    name: 'your_tool_name',
    arguments: {
      // test arguments
    }
  };

  // Test execution
  try {
    // Your test logic here
    console.log('✅ Test passed');
    return true;
  } catch (error) {
    console.log('❌ Test failed:', error);
    return false;
  }
}

// Run the test
testYourFeature()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('💥 Test error:', error);
    process.exit(1);
  });
```

### Test Fixtures
Add test data to `test/fixtures/sample-responses.json`:
```json
{
  "yourEndpoint": {
    "success": {
      "data": "expected response"
    },
    "error": {
      "status": 400,
      "message": "Error message"
    }
  }
}
```

## Test Cases

### Current Test Coverage

#### Mute Monitors by Service (`test-mute-monitors.js`)
- ✅ Validates service name exists
- ✅ Validates monitor names for the service
- ✅ Tests successful mute rule creation
- ❓ Error handling for invalid services
- ❓ Error handling for invalid monitors

### Planned Test Cases
- [ ] AWS Integration creation and management
- [ ] Azure Integration creation and management
- [ ] Event retrieval and filtering
- [ ] Notification management
- [ ] User management
- [ ] Error handling for API failures
- [ ] Authentication validation

## Mock Data

### API Response Mocking
The test fixtures provide realistic mock data for:
- Integration responses
- Event data
- Monitor lists
- Error scenarios

### Adding New Mock Data
1. Update `test/fixtures/sample-responses.json`
2. Include both success and error scenarios
3. Use realistic data structure matching the actual API

## Continuous Integration

### Pre-commit Checks
Before committing:
```bash
npm run typecheck    # Check TypeScript
npm run test         # Run all tests
npm run build        # Ensure build succeeds
```

### Test Automation
Future CI/CD pipeline should:
1. Run all tests on pull requests
2. Test against multiple Node.js versions
3. Validate integration with real API (staging)
4. Performance testing for large datasets

## Debugging Tests

### Enable Test Debugging
```bash
DEBUG=true npm run test
```

### Common Test Issues
- **Timeout**: Increase timeout in test config
- **Mock Data**: Ensure fixtures match expected format
- **Environment**: Check test environment variables

## Test Data Management

### Sensitive Data
- Never commit real API keys
- Use placeholder values in test configs
- Document required environment variables

### Test Cleanup
- Tests should be idempotent
- Clean up any created resources
- Reset state between test runs