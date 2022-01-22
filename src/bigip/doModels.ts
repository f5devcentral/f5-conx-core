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


/**
 * parent class DO declaration (typically for deploying through bigiq)
 * 
 * https://clouddocs.f5.com/products/big-iq/mgmt-api/v7.1.0/ApiReferences/bigiq_public_api_ref/r_do_onboarding.html#post-mgmt-shared-declarative-onboarding
 * 
 * base "device" https://raw.githubusercontent.com/F5Networks/f5-declarative-onboarding/master/src/schema/latest/base.schema.json
 * parent "DO" https://raw.githubusercontent.com/F5Networks/f5-declarative-onboarding/master/src/schema/latest.remote.schema.json
 */
 export type DoDecParent = {
    class: 'DO',
    $schema?: string,
    declaration: DoDecDevice
    targetUsername: string,
    targetHost: string,
    targetSshKey: {
        path: string,
    },
    bigIqSettings: {
        failImportOnConflict: boolean,
        conflictPolicy: DoBigIqConflictOptions,
        deviceConflictPolicy: DoBigIqConflictOptions,
        verionedConflictPolicy: DoBigIqConflictOptions,
        versionedConflictPolicy: string
    }
};


type DoBigIqConflictOptions = 'NONE' | 'USE_BIGIP' | 'USE_BIGIQ' | 'KEEP_VERSION';

/**
 * 
 * DO declaration body (typical NON-BIGIQ deployment)
 * 
 */
export type DoDecDevice = {
    schemaVersion: string;
    $schema?: string,
    class: 'Device';
    async?: boolean;
    [key: string]: {
        class: 'Tenant';
        myProvision: {
            ltm: string;
            class: 'Provision';
        };
        admin: {
            class: 'User';
            userType: string;
            password: string;
            partitionAccess: unknown
        };
        hostname: string;
    } | string | boolean | undefined;
};




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
 export const doExampleDec = {
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
    
    export const doExampleDecDevice = {
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