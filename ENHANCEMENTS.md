# f5-conx-core Enhancement Roadmap

**Status:** Planning  
**Last Updated:** 2024-12-23

---

## Overview

Proposed enhancements to complete the f5-conx-core SDK for comprehensive BIG-IP management. These additions benefit all consumers (MCP servers, VSCode extensions, CLI tools) by providing structured APIs with proper async handling, TypeScript interfaces, and consistent error handling.

---

## Proposed Additions

### 1. UcsClient.restore()

Complete the UCS lifecycle with restore functionality.

**Rationale:** UCS restore has complex options and requires careful handling. A structured API prevents common mistakes.

```typescript
interface UcsRestoreOptions {
  passphrase?: string;           // For encrypted UCS
  noLicense?: boolean;           // Skip license restoration
  noPlatformCheck?: boolean;     // Skip platform validation
  resetTrust?: boolean;          // Reset device trust
  includeChassisLevel?: boolean; // VIPRION chassis config
}

// Proposed API
await f5Client.ucs.restore(filename: string, options?: UcsRestoreOptions): Promise<{
  success: boolean;
  duration_ms: number;
  warnings: string[];
  reboot_required: boolean;
}>;
```

**Implementation:** Uses `tmsh load sys ucs` via bash endpoint with option mapping.

---

### 2. SysClient

System operations with proper async job handling.

**Rationale:** Reboot/shutdown cause device disconnection - need graceful handling and reconnection logic.

```typescript
// Proposed API
f5Client.sys.reboot(options?: { 
  volume?: string;               // Boot to specific volume
}): Promise<{ initiated: boolean; reconnect_hint_seconds: number }>;

f5Client.sys.shutdown(): Promise<{ initiated: boolean }>;

f5Client.sys.saveConfig(options?: {
  partitions?: string[];         // Specific partitions
}): Promise<{ success: boolean }>;
```

**Implementation:** 
- Reboot: `tmsh reboot` or `/mgmt/tm/sys` API
- Returns immediately with estimated reconnect time
- Consumer handles reconnection polling

---

### 3. HaClient

HA operations with structured status responses.

**Rationale:** HA status has many fields; failover/sync are critical operations that benefit from validation and structured responses.

```typescript
interface HaStatus {
  enabled: boolean;
  local: {
    name: string;
    state: 'active' | 'standby' | 'offline';
    management_ip: string;
  };
  peer?: {
    name: string;
    state: 'active' | 'standby' | 'offline';
    management_ip: string;
    reachable: boolean;
  };
  sync: {
    status: string;              // "In Sync", "Changes Pending", etc.
    color: 'green' | 'yellow' | 'red';
    group: string;
    last_sync: string;           // ISO8601
  };
  failover: {
    state: string;
    last_failover?: string;      // ISO8601
    last_reason?: string;
  };
  traffic_groups: {
    name: string;
    state: 'active' | 'standby';
  }[];
}

// Proposed API
f5Client.ha.getStatus(): Promise<HaStatus>;

f5Client.ha.failover(options?: {
  trafficGroup?: string;         // Specific traffic group
}): Promise<{
  success: boolean;
  previous_state: string;
  new_state: string;
  duration_ms: number;
}>;

f5Client.ha.sync(options?: {
  direction: 'to-group' | 'from-peer';
  group?: string;                // Auto-detected if omitted
  force?: boolean;               // Force full sync
}): Promise<{
  success: boolean;
  sync_type: 'incremental' | 'full';
  changes_synced: number;
}>;
```

**Implementation:**
- Status: `/mgmt/tm/cm/device` + `/mgmt/tm/cm/sync-status`
- Failover: `tmsh run sys failover standby` or API
- Sync: `/mgmt/tm/cm/config-sync`

---

### 4. SoftwareClient

Image management with async install tracking.

**Rationale:** Software installation is async and long-running (15-45 min). Needs progress monitoring.

