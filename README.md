# f5-conx-core

[![Main](https://github.com/f5devcentral/f5-conx-core/workflows/Main/badge.svg)](https://github.com/f5devcentral/f5-conx-core/actions/workflows/main.yml)
[![npm version](https://img.shields.io/npm/v/f5-conx-core.svg)](https://www.npmjs.com/package/f5-conx-core)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

F5 SDK for JavaScript with TypeScript type definitions. This library abstracts F5 BIG-IP and BIG-IQ API functionality, providing a unified interface for device management, Automated Tool Chain (ATC) services, and system operations.

Originally developed for the [vscode-f5 extension](https://github.com/f5devcentral/vscode-f5), this SDK is designed to be reusable across multiple F5 automation projects.

## Features

- **Standardized HTTP REST calls** to F5 devices
  - Authentication token and provider management
  - Async job monitoring with progress events
  - Request timing data for analytics/telemetry
  - File upload/download functionality

- **Device discovery and management**
  - Automatic device type detection (BIG-IP/BIG-IQ)
  - TMOS metadata collection
  - Version and capability discovery

- **ATC Service Support**
  - [AS3](https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/) - Application Services 3
  - [DO](https://clouddocs.f5.com/products/extensions/f5-declarative-onboarding/latest/) - Declarative Onboarding
  - [TS](https://clouddocs.f5.com/products/extensions/f5-telemetry-streaming/latest/) - Telemetry Streaming
  - [FAST](https://clouddocs.f5.com/products/extensions/f5-appsvcs-templates/latest/) - F5 Application Services Templates
  - [CF](https://clouddocs.f5.com/products/extensions/f5-cloud-failover/latest/) - Cloud Failover Extension
  - Version management from GitHub
  - RPM install/uninstall

- **System operations**
  - UCS backup management
  - Qkview generation and retrieval
  - iHealth integration

- **External HTTP calls**
  - Custom user-agent identification
  - File downloads from external sources
  - Proxy support

- **Event-driven architecture**
  - EventEmitter-based logging and progress tracking

## Installation

```bash
npm install f5-conx-core
```

## Requirements

- Node.js 14.x or higher
- Network access to F5 BIG-IP or BIG-IQ devices
- Valid F5 device credentials

## Quick Start

### Basic Connection

```typescript
import { F5Client } from 'f5-conx-core';

// Create client instance
const f5Client = new F5Client(
  'bigip.example.com',
  'admin',
  'password',
  {
    port: 443,
    provider: 'tmos'  // or 'ldap', 'radius', 'tacacs'
  }
);

// Discover device capabilities
await f5Client.discover();

// Make API calls
const version = await f5Client.https('/mgmt/tm/sys/version');
console.log(version.data);
```

### Using ATC Services

```typescript
// Deploy AS3 declaration
const as3Declaration = {
  class: "AS3",
  action: "deploy",
  // ... your AS3 config
};

const result = await f5Client.as3?.deploy(as3Declaration);
console.log('AS3 deployment:', result.data);

// Post DO declaration
const doDeclaration = {
  class: "Device",
  schemaVersion: "1.0.0",
  // ... your DO config
};

const doResult = await f5Client.do?.deploy(doDeclaration);
```

### Event Monitoring

```typescript
import { F5Client } from 'f5-conx-core';

const f5Client = new F5Client('bigip.example.com', 'admin', 'password');

// Listen for events
f5Client.events.on('log-info', (msg) => console.log('INFO:', msg));
f5Client.events.on('log-debug', (msg) => console.log('DEBUG:', msg));
f5Client.events.on('log-error', (msg) => console.error('ERROR:', msg));

await f5Client.discover();
```

### UCS Backup Management

```typescript
// Create UCS backup
const ucsCreate = await f5Client.ucs?.create('myBackup.ucs');

// List UCS files
const ucsList = await f5Client.ucs?.list();

// Download UCS
const ucsFile = await f5Client.ucs?.download('myBackup.ucs');

// Delete UCS
await f5Client.ucs?.delete('myBackup.ucs');
```

### Install ATC Service

```typescript
// Install AS3 from GitHub
const as3Install = await f5Client.atc?.install('as3', '3.50.0');

// Get installed ATC versions
const installedServices = await f5Client.atc?.getInstalledVersions();
console.log(installedServices);
```

## Configuration

### Cache Directory

By default, downloaded files are cached in `/f5_cache`. Override with the `F5_CONX_CORE_CACHE` environment variable:

```bash
export F5_CONX_CORE_CACHE=/path/to/custom/cache
```

### Authentication Providers

Supported authentication providers:

- `tmos` (default) - Local BIG-IP authentication
- `ldap` - LDAP authentication
- `radius` - RADIUS authentication
- `tacacs` - TACACS+ authentication

```typescript
const f5Client = new F5Client(
  'bigip.example.com',
  'admin',
  'password',
  { provider: 'ldap' }
);
```

## Architecture

The SDK uses a layered client architecture:

1. **F5Client** - Main entry point, handles device discovery
2. **MgmtClient** - Device connectivity and token management
3. **Service Clients** - Specialized clients for ATC services (AS3, DO, TS, CF, FAST)
4. **Utility Clients** - UCS, Qkview, iHealth operations

All HTTP responses include detailed timing information via [@szmarczak/http-timer](https://github.com/szmarczak/http-timer) for performance monitoring and telemetry.

```typescript
// Example response with timings
{
  data: { /* response data */ },
  status: 200,
  request: {
    timings: {
      phases: {
        wait: 5,
        dns: 20,
        tcp: 30,
        tls: 100,
        request: 10,
        firstByte: 50,
        download: 15,
        total: 230
      }
    }
  }
}
```

## API Reference

For detailed API documentation, see the TypeScript definitions in `dist/index.d.ts` or explore the source code with JSDoc annotations.

### Core Classes

- **F5Client** - Main SDK entry point
- **MgmtClient** - Device management operations
- **As3Client** - Application Services 3
- **DoClient** - Declarative Onboarding
- **TsClient** - Telemetry Streaming
- **FastClient** - F5 Application Services Templates
- **CfClient** - Cloud Failover Extension
- **UcsClient** - UCS backup management
- **QkviewClient** - Qkview operations
- **AtcMgmtClient** - ATC package installation
- **ExtHttp** - External HTTP operations
- **iHealthClient** - iHealth service integration

## Development

### Build Commands

```bash
# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Build npm package
npm run build-package
```

### Testing

```bash
# Run all unit tests
npm test

# Run linter
npm run lint
```

Tests use [Mocha](https://mochajs.org/) with [nock](https://github.com/nock/nock) for HTTP mocking. Integration tests (`.int.tests.ts`) require actual F5 device connectivity.

### Code Coverage

Coverage thresholds are enforced via [nyc](https://github.com/istanbuljs/nyc):

- Lines: 60%
- Functions: 60%
- Branches: 60%
- Statements: 60%

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass and linting succeeds
5. Submit a pull request

Before contributing, please review the [F5 Networks Contributor License Agreement](https://github.com/f5devcentral/f5-conx-core).

## Support

- **Issues**: [GitHub Issues](https://github.com/f5devcentral/f5-conx-core/issues)
- **Questions**: Open a GitHub discussion or issue

## Related Projects

- [vscode-f5](https://github.com/f5devcentral/vscode-f5) - VS Code extension using this SDK
- [F5 Automation Toolchain](https://www.f5.com/products/automation-and-orchestration)

## License

[Apache 2.0](LICENSE)

## Copyright

Copyright 2014-2025 F5 Networks Inc.

---

**Note**: This SDK is community-supported. For official F5 support, please use official F5 channels and products.
