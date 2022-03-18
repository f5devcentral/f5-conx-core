/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Copyright 2021 F5 Networks, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

// nice easy way to convert json schema to TypeScript interfaces
//      https://transform.tools/json-schema-to-typescript


// /**
//  * parent class DO declaration (typically for deploying through bigiq)
//  * 
//  * https://clouddocs.f5.com/products/big-iq/mgmt-api/v7.1.0/ApiReferences/bigiq_public_api_ref/r_do_onboarding.html#post-mgmt-shared-declarative-onboarding
//  * 
//  * base "device" https://raw.githubusercontent.com/F5Networks/f5-declarative-onboarding/master/src/schema/latest/base.schema.json
//  * parent "DO" https://raw.githubusercontent.com/F5Networks/f5-declarative-onboarding/master/src/schema/latest.remote.schema.json
//  */
// export type DoDeclaration = {
//     class: 'DO',
//     $schema?: string,
//     declaration: DeviceDeclaration
//     targetUsername: string,
//     targetHost: string,
//     targetSshKey: {
//         path: string,
//     },
//     bigIqSettings: {
//         failImportOnConflict: boolean,
//         conflictPolicy: DoBigIqConflictOptions,
//         deviceConflictPolicy: DoBigIqConflictOptions,
//         versionedConflictPolicy: DoBigIqConflictOptions,
//     }
// };

/**
 * Wrapper for remote onboarding of a BIG-IP device using F5 Declarative Onboarding
 * parent class DO declaration (typically for deploying through bigiq)
 * 
 * https://clouddocs.f5.com/products/big-iq/mgmt-api/v7.1.0/ApiReferences/bigiq_public_api_ref/r_do_onboarding.html#post-mgmt-shared-declarative-onboarding
 * 
 * base "device" https://raw.githubusercontent.com/F5Networks/f5-declarative-onboarding/master/src/schema/latest/base.schema.json
 * parent "DO" https://raw.githubusercontent.com/F5Networks/f5-declarative-onboarding/master/src/schema/latest.remote.schema.json
 */
export type DoDeclaration = {
    /**
     * Indicates that this is a Declarative Onboarding request
     */
    class: "DO"
    /**
     * URL of schema against which to validate. Used by validation in your local environment only (via Visual Studio Code, for example)
     */
    $schema?: string
    /**
     * Hostname or IP address of ADC to which request applies (default localhost)
     */
    targetHost?: {
        [k: string]: unknown
    } | string
    /**
     * TCP port number of management service on targetHost; default 0 means try common ports
     */
    targetPort?: number
    /**
     * Username of principal authorized to modify configuration of targetHost (may not include the character ':').  NOTE:  this is generally not required to configure 'localhost' because client authentication and authorization precede invocation of DO.  It is also not required for any targetHost if you populate targetTokens
     */
    targetUsername?: {
        [k: string]: unknown
    } | string
    /**
     * Passphrase for targetUsername account.  This is generally not required to configure 'localhost' and is not required when you populate targetTokens
     */
    targetPassphrase?: {
        [k: string]: unknown
    } & string
    /**
     * Private key for use in ssh operations. Corresponding public key must be in the targetUsername's ~/.ssh/authorized_keys file on the targetHost. This is only used to do initial account creation in environments where that is necessary. If this value is present, DO will look in the declaration for a user matching targetUsername and set its password via ssh.
     */
    targetSshKey?: {
        /**
         * Full path to private ssh key. File must be owned by restnoded.
         */
        path: string
    }
    /**
     * One or more HTTP headers (each a property, like 'X-F5-Auth-Token': 'MF6APSRUYKTMSDBEOOEWLCNSO2') you want to send with queries to the targetHost management service as authentication/authorization tokens
     */
    targetTokens?:
    | ({
        [k: string]: unknown
    } & string)
    | {
        /**
         * This interface was referenced by `undefined`'s JSON-Schema definition
         * via the `patternProperty` "^[^\x00-\x20:\x7f-\xff]{1,254}$".
         */
        [k: string]: string
    }
    /**
     * Maximum delay allowed while communicating with targetHost device (seconds, default 900)
     */
    targetTimeout?: number
    /**
     * Settings for the management of a BIG-IP which is onboarded via a BIG-IQ.
     */
    bigIqSettings?: {
        [k: string]: unknown
    }
    /**
     * Declaration to deploy to targetHost
     */
    declaration: {
        [k: string]: unknown
    }
}



