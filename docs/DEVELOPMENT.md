# Development Guide

This guide covers local development and testing for the Bluematador MCP Server.

## Project Structure

```
bluematador-mcp-server/
├── src/                    # Source code
├── dist/                   # Built JavaScript files
├── dev/                    # Development tools and configs
│   ├── configs/           # Development-specific configurations
│   └── scripts/           # Development scripts
├── test/                   # Testing files
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   ├── fixtures/          # Test data and mock responses
│   └── configs/           # Test configurations
├── examples/               # Example configurations and scripts
│   ├── configs/           # Example Claude configurations
│   └── scripts/           # Setup and utility scripts
└── docs/                   # Documentation
```

## Development Setup

### Quick Start
Run the setup script to get started quickly:
```bash
./examples/scripts/setup-dev-env.sh
```

### Manual Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Create your environment configuration:
   ```bash
   cp dev/configs/development.json dev/configs/development.local.json
   # Edit development.local.json with your settings
   ```

## Development Commands

### Building and Running
```bash
npm run build              # Build TypeScript to JavaScript
npm run rebuild            # Clean and rebuild
npm run start              # Start production server
npm run start:dev          # Start development server
npm run watch:dev          # Start with auto-restart on changes
npm run dev                # Start with tsx (TypeScript execution)
```

### Code Quality
```bash
npm run typecheck          # Check TypeScript types
npm run lint               # Run linter (when configured)
```

### Testing
```bash
npm run test               # Run all tests
npm run test:integration   # Run integration tests only
```

## Development Configuration

### Environment Variables
Create a `.env.dev` file for local development:
```bash
NODE_ENV=development
DEBUG=true
BLUEMATADOR_API_KEY=your-api-key-here
BLUEMATADOR_BASE_URL=https://app.bluematador.com
```

### Claude Configuration
Use the example configurations in `examples/configs/`:
- `claude-config-dev.json` - Development configuration
- `claude-config-test.json` - Testing configuration

## Development Workflow

1. **Start Development Server**
   ```bash
   npm run watch:dev
   ```

2. **Make Changes**
   - Edit files in `src/`
   - Server automatically restarts on changes

3. **Test Changes**
   ```bash
   npm run test
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Debugging

### Enable Debug Logging
Set the `DEBUG` environment variable:
```bash
export DEBUG=true
npm run start:dev
```

### Common Issues
- **Build Errors**: Run `npm run typecheck` to see TypeScript errors
- **API Errors**: Check your API key and base URL configuration
- **Permission Errors**: Ensure scripts have execute permissions

## Testing Your Changes

### Integration Testing
The integration tests validate the new functionality:
```bash
npm run test:integration
```

### Manual Testing
1. Start the development server
2. Configure Claude to use your development server
3. Test the MCP tools through Claude

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm run test`
4. Build: `npm run build`
5. Test with Claude manually
6. Submit a pull request