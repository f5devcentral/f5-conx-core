# F5 MCP Server Design Document

## Summary

This document outlines the design for an MCP (Model Context Protocol) server that exposes F5 BIG-IP management functionality to AI assistants. The server will leverage the existing `f5-conx-core` SDK to provide device connectivity, configuration management, and operational tasks.

A key feature is the **Playbook System** - a markdown-based workflow definition format that allows customers to define customized procedures (such as upgrades) that the AI can execute while respecting organizational requirements and constraints.

The system emphasizes:
- **Safety**: Human approval gates, rollback capabilities, and validation checks
- **Flexibility**: Customer-customizable workflows with AI adaptation
- **Observability**: Comprehensive logging and markdown report generation
- **Extensibility**: Clear patterns for adding new functionality based on customer needs

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
   - 1.1 [System Components](#11-system-components)
   - 1.2 [Package Structure](#12-package-structure)
   - 1.3 [Relationship to f5-conx-core](#13-relationship-to-f5-conx-core)

2. [MCP Server Tools](#2-mcp-server-tools)
   - 2.1 [Connection & Discovery](#21-connection--discovery)
   - 2.2 [Backup & Recovery](#22-backup--recovery)
   - 2.3 [Application Deployment (AS3)](#23-application-deployment-as3)
   - 2.4 [System Management](#24-system-management)
   - 2.5 [Monitoring & Diagnostics](#25-monitoring--diagnostics)
   - 2.6 [HA Management](#26-ha-management)
   - 2.7 [Playbook Execution](#27-playbook-execution)

3. [MCP Resources & Prompts](#3-mcp-resources--prompts)
   - 3.1 [Resources Overview](#31-resources-overview)
   - 3.2 [Device Resources](#32-device-resources)
   - 3.3 [Configuration Resources](#33-configuration-resources)
   - 3.4 [Monitoring Resources](#34-monitoring-resources)
   - 3.5 [Playbook Resources](#35-playbook-resources)
   - 3.6 [MCP Prompts](#36-mcp-prompts)

4. [Playbook System](#4-playbook-system)
   - 4.1 [Format Specification](#41-format-specification)
   - 4.2 [Front Matter Schema](#42-front-matter-schema)
   - 4.3 [Step Definition](#43-step-definition)
   - 4.4 [Conditional Logic](#44-conditional-logic)
   - 4.5 [Human Approval Gates](#45-human-approval-gates)
   - 4.6 [AI Guidance Blocks](#46-ai-guidance-blocks)
   - 4.7 [Error Handling & Recovery](#47-error-handling--recovery)
   - 4.8 [Checkpoints & Rollback](#48-checkpoints--rollback)

5. [HA Pair Management](#5-ha-pair-management)
   - 5.1 [Device Pairing Model](#51-device-pairing-model)
   - 5.2 [Coordinated Operations](#52-coordinated-operations)
   - 5.3 [Failover Handling](#53-failover-handling)
   - 5.4 [Sync State Management](#54-sync-state-management)

6. [Logging & Reporting](#6-logging--reporting)
   - 6.1 [Execution Log Structure](#61-execution-log-structure)
   - 6.2 [Markdown Report Generation](#62-markdown-report-generation)
   - 6.3 [State Persistence](#63-state-persistence)
   - 6.4 [Audit Trail Requirements](#64-audit-trail-requirements)

7. [Validation & Pre-Flight Checks](#7-validation--pre-flight-checks)
   - 7.1 [Upgrade Readiness Assessment](#71-upgrade-readiness-assessment)
   - 7.2 [Health Check Framework](#72-health-check-framework)
   - 7.3 [Resource Verification](#73-resource-verification)

8. [Extensibility & Feature Requests](#8-extensibility--feature-requests)
   - 8.1 [Capturing Unmet Needs](#81-capturing-unmet-needs)
   - 8.2 [Documentation Links](#82-documentation-links)
   - 8.3 [Feature Request Workflow](#83-feature-request-workflow)

9. [Implementation Phases](#9-implementation-phases)

10. [ACC/Chariot Integration](#10-accchariot-integration-tmos-converter)
    - 10.1 [Overview](#101-overview)
    - 10.2 [Integration Options](#102-integration-options)
    - 10.3 [Recommendation](#103-recommendation)
    - 10.4 [Proposed ACC Tools](#104-proposed-acc-tools)
    - 10.5 [AI Workflows Enabled](#105-ai-workflows-enabled)
    - 10.6 [Error Recovery Patterns](#106-error-recovery-patterns)
    - 10.7 [Resource: AS3 Schema Reference](#107-resource-as3-schema-reference)

11. [Open Questions](#11-open-questions)

---

## 1. Architecture Overview

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Assistant                              │
│                   (Claude, GPT, etc.)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ MCP Protocol
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      f5-mcp-server                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ MCP Tools   │  │  Playbook   │  │   Execution Logger      │  │
│  │ (connect,   │  │   Engine    │  │   & Report Generator    │  │
│  │  backup,    │  │             │  │                         │  │
│  │  deploy...) │  │             │  │                         │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         │                │                      │                │
│         └────────────────┼──────────────────────┘                │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   Session Manager                            ││
│  │        (Device connections, state, HA pair tracking)         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Uses
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      f5-conx-core                                │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │ F5Client  │ │ As3Client │ │ UcsClient │ │ MgmtClient│  ...  │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BIG-IP Devices                               │
│         ┌─────────────┐         ┌─────────────┐                 │
│         │  Active     │◄───────►│  Standby    │                 │
│         │  (unit-1)   │  HA     │  (unit-2)   │                 │
│         └─────────────┘         └─────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Package Structure

```
f5-mcp-server/
├── src/
│   ├── index.ts                 # MCP server entry point
│   ├── server.ts                # MCP server implementation
│   ├── tools/                   # MCP tool definitions
│   │   ├── connection.ts        # connect, disconnect, device_info
│   │   ├── backup.ts            # ucs_*, qkview_*
│   │   ├── deployment.ts        # as3_*, do_*
│   │   ├── system.ts            # license, settings, bash
│   │   ├── monitoring.ts        # logs, stats, health
│   │   └── playbook.ts          # playbook_execute, playbook_validate
│   ├── playbook/                # Playbook engine
│   │   ├── parser.ts            # Markdown/YAML parser
│   │   ├── executor.ts          # Step execution engine
│   │   ├── conditions.ts        # Conditional logic evaluation
│   │   ├── variables.ts         # Variable interpolation
│   │   └── validators.ts        # Pre-flight check implementations
│   ├── session/                 # Session management
│   │   ├── manager.ts           # Multi-device session handling
│   │   ├── haPair.ts            # HA pair coordination
│   │   └── state.ts             # Execution state persistence
│   ├── logging/                 # Logging & reporting
│   │   ├── executionLog.ts      # Structured execution logging
│   │   ├── reportGenerator.ts   # Markdown report generation
│   │   └── auditTrail.ts        # Compliance audit logging
│   └── types/                   # TypeScript definitions
│       ├── playbook.ts          # Playbook schema types
│       ├── execution.ts         # Execution state types
│       └── reports.ts           # Report structure types
├── playbooks/                   # Example playbooks
│   ├── upgrade-ha-pair.md
│   ├── backup-all-devices.md
│   └── deploy-application.md
├── docs/
│   └── playbook-reference.md    # Playbook authoring guide
└── package.json
```

### 1.3 Relationship to f5-conx-core

The MCP server is a **consumer** of f5-conx-core, not an extension:

- **f5-conx-core**: Remains a focused SDK for F5 API abstraction
- **f5-mcp-server**: Thin interface layer translating MCP calls to SDK operations

This separation allows:
- Independent versioning and release cycles
- f5-conx-core to serve other consumers (VSCode extension, CLI tools)
- MCP-specific features without SDK bloat

**Gaps to address in f5-conx-core:**
- Mini-UCS support (UcsClient)
- UCS restore functionality
- Log file retrieval utility
- Stats retrieval wrapper
- License activation workflow
- Software image management
- HA status queries

---

## 2. MCP Server Tools

All tools follow the MCP tool specification with JSON Schema input validation. Each tool includes comprehensive error handling and returns structured responses.

### 2.1 Connection & Discovery

#### `connect`
Establish connection to a BIG-IP device and discover its capabilities.

```typescript
{
  name: "connect",
  description: "Connect to a BIG-IP device and discover its configuration, version, and installed services",
  inputSchema: {
    type: "object",
    properties: {
      host: {
        type: "string",
        description: "Device hostname or IP address"
      },
      username: {
        type: "string",
        description: "Admin username for authentication"
      },
      password: {
        type: "string",
        description: "Password for authentication"
      },
      port: {
        type: "number",
        default: 443,
        description: "Management port (default: 443)"
      },
      provider: {
        type: "string",
        default: "tmos",
        enum: ["tmos", "local", "ldap", "radius", "tacacs"],
        description: "Authentication provider"
      },
      alias: {
        type: "string",
        description: "Friendly name for referencing this connection in subsequent commands"
      }
    },
    required: ["host", "username", "password"]
  }
}
```

**Returns:**
```typescript
{
  success: boolean;
  connection_id: string;           // Unique session identifier
  alias: string;                   // User-provided or auto-generated alias
  device: {
    host: string;
    hostname: string;              // Device configured hostname
    version: string;               // e.g., "16.1.3"
    build: string;                 // e.g., "0.0.10"
    product: "BIG-IP" | "BIG-IQ";
    platform: string;              // e.g., "i5800", "VE", "VIPRION"
    serial: string;
    uptime: number;                // Seconds since boot
  };
  ha: {
    enabled: boolean;
    status: "active" | "standby" | "offline" | "unknown";
    peer_host?: string;
    sync_status?: string;          // e.g., "In Sync", "Changes Pending"
    failover_state?: string;
  };
  atc_services: {
    as3?: { version: string; available: boolean };
    do?: { version: string; available: boolean };
    ts?: { version: string; available: boolean };
    fast?: { version: string; available: boolean };
    cf?: { version: string; available: boolean };
  };
  provisioned_modules: string[];   // e.g., ["ltm", "gtm", "asm", "apm"]
}
```

#### `disconnect`
Close connection to a device and release resources.

```typescript
{
  name: "disconnect",
  description: "Disconnect from a BIG-IP device and release the session",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or connection ID. Use '*' to disconnect all."
      }
    },
    required: ["device"]
  }
}
```

**Returns:**
```typescript
{
  success: boolean;
  disconnected: string[];          // List of disconnected device aliases
  remaining_connections: number;
}
```

#### `device_info`
Get detailed information about a connected device.

```typescript
{
  name: "device_info",
  description: "Retrieve detailed information about a connected BIG-IP device",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or connection ID"
      },
      include: {
        type: "array",
        items: {
          type: "string",
          enum: ["system", "network", "failover", "sync_status", "provisioning",
                 "licenses", "certificates", "atc_services", "disk", "memory", "cpu"]
        },
        default: ["system", "failover"],
        description: "Categories of information to retrieve"
      },
      refresh: {
        type: "boolean",
        default: false,
        description: "Force refresh from device (bypass cache)"
      }
    },
    required: ["device"]
  }
}
```

**Returns:** Varies based on `include` parameter. Full response:
```typescript
{
  device: string;
  retrieved_at: ISO8601;
  system: {
    hostname: string;
    version: string;
    build: string;
    product: string;
    platform: string;
    serial: string;
    base_mac: string;
    uptime: number;
    current_time: ISO8601;
  };
  network: {
    management_ip: string;
    management_gateway: string;
    dns_servers: string[];
    ntp_servers: string[];
    vlans: { name: string; tag: number; interfaces: string[] }[];
    self_ips: { name: string; address: string; vlan: string }[];
  };
  failover: {
    state: "active" | "standby" | "offline";
    peer_host: string;
    peer_state: string;
    last_failover: ISO8601;
    failover_reason: string;
  };
  sync_status: {
    status: string;                // "In Sync", "Changes Pending", etc.
    sync_group: string;
    last_sync: ISO8601;
    pending_changes: boolean;
    color: "green" | "yellow" | "red";
  };
  provisioning: {
    module: string;
    level: "none" | "minimum" | "nominal" | "dedicated";
    cpu_ratio: number;
  }[];
  licenses: {
    registration_key: string;
    licensed_on: ISO8601;
    licensed_version: string;
    service_check_date: ISO8601;
    active_modules: string[];
    expires: ISO8601 | null;
  };
  certificates: {
    name: string;
    subject: string;
    issuer: string;
    expires: ISO8601;
    days_until_expiry: number;
    key_type: string;
    key_size: number;
  }[];
  atc_services: { /* same as connect response */ };
  disk: {
    volumes: {
      name: string;
      size_mb: number;
      used_mb: number;
      available_mb: number;
      percent_used: number;
    }[];
  };
  memory: {
    total_mb: number;
    used_mb: number;
    available_mb: number;
    percent_used: number;
    tmm_memory_mb: number;
  };
  cpu: {
    cores: number;
    current_utilization: number;
    average_1min: number;
    average_5min: number;
  };
}
```

#### `list_connections`
List all active device connections in the session.

```typescript
{
  name: "list_connections",
  description: "List all active BIG-IP device connections in the current session",
  inputSchema: {
    type: "object",
    properties: {
      include_details: {
        type: "boolean",
        default: false,
        description: "Include device details (version, HA status)"
      }
    }
  }
}
```

**Returns:**
```typescript
{
  connections: {
    alias: string;
    host: string;
    connected_at: ISO8601;
    token_expires_at: ISO8601;
    // When include_details=true:
    version?: string;
    product?: string;
    ha_status?: string;
  }[];
  total_connections: number;
}
```

### 2.2 Backup & Recovery

#### `ucs_create`
Create a UCS (User Configuration Set) backup archive.

```typescript
{
  name: "ucs_create",
  description: "Create a UCS backup archive containing full device configuration",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      filename: {
        type: "string",
        description: "UCS filename (without path). Timestamp added if not provided.",
        pattern: "^[\\w\\-\\.]+$"
      },
      passphrase: {
        type: "string",
        description: "Encryption passphrase for the UCS archive (recommended)"
      },
      noPrivateKeys: {
        type: "boolean",
        default: false,
        description: "Exclude private keys from the backup"
      },
      async: {
        type: "boolean",
        default: false,
        description: "Return immediately and poll for status"
      }
    },
    required: ["device"]
  }
}
```

**Returns:**
```typescript
{
  success: boolean;
  filename: string;                // Full filename with .ucs extension
  path: string;                    // Path on device: /var/local/ucs/
  size_bytes: number;
  created_at: ISO8601;
  encrypted: boolean;
  includes_private_keys: boolean;
  duration_ms: number;             // Time to create
  // If async=true:
  task_id?: string;
  status?: "pending" | "in_progress" | "completed" | "failed";
}
```

#### `ucs_download`
Download a UCS file from the device to local storage.

```typescript
{
  name: "ucs_download",
  description: "Download a UCS backup file from the device",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      filename: {
        type: "string",
        description: "UCS filename to download"
      },
      localPath: {
        type: "string",
        description: "Local directory to save the file (default: current directory)"
      },
      overwrite: {
        type: "boolean",
        default: false,
        description: "Overwrite if local file exists"
      }
    },
    required: ["device", "filename"]
  }
}
```

**Returns:**
```typescript
{
  success: boolean;
  remote_path: string;
  local_path: string;
  size_bytes: number;
  checksum: {
    algorithm: "md5" | "sha256";
    value: string;
  };
  download_duration_ms: number;
}
```

#### `ucs_list`
List available UCS files on a device.

```typescript
{
  name: "ucs_list",
  description: "List UCS backup files available on the device",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      sortBy: {
        type: "string",
        enum: ["name", "date", "size"],
        default: "date",
        description: "Sort order for results"
      },
      limit: {
        type: "number",
        default: 50,
        description: "Maximum number of results"
      }
    },
    required: ["device"]
  }
}
```

**Returns:**
```typescript
{
  files: {
    filename: string;
    path: string;
    size_bytes: number;
    created_at: ISO8601;
    encrypted: boolean;
  }[];
  total_count: number;
  total_size_bytes: number;
}
```

#### `ucs_upload`
Upload a UCS file to the device.

```typescript
{
  name: "ucs_upload",
  description: "Upload a UCS backup file to the device",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      localPath: {
        type: "string",
        description: "Local path to the UCS file"
      },
      filename: {
        type: "string",
        description: "Target filename on device (default: same as local)"
      }
    },
    required: ["device", "localPath"]
  }
}
```

**Returns:**
```typescript
{
  success: boolean;
  local_path: string;
  remote_path: string;
  size_bytes: number;
  upload_duration_ms: number;
  checksum_verified: boolean;
}
```

#### `ucs_restore`
Restore configuration from a UCS file.

```typescript
{
  name: "ucs_restore",
  description: "Restore device configuration from a UCS backup file. WARNING: This is a disruptive operation.",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      filename: {
        type: "string",
        description: "UCS filename on device to restore"
      },
      passphrase: {
        type: "string",
        description: "Decryption passphrase if UCS is encrypted"
      },
      noLicense: {
        type: "boolean",
        default: false,
        description: "Do not restore license file"
      },
      noPlatformCheck: {
        type: "boolean",
        default: false,
        description: "Skip platform validation (use with caution)"
      },
      resetTrust: {
        type: "boolean",
        default: false,
        description: "Reset device trust after restore"
      },
      includeChassisLevelConfig: {
        type: "boolean",
        default: false,
        description: "Include chassis-level configuration (VIPRION)"
      }
    },
    required: ["device", "filename"]
  }
}
```

**Returns:**
```typescript
{
  success: boolean;
  restore_started_at: ISO8601;
  restore_completed_at: ISO8601;
  duration_ms: number;
  device_rebooted: boolean;
  warnings: string[];
  post_restore_status: {
    services_running: boolean;
    config_loaded: boolean;
    ha_status: string;
  };
}
```

#### `ucs_delete`
Delete a UCS file from the device.

```typescript
{
  name: "ucs_delete",
  description: "Delete a UCS backup file from the device",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      filename: {
        type: "string",
        description: "UCS filename to delete"
      },
      confirm: {
        type: "boolean",
        default: false,
        description: "Must be true to confirm deletion"
      }
    },
    required: ["device", "filename", "confirm"]
  }
}
```

#### `mini_ucs_create`
Create a mini-UCS (lightweight configuration backup).

```typescript
{
  name: "mini_ucs_create",
  description: "Create a mini-UCS containing only configuration files (no certificates, keys, or large binaries)",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      filename: {
        type: "string",
        description: "Filename for the mini-UCS"
      },
      include: {
        type: "array",
        items: {
          type: "string",
          enum: ["bigip.conf", "bigip_base.conf", "bigip_user.conf", "bigip_script.conf",
                 "profile_base.conf", "custom_monitors", "data_groups", "irules"]
        },
        description: "Specific configuration files to include (default: all)"
      }
    },
    required: ["device"]
  }
}
```

**Returns:**
```typescript
{
  success: boolean;
  filename: string;
  path: string;
  size_bytes: number;
  included_files: string[];
  created_at: ISO8601;
}
```

#### `qkview_create`
Generate a qkview diagnostic file.

```typescript
{
  name: "qkview_create",
  description: "Generate a qkview diagnostic file for F5 Support or iHealth analysis",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      filename: {
        type: "string",
        description: "Qkview filename (default: auto-generated with timestamp)"
      },
      maxFileSize: {
        type: "number",
        default: 500,
        description: "Maximum file size in MB"
      },
      excludeCore: {
        type: "boolean",
        default: false,
        description: "Exclude core files from qkview"
      },
      timeout: {
        type: "number",
        default: 600,
        description: "Timeout in seconds (qkviews can take 5-10 minutes)"
      }
    },
    required: ["device"]
  }
}
```

**Returns:**
```typescript
{
  success: boolean;
  filename: string;
  path: string;                    // /var/tmp/
  size_bytes: number;
  created_at: ISO8601;
  duration_ms: number;
  case_number?: string;            // If associated with support case
}
```

#### `qkview_download`
Download a qkview file from the device.

```typescript
{
  name: "qkview_download",
  description: "Download a qkview diagnostic file from the device",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      filename: {
        type: "string",
        description: "Qkview filename to download"
      },
      localPath: {
        type: "string",
        description: "Local directory to save the file"
      }
    },
    required: ["device", "filename"]
  }
}
```

#### `qkview_list`
List available qkview files on a device.

```typescript
{
  name: "qkview_list",
  description: "List qkview files available on the device",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      }
    },
    required: ["device"]
  }
}
```

### 2.3 Application Deployment (AS3)

AS3 (Application Services 3) is the recommended approach for declarative application deployment. It provides idempotent, tenant-isolated configuration management.

#### `as3_deploy`
Deploy an AS3 declaration.

```typescript
{
  name: "as3_deploy",
  description: "Deploy an AS3 declaration to configure applications declaratively",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      declaration: {
        type: "object",
        description: "AS3 declaration JSON object"
      },
      declarationFile: {
        type: "string",
        description: "Path to AS3 declaration file (alternative to declaration)"
      },
      tenant: {
        type: "string",
        description: "Deploy to specific tenant only (filters declaration)"
      },
      async: {
        type: "boolean",
        default: true,
        description: "Use async mode for large declarations"
      },
      dryRun: {
        type: "boolean",
        default: false,
        description: "Validate without deploying"
      }
    },
    required: ["device"]
  }
}
```

**Returns:**
```typescript
{
  success: boolean;
  task_id: string;
  status: "success" | "pending" | "failed" | "no-change";
  tenants_deployed: string[];
  declaration_id: string;
  results: {
    tenant: string;
    status: string;
    message: string;
    changes: number;
  }[];
  warnings: string[];
  duration_ms: number;
  // If dryRun=true:
  validation?: {
    valid: boolean;
    errors: string[];
  };
}
```

#### `as3_get`
Retrieve current AS3 declarations from the device.

```typescript
{
  name: "as3_get",
  description: "Retrieve current AS3 declarations from the device",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      tenant: {
        type: "string",
        description: "Specific tenant to retrieve (default: all)"
      },
      showHash: {
        type: "boolean",
        default: false,
        description: "Include declaration hash for comparison"
      },
      expandReferences: {
        type: "boolean",
        default: false,
        description: "Expand pointer references in output"
      }
    },
    required: ["device"]
  }
}
```

**Returns:**
```typescript
{
  declaration: object;             // Full AS3 declaration
  tenants: string[];
  as3_version: string;
  schema_version: string;
  declaration_hash?: string;
  retrieved_at: ISO8601;
}
```

#### `as3_delete`
Remove an AS3 tenant configuration.

```typescript
{
  name: "as3_delete",
  description: "Remove an AS3 tenant and all its applications",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      tenant: {
        type: "string",
        description: "Tenant name to delete"
      },
      confirm: {
        type: "boolean",
        default: false,
        description: "Must be true to confirm deletion"
      }
    },
    required: ["device", "tenant", "confirm"]
  }
}
```

**Returns:**
```typescript
{
  success: boolean;
  tenant_deleted: string;
  applications_removed: string[];
  virtual_servers_removed: string[];
  pools_removed: string[];
}
```

#### `as3_validate`
Validate an AS3 declaration without deploying.

```typescript
{
  name: "as3_validate",
  description: "Validate an AS3 declaration against schema and device state",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host (required for device-level validation)"
      },
      declaration: {
        type: "object",
        description: "AS3 declaration to validate"
      },
      declarationFile: {
        type: "string",
        description: "Path to declaration file"
      },
      level: {
        type: "string",
        enum: ["schema", "semantic", "full"],
        default: "full",
        description: "Validation depth: schema-only, semantic checks, or full device validation"
      }
    },
    required: ["declaration"]
  }
}
```

**Returns:**
```typescript
{
  valid: boolean;
  validation_level: string;
  errors: {
    path: string;                  // JSON path to error location
    message: string;
    code: string;
    suggestion?: string;
  }[];
  warnings: {
    path: string;
    message: string;
  }[];
  schema_version: string;
}
```

#### `as3_task_status`
Check status of an async AS3 deployment task.

```typescript
{
  name: "as3_task_status",
  description: "Check the status of an asynchronous AS3 deployment",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      taskId: {
        type: "string",
        description: "Task ID from as3_deploy response"
      }
    },
    required: ["device", "taskId"]
  }
}
```

### 2.4 System Management

#### `license_get`
Retrieve current license information.

```typescript
{
  name: "license_get",
  description: "Retrieve license information from the device",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      }
    },
    required: ["device"]
  }
}
```

**Returns:**
```typescript
{
  registration_key: string;
  licensed_on: ISO8601;
  licensed_version: string;
  platform_id: string;
  service_check_date: ISO8601;
  license_end_date: ISO8601 | null;  // null = perpetual
  active_modules: {
    name: string;
    key: string;
    expiration?: ISO8601;
  }[];
  feature_flags: string[];
}
```

#### `license_activate`
Activate a license on the device.

```typescript
{
  name: "license_activate",
  description: "Activate a BIG-IP license using a registration key",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      registrationKey: {
        type: "string",
        description: "License registration key (e.g., XXXXX-XXXXX-XXXXX-XXXXX-XXXXXXX)"
      },
      addOnKeys: {
        type: "array",
        items: { type: "string" },
        description: "Additional add-on registration keys"
      },
      licenseServer: {
        type: "string",
        default: "activate.f5.com",
        description: "License server hostname"
      },
      proxyHost: {
        type: "string",
        description: "Proxy server for license activation"
      },
      proxyPort: {
        type: "number",
        description: "Proxy server port"
      }
    },
    required: ["device", "registrationKey"]
  }
}
```

**Returns:**
```typescript
{
  success: boolean;
  registration_key: string;
  license_text: string;
  activated_modules: string[];
  requires_reboot: boolean;
  warnings: string[];
}
```

#### `software_list`
List installed software images and boot volumes.

```typescript
{
  name: "software_list",
  description: "List installed software images and boot volumes",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      }
    },
    required: ["device"]
  }
}
```

**Returns:**
```typescript
{
  current_boot_location: string;   // e.g., "HD1.1"
  volumes: {
    name: string;                  // e.g., "HD1.1"
    version: string;               // e.g., "16.1.3"
    build: string;
    active: boolean;
    status: "complete" | "installing" | "failed";
    size_mb: number;
  }[];
  images: {
    filename: string;
    version: string;
    build: string;
    size_mb: number;
    uploaded_at: ISO8601;
    verified: boolean;
  }[];
  available_space_mb: number;
}
```

#### `software_upload`
Upload a software ISO image to the device.

```typescript
{
  name: "software_upload",
  description: "Upload a BIG-IP software ISO image to the device",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      localPath: {
        type: "string",
        description: "Local path to the ISO file"
      },
      verify: {
        type: "boolean",
        default: true,
        description: "Verify ISO integrity after upload"
      }
    },
    required: ["device", "localPath"]
  }
}
```

**Returns:**
```typescript
{
  success: boolean;
  filename: string;
  remote_path: string;
  size_bytes: number;
  upload_duration_ms: number;
  verified: boolean;
  detected_version: string;
}
```

#### `software_install`
Install software to a boot volume.

```typescript
{
  name: "software_install",
  description: "Install a software image to a boot volume. Does NOT reboot automatically.",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      image: {
        type: "string",
        description: "ISO filename to install"
      },
      volume: {
        type: "string",
        description: "Target volume (e.g., 'HD1.2'). Auto-selects inactive volume if omitted."
      },
      createVolume: {
        type: "boolean",
        default: false,
        description: "Create new volume if specified volume doesn't exist"
      },
      reboot: {
        type: "boolean",
        default: false,
        description: "Reboot to new volume after installation completes"
      }
    },
    required: ["device", "image"]
  }
}
```

**Returns:**
```typescript
{
  success: boolean;
  task_id: string;
  volume: string;
  image: string;
  version: string;
  status: "installing" | "complete" | "failed";
  progress_percent?: number;
  estimated_completion?: ISO8601;
  reboot_scheduled: boolean;
}
```

#### `software_reboot`
Reboot the device to a specific volume.

```typescript
{
  name: "software_reboot",
  description: "Reboot the device, optionally to a specific boot volume",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      volume: {
        type: "string",
        description: "Boot volume (uses current if omitted)"
      },
      confirm: {
        type: "boolean",
        default: false,
        description: "Must be true to confirm reboot"
      }
    },
    required: ["device", "confirm"]
  }
}
```

#### `bash_execute`
Execute a bash command on the device.

```typescript
{
  name: "bash_execute",
  description: "Execute a bash command on the BIG-IP device. Use with caution.",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      command: {
        type: "string",
        description: "Bash command to execute"
      },
      timeout: {
        type: "number",
        default: 30,
        description: "Command timeout in seconds"
      }
    },
    required: ["device", "command"]
  }
}
```

**Security considerations:**
- Commands are logged to audit trail
- Certain patterns may be blocked by policy (configurable)
- Output is truncated at 64KB

**Returns:**
```typescript
{
  success: boolean;
  command: string;
  exit_code: number;
  stdout: string;
  stderr: string;
  duration_ms: number;
  truncated: boolean;
}
```

#### `tmsh_execute`
Execute a TMSH command on the device.

```typescript
{
  name: "tmsh_execute",
  description: "Execute a TMSH command on the BIG-IP device",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      command: {
        type: "string",
        description: "TMSH command (without 'tmsh' prefix)"
      }
    },
    required: ["device", "command"]
  }
}
```

**Returns:**
```typescript
{
  success: boolean;
  command: string;
  output: string;
  duration_ms: number;
}
```

#### `config_save`
Save the running configuration.

```typescript
{
  name: "config_save",
  description: "Save the running configuration to disk",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      }
    },
    required: ["device"]
  }
}
```

### 2.5 Monitoring & Diagnostics

#### `logs_get`
Retrieve log file contents.

```typescript
{
  name: "logs_get",
  description: "Retrieve log file contents from the device",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      logFile: {
        type: "string",
        enum: ["ltm", "gtm", "audit", "restjavad", "restnoded", "apm", "asm",
               "daemon", "kern", "messages", "secure"],
        description: "Log file to retrieve"
      },
      customPath: {
        type: "string",
        description: "Custom log file path (alternative to logFile enum)"
      },
      lines: {
        type: "number",
        default: 100,
        maximum: 10000,
        description: "Number of lines to retrieve (from end of file)"
      },
      filter: {
        type: "string",
        description: "Grep pattern to filter log entries"
      },
      since: {
        type: "string",
        description: "ISO8601 timestamp - only return entries after this time"
      },
      severity: {
        type: "string",
        enum: ["debug", "info", "notice", "warning", "error", "critical", "alert", "emergency"],
        description: "Minimum severity level to include"
      }
    },
    required: ["device"]
  }
}
```

**Log file mappings:**
| Enum | Path |
|------|------|
| ltm | /var/log/ltm |
| gtm | /var/log/gtm |
| audit | /var/log/audit |
| restjavad | /var/log/restjavad.0.log |
| restnoded | /var/log/restnoded/restnoded.log |
| apm | /var/log/apm |
| asm | /var/log/asm |
| daemon | /var/log/daemon.log |
| kern | /var/log/kern.log |
| messages | /var/log/messages |
| secure | /var/log/secure |

**Returns:**
```typescript
{
  log_file: string;
  path: string;
  lines_returned: number;
  total_lines: number;
  filtered: boolean;
  entries: {
    timestamp: ISO8601;
    severity?: string;
    source?: string;
    message: string;
    raw: string;
  }[];
  size_bytes: number;
  last_modified: ISO8601;
}
```

#### `stats_get`
Retrieve statistics for LTM objects.

```typescript
{
  name: "stats_get",
  description: "Retrieve performance statistics for virtual servers, pools, and pool members",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      type: {
        type: "string",
        enum: ["virtual", "pool", "pool_member", "node", "profile", "rule", "snatpool"],
        description: "Object type to get stats for"
      },
      name: {
        type: "string",
        description: "Specific object name (default: all objects of type)"
      },
      partition: {
        type: "string",
        default: "Common",
        description: "Partition to query"
      },
      timeRange: {
        type: "string",
        enum: ["current", "1min", "5min", "1hour"],
        default: "current",
        description: "Time range for averaged stats"
      }
    },
    required: ["device", "type"]
  }
}
```

**Returns (virtual server example):**
```typescript
{
  type: "virtual";
  objects: {
    name: string;
    partition: string;
    full_path: string;
    destination: string;
    status: {
      availability: "available" | "offline" | "unknown";
      state: "enabled" | "disabled";
      reason: string;
    };
    stats: {
      connections: {
        current: number;
        max: number;
        total: number;
      };
      packets: {
        in: number;
        out: number;
      };
      bytes: {
        in: number;
        out: number;
      };
      requests: number;
      cpu_cycles: number;
      ephemeral: {
        current: number;
        max: number;
        total: number;
      };
    };
  }[];
  retrieved_at: ISO8601;
}
```

#### `health_check`
Run comprehensive health check on a device.

```typescript
{
  name: "health_check",
  description: "Run a comprehensive health check on the device",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      checks: {
        type: "array",
        items: {
          type: "string",
          enum: ["system", "services", "ha", "virtual_servers", "pools",
                 "certificates", "disk", "memory", "cpu", "interfaces"]
        },
        default: ["system", "services", "ha"],
        description: "Categories of health checks to run"
      },
      thresholds: {
        type: "object",
        properties: {
          cpu_warning: { type: "number", default: 70 },
          cpu_critical: { type: "number", default: 90 },
          memory_warning: { type: "number", default: 70 },
          memory_critical: { type: "number", default: 90 },
          disk_warning: { type: "number", default: 80 },
          disk_critical: { type: "number", default: 95 },
          cert_expiry_warning_days: { type: "number", default: 30 },
          cert_expiry_critical_days: { type: "number", default: 7 }
        },
        description: "Custom thresholds for warnings and critical alerts"
      }
    },
    required: ["device"]
  }
}
```

**Returns:**
```typescript
{
  overall_status: "healthy" | "warning" | "critical";
  device: string;
  checked_at: ISO8601;
  duration_ms: number;

  summary: {
    healthy: number;
    warnings: number;
    critical: number;
    skipped: number;
  };

  checks: {
    category: string;
    name: string;
    status: "healthy" | "warning" | "critical" | "skipped";
    message: string;
    details?: any;
    recommendation?: string;
    documentation?: string;        // K-article link
  }[];
}
```

#### `validate_upgrade_readiness`
Comprehensive pre-upgrade validation.

```typescript
{
  name: "validate_upgrade_readiness",
  description: "Validate device readiness for software upgrade",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      },
      targetVersion: {
        type: "string",
        description: "Target BIG-IP version (e.g., '16.1.3')"
      },
      checkCategories: {
        type: "array",
        items: {
          type: "string",
          enum: ["system", "ha", "configuration", "compatibility",
                 "network", "services", "licenses", "disk", "memory"]
        },
        default: ["system", "ha", "configuration", "compatibility", "licenses", "disk"],
        description: "Categories of checks to perform"
      },
      thresholds: {
        type: "object",
        properties: {
          minDiskSpace: { type: "string", default: "1GB" },
          minMemoryAvailable: { type: "string", default: "20%" },
          maxCpuUtilization: { type: "number", default: 80 },
          maxActiveConnections: { type: "number", default: 50000 }
        }
      }
    },
    required: ["device", "targetVersion"]
  }
}
```

**Returns:** See Section 6.1 for detailed output format.

### 2.6 HA Management

#### `ha_status`
Get detailed HA (High Availability) status.

```typescript
{
  name: "ha_status",
  description: "Get detailed HA status for a device or HA pair",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host"
      }
    },
    required: ["device"]
  }
}
```

**Returns:**
```typescript
{
  ha_enabled: boolean;
  local_device: {
    name: string;
    host: string;
    state: "active" | "standby" | "offline";
    management_ip: string;
  };
  peer_device: {
    name: string;
    host: string;
    state: "active" | "standby" | "offline";
    management_ip: string;
    reachable: boolean;
  };
  sync_status: {
    status: string;                // "In Sync", "Changes Pending", etc.
    color: "green" | "yellow" | "red";
    mode: string;                  // "automatic" | "manual"
    group: string;
    summary: string;
    last_sync_time: ISO8601;
  };
  failover: {
    state: string;
    last_failover_time?: ISO8601;
    last_failover_reason?: string;
    failover_timeout: number;
  };
  traffic_groups: {
    name: string;
    state: "active" | "standby";
    next_active: string;
  }[];
}
```

#### `ha_failover`
Initiate a controlled failover.

```typescript
{
  name: "ha_failover",
  description: "Initiate a controlled failover to the peer device",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Currently active device alias or host"
      },
      type: {
        type: "string",
        enum: ["controlled", "forced"],
        default: "controlled",
        description: "Failover type - controlled waits for clean handoff"
      },
      trafficGroup: {
        type: "string",
        description: "Specific traffic group to failover (default: all)"
      },
      confirm: {
        type: "boolean",
        default: false,
        description: "Must be true to confirm failover"
      }
    },
    required: ["device", "confirm"]
  }
}
```

**Returns:**
```typescript
{
  success: boolean;
  previous_active: string;
  new_active: string;
  failover_type: string;
  duration_ms: number;
  traffic_groups_moved: string[];
  warnings: string[];
}
```

#### `config_sync`
Synchronize configuration between HA peers.

```typescript
{
  name: "config_sync",
  description: "Synchronize configuration between HA pair devices",
  inputSchema: {
    type: "object",
    properties: {
      device: {
        type: "string",
        description: "Device alias or host (typically the active unit)"
      },
      direction: {
        type: "string",
        enum: ["to_group", "from_peer"],
        default: "to_group",
        description: "Sync direction"
      },
      syncGroup: {
        type: "string",
        description: "Sync group name (auto-detected if omitted)"
      },
      forceFullSync: {
        type: "boolean",
        default: false,
        description: "Force full sync even if incremental is possible"
      }
    },
    required: ["device"]
  }
}
```

**Returns:**
```typescript
{
  success: boolean;
  sync_type: "incremental" | "full";
  source: string;
  targets: string[];
  changes_synced: number;
  duration_ms: number;
  final_status: string;
}
```

### 2.7 Playbook Execution

#### `playbook_execute`
Execute a playbook workflow.

```typescript
{
  name: "playbook_execute",
  description: "Execute a structured playbook workflow",
  inputSchema: {
    type: "object",
    properties: {
      playbook: {
        type: "string",
        description: "Playbook content (markdown) or file path"
      },
      variables: {
        type: "object",
        description: "Variable values to pass to the playbook"
      },
      secrets: {
        type: "object",
        description: "Secret values (will not be logged)"
      },
      dryRun: {
        type: "boolean",
        default: false,
        description: "Validate and show planned steps without executing"
      },
      startFromStep: {
        type: "string",
        description: "Resume execution from a specific step ID"
      },
      startFromCheckpoint: {
        type: "string",
        description: "Resume from a saved checkpoint"
      },
      approvalMode: {
        type: "string",
        enum: ["interactive", "auto", "strict"],
        default: "interactive",
        description: "How to handle approval gates: interactive (prompt), auto (auto-approve), strict (fail if gate encountered)"
      },
      reportFormat: {
        type: "string",
        enum: ["markdown", "json", "both"],
        default: "markdown",
        description: "Format for execution report"
      }
    },
    required: ["playbook"]
  }
}
```

**Returns:**
```typescript
{
  execution_id: string;
  status: "completed" | "failed" | "paused" | "rolled_back";
  started_at: ISO8601;
  completed_at: ISO8601;
  duration_ms: number;

  summary: {
    total_steps: number;
    completed: number;
    failed: number;
    skipped: number;
    warnings: number;
  };

  current_step?: {                 // If paused
    id: string;
    name: string;
    waiting_for: "approval" | "input" | "retry";
  };

  report_path?: string;            // Path to generated report
  checkpoint_id?: string;          // Latest checkpoint for resume
}
```

#### `playbook_validate`
Validate a playbook without executing.

```typescript
{
  name: "playbook_validate",
  description: "Validate a playbook's syntax, schema, and tool references",
  inputSchema: {
    type: "object",
    properties: {
      playbook: {
        type: "string",
        description: "Playbook content (markdown) or file path"
      },
      variables: {
        type: "object",
        description: "Variables to validate against (optional)"
      },
      checkToolAvailability: {
        type: "boolean",
        default: true,
        description: "Verify all referenced tools exist"
      }
    },
    required: ["playbook"]
  }
}
```

**Returns:**
```typescript
{
  valid: boolean;

  playbook_info: {
    name: string;
    version: string;
    description: string;
    total_steps: number;
    phases: string[];
    required_tools: string[];
    required_parameters: string[];
  };

  errors: {
    location: string;              // e.g., "step:backup:create_ucs"
    type: "syntax" | "schema" | "reference" | "logic";
    message: string;
    suggestion?: string;
  }[];

  warnings: {
    location: string;
    message: string;
  }[];
}
```

#### `playbook_status`
Get current playbook execution status.

```typescript
{
  name: "playbook_status",
  description: "Get the status of a running or paused playbook execution",
  inputSchema: {
    type: "object",
    properties: {
      executionId: {
        type: "string",
        description: "Execution ID from playbook_execute"
      }
    },
    required: ["executionId"]
  }
}
```

**Returns:**
```typescript
{
  execution_id: string;
  playbook_name: string;
  status: "running" | "paused" | "completed" | "failed" | "rolled_back";
  started_at: ISO8601;
  elapsed_time_ms: number;

  progress: {
    current_phase: string;
    current_step: string;
    completed_steps: number;
    total_steps: number;
    percent_complete: number;
  };

  pending_action?: {
    type: "approval" | "input" | "error_decision";
    step_id: string;
    prompt: string;
    options: string[];
    timeout?: ISO8601;
  };

  recent_steps: {
    id: string;
    name: string;
    status: string;
    duration_ms: number;
  }[];
}
```

#### `playbook_respond`
Respond to a pending approval gate or input request.

```typescript
{
  name: "playbook_respond",
  description: "Respond to a pending approval gate or input request in a playbook",
  inputSchema: {
    type: "object",
    properties: {
      executionId: {
        type: "string",
        description: "Execution ID"
      },
      response: {
        type: "string",
        description: "Response option ID or input value"
      },
      comment: {
        type: "string",
        description: "Optional comment for audit trail"
      }
    },
    required: ["executionId", "response"]
  }
}
```

#### `playbook_abort`
Abort a running playbook execution.

```typescript
{
  name: "playbook_abort",
  description: "Abort a running playbook and optionally trigger rollback",
  inputSchema: {
    type: "object",
    properties: {
      executionId: {
        type: "string",
        description: "Execution ID"
      },
      triggerRollback: {
        type: "boolean",
        default: false,
        description: "Execute rollback steps if available"
      },
      reason: {
        type: "string",
        description: "Reason for abort (for audit trail)"
      }
    },
    required: ["executionId"]
  }
}
```

---

## 3. MCP Resources & Prompts

MCP supports three primitive types: **Tools** (actions), **Resources** (read-only data), and **Prompts** (templated interactions). While Section 2 covers tools, this section defines resources and prompts that provide contextual data to AI assistants.

### 3.1 Resources Overview

Resources expose read-only data that AI assistants can access to understand device state without executing actions. Resources are:

- **Stateless**: Each read returns current state
- **Cacheable**: Can specify cache duration hints
- **Subscribable**: Clients can subscribe to updates (where supported)

Resources use URI templates following RFC 6570:

```
f5://devices/{device}/info
f5://devices/{device}/config/{component}
f5://devices/{device}/stats/{type}
f5://playbooks/{name}
```

### 3.2 Device Resources

#### `f5://devices`

List all connected devices.

```typescript
{
  uri: "f5://devices",
  name: "Connected Devices",
  description: "List of all currently connected BIG-IP devices",
  mimeType: "application/json"
}
```

**Returns:**

```typescript
{
  devices: {
    alias: string;
    host: string;
    version: string;
    product: string;
    ha_status: string;
    connected_since: ISO8601;
  }[];
}
```

#### `f5://devices/{device}/info`

Detailed device information.

```typescript
{
  uri: "f5://devices/{device}/info",
  name: "Device Information",
  description: "Comprehensive device details including version, platform, modules, and HA status",
  mimeType: "application/json"
}
```

**URI Parameters:**
- `device`: Device alias or host

**Returns:** Same structure as `device_info` tool with all categories included.

#### `f5://devices/{device}/ha`

HA pair status and configuration.

```typescript
{
  uri: "f5://devices/{device}/ha",
  name: "HA Status",
  description: "High availability status including sync state, failover status, and peer information",
  mimeType: "application/json"
}
```

**Returns:** Same structure as `ha_status` tool.

#### `f5://devices/{device}/health`

Current health status snapshot.

```typescript
{
  uri: "f5://devices/{device}/health",
  name: "Device Health",
  description: "Current health status including system resources, services, and alerts",
  mimeType: "application/json"
}
```

**Returns:**

```typescript
{
  overall_status: "healthy" | "warning" | "critical";
  last_checked: ISO8601;
  system: {
    cpu_percent: number;
    memory_percent: number;
    disk_percent: number;
  };
  services: {
    name: string;
    status: "running" | "stopped" | "error";
  }[];
  alerts: {
    severity: string;
    message: string;
    timestamp: ISO8601;
  }[];
}
```

### 3.3 Configuration Resources

#### `f5://devices/{device}/config/virtuals`

Virtual server configuration.

```typescript
{
  uri: "f5://devices/{device}/config/virtuals",
  name: "Virtual Servers",
  description: "List of all virtual servers with their configuration",
  mimeType: "application/json"
}
```

**Returns:**

```typescript
{
  virtual_servers: {
    name: string;
    partition: string;
    destination: string;
    port: number;
    pool: string;
    profiles: string[];
    irules: string[];
    enabled: boolean;
    status: {
      availability: string;
      state: string;
    };
  }[];
  total_count: number;
}
```

#### `f5://devices/{device}/config/pools`

Pool configuration and member status.

```typescript
{
  uri: "f5://devices/{device}/config/pools",
  name: "Pools",
  description: "List of all pools with member configuration and status",
  mimeType: "application/json"
}
```

**Returns:**

```typescript
{
  pools: {
    name: string;
    partition: string;
    load_balancing_mode: string;
    monitor: string;
    members: {
      name: string;
      address: string;
      port: number;
      state: "enabled" | "disabled" | "forced_offline";
      status: "up" | "down" | "checking";
      ratio: number;
      priority_group: number;
    }[];
    members_up: number;
    members_total: number;
  }[];
  total_count: number;
}
```

#### `f5://devices/{device}/config/certificates`

SSL certificate inventory.

```typescript
{
  uri: "f5://devices/{device}/config/certificates",
  name: "SSL Certificates",
  description: "SSL certificate inventory with expiration information",
  mimeType: "application/json"
}
```

**Returns:**

```typescript
{
  certificates: {
    name: string;
    partition: string;
    subject: string;
    issuer: string;
    serial_number: string;
    not_before: ISO8601;
    not_after: ISO8601;
    days_until_expiry: number;
    expiry_status: "valid" | "expiring_soon" | "expired";
    key_type: string;
    key_size: number;
    in_use_by: string[];          // Virtual servers using this cert
  }[];
  expiring_soon: number;          // Count expiring within 30 days
  expired: number;
}
```

#### `f5://devices/{device}/config/as3`

Current AS3 declaration.

```typescript
{
  uri: "f5://devices/{device}/config/as3",
  name: "AS3 Declaration",
  description: "Current AS3 declaration deployed on the device",
  mimeType: "application/json"
}
```

**Returns:** Full AS3 declaration JSON.

#### `f5://devices/{device}/config/as3/{tenant}`

AS3 declaration for a specific tenant.

```typescript
{
  uri: "f5://devices/{device}/config/as3/{tenant}",
  name: "AS3 Tenant Declaration",
  description: "AS3 declaration for a specific tenant",
  mimeType: "application/json"
}
```

### 3.4 Monitoring Resources

#### `f5://devices/{device}/stats/traffic`

Real-time traffic statistics.

```typescript
{
  uri: "f5://devices/{device}/stats/traffic",
  name: "Traffic Statistics",
  description: "Current traffic statistics including connections, throughput, and requests",
  mimeType: "application/json"
}
```

**Returns:**

```typescript
{
  timestamp: ISO8601;
  summary: {
    active_connections: number;
    new_connections_per_sec: number;
    throughput_in_mbps: number;
    throughput_out_mbps: number;
    requests_per_sec: number;
    ssl_transactions_per_sec: number;
  };
  by_virtual: {
    name: string;
    connections_current: number;
    connections_total: number;
    bytes_in: number;
    bytes_out: number;
  }[];
}
```

#### `f5://devices/{device}/stats/system`

System resource utilization.

```typescript
{
  uri: "f5://devices/{device}/stats/system",
  name: "System Statistics",
  description: "CPU, memory, and disk utilization metrics",
  mimeType: "application/json"
}
```

**Returns:**

```typescript
{
  timestamp: ISO8601;
  cpu: {
    current_percent: number;
    average_1min: number;
    average_5min: number;
    average_15min: number;
    tmm_percent: number;
  };
  memory: {
    total_bytes: number;
    used_bytes: number;
    free_bytes: number;
    percent_used: number;
    tmm_used_bytes: number;
  };
  disk: {
    volumes: {
      mount_point: string;
      total_bytes: number;
      used_bytes: number;
      percent_used: number;
    }[];
  };
}
```

#### `f5://devices/{device}/logs/{logfile}`

Recent log entries.

```typescript
{
  uri: "f5://devices/{device}/logs/{logfile}",
  name: "Log Entries",
  description: "Recent log entries from specified log file",
  mimeType: "text/plain"
}
```

**URI Parameters:**
- `logfile`: One of `ltm`, `gtm`, `audit`, `restjavad`, `restnoded`, `apm`, `asm`

**Query Parameters:**
- `lines`: Number of lines (default: 50, max: 500)
- `severity`: Minimum severity filter

**Returns:** Plain text log content.

#### `f5://devices/{device}/alerts`

Active alerts and notifications.

```typescript
{
  uri: "f5://devices/{device}/alerts",
  name: "Active Alerts",
  description: "Current alerts, warnings, and system notifications",
  mimeType: "application/json"
}
```

**Returns:**

```typescript
{
  alerts: {
    id: string;
    severity: "info" | "warning" | "error" | "critical";
    category: string;
    message: string;
    timestamp: ISO8601;
    acknowledged: boolean;
    source: string;
    documentation?: string;        // K-article link
  }[];
  summary: {
    critical: number;
    error: number;
    warning: number;
    info: number;
  };
}
```

### 3.5 Playbook Resources

#### `f5://playbooks`

List available playbooks.

```typescript
{
  uri: "f5://playbooks",
  name: "Available Playbooks",
  description: "List of playbooks available for execution",
  mimeType: "application/json"
}
```

**Returns:**

```typescript
{
  playbooks: {
    name: string;
    version: string;
    description: string;
    author: string;
    tags: string[];
    path: string;
    required_parameters: string[];
  }[];
  sources: {
    type: "builtin" | "local" | "remote";
    path: string;
  }[];
}
```

#### `f5://playbooks/{name}`

Playbook content and metadata.

```typescript
{
  uri: "f5://playbooks/{name}",
  name: "Playbook Details",
  description: "Full playbook content with parsed metadata",
  mimeType: "application/json"
}
```

**Returns:**

```typescript
{
  name: string;
  version: string;
  description: string;
  content: string;                 // Raw markdown content
  metadata: {
    author: string;
    tags: string[];
    parameters: ParameterDefinition[];
    variables: Record<string, any>;
    required_tools: string[];
    phases: string[];
    total_steps: number;
  };
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}
```

#### `f5://executions`

List playbook executions.

```typescript
{
  uri: "f5://executions",
  name: "Playbook Executions",
  description: "List of current and recent playbook executions",
  mimeType: "application/json"
}
```

**Returns:**

```typescript
{
  executions: {
    id: string;
    playbook_name: string;
    status: string;
    started_at: ISO8601;
    completed_at?: ISO8601;
    progress_percent: number;
    current_step?: string;
  }[];
  running: number;
  paused: number;
  recent_completed: number;
}
```

#### `f5://executions/{id}`

Execution details and status.

```typescript
{
  uri: "f5://executions/{id}",
  name: "Execution Details",
  description: "Detailed status and logs for a specific playbook execution",
  mimeType: "application/json"
}
```

#### `f5://executions/{id}/report`

Execution report.

```typescript
{
  uri: "f5://executions/{id}/report",
  name: "Execution Report",
  description: "Generated report for a completed playbook execution",
  mimeType: "text/markdown"
}
```

### 3.6 MCP Prompts

Prompts provide templated interactions that guide users through common workflows. They pre-populate context and suggested parameters.

#### `f5://prompts/connect`

Guide user through device connection.

```typescript
{
  name: "connect",
  description: "Connect to a BIG-IP device",
  arguments: [
    {
      name: "host",
      description: "Device hostname or IP",
      required: true
    },
    {
      name: "purpose",
      description: "What you plan to do (helps AI provide relevant guidance)",
      required: false
    }
  ]
}
```

**Generated Prompt:**

```
I'd like to connect to a BIG-IP device at {host}.

Purpose: {purpose}

Please:
1. Establish the connection
2. Show me the device details (version, platform, HA status)
3. List any immediate concerns (expiring certs, health issues)
```

#### `f5://prompts/backup`

Create backup with guidance.

```typescript
{
  name: "backup",
  description: "Create a UCS backup with best practices",
  arguments: [
    {
      name: "device",
      description: "Device to backup",
      required: true
    },
    {
      name: "reason",
      description: "Reason for backup (pre-change, scheduled, etc.)",
      required: false
    }
  ]
}
```

**Generated Prompt:**

```
I need to create a backup of {device}.

Reason: {reason}

Please:
1. Check available disk space first
2. Create an encrypted UCS backup with today's date
3. Verify the backup was created successfully
4. Download a copy locally
5. Show me the backup file details
```

#### `f5://prompts/health-check`

Comprehensive health assessment.

```typescript
{
  name: "health-check",
  description: "Run comprehensive health check on a device",
  arguments: [
    {
      name: "device",
      description: "Device to check",
      required: true
    },
    {
      name: "focus",
      description: "Specific area of concern (optional)",
      required: false
    }
  ]
}
```

**Generated Prompt:**

```
Please run a comprehensive health check on {device}.

Focus area: {focus}

I'd like to know:
1. Overall device health status
2. Resource utilization (CPU, memory, disk)
3. Any services that aren't running properly
4. Certificate expiration status
5. HA/sync status if applicable
6. Any active alerts or warnings
7. Recommendations for any issues found
```

#### `f5://prompts/deploy-app`

Guide through AS3 application deployment.

```typescript
{
  name: "deploy-app",
  description: "Deploy an application using AS3",
  arguments: [
    {
      name: "device",
      description: "Target device",
      required: true
    },
    {
      name: "app_name",
      description: "Application name",
      required: true
    },
    {
      name: "vip",
      description: "Virtual server IP address",
      required: true
    },
    {
      name: "pool_members",
      description: "Pool member IPs (comma-separated)",
      required: true
    }
  ]
}
```

**Generated Prompt:**

```
I want to deploy an application on {device}.

Application details:
- Name: {app_name}
- VIP: {vip}
- Pool members: {pool_members}

Please:
1. Create an AS3 declaration for this application
2. Validate the declaration before deploying
3. Show me what will be created
4. Deploy after I confirm
5. Verify the deployment was successful
6. Show me the application status
```

#### `f5://prompts/troubleshoot`

Troubleshooting assistance.

```typescript
{
  name: "troubleshoot",
  description: "Help troubleshoot an issue",
  arguments: [
    {
      name: "device",
      description: "Device with the issue",
      required: true
    },
    {
      name: "symptom",
      description: "What's happening / the problem",
      required: true
    },
    {
      name: "affected_resource",
      description: "Specific VS, pool, or service affected (if known)",
      required: false
    }
  ]
}
```

**Generated Prompt:**

```
I'm experiencing an issue on {device}.

Symptom: {symptom}
Affected resource: {affected_resource}

Please help me:
1. Check the status of the affected resource
2. Review relevant logs for errors
3. Check for any related alerts
4. Identify potential causes
5. Suggest remediation steps
6. Point me to relevant F5 documentation
```

#### `f5://prompts/run-playbook`

Execute a playbook with parameter collection.

```typescript
{
  name: "run-playbook",
  description: "Execute a playbook workflow",
  arguments: [
    {
      name: "playbook",
      description: "Playbook name or path",
      required: true
    },
    {
      name: "target_device",
      description: "Primary target device",
      required: true
    }
  ]
}
```

**Generated Prompt:**

```
I want to run the {playbook} playbook on {target_device}.

Please:
1. Load and validate the playbook
2. Show me the required parameters
3. Explain what the playbook will do
4. Let me provide any required values
5. Execute with appropriate approval gates
6. Generate a report when complete
```

---

## 4. Playbook System

### 4.1 Format Specification

Playbooks use a hybrid Markdown format with YAML front matter and structured code blocks.

```markdown
---
# YAML Front Matter - Playbook metadata and configuration
name: BIG-IP HA Pair Upgrade
version: 1.0.0
description: Standard upgrade procedure for BIG-IP HA pairs
author: F5 Operations Team
---

# Human-readable documentation

Documentation, context, and explanations in standard Markdown.

```step:<phase>
# YAML step definition
name: Step Name
tool: tool_name
params:
  key: value
```

```ai_context
Guidance and hints for the AI assistant.
```

```gate:approval
Human approval gate definition.
```
```

### 4.2 Front Matter Schema

```yaml
---
# Required
name: string                    # Playbook display name
version: string                 # Semantic version

# Optional metadata
description: string             # Brief description
author: string                  # Author or team
tags: string[]                  # Categorization tags
documentation_url: string       # Link to detailed docs

# Parameters - User-provided values
parameters:
  - name: target_version
    type: string
    required: true
    description: "Target BIG-IP version (e.g., 16.1.3)"
  - name: maintenance_window
    type: time_range
    required: false
    default: "02:00-06:00"
  - name: backup_passphrase
    type: secret
    required: true

# Variables - Computed or default values
vars:
  min_disk_space: "500MB"
  health_check_retries: 3
  failover_timeout: "5m"

# Device targeting
targets:
  type: ha_pair              # single, ha_pair, device_group
  primary_alias: active      # How to reference in steps
  secondary_alias: standby

# Execution settings
settings:
  rollback_on_failure: true
  continue_on_warning: false
  log_level: detailed        # minimal, standard, detailed
  report_format: markdown    # markdown, json, both

# Feature flags - For functionality not yet in MCP server
required_features:
  - ucs_restore              # Will warn if not available
  - mini_ucs                 # Will suggest alternatives
---
```

### 4.3 Step Definition

Steps are defined in fenced code blocks with the `step:<phase>` tag:

```markdown
```step:preflight
id: check-ha-sync                    # Unique identifier (auto-generated if omitted)
name: Verify HA Sync Status          # Display name
description: |                       # Detailed description for logs/reports
  Confirms the HA pair is synchronized before proceeding.
  This prevents split-brain scenarios during upgrade.

tool: device_info                    # MCP tool to invoke
device: "{{ targets.primary }}"      # Target device
params:                              # Tool parameters
  include:
    - failover
    - sync_status

expect:                              # Expected outcomes
  sync_status: "In Sync"
  failover_state: ["active", "standby"]  # Either is acceptable

on_success: continue                 # continue (default), skip_to:<step_id>, complete
on_failure: abort                    # abort, continue, retry, gate, skip_to:<step_id>
on_warning: gate                     # Trigger approval gate on warnings

retry:                               # Retry configuration
  attempts: 3
  delay: "30s"
  backoff: exponential

timeout: "2m"                        # Step timeout

rollback: false                      # Include in rollback? (default: true)
rollback_step: null                  # Custom rollback step ID

tags:                                # For filtering/reporting
  - critical
  - ha-validation
```
```

### 4.4 Conditional Logic

#### Simple Conditions

```markdown
```step:upgrade
name: Install Software
when: "{{ device.version | version_lt(params.target_version) }}"
tool: software_install
# ...
```
```

#### Decision Blocks

```markdown
```decision
id: choose-upgrade-path
name: Determine Upgrade Path

conditions:
  - if: "{{ device.version | major < 14 }}"
    description: "Legacy version requires intermediate upgrade"
    then: phase_legacy_upgrade

  - if: "{{ device.version | major >= 14 and device.version | major < 16 }}"
    description: "Standard upgrade path"
    then: phase_standard_upgrade

  - else:
    description: "Already on target major version"
    then: phase_minor_upgrade
```
```

#### Loop Constructs

```markdown
```step:validation
name: Validate All Virtual Servers
loop: "{{ device.virtual_servers }}"
loop_var: vs
tool: stats_get
params:
  type: virtual
  name: "{{ vs.name }}"
expect:
  availability_state: available
```
```

### 4.5 Human Approval Gates

Gates pause execution and require human confirmation.

```markdown
```gate:approval
id: confirm-failover
name: Confirm Failover Initiation
phase: upgrade

prompt: |
  ## Ready to Initiate Failover

  The standby unit has been successfully upgraded and validated.

  **Current State:**
  - Active: {{ targets.primary.host }} ({{ targets.primary.version }})
  - Standby: {{ targets.secondary.host }} ({{ targets.secondary.version }}) ✓ Upgraded

  **Action:** Failover will transfer traffic to the upgraded standby unit.

  **Impact:**
  - Brief traffic interruption (typically < 1 second for stateless)
  - Stateful connections may be reset
  - Current active connections: {{ stats.active_connections }}

display:                             # Additional data to show
  - label: "Active Connections"
    value: "{{ stats.active_connections }}"
  - label: "Persistence Records"
    value: "{{ stats.persistence_records }}"
  - label: "Estimated Impact"
    value: "{{ impact_assessment }}"

options:                             # Response options
  - id: proceed
    label: "Proceed with Failover"
    action: continue
  - id: delay
    label: "Delay 30 minutes"
    action: wait
    wait_time: "30m"
  - id: abort
    label: "Abort Upgrade"
    action: rollback
  - id: skip
    label: "Skip (manual failover)"
    action: skip_to:post_failover_validation

timeout: "4h"                        # Gate timeout
on_timeout: abort                    # abort, continue, rollback
notify:                              # Optional notification
  - slack: "#f5-upgrades"
  - email: "oncall@example.com"
```
```

### 4.6 AI Guidance Blocks

Provide context and hints specifically for the AI assistant.

```markdown
```ai_context
# Guidance for AI Assistant

## Customer Context
This customer operates in the financial services sector with strict change
management requirements. All changes must be completed within the defined
maintenance window.

## Decision-Making Guidelines
- **Prefer safety over speed**: If uncertain, pause and ask rather than proceed
- **Rollback threshold**: If more than 2 steps fail, recommend full rollback
- **Connection threshold**: Do not proceed with failover if active connections > 10,000

## Common Issues
1. **GTM sync delays**: After failover, GTM may take 2-3 minutes to update.
   This is normal - wait before flagging as an issue.
2. **ASM policy compilation**: On first boot after upgrade, ASM policies
   recompile. This can take 5-10 minutes on large policy sets.

## Escalation
If you encounter issues not covered by the playbook:
- For HA issues: Check DevCentral article K1234
- For license issues: Customer has support contract, reference case #00000
- For ASM issues: Contact ASM specialist team

## Post-Upgrade
Remind the customer to:
- Update monitoring thresholds if version-specific
- Verify iApp templates if using custom iApps
- Schedule follow-up health check for +24 hours
```
```

#### Scoped AI Context

```markdown
```ai_context:step:software_install
# Context specific to this step

The software installation can take 15-45 minutes depending on the platform.
- VE: ~15 minutes
- i5800: ~25 minutes
- i10800: ~35 minutes
- VIPRION: ~45 minutes

Do not interpret long installation times as failures. Monitor the installation
status endpoint rather than relying on timeouts.
```
```

### 4.7 Error Handling & Recovery

#### Step-Level Error Handling

```markdown
```step:backup
name: Create Pre-Upgrade Backup
tool: ucs_create
params:
  filename: "pre-upgrade-{{ timestamp }}"

on_failure:
  action: gate                       # Pause for human decision
  gate:
    prompt: |
      ## Backup Creation Failed

      Error: {{ error.message }}

      **Options:**
      - Retry with different filename
      - Skip backup (NOT RECOMMENDED)
      - Abort upgrade
    options:
      - id: retry
        label: "Retry"
        action: retry
      - id: skip
        label: "Skip Backup"
        action: continue
        requires_confirmation: true
        warning: "Proceeding without backup is not recommended"
      - id: abort
        label: "Abort"
        action: abort
```
```

#### Recovery Suggestions

```markdown
```recovery:insufficient_disk_space
name: Insufficient Disk Space Recovery
trigger: "{{ error.code == 'ENOSPC' or error.message | contains('No space left') }}"

description: |
  The device does not have enough disk space for this operation.

suggestions:
  - action: auto
    description: "Delete old UCS files"
    tool: bash_execute
    params:
      command: "ls -t /var/local/ucs/*.ucs | tail -n +4 | xargs rm -f"
    approval_required: true

  - action: auto
    description: "Clear log files"
    tool: bash_execute
    params:
      command: "rm -f /var/log/*.gz"
    approval_required: true

  - action: manual
    description: "Review and delete unused software images"
    documentation: "https://my.f5.com/manage/s/article/K14952"

  - action: manual
    description: "Contact F5 Support if issue persists"
    documentation: "https://my.f5.com/manage/s/case"
```
```

### 4.8 Checkpoints & Rollback

#### Checkpoint Definition

```markdown
```checkpoint
id: pre-upgrade-state
name: Pre-Upgrade Configuration State
phase: backup

capture:
  ucs:
    source: "{{ steps.create_backup.output.filename }}"
    store: local                     # local, remote, both
    retention: "30d"
  config_sync:
    source: device_info
    fields: [sync_status, sync_group]
  running_config:
    source: bash_execute
    params:
      command: "tmsh list"
    store: local

validation:
  - "{{ captured.ucs.exists }}"
  - "{{ captured.ucs.size > 1000 }}"
```
```

#### Rollback Definition

```markdown
```rollback
id: restore-pre-upgrade
name: Restore to Pre-Upgrade State
checkpoint: pre-upgrade-state

steps:
  - name: Restore UCS
    tool: ucs_restore
    params:
      filename: "{{ checkpoint.ucs.filename }}"
      passphrase: "{{ params.backup_passphrase }}"
    timeout: "30m"

  - name: Verify Restoration
    tool: health_check
    expect:
      status: healthy

  - name: Sync HA Pair
    tool: config_sync
    when: "{{ targets.type == 'ha_pair' }}"

on_failure:
  action: gate
  prompt: |
    ## Rollback Failed

    Manual intervention required. Contact support with:
    - Checkpoint ID: {{ checkpoint.id }}
    - Error: {{ error.message }}

    Documentation: https://my.f5.com/manage/s/article/K00000
```
```

---

## 5. HA Pair Management

### 5.1 Device Pairing Model

```yaml
# In playbook front matter
targets:
  type: ha_pair
  discovery: auto                    # auto, manual

  # Auto-discovery queries the device for its HA peer
  # Manual requires explicit definition:
  manual_config:
    primary:
      host: "10.1.1.1"
      alias: unit-1
    secondary:
      host: "10.1.1.2"
      alias: unit-2

  # Role assignment
  role_assignment: by_state          # by_state, by_order, manual
  # by_state: active=primary, standby=secondary
  # by_order: first connected=primary
  # manual: use manual_config
```

### 5.2 Coordinated Operations

#### Sequential HA Operations

```markdown
```step:upgrade-standby
name: Upgrade Standby Unit
device: "{{ targets.standby }}"      # Automatically resolves to standby device
tool: software_install
params:
  volume: "{{ available_volume }}"
  image: "{{ params.iso_filename }}"
```

```step:verify-standby
name: Verify Standby Upgrade
device: "{{ targets.standby }}"
tool: health_check
expect:
  version: "{{ params.target_version }}"
  status: healthy
```

```step:failover
name: Initiate Failover
device: "{{ targets.active }}"
tool: ha_failover
params:
  target: "{{ targets.standby.host }}"
ha_coordination:
  wait_for_sync: true
  verify_roles_swapped: true
```
```

#### HA-Aware Steps

```markdown
```step:sync-config
name: Synchronize Configuration
device: "{{ targets.active }}"
tool: config_sync
params:
  direction: to_standby

ha_coordination:
  pre_check:
    - sync_status: "In Sync"
    - both_units: reachable
  post_check:
    - sync_status: "In Sync"
  on_sync_failure: gate
```
```

### 5.3 Failover Handling

```markdown
```step:controlled-failover
name: Controlled Failover to Upgraded Unit
device: "{{ targets.active }}"
tool: ha_failover

params:
  type: controlled                   # controlled, forced
  target: "{{ targets.standby.host }}"

pre_checks:
  - standby_ready: true
  - sync_status: "In Sync"
  - standby_health: healthy

monitoring:
  poll_interval: "5s"
  timeout: "5m"
  success_criteria:
    - old_active_state: standby
    - old_standby_state: active
    - traffic_flowing: true

rollback_trigger:
  - traffic_loss_duration: "> 30s"
  - failover_timeout: "> 5m"
```
```

### 5.4 Sync State Management

```markdown
```step:wait-for-sync
name: Wait for Configuration Sync
device: "{{ targets.active }}"
tool: ha_sync_status

params:
  wait_for: "In Sync"
  timeout: "10m"
  poll_interval: "15s"

on_timeout:
  action: gate
  prompt: |
    ## Sync Timeout

    Configuration sync has not completed within expected time.

    Current Status:
    - Primary: {{ targets.primary.sync_status }}
    - Secondary: {{ targets.secondary.sync_status }}

    This may indicate:
    - Network issues between units
    - Configuration conflicts
    - Resource constraints

    Documentation: https://my.f5.com/manage/s/article/K13946
```
```

---

## 6. Logging & Reporting

### 6.1 Execution Log Structure

```typescript
interface ExecutionLog {
  execution_id: string;              // Unique execution identifier
  playbook: {
    name: string;
    version: string;
    hash: string;                    // Content hash for traceability
  };
  started_at: ISO8601;
  completed_at?: ISO8601;
  status: 'running' | 'completed' | 'failed' | 'rolled_back' | 'paused';

  parameters: Record<string, any>;   // Input parameters (secrets redacted)

  targets: {
    type: string;
    devices: DeviceInfo[];
  };

  phases: PhaseLog[];

  checkpoints: CheckpointLog[];

  current_step?: {
    id: string;
    name: string;
    started_at: ISO8601;
  };

  summary: {
    total_steps: number;
    completed_steps: number;
    failed_steps: number;
    skipped_steps: number;
    warnings: number;
    approval_gates_passed: number;
    rollbacks_performed: number;
  };
}

interface StepLog {
  id: string;
  name: string;
  phase: string;
  device?: string;

  started_at: ISO8601;
  completed_at: ISO8601;
  duration_ms: number;

  status: 'success' | 'failed' | 'skipped' | 'warning';

  tool: string;
  params: Record<string, any>;       // Secrets redacted

  result?: {
    output: any;                     // Tool output
    matched_expectations: boolean;
    expectation_details?: any;
  };

  error?: {
    code: string;
    message: string;
    stack?: string;
    recovery_attempted?: string;
  };

  ai_notes?: string;                 // AI's observations/decisions

  approval_gate?: {
    prompted_at: ISO8601;
    responded_at: ISO8601;
    response: string;
    responder?: string;
  };
}
```

### 6.2 Markdown Report Generation

Generated reports follow this structure:

```markdown
# Execution Report: BIG-IP HA Pair Upgrade

**Execution ID:** `exec_20240115_143022_abc123`
**Playbook:** BIG-IP HA Pair Upgrade v1.0.0
**Status:** ✅ Completed Successfully

## Summary

| Metric | Value |
|--------|-------|
| Started | 2024-01-15 14:30:22 UTC |
| Completed | 2024-01-15 16:45:18 UTC |
| Duration | 2h 14m 56s |
| Total Steps | 24 |
| Successful | 22 |
| Skipped | 2 |
| Warnings | 1 |

## Target Devices

| Alias | Host | Initial Version | Final Version | Role |
|-------|------|-----------------|---------------|------|
| unit-1 | 10.1.1.1 | 15.1.8 | 16.1.3 | Active → Standby → Active |
| unit-2 | 10.1.1.2 | 15.1.8 | 16.1.3 | Standby → Active → Standby |

## Execution Timeline

### Phase: Pre-Flight Checks ✅
*Duration: 2m 34s*

#### ✅ Verify HA Sync Status
- **Tool:** `device_info`
- **Duration:** 1.2s
- **Result:** Sync status confirmed as "In Sync"

#### ✅ Check Disk Space
- **Tool:** `bash_execute`
- **Duration:** 0.8s
- **Result:** Available space: 2.1GB (required: 500MB)

[... additional steps ...]

### Phase: Upgrade Standby ✅
*Duration: 45m 12s*

#### ✅ Create Pre-Upgrade Backup
- **Tool:** `ucs_create`
- **Device:** unit-2
- **Duration:** 3m 22s
- **Output:** `pre-upgrade-20240115-143256.ucs` (245MB)

#### ⏸️ Approval Gate: Confirm Software Installation
- **Prompted:** 14:36:18
- **Responded:** 14:37:02
- **Decision:** Proceed
- **Responder:** admin@example.com

[... additional steps ...]

## Warnings

### ⚠️ ASM Policy Compilation Delay
- **Step:** Post-Upgrade Health Check
- **Details:** ASM policy compilation took 8 minutes (expected: 5 minutes)
- **Resolution:** Completed successfully after extended wait

## Checkpoints Created

| ID | Name | Timestamp | UCS File |
|----|------|-----------|----------|
| pre-upgrade-state | Pre-Upgrade Configuration | 14:32:56 | pre-upgrade-20240115.ucs |
| post-standby-upgrade | Post Standby Upgrade | 15:22:14 | post-standby-20240115.ucs |

## Rollback Information

No rollbacks were performed during this execution.

**Rollback available until:** 2024-02-14 (30 days)
**Rollback checkpoint:** `pre-upgrade-state`

## AI Assistant Notes

> During the upgrade, I observed that the ASM policy compilation took longer
> than the documented estimate. This appears to be due to the large number
> of custom signatures (2,847) in the policy set. Future upgrades for this
> device should account for extended ASM initialization time.

> The customer's monitoring system generated alerts during the failover
> window. I confirmed with the operator that these were expected and
> auto-cleared after traffic stabilized.

---
*Report generated by f5-mcp-server v1.0.0*
*Playbook hash: sha256:abc123...*
```

### 6.3 State Persistence

For resumable execution and crash recovery:

```typescript
interface PersistedState {
  execution_id: string;
  playbook_hash: string;

  // Current position
  current_phase: string;
  current_step_index: number;
  step_status: Map<string, StepStatus>;

  // Variable state
  variables: Record<string, any>;
  step_outputs: Map<string, any>;

  // Connection state
  device_sessions: Map<string, {
    host: string;
    token_expiry: ISO8601;
    // Credentials NOT persisted - must re-authenticate
  }>;

  // Checkpoints
  checkpoints: Map<string, CheckpointData>;

  // Timestamps
  started_at: ISO8601;
  last_updated: ISO8601;
  paused_at?: ISO8601;
  pause_reason?: string;
}
```

**Storage locations:**
- Default: `~/.f5-mcp/executions/`
- Configurable via environment variable
- Encrypted at rest for security

### 6.4 Audit Trail Requirements

For compliance and troubleshooting:

```typescript
interface AuditEntry {
  timestamp: ISO8601;
  execution_id: string;
  event_type:
    | 'execution_started'
    | 'execution_completed'
    | 'step_started'
    | 'step_completed'
    | 'approval_requested'
    | 'approval_granted'
    | 'approval_denied'
    | 'rollback_initiated'
    | 'rollback_completed'
    | 'error_occurred'
    | 'recovery_attempted'
    | 'credential_used'
    | 'device_connected'
    | 'device_disconnected';

  actor: {
    type: 'ai_assistant' | 'human' | 'system';
    identity?: string;              // User email, AI model ID, etc.
  };

  target?: {
    device?: string;
    resource?: string;
  };

  details: Record<string, any>;

  // For security-sensitive operations
  authorization?: {
    method: string;                  // How action was authorized
    reference?: string;              // Approval gate ID, etc.
  };
}
```

---

## 7. Validation & Pre-Flight Checks

### 7.1 Upgrade Readiness Assessment

The `validate_upgrade_readiness` tool performs comprehensive pre-upgrade checks:

```markdown
```step:preflight
id: upgrade-readiness
name: Comprehensive Upgrade Readiness Check
tool: validate_upgrade_readiness
device: "{{ targets.primary }}"

params:
  target_version: "{{ params.target_version }}"
  check_categories:
    - system                         # Disk, memory, CPU
    - ha                             # HA status, sync state
    - configuration                  # Config validity, pending changes
    - compatibility                  # Version compatibility, iApp support
    - network                        # Management access, peer connectivity
    - services                       # Critical services running
    - licenses                       # License validity, feature coverage

thresholds:
  min_disk_space: "1GB"
  min_memory_available: "20%"
  max_cpu_utilization: "80%"
  max_active_connections: 50000     # Warn if above

output_format: detailed              # summary, detailed, full

expect:
  overall_status: ready              # ready, warnings, not_ready
  critical_issues: 0
```
```

**Readiness check output:**

```json
{
  "overall_status": "warnings",
  "critical_issues": 0,
  "warnings": 2,
  "checks": {
    "system": {
      "status": "pass",
      "disk_space": { "available": "2.1GB", "required": "1GB", "status": "pass" },
      "memory": { "available": "34%", "required": "20%", "status": "pass" },
      "cpu": { "current": "23%", "threshold": "80%", "status": "pass" }
    },
    "ha": {
      "status": "pass",
      "sync_status": "In Sync",
      "peer_reachable": true,
      "failover_ready": true
    },
    "configuration": {
      "status": "warning",
      "warnings": [
        {
          "code": "CONFIG_NOT_SAVED",
          "message": "Running configuration differs from saved configuration",
          "recommendation": "Run 'tmsh save sys config' before upgrade",
          "auto_fixable": true
        }
      ]
    },
    "compatibility": {
      "status": "warning",
      "current_version": "15.1.8",
      "target_version": "16.1.3",
      "upgrade_path": "direct",
      "warnings": [
        {
          "code": "IAPP_REVALIDATION",
          "message": "3 iApp templates may require revalidation after upgrade",
          "affected": ["appsvcs_integration_v3.18.0", "custom_app_v1.2"],
          "documentation": "https://my.f5.com/manage/s/article/K42052145"
        }
      ]
    },
    "network": {
      "status": "pass",
      "management_access": true,
      "peer_connectivity": true,
      "dns_resolution": true
    },
    "services": {
      "status": "pass",
      "mcpd": "running",
      "tmm": "running",
      "restjavad": "running"
    },
    "licenses": {
      "status": "pass",
      "valid": true,
      "expires": "2025-12-31",
      "features_compatible": true
    }
  },
  "recommendations": [
    {
      "priority": "high",
      "action": "Save current configuration",
      "command": "tmsh save sys config",
      "reason": "Ensures recovery point matches running state"
    },
    {
      "priority": "medium",
      "action": "Review iApp compatibility",
      "documentation": "https://my.f5.com/manage/s/article/K42052145",
      "reason": "Custom iApps may need updates for new version"
    }
  ]
}
```

### 7.2 Health Check Framework

```markdown
```step:health-check
name: Post-Upgrade Health Validation
tool: health_check
device: "{{ targets.standby }}"

params:
  checks:
    - type: virtual_servers
      expect:
        availability: available
        minimum_available_percent: 95

    - type: pools
      expect:
        minimum_members_up_percent: 75

    - type: ssl_certificates
      expect:
        not_expiring_within: "30d"

    - type: system_health
      expect:
        cpu_below: "90%"
        memory_available_above: "10%"

    - type: services
      expect:
        all_running: ["mcpd", "tmm", "restjavad", "restnoded"]

    - type: ha_status
      expect:
        state: standby             # Expected state for this device
        peer_reachable: true
        config_sync: "In Sync"

  comparison:
    baseline: "{{ checkpoints.pre_upgrade.health }}"
    tolerance:
      virtual_servers: 0           # No VS should be lost
      pools: 0
      pool_members: "5%"           # Allow 5% variance

timeout: "5m"
retry:
  attempts: 3
  delay: "60s"
  reason: "Allow services to fully initialize"
```
```

### 7.3 Resource Verification

```markdown
```step:verify-resources
name: Verify Critical Resources
tool: resource_verification
device: "{{ targets.active }}"

params:
  resources:
    - type: virtual_servers
      names:
        - /Common/www_vs
        - /Common/api_vs
      verify:
        - enabled: true
        - destination_accessible: true
        - pool_available: true

    - type: pools
      names:
        - /Common/www_pool
        - /Common/api_pool
      verify:
        - minimum_active_members: 2
        - health_monitor_passing: true

    - type: certificates
      names:
        - /Common/www.example.com.crt
      verify:
        - valid: true
        - days_until_expiry: ">= 30"

    - type: routes
      verify:
        - default_gateway_reachable: true

  traffic_verification:
    enabled: true
    duration: "30s"
    expect:
      requests_per_second: "> 0"
      error_rate: "< 1%"
```
```

---

## 8. Extensibility & Feature Requests

### 8.1 Capturing Unmet Needs

When the AI encounters operations that aren't supported by the MCP server, it should capture this for future development:

```markdown
```capability_gap
id: mini-ucs-selective
timestamp: "{{ now }}"
context: upgrade-playbook-execution

requested_operation: |
  Create mini-UCS with only LTM configuration, excluding ASM policies

current_limitation: |
  The mini_ucs_create tool does not support component filtering.
  Currently captures all components or none.

workaround_used: |
  Created full UCS and noted that restore should use no-asm-policies flag

impact: medium                       # low, medium, high, critical
frequency: common                    # rare, occasional, common, frequent

suggested_enhancement:
  tool: mini_ucs_create
  new_parameter:
    name: components
    type: string[]
    values: [ltm, gtm, asm, apm, afm, dns, all]
    description: "Select which components to include in mini-UCS"

documentation_reference: "https://my.f5.com/manage/s/article/K4423"

votes: 1                             # Incremented when same gap encountered
```
```

**Gap collection location:** `~/.f5-mcp/capability_gaps.json`

### 8.2 Documentation Links

The MCP server maintains a documentation registry:

```typescript
const documentationRegistry = {
  // General references
  "upgrade_guide": "https://my.f5.com/manage/s/article/K13845",
  "ha_overview": "https://my.f5.com/manage/s/article/K1031",
  "ucs_management": "https://my.f5.com/manage/s/article/K4423",

  // Error-specific documentation
  "errors": {
    "ENOSPC": "https://my.f5.com/manage/s/article/K14952",
    "HA_SYNC_FAILED": "https://my.f5.com/manage/s/article/K13946",
    "LICENSE_EXPIRED": "https://my.f5.com/manage/s/article/K7752",
    "MCPD_NOT_RUNNING": "https://my.f5.com/manage/s/article/K05645522"
  },

  // Version-specific notes
  "version_notes": {
    "16.1": "https://my.f5.com/manage/s/article/K02052145",
    "17.0": "https://my.f5.com/manage/s/article/K12345678"
  },

  // Feature documentation
  "features": {
    "as3": "https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/",
    "do": "https://clouddocs.f5.com/products/extensions/f5-declarative-onboarding/latest/",
    "ts": "https://clouddocs.f5.com/products/extensions/f5-telemetry-streaming/latest/"
  }
};
```

**Usage in AI responses:**

When the AI encounters an issue or needs to suggest manual steps, it references appropriate documentation:

```
I encountered an HA sync failure. This is typically caused by network
connectivity issues between the units or configuration conflicts.

For troubleshooting steps, see: K13946 - Troubleshooting ConfigSync issues
https://my.f5.com/manage/s/article/K13946

Would you like me to run diagnostic commands to identify the specific cause?
```

### 8.3 Feature Request Workflow

```markdown
```feature_request
# Auto-generated when capability gap is significant or frequent

id: fr-20240115-001
status: captured                     # captured, reviewed, planned, implemented

source:
  execution_id: exec_20240115_143022
  playbook: upgrade-ha-pair
  step: backup

gap_reference: mini-ucs-selective
times_encountered: 5
unique_users: 3

description: |
  Customers need the ability to create selective mini-UCS backups that include
  only specific configuration components (LTM, GTM, ASM, etc.) rather than
  all-or-nothing.

use_cases:
  - "Backup only LTM config before making pool changes"
  - "Exclude large ASM policies from quick config snapshots"
  - "Create lightweight backups for version control"

proposed_solution:
  type: tool_enhancement
  tool: mini_ucs_create
  changes:
    - Add 'components' parameter for selective inclusion
    - Add 'exclude' parameter for exclusion patterns

estimated_effort: medium             # small, medium, large, xlarge

priority_score: 75                   # 0-100, auto-calculated
priority_factors:
  frequency: 35                      # How often encountered
  impact: 25                         # Impact on workflow
  workaround_quality: 15             # How good is current workaround
```
```

---

## 9. Implementation Phases

### Phase 1: Foundation
**Goal:** Basic MCP server with core connectivity and backup operations

- [ ] Project scaffolding and build setup
- [ ] MCP server implementation
- [ ] Core tools: `connect`, `disconnect`, `device_info`, `list_connections`
- [ ] Backup tools: `ucs_create`, `ucs_download`, `qkview_create`, `qkview_download`
- [ ] Basic session management (single device)
- [ ] Simple execution logging

**f5-conx-core changes needed:**
- [ ] Add log file retrieval utility
- [ ] Add stats retrieval wrapper

### Phase 2: Extended Operations
**Goal:** Full device management capabilities

- [ ] UCS restore functionality
- [ ] AS3 tools: `as3_deploy`, `as3_get`, `as3_delete`, `as3_validate`
- [ ] System tools: `bash_execute`, `license_get`, `software_list`
- [ ] Monitoring tools: `logs_get`, `stats_get`, `health_check`
- [ ] Multi-device session management

**f5-conx-core changes needed:**
- [ ] UCS restore implementation
- [ ] Mini-UCS support
- [ ] License activation workflow

### Phase 3: Playbook Engine (Basic)
**Goal:** Execute simple linear playbooks

- [ ] Playbook parser (front matter + step blocks)
- [ ] Variable interpolation
- [ ] Sequential step execution
- [ ] Basic expect/validation
- [ ] Simple error handling (abort/continue)
- [ ] Execution logging and basic report generation

### Phase 4: HA Pair Support
**Goal:** Coordinated multi-device operations

- [ ] HA pair discovery and modeling
- [ ] Role-aware device targeting
- [ ] Failover coordination tools
- [ ] Config sync management
- [ ] HA-specific health checks

### Phase 5: Advanced Playbook Features
**Goal:** Full playbook system with AI integration

- [ ] Conditional logic and decision blocks
- [ ] Human approval gates
- [ ] AI guidance block processing
- [ ] Checkpoints and rollback
- [ ] Recovery suggestions
- [ ] State persistence and resume
- [ ] Full markdown report generation

### Phase 6: Validation & Polish
**Goal:** Production-ready upgrade workflows

- [ ] Comprehensive upgrade readiness checks
- [ ] Resource verification framework
- [ ] Capability gap tracking
- [ ] Documentation link integration
- [ ] Example playbooks (upgrade, backup, deploy)
- [ ] Audit trail compliance

---

## 10. ACC/Chariot Integration (tmos-converter)

### 10.1 Overview

The `tmos-converter` package (ACC/Chariot) provides critical capabilities for AI-assisted configuration management:

1. **TMOS to AS3 Conversion** - Convert legacy bigip.conf to declarative AS3
2. **TMOS to DO Conversion** - Convert system configuration to Declarative Onboarding
3. **AS3 Schema Validation** - Validate declarations against the AS3 JSON schema
4. **DO Schema Validation** - Validate declarations against the DO JSON schema

These capabilities enable a powerful **convert → modify → validate → deploy** loop where the AI can:
- Extract configuration from a BIG-IP
- Convert it to declarative format
- Make modifications based on user requests
- Validate changes against the schema
- Fix errors and iterate until valid
- Deploy the validated declaration

### 10.2 Integration Options

#### Option A: Include in f5-mcp-server (Recommended)

**Pros:**
- Single MCP server for all F5 operations
- Seamless workflow: extract config → convert → validate → deploy
- Shared device connections (extract config from connected device)
- Unified tool namespace
- Simpler user setup (one server to configure)

**Cons:**
- Larger dependency footprint
- tmos-converter updates require f5-mcp-server release
- Tighter coupling

#### Option B: Separate f5-acc-mcp-server

**Pros:**
- Independent release cycles
- Smaller, focused package
- Can be used without device connectivity
- Users who only need conversion/validation don't need f5-conx-core

**Cons:**
- Two servers to configure
- Can't directly extract config from devices (needs f5-mcp-server)
- Fragmented tool namespace
- More complex for common workflows

#### Option C: Hybrid - Core in f5-mcp-server, Standalone Also Available

**Pros:**
- Best of both worlds
- f5-mcp-server includes ACC tools for integrated workflows
- Standalone f5-acc-mcp-server for conversion-only use cases
- Shared underlying library (tmos-converter)

**Cons:**
- Two packages to maintain
- Potential version drift

### 10.3 Recommendation

**Option A (Include in f5-mcp-server)** is recommended because:

1. The primary value is the integrated workflow - extract live config, convert, modify, validate, deploy
2. Validation is most useful when paired with deployment (validate before `as3_deploy`)
3. Users expect a single "F5 MCP server" for all F5 operations
4. The dependency cost is minimal (tmos-converter is already TypeScript/Node)

However, we should structure the code so tmos-converter tools can be **optionally disabled** if users don't need them.

### 10.4 Proposed ACC Tools

#### `tmos_to_as3`

Convert TMOS configuration to AS3 declaration.

```typescript
{
  name: "tmos_to_as3",
  description: "Convert F5 TMOS configuration (bigip.conf format) to AS3 declaration",
  inputSchema: {
    type: "object",
    properties: {
      config: {
        type: "string",
        description: "TMOS configuration text. Can be full bigip.conf or relevant extract."
      },
      device: {
        type: "string",
        description: "Optional: Device alias to extract config from (uses tmsh list)"
      },
      partition: {
        type: "string",
        description: "Optional: Limit extraction to specific partition"
      },
      stripRouteDomains: {
        type: "boolean",
        default: false,
        description: "Remove route domain suffixes from IP addresses"
      },
      includeDefaults: {
        type: "boolean",
        default: false,
        description: "Include default/implicit values in output"
      }
    }
  }
}
```

**Returns:**

```typescript
{
  success: boolean;
  declaration: object;               // AS3 declaration
  tenants: string[];                 // Tenants in the declaration
  statistics: {
    virtual_servers_converted: number;
    pools_converted: number;
    monitors_converted: number;
    profiles_converted: number;
    irules_converted: number;
  };
  unsupported: {
    type: string;
    name: string;
    reason: string;
  }[];                               // Objects that couldn't be converted
  warnings: string[];                // Non-fatal conversion issues
}
```

#### `tmos_to_do`

Convert TMOS system configuration to DO declaration.

```typescript
{
  name: "tmos_to_do",
  description: "Convert F5 TMOS system configuration to Declarative Onboarding declaration",
  inputSchema: {
    type: "object",
    properties: {
      config: {
        type: "string",
        description: "TMOS configuration text (bigip_base.conf or system config)"
      },
      device: {
        type: "string",
        description: "Optional: Device alias to extract system config from"
      },
      includeNetwork: {
        type: "boolean",
        default: true,
        description: "Include network configuration (VLANs, Self IPs, Routes)"
      },
      includeProvisioning: {
        type: "boolean",
        default: true,
        description: "Include module provisioning"
      }
    }
  }
}
```

**Returns:**

```typescript
{
  success: boolean;
  declaration: object;               // DO declaration
  components: {
    system: boolean;                 // Hostname, DNS, NTP, etc.
    network: boolean;                // VLANs, Self IPs, Routes
    provisioning: boolean;           // Module provisioning
    users: boolean;                  // User accounts
  };
  unsupported: {
    type: string;
    name: string;
    reason: string;
  }[];
  warnings: string[];
}
```

#### `validate_as3_schema`

Validate AS3 declaration against the JSON schema.

```typescript
{
  name: "validate_as3_schema",
  description: "Validate an AS3 declaration against the AS3 JSON schema. Use before deployment or after AI modifications.",
  inputSchema: {
    type: "object",
    properties: {
      declaration: {
        type: "object",
        description: "AS3 declaration to validate"
      },
      mode: {
        type: "string",
        enum: ["strict", "lazy"],
        default: "strict",
        description: "strict: fail on first error; lazy: auto-remove invalid properties"
      },
      schemaVersion: {
        type: "string",
        description: "Optional: Validate against specific schema version"
      }
    },
    required: ["declaration"]
  }
}
```

**Returns:**

```typescript
{
  valid: boolean;
  schema_version: string;            // Schema version used for validation

  // If valid
  declaration?: object;              // Validated (possibly cleaned) declaration

  // If invalid (strict mode)
  errors?: {
    path: string;                    // JSON path to error (e.g., "/tenant/app/pool/members/0")
    message: string;                 // Human-readable error
    keyword: string;                 // JSON Schema keyword that failed
    schema_path: string;             // Path in schema
    suggestion?: string;             // AI-friendly fix suggestion
  }[];

  // If lazy mode
  cleaned_declaration?: object;      // Declaration with invalid properties removed
  removed_properties?: {
    path: string;
    property: string;
    reason: string;
  }[];
}
```

#### `validate_do_schema`

Validate DO declaration against the JSON schema.

```typescript
{
  name: "validate_do_schema",
  description: "Validate a Declarative Onboarding declaration against the DO JSON schema",
  inputSchema: {
    type: "object",
    properties: {
      declaration: {
        type: "object",
        description: "DO declaration to validate"
      }
    },
    required: ["declaration"]
  }
}
```

**Returns:**

```typescript
{
  valid: boolean;
  schema_version: string;
  errors?: {
    path: string;
    message: string;
    keyword: string;
    suggestion?: string;
  }[];
}
```

#### `get_as3_schema_info`

Get AS3 schema information and class documentation.

```typescript
{
  name: "get_as3_schema_info",
  description: "Get AS3 schema information, supported classes, and property documentation",
  inputSchema: {
    type: "object",
    properties: {
      class: {
        type: "string",
        description: "Optional: Specific AS3 class to get details for (e.g., 'Pool', 'Service_HTTP')"
      },
      property: {
        type: "string",
        description: "Optional: Specific property within a class"
      }
    }
  }
}
```

**Returns:**

```typescript
{
  schema_version: {
    latest: string;                  // e.g., "3.52.0"
    earliest_supported: string;      // e.g., "3.0.0"
  };

  // If no class specified, list available classes
  classes?: {
    name: string;
    description: string;
    category: string;                // "Application", "Network", "Security", etc.
  }[];

  // If class specified
  class_info?: {
    name: string;
    description: string;
    properties: {
      name: string;
      type: string;
      required: boolean;
      default?: any;
      description: string;
      enum_values?: string[];
    }[];
    examples?: object[];
  };
}
```

### 10.5 AI Workflows Enabled

#### Workflow 1: Legacy Config Migration

```
User: "Convert this BIG-IP to AS3"

1. AI uses `device_info` to understand current config
2. AI uses `bash_execute` or direct API to extract bigip.conf
3. AI calls `tmos_to_as3` with the config
4. AI reviews unsupported objects, asks user about handling
5. AI calls `validate_as3_schema` (strict mode)
6. If errors, AI fixes based on error messages
7. AI presents final declaration to user
8. User approves, AI calls `as3_deploy`
```

#### Workflow 2: Iterative Declaration Development

```
User: "Create an AS3 declaration for a new web app with SSL offload"

1. AI generates AS3 declaration based on requirements
2. AI calls `validate_as3_schema` (strict mode)
3. If errors:
   a. AI reads error messages
   b. AI uses `get_as3_schema_info` to understand correct structure
   c. AI fixes the declaration
   d. AI re-validates
   e. Repeat until valid
4. AI presents validated declaration to user
5. User requests modifications
6. AI modifies and re-validates
7. Final deployment via `as3_deploy`
```

#### Workflow 3: Configuration Audit & Modernization

```
User: "Audit this BIG-IP and suggest AS3 migration"

1. AI connects to device
2. AI extracts full configuration
3. AI calls `tmos_to_as3` to identify what can be converted
4. AI analyzes unsupported objects
5. AI generates report:
   - Objects that convert cleanly
   - Objects needing manual attention
   - Recommended migration phases
   - Risk assessment
```

#### Workflow 4: Declaration Modification with Validation

```
User: "Add a new pool member to the production tenant"

1. AI calls `as3_get` to retrieve current declaration
2. AI modifies the declaration (adds pool member)
3. AI calls `validate_as3_schema` (strict mode)
4. If valid, AI calls `as3_deploy`
5. AI verifies deployment with `stats_get`
```

### 10.6 Error Recovery Patterns

The AI should use schema validation as part of a feedback loop:

```typescript
// Pseudo-code for AI behavior
async function modifyAndDeploy(declaration, modification) {
  // Apply modification
  const modified = applyModification(declaration, modification);

  // Validate
  const validation = await validate_as3_schema({ declaration: modified, mode: 'strict' });

  if (!validation.valid) {
    // Use errors to understand what's wrong
    for (const error of validation.errors) {
      // Check schema info for correct values
      const schemaInfo = await get_as3_schema_info({
        class: extractClass(error.path)
      });

      // Apply fix based on schema info
      // ... AI reasoning ...
    }

    // Re-validate after fixes
    return modifyAndDeploy(fixedDeclaration, null);
  }

  // Deploy validated declaration
  return as3_deploy({ declaration: modified });
}
```

### 10.7 Resource: AS3 Schema Reference

Expose schema information as an MCP resource for AI context:

```typescript
{
  uri: "f5://schemas/as3",
  name: "AS3 Schema Reference",
  description: "AS3 JSON Schema documentation for declaration authoring",
  mimeType: "application/json"
}

{
  uri: "f5://schemas/as3/{class}",
  name: "AS3 Class Schema",
  description: "Schema details for a specific AS3 class",
  mimeType: "application/json"
}

{
  uri: "f5://schemas/do",
  name: "DO Schema Reference",
  description: "DO JSON Schema documentation",
  mimeType: "application/json"
}
```

---

## 11. Open Questions

1. **Authentication storage**: Should the MCP server persist credentials between sessions, or require re-authentication? Security vs. convenience tradeoff.

2. **Playbook distribution**: How should customers share/distribute playbooks? Git repos? Built-in library? Both?

3. **Multi-tenancy**: Should the server support managing devices across different customers/environments simultaneously?

4. **Approval gate integration**: Should approval gates integrate with external systems (Slack, ServiceNow, PagerDuty) or only work through the AI chat interface?

5. **Playbook versioning**: How do we handle playbook updates during long-running executions?

6. **Secrets management**: How should sensitive values (passphrases, credentials) be passed to playbooks? Environment variables? External vault integration?

7. **Offline mode**: Should playbooks be able to run in a "disconnected" mode for air-gapped environments?

8. **Custom tools**: Should customers be able to define custom tools/steps that wrap bash commands or API calls?

9. **Testing framework**: How should customers test/validate their playbooks before running against production?

10. **Rate limiting**: Should the MCP server implement rate limiting to prevent overwhelming devices with requests?

11. **ACC/tmos-converter integration**: Should ACC tools be included in the main f5-mcp-server (recommended) or delivered as a separate package? See Section 10 for analysis.

---

*Document Version: 0.2.0*
*Last Updated: 2024-01-15*
*Status: Draft*