type DoBigIqConflictOptions = 'NONE' | 'USE_BIGIP' | 'USE_BIGIQ' | 'KEEP_VERSION';

// /**
//  * 
//  * DO declaration body (typical NON-BIGIQ deployment)
//  * 
//  */
// export type DeviceDeclaration = {
//     schemaVersion: string;
//     $schema?: string,
//     class: 'Device';
//     async?: boolean;
//     [key: string]: {
//         class: 'Tenant';
//         myProvision?: {
//             class: 'Provision';
//             ltm: string;
//         };
//         admin?: {
//             class: 'User';
//             userType?: string;
//             password?: string;
//             partitionAccess?: unknown
//             shell?: string;
//         };
//         mySystem?: {
//             class: 'System'
//         };
//         myLicense?: {
//             class: 'License'
//         }
//         hostname?: string;
//     } | string | boolean | undefined;
// };


/**
 * Top level schema for onboarding a BIG-IP.
 * DO declaration body (typical NON-BIGIQ deployment)
 */
export type DeviceDeclaration = {
    /**
     * Version of Declarative Onboarding schema this declaration uses.
     */
    schemaVersion:
    | "1.27.0"
    | "1.26.0"
    | "1.25.0"
    | "1.24.0"
    | "1.23.0"
    | "1.22.0"
    | "1.21.0"
    | "1.20.0"
    | "1.19.0"
    | "1.18.0"
    | "1.17.0"
    | "1.16.0"
    | "1.15.0"
    | "1.14.0"
    | "1.13.0"
    | "1.12.0"
    | "1.11.1"
    | "1.11.0"
    | "1.10.0"
    | "1.9.0"
    | "1.8.0"
    | "1.7.0"
    | "1.6.1"
    | "1.6.0"
    | "1.5.1"
    | "1.5.0"
    | "1.4.1"
    | "1.4.0"
    | "1.3.0"
    | "1.2.0"
    | "1.1.0"
    | "1.0.0"
    /**
     * Indicates this JSON document is a Device declaration
     */
    class: "Device"
    /**
     * URL of schema against which to validate. Used by validation in your local environment only (via Visual Studio Code, for example)
     */
    $schema?: string
    /**
     * Tells the API to return a 202 HTTP status before processing is complete. User must then poll for status.
     */
    async?: boolean
    /**
     * URL to post results to
     */
    webhook?: string
    /**
     * Optional friendly name for this declaration
     */
    label?: string
    /**
     * Credentials which can be referenced from other parts of the declaration or the remote wrapper.
     */
    Credentials?: {
        /**
         * Username of principal authorized to modify configuration of device (may not include the character ':').  NOTE:  this is generally not required to configure 'localhost' because client authentication and authorization precede invocation of DO.  It is also not required for any host if you populate tokens
         */
        username?: string
        /**
         * Password for username account.  This is generally not required to configure 'localhost' and is not required when you populate tokens
         */
        password?: string
        /**
         * One or more HTTP headers (each a property, like 'X-F5-Auth-Token': 'MF6APSRUYKTMSDBEOOEWLCNSO2') you want to send with queries to the device management service as authentication/authorization tokens
         */
        tokens?: {
            /**
             * This interface was referenced by `undefined`'s JSON-Schema definition
             * via the `patternProperty` "^[^\x00-\x20:\x7f-\xff]{1,254}$".
             */
            [k: string]: string
        }
    }[]
    /**
     * Special tenant Common holds objects other tenants can share
     */
    Common?: {
        class: "Tenant"
        /**
         * Hostname to set for the device. Note: If you set the hostname as part of the System class, you CANNOT set a hostname in the Common class (they are mutually exclusive).
         */
        hostname?: string
        [k: string]: {
            class?:
            | "Analytics"
            | "Authentication"
            | "ConfigSync"
            | "DagGlobals"
            | "DbVariables"
            | "DeviceCertificate"
            | "DeviceGroup"
            | "DeviceTrust"
            | "Disk"
            | "DNS"
            | "DNS_Resolver"
            | "FailoverUnicast"
            | "FailoverMulticast"
            | "HTTPD"
            | "License"
            | "MAC_Masquerade"
            | "ManagementIp"
            | "ManagementIpFirewall"
            | "ManagementRoute"
            | "MirrorIp"
            | "NTP"
            | "Provision"
            | "RemoteAuthRole"
            | "Route"
            | "RouteDomain"
            | "RouteMap"
            | "RoutingAccessList"
            | "RoutingAsPath"
            | "RoutingPrefixList"
            | "RoutingBGP"
            | "SelfIp"
            | "SnmpAgent"
            | "SnmpCommunity"
            | "SnmpTrapEvents"
            | "SnmpTrapDestination"
            | "SnmpUser"
            | "SSHD"
            | "SyslogRemoteServer"
            | "System"
            | "TrafficControl"
            | "Trunk"
            | "Tunnel"
            | "User"
            | "VLAN"
            | "TrafficGroup"
            | "GSLBGlobals"
            | "GSLBDataCenter"
            | "GSLBServer"
            | "GSLBMonitor"
            | "GSLBProberPool"
            | "FirewallPolicy"
            | "FirewallAddressList"
            | "FirewallPortList"
            [k: string]: unknown
        } | unknown
    }
    /**
     * Options to control configuration process
     */
    controls?: {
        class?: "Controls"
        /**
         * Boolean that indicates if this declaration will be run as a dry-run. If true, the declaration will NOT make any changes to the system, but will respond with whether or not it would.
         */
        dryRun?: boolean
        /**
         * If true, create a detailed trace of the configuration process for subsequent analysis (default false).  Warning:  trace files may contain sensitive configuration data.
         */
        trace?: boolean
        /**
         * If true, the response will contain the trace files.
         */
        traceResponse?: boolean
        /**
         * User Agent information to include in TEEM report.
         */
        userAgent?: string
        [k: string]: unknown
    }
    /**
     * Status of current request. This is set by the system.
     */
    result?: {
        class: "Result"
        /**
         * Status code.
         */
        code: "OK" | "ERROR"
        /**
         * Further detail about the status.
         */
        message?: string
        [k: string]: unknown
    }
}