```typescript
interface SoftwareImage {
  name: string;
  version: string;
  build: string;
  size_mb: number;
  verified: boolean;
}

interface SoftwareVolume {
  name: string;                  // e.g., "HD1.1"
  version: string;
  build: string;
  active: boolean;
  status: 'complete' | 'installing' | 'failed';
}

// Proposed API
f5Client.software.listImages(): Promise<SoftwareImage[]>;

f5Client.software.listVolumes(): Promise<SoftwareVolume[]>;

f5Client.software.upload(localPath: string, options?: {
  verify?: boolean;
}): Promise<{
  filename: string;
  size_bytes: number;
  verified: boolean;
}>;

f5Client.software.install(image: string, options?: {
  volume?: string;               // Auto-select inactive if omitted
  createVolume?: boolean;
}): Promise<{
  task_id: string;
  volume: string;
  status: 'installing';
}>;

f5Client.software.installStatus(taskId: string): Promise<{
  status: 'installing' | 'complete' | 'failed';
  progress_percent?: number;
  error?: string;
}>;

f5Client.software.deleteImage(filename: string): Promise<{ success: boolean }>;
```

**Implementation:**
- List: `/mgmt/tm/sys/software/image`, `/mgmt/tm/sys/software/volume`
- Upload: File upload API
- Install: `/mgmt/tm/sys/software/volume` with async job
- Status: Poll `/mgmt/tm/sys/software/volume/{name}`

---

### 5. StatsClient

LTM statistics with consistent structure.

**Rationale:** Stats endpoints return deeply nested structures. A wrapper normalizes the response.

```typescript
interface VirtualStats {
  name: string;
  destination: string;
  status: {
    availability: 'available' | 'offline' | 'unknown';
    state: 'enabled' | 'disabled';
    reason: string;
  };
  connections: {
    current: number;
    max: number;
    total: number;
  };
  bytes: { in: number; out: number };
  packets: { in: number; out: number };
}

interface PoolStats {
  name: string;
  status: { availability: string; state: string };
  members_up: number;
  members_total: number;
  connections: { current: number; total: number };
  bytes: { in: number; out: number };
}

// Proposed API
f5Client.stats.virtuals(name?: string): Promise<VirtualStats[]>;
f5Client.stats.pools(name?: string): Promise<PoolStats[]>;
f5Client.stats.nodes(name?: string): Promise<NodeStats[]>;
```

**Implementation:** `/mgmt/tm/ltm/*/stats` with response normalization.

---

### 6. LogsClient

Log retrieval with filtering.

**Rationale:** Logs are commonly needed for troubleshooting. Structured filtering avoids bash parsing in consumers.

```typescript
type LogFile = 'ltm' | 'gtm' | 'audit' | 'restjavad' | 'restnoded' | 'apm' | 'asm';

interface LogEntry {
  timestamp: string;             // ISO8601
  severity?: string;
  source?: string;
  message: string;
  raw: string;
}

interface LogsOptions {
  lines?: number;                // Tail N lines (default: 100)
  grep?: string;                 // Filter pattern
  since?: string;                // ISO8601 timestamp
  severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
}

// Proposed API
f5Client.logs.get(log: LogFile, options?: LogsOptions): Promise<{
  entries: LogEntry[];
  total_lines: number;
  filtered: boolean;
}>;

f5Client.logs.list(): Promise<{
  name: LogFile;
  path: string;
  size_bytes: number;
  modified: string;
}[]>;
```

**Implementation:** 
- bash: `tail -n {lines} /var/log/{log} | grep {pattern}`
- Parse output into structured entries

---

## Implementation Priority

### Phase 1: Core Operations
- [ ] `UcsClient.restore()` - Completes backup/restore cycle
- [ ] `SysClient` - Reboot, shutdown, save config

### Phase 2: HA Operations
- [ ] `HaClient` - Status, failover, sync

### Phase 3: Software Management
- [ ] `SoftwareClient` - Image lifecycle with async install

### Phase 4: Observability
- [ ] `StatsClient` - Normalized statistics
- [ ] `LogsClient` - Log retrieval with filtering

---

## Design Principles

1. **Async-first** - Long operations return task IDs, provide status methods
2. **Structured responses** - TypeScript interfaces, not raw strings
3. **Consistent errors** - Use existing `F5Error` class
4. **Testable** - Unit tests with nock mocks
5. **Documented** - JSDoc comments, update README

---

## Alternatives Considered

**Bash wrapper approach:** All operations could be done via `F5Client.https('/mgmt/tm/util/bash')`. This works but:
- Requires parsing bash output in every consumer
- No TypeScript type safety
- Harder to test
- Duplicates logic across MCP server, VSCode extension, etc.

**Conclusion:** Library-level support provides better DX and reusability.

---

## Changelog

### 2024-12-23
- Initial roadmap created
- Identified 6 enhancement areas with TypeScript interfaces
