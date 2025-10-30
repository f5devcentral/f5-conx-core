# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

f5-conx-core is a TypeScript SDK that abstracts F5 API functionality for use across multiple projects. It provides standardized HTTP REST calls, authentication management, and connectivity to F5 devices (BIG-IP and BIG-IQ) and their Automated Tool Chain (ATC) services.

## Development Commands

### Build & Compile
- `npm run compile` - Compile TypeScript to JavaScript (outputs to `dist/`)
- `npm run watch` - Watch mode for development
- `npm run build-package` - Compile and create npm package

### Testing
- `npm test` or `npm run test` - Run all tests (Mocha with ts-node)
- Tests use Mocha framework with a 40-second timeout
- Coverage thresholds enforced via nyc: 60% for lines, functions, branches, and statements

### Code Quality
- `npm run lint` - Run TypeScript compiler check (no emit) and ESLint on `src/` and `tests/`

### Testing Notes
- Test files follow pattern: `*.tests.ts` or `*.test.ts`
- Unit tests use [nock](https://github.com/nock/nock) for HTTP mocking
- Integration tests (`.int.tests.ts`) require actual F5 device connectivity
- Test server implementation available at `tests/testServer/restServer.ts`
- Disabled tests use `.no.ts` extension

## Architecture

### Core Client Hierarchy

The SDK uses a layered client architecture:

1. **F5Client** (`src/bigip/f5Client.ts`) - Main entry point
   - Discovers device type and initializes appropriate management client
   - Provides unified interface for all F5 device interactions
   - Manages cache directory (default: `/f5_cache`, configurable via `F5_CONX_CORE_CACHE` env var)

2. **Management Client** - Device-specific connectivity
   - **MgmtClient** (`src/bigip/mgmtClient.ts`) - BIG-IP and BIG-IQ connectivity

3. **ATC Service Clients** - Specialized clients for each Automated Tool Chain service
   - **AtcMgmtClient** (`src/bigip/atcMgmtClient.ts`) - Install/uninstall ATC packages
   - **As3Client** (`src/bigip/as3Client.ts`) - Application Services 3
   - **DoClient** (`src/bigip/doClient.ts`) - Declarative Onboarding
   - **TsClient** (`src/bigip/tsClient.ts`) - Telemetry Streaming
   - **FastClient** (`src/bigip/fastClient.ts`) - F5 Application Services Templates
   - **CfClient** (`src/bigip/cfClient.ts`) - Cloud Failover

4. **Utility Clients**
   - **UcsClient** (`src/bigip/ucsClient.ts`) - UCS backup management
   - **QkviewClient** (`src/bigip/qkviewClient.ts`) - Qkview file management
   - **ExtHttp** (`src/externalHttps.ts`) - External HTTP calls (e.g., GitHub)
   - **iHealthClient** (`src/iHealthClient.ts`) - F5 iHealth service integration

### Key Architectural Patterns

**Discovery Flow**: The `F5Client.discover()` method:
1. Determines product type (defaults to BIG-IP, updated to BIG-IQ after device query)
2. Queries device for version, hostname, and installed ATC services
3. Initializes specialized clients only for detected services

**HTTP Timing**: Uses `@szmarczak/http-timer` plugin via `httpTimer.ts` to capture detailed request timing metrics for analytics/telemetry. All responses include a `timings` object with phases (wait, dns, tcp, tls, request, firstByte, download, total).

**Authentication**:
- Token-based auth managed at MgmtClient level
- Auth providers configurable (default: `tmos`)
- Token automatically refreshed on expiration

**Event-Driven**: Uses EventEmitter throughout for logging and progress events. Parent classes pass EventEmitter instances to child clients.

**File Operations**: Upload/download support via `F5Upload` and `F5DownLoad` types:
- Upload paths: FILE (`/var/config/rest/downloads`), ISO (`/shared/images`)
- Download types: UCS, QKVIEW, ISO (each with specific URI patterns)

### Constants and Metadata

`src/constants.ts` defines:
- **atcMetaData**: Complete endpoint mappings, GitHub URLs, and schema URLs for all ATC services
- **iControlEndpoints**: Common iControl REST API endpoints (login, bash, UCS, qkview, etc.)
- **F5UploadPaths/F5DownloadPaths**: File transfer path mappings

### Models and Types

- `src/bigip/bigipModels.ts` - Core types (Token, F5InfoApi, DiscoverInfo, etc.)
- `src/bigip/as3Models.ts`, `doModels.ts`, `tsModels.ts`, `cfModels.ts` - ATC-specific types
- `src/utils/httpModels.ts` - HTTP request/response types with timing support

## Entry Point

`src/index.ts` exports all public APIs. The main export is `F5Client` class.

Typical usage pattern:
```typescript
const f5Client = new F5Client(host, user, password, { port: 443, provider: 'tmos' });
await f5Client.discover();  // Detects device type and services
const resp = await f5Client.https('/mgmt/tm/sys/version');
```

## Build Output

- Source: `src/**/*.ts`
- Compiled: `dist/` (JavaScript + declaration files)
- Entry: `dist/index.js` (package.json main)
- Types: `dist/index.d.ts` (package.json types)