// for use with bigiq
// https://clouddocs.f5.com/products/extensions/f5-declarative-onboarding/latest/do-on-bigiq.html
// https://clouddocs.f5.com/products/big-iq/mgmt-api/v7.1.0/ApiReferences/bigiq_public_api_ref/r_do_onboarding.html#post-mgmt-shared-declarative-onboarding
const doClassExample = {
    "class": "DO",
    "declaration": {
        "schemaVersion": "1.5.0",
        "class": "Device",
        "async": true,
        "Common": {
            "class": "Tenant",
            "myProvision": {
                "ltm": "nominal",
                "class": "Provision"
            },
            "admin": {
                "class": "User",
                "userType": "regular",
                "password": "privatepassword",
                "partitionAccess": {
                    "all-partitions": {
                        "role": "admin"
                    }
                }
            },
            "hostname": "aws.ve.do.demo"
        }
    },
    "targetUsername": "admin",
    "targetHost": "54.10.10.10",
    "targetSshKey": {
        "path": "/var/ssh/restnoded/private.pem"
    },
    "bigIqSettings": {
        "failImportOnConflict": false,
        "conflictPolicy": "USE_BIGIQ",
        "deviceConflictPolicy": "USE_BIGIP",
        "versionedConflictPolicy": "KEEP_VERSION"
    }
};




/**
 * parent DO declaration example, includes "device" declaration
 * 
 * https://clouddocs.f5.com/products/big-iq/mgmt-api/v7.1.0/ApiReferences/bigiq_public_api_ref/r_do_onboarding.html#post-mgmt-shared-declarative-onboarding
 */
export const doExampleDec: DoDeclaration = {
    "class": "DO",
    "declaration": {
        "schemaVersion": "1.5.0",
        "class": "Device",
        "async": true,
        "Common": {
            "class": "Tenant",
            "myProvision": {
                "ltm": "nominal",
                "class": "Provision"
            },
            "admin": {
                "class": "User",
                "userType": "regular",
                "password": "privatepassword",
                "partitionAccess": {
                    "all-partitions": {
                        "role": "admin"
                    }
                }
            },
            "hostname": "aws.ve.do.demo"
        }
    },
    "targetUsername": "admin",
    "targetHost": "54.10.10.10",
    "targetSshKey": {
        "path": "/var/ssh/restnoded/private.pem"
    },
    "bigIqSettings": {
        "failImportOnConflict": false,
        "conflictPolicy": "USE_BIGIQ",
        "deviceConflictPolicy": "USE_BIGIP",
        "versionedConflictPolicy": "KEEP_VERSION"
    }
}


/**
 * example DO declaration (non-BIG-IQ!)
 */
export const deviceExampleDec: DeviceDeclaration = {
    "$schema": "https://raw.githubusercontent.com/F5Networks/f5-declarative-onboarding/master/src/schema/latest/base.schema.json",
    "schemaVersion": "1.0.0",
    "class": "Device",
    "async": true,
    "webhook": "https://example.com/myHook",
    "label": "my BIG-IP declaration for declarative onboarding",
    "Common": {
        "class": "Tenant",
        "mySystem": {
            "class": "System",
            "hostname": "bigip.example.com",
            "cliInactivityTimeout": 1200,
            "consoleInactivityTimeout": 1200,
            "autoPhonehome": false
        },
        "myLicense": {
            "class": "License",
            "licenseType": "regKey",
            "regKey": "AAAAA-BBBBB-CCCCC-DDDDD-EEEEEEE"
        },
        "myDns": {
            "class": "DNS",
            "nameServers": [
                "8.8.8.8",
                "2001:4860:4860::8844"
            ],
            "search": [
                "f5.com"
            ]
        },
        "myNtp": {
            "class": "NTP",
            "servers": [
                "0.pool.ntp.org",
                "1.pool.ntp.org",
                "2.pool.ntp.org"
            ],
            "timezone": "UTC"
        },
        "root": {
            "class": "User",
            "userType": "root",
            "oldPassword": "default",
            "newPassword": "myNewPass1word"
        },
        "admin": {
            "class": "User",
            "userType": "regular",
            "password": "asdfjkl",
            "shell": "bash"
        },
        "guestUser": {
            "class": "User",
            "userType": "regular",
            "password": "guestNewPass1",
            "partitionAccess": {
                "Common": {
                    "role": "guest"
                }
            }
        },
        "anotherUser": {
            "class": "User",
            "userType": "regular",
            "password": "myPass1word",
            "shell": "none",
            "partitionAccess": {
                "all-partitions": {
                    "role": "guest"
                }
            }
        },
        "myProvisioning": {
            "class": "Provision",
            "ltm": "nominal",
            "gtm": "minimum"
        },
        "internal": {
            "class": "VLAN",
            "tag": 4093,
            "mtu": 1500,
            "interfaces": [
                {
                    "name": "1.2",
                    "tagged": true
                }
            ],
            "cmpHash": "dst-ip"
        },
        "internal-self": {
            "class": "SelfIp",
            "address": "10.10.0.100/24",
            "vlan": "internal",
            "allowService": "default",
            "trafficGroup": "traffic-group-local-only"
        },
        "external": {
            "class": "VLAN",
            "tag": 4094,
            "mtu": 1500,
            "interfaces": [
                {
                    "name": "1.1",
                    "tagged": true
                }
            ],
            "cmpHash": "src-ip"
        },
        "external-self": {
            "class": "SelfIp",
            "address": "10.20.0.100/24",
            "vlan": "external",
            "allowService": "none",
            "trafficGroup": "traffic-group-local-only"
        },
        "default": {
            "class": "Route",
            "gw": "10.10.0.1",
            "network": "default",
            "mtu": 1500
        },
        "managementRoute": {
            "class": "ManagementRoute",
            "gw": "1.2.3.4",
            "network": "default",
            "mtu": 1500
        },
        "myRouteDomain": {
            "class": "RouteDomain",
            "id": 100,
            "bandWidthControllerPolicy": "bwcPol",
            "connectionLimit": 5432991,
            "flowEvictionPolicy": "default-eviction-policy",
            "ipIntelligencePolicy": "ip-intelligence",
            "enforcedFirewallPolicy": "enforcedPolicy",
            "stagedFirewallPolicy": "stagedPolicy",
            "securityNatPolicy": "securityPolicy",
            "servicePolicy": "servicePolicy",
            "strict": false,
            "routingProtocols": [
                "RIP"
            ],
            "vlans": [
                "external"
            ]
        },
        "dbvars": {
            "class": "DbVariables",
            "ui.advisory.enabled": true,
            "ui.advisory.color": "green",
            "ui.advisory.text": "/Common/hostname"
        }
    }
} 