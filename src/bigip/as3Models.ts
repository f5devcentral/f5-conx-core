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
 * target/tenant/app index type
 *  - now includes app pieces
 * 
 * ```ts
 * const exmp = {
 *     "target": {
 *      "tenant": {
 *        "app": {
 *          Pool: 1,
 *          Service_HTTP: 1,
 *          ...
 *        },
 *      },
 *    },
 *  }
 * ```
 * 
 */
 export interface As3AppMap {
    // parentType: 'targets' | 'tenants',
    [key: string]: {
        [key: string]: {
            [key: string]: unknown;
        }
    }
}



/**
 * target/tenant/app/app-pieces index type
 * 
 * ```ts
 * const example = {
 *   target: "10.200.244.5",
 *   tenants: [
 *     {
 *       tenant: "core1_sample_01",
 *       apps: [
 *         {
 *           app: "A1",
 *           parts: {
 *             Pool: 1,
 *             Service_HTTP: 1,
 *           },
 *         },
 *       ],
 *     },
 *   ],
 * },
 * ```
 * 
 */
export interface As3AppMapTargets extends As3AppMapTenants {
    target: string;
    tenants: As3AppMapTenants
}


/**
 * tenant/app/app-pieces index type
 * 
 * ```ts
 * const example = {
 *   tenant: "core1_sample_01",
 *   apps: [
 *     {
 *       app: "A1",
 *       parts: {
 *         Pool: 1,
 *         Service_HTTP: 1,
 *       },
 *     },
 *   ],
 * },
 * ```
 * 
 */
export interface As3AppMapTenants {
    tenant: string;
    apps: {
        app: string;
        components: Record<string, unknown>;
    }[];
}




export type As3App =  {
    class: 'Application',
    [key: string]: Record<string, unknown> | string,
}

export type As3Declaration = {
    class: 'AS3',
    $schema?: string,
    persist?: boolean;
    action?: string;
    declaration: AdcDeclaration
}

export interface As3Controls {
    class?: 'Controls';
    userAgent?: string;
    archiveId?: number;
    archiveTimestamp?: string;
    logLevel?: string;
    trace?: string;
    traceResponse?: string;
}


export type AdcDeclaration = {
    id?: string;
    class: 'ADC';
    target?: Target;
    updateMode?: string;
    controls?: As3Controls;
    schemaVersion: string;
    [key: string]: As3Tenant | As3Controls | Target | string | boolean | undefined
}


export interface As3Tenant {
    class: 'Tenant',
    [key: string]: As3App | string
}

export interface Target {
    address?: string,
    hostname?: string
}


/**
 * primary as3 example with TS type declaration
 */
const exampleAs3Declaration: As3Declaration = {
    "$schema": "https://raw.githubusercontent.com/F5Networks/f5-appsvcs-extension/master/schema/latest/as3-schema.json",
    class: "AS3",
    "action": "deploy",
    "persist": true,
    "declaration": {
        "updateMode": "selective",
        "class": "ADC",
        "schemaVersion": "3.0.0",
        "id": "urn:uuid:33045210-3ab8-4636-9b2a-c98d22ab915d",
        "label": "Sample 1",
        "remark": "Simple HTTP application with RR pool",
        "Sample_01": {
            "class": "Tenant",
            "A1": {
                "class": "Application",
                "template": "http",
                "serviceMain": {
                    "class": "Service_HTTP",
                    "virtualAddresses": [
                        "10.0.1.10"
                    ],
                    "pool": "web_pool"
                },
                "web_pool": {
                    "class": "Pool",
                    "monitors": [
                        "http"
                    ],
                    "members": [{
                        "servicePort": 80,
                        "serverAddresses": [
                            "192.0.1.10",
                            "192.0.1.11"
                        ]
                    }]
                }
            }
        }
    }
};


/**
 * primary as3 example with target parameter and TS type declaration
 */
const exampleAs3DeclarationWithTarget: As3Declaration = {
    "$schema": "https://raw.githubusercontent.com/F5Networks/f5-appsvcs-extension/master/schema/latest/as3-schema.json",
    class: "AS3",
    "action": "deploy",
    "persist": true,
    "declaration": {
        "updateMode": "selective",
        "class": "ADC",
        "target": {
            "address": "10.200.244.5"
        },
        "schemaVersion": "3.0.0",
        "id": "urn:uuid:33045210-3ab8-4636-9b2a-c98d22ab915d",
        "label": "Sample 1",
        "remark": "Simple HTTP application with RR pool",
        "Sample_01": {
            "class": "Tenant",
            "A1": {
                "class": "Application",
                "template": "http",
                "serviceMain": {
                    "class": "Service_HTTP",
                    "virtualAddresses": [
                        "10.0.1.10"
                    ],
                    "pool": "web_pool"
                },
                "web_pool": {
                    "class": "Pool",
                    "monitors": [
                        "http"
                    ],
                    "members": [{
                        "servicePort": 80,
                        "serverAddresses": [
                            "192.0.1.10",
                            "192.0.1.11"
                        ]
                    }]
                }
            }
        }
    }
};


/**
 * as3 /declare endpoint output for bigiq with multiple targets
 */
export const As3DeclareEndpoint: AdcDeclaration[] = [
    {
        id: "urn:uuid:33045210-3ab8-4636-9b2a-c98d22ab915d",
        class: "ADC",
        target: {
            address: "10.200.244.5",
        },
        updateMode: "selective",
        schemaVersion: "3.0.0",
        core1_sample_01: {
            A1: {
                class: "Application",
                template: "http",
                web_pool: {
                    class: "Pool",
                    members: [
                        {
                            servicePort: 80,
                            serverAddresses: [
                                "192.0.1.10",
                                "192.0.1.11",
                            ],
                        },
                    ],
                    monitors: [
                        "http",
                    ],
                },
                serviceMain: {
                    pool: "/core1_sample_01/A1/web_pool",
                    class: "Service_HTTP",
                    virtualAddresses: [
                        "10.0.1.10",
                    ],
                },
                schemaOverlay: "default",
            },
            class: "Tenant",
        },
        core1_sample_02: {
            A1: {
                class: "Application",
                template: "http",
                web_pool: {
                    class: "Pool",
                    members: [
                        {
                            servicePort: 80,
                            serverAddresses: [
                                "192.0.2.10",
                                "192.0.2.11",
                            ],
                        },
                    ],
                    monitors: [
                        "http",
                    ],
                },
                serviceMain: {
                    pool: "/core1_sample_02/A1/web_pool",
                    class: "Service_HTTP",
                    virtualAddresses: [
                        "10.0.2.10",
                    ],
                },
                schemaOverlay: "default",
            },
            class: "Tenant",
        },
    },
    {
        id: "urn:uuid:33045210-3ab8-4636-9b2a-c98d22ab915d",
        class: "ADC",
        target: {
            address: "10.200.244.6",
        },
        updateMode: "selective",
        schemaVersion: "3.0.0",
        core1_sample_02: {
            A1: {
                class: "Application",
                template: "http",
                web_pool: {
                    class: "Pool",
                    members: [
                        {
                            servicePort: 80,
                            serverAddresses: [
                                "192.0.2.10",
                                "192.0.2.11",
                            ],
                        },
                    ],
                    monitors: [
                        "http",
                    ],
                },
                serviceMain: {
                    pool: "/core1_sample_02/A1/web_pool",
                    class: "Service_HTTP",
                    virtualAddresses: [
                        "10.0.2.10",
                    ],
                },
                schemaOverlay: "default",
            },
            class: "Tenant",
        },
        core1_sample_01: {
            A1: {
                class: "Application",
                template: "http",
                web_pool: {
                    class: "Pool",
                    members: [
                        {
                            servicePort: 80,
                            serverAddresses: [
                                "192.0.1.10",
                                "192.0.1.11",
                            ],
                        },
                    ],
                    monitors: [
                        "http",
                    ],
                },
                serviceMain: {
                    pool: "/core1_sample_01/A1/web_pool",
                    class: "Service_HTTP",
                    virtualAddresses: [
                        "10.0.1.10",
                    ],
                },
                schemaOverlay: "default",
            },
            class: "Tenant",
        },
    },
    {
        id: "urn:uuid:33045210-3ab8-4636-9b2a-c98d22ab915d",
        class: "ADC",
        target: {
            address: "192.168.200.131",
        },
        updateMode: "selective",
        schemaVersion: "3.0.0",
        tparty_sample_01: {
            A1: {
                class: "Application",
                template: "http",
                web_pool: {
                    class: "Pool",
                    members: [
                        {
                            servicePort: 80,
                            serverAddresses: [
                                "19.0.1.20",
                                "19.0.1.21",
                            ],
                        },
                    ],
                    monitors: [
                        "http",
                    ],
                },
                serviceMain: {
                    pool: "/tparty_sample_01/A1/web_pool",
                    class: "Service_HTTP",
                    virtualAddresses: [
                        "19.0.1.10",
                    ],
                },
                schemaOverlay: "default",
            },
            class: "Tenant",
        },
        tparty_sample_02: {
            A1: {
                class: "Application",
                template: "http",
                web_pool: {
                    class: "Pool",
                    members: [
                        {
                            servicePort: 80,
                            serverAddresses: [
                                "19.0.2.20",
                                "19.0.2.21",
                            ],
                        },
                    ],
                    monitors: [
                        "http",
                    ],
                },
                serviceMain: {
                    pool: "/tparty_sample_02/A1/web_pool",
                    class: "Service_HTTP",
                    virtualAddresses: [
                        "19.0.2.10",
                    ],
                },
                schemaOverlay: "default",
            },
            class: "Tenant",
        },
    },
];


/**
 * as3 /declare endpoint output for bigip, no targets tenants only
 */
const as3DeclarationEndpointLTM: AdcDeclaration = {
    tparty_sample_02: {
        A1: {
            class: "Application",
            template: "http",
            web_pool: {
                class: "Pool",
                members: [
                    {
                        servicePort: 80,
                        serverAddresses: [
                            "19.0.2.20",
                            "19.0.2.21",
                        ],
                    },
                ],
                monitors: [
                    "http",
                ],
            },
            serviceMain: {
                pool: "/tparty_sample_02/A1/web_pool",
                class: "Service_HTTP",
                virtualAddresses: [
                    "19.0.2.10",
                ],
            },
        },
        class: "Tenant",
    },
    tparty_sample_01: {
        A1: {
            class: "Application",
            template: "http",
            web_pool: {
                class: "Pool",
                members: [
                    {
                        servicePort: 80,
                        serverAddresses: [
                            "19.0.1.20",
                            "19.0.1.21",
                        ],
                    },
                ],
                monitors: [
                    "http",
                ],
            },
            serviceMain: {
                pool: "/tparty_sample_01/A1/web_pool",
                class: "Service_HTTP",
                virtualAddresses: [
                    "19.0.1.10",
                ],
            },
        },
        class: "Tenant",
    },
    Sample_01: {
        class: "Tenant",
        A1: {
            class: "Application",
            template: "http",
            serviceMain: {
                class: "Service_HTTP",
                virtualAddresses: [
                    "10.0.1.10",
                ],
                pool: "web_pool",
            },
            web_pool: {
                class: "Pool",
                monitors: [
                    "http",
                ],
                members: [
                    {
                        servicePort: 80,
                        serverAddresses: [
                            "192.0.1.10",
                            "192.0.1.11",
                        ],
                    },
                ],
            },
        },
    },
    class: "ADC",
    schemaVersion: "3.23.0",
    id: "urn:uuid:47fdeacb-804d-43d4-8b8e-836cb4b7ae09",
    label: "Converted Declaration",
    remark: "Auto-generated by Project Charon",
    Common: {
        class: "Tenant",
        Shared: {
            class: "Application",
            template: "shared",
            app1_t80_vs: {
                layer4: "tcp",
                iRules: [
                    {
                        bigip: "/Common/_sys_https_redirect",
                    },
                ],
                translateServerAddress: true,
                translateServerPort: true,
                class: "Service_HTTP",
                profileHTTP: {
                    bigip: "/Common/http",
                },
                profileTCP: {
                    bigip: "/Common/tcp",
                },
                virtualAddresses: [
                    "192.168.1.21",
                ],
                virtualPort: 80,
                persistenceMethods: [
                ],
                snat: "none",
            },
            app1_t443_vs: {
                layer4: "tcp",
                pool: "app1_t80_pool",
                translateServerAddress: true,
                translateServerPort: true,
                class: "Service_HTTP",
                profileHTTP: {
                    bigip: "/Common/http",
                },
                profileTCP: {
                    bigip: "/Common/tcp",
                },
                virtualAddresses: [
                    "192.168.1.21",
                ],
                virtualPort: 443,
                persistenceMethods: [
                ],
                snat: "auto",
            },
            app1_t80_pool: {
                members: [
                    {
                        addressDiscovery: "static",
                        servicePort: 80,
                        serverAddresses: [
                            "192.168.1.22",
                            "192.168.1.23",
                        ],
                        shareNodes: true,
                    },
                ],
                monitors: [
                    {
                        bigip: "/Common/http",
                    },
                    {
                        bigip: "/Common/tcp",
                    },
                ],
                class: "Pool",
            },
        },
    },
    updateMode: "selective",
    controls: {
        archiveTimestamp: "2021-01-27T19:38:38.359Z",
    },
};

/**
 * full AS3 parent class as3 declaration
 */
 export const as3ExampleDec: As3Declaration = {
    "$schema": "https://raw.githubusercontent.com/F5Networks/f5-appsvcs-extension/master/schema/latest/as3-schema.json",
    "class": "AS3",
    "action": "deploy",
    "persist": true,
    "declaration": {
        "class": "ADC",
        "schemaVersion": "3.0.0",
        "id": "urn:uuid:33045210-3ab8-4636-9b2a-c98d22ab915d",
        "label": "Sample 1",
        "remark": "Simple HTTP application with RR pool",
        "Sample_01_tst12345": {
            "class": "Tenant",
            "A1": {
                "class": "Application",
                "template": "http",
                "serviceMain": {
                    "class": "Service_HTTP",
                    "virtualAddresses": [
                        "10.244.99.10"
                    ],
                    "pool": "web_pool"
                },
                "web_pool": {
                    "class": "Pool",
                    "monitors": [
                        "http"
                    ],
                    "members": [
                        {
                            "servicePort": 80,
                            "serverAddresses": [
                                "192.244.99.10",
                                "192.244.99.11"
                            ]
                        }
                    ]
                }
            }
        }
    }
}

/**
 * declaration only part of the as3
 * 
 * Does not include the parent as3 class
 */
export const AdcExampleDec: AdcDeclaration = {
    "class": "ADC",
    "schemaVersion": "3.0.0",
    "id": "urn:uuid:33045210-3ab8-4636-9b2a-c98d22ab915d",
    "label": "Sample 1",
    "remark": "Simple HTTP application with RR pool",
    "Sample_01": {
      "class": "Tenant",
      "A1": {
        "class": "Application",
        "template": "http",
        "serviceMain": {
          "class": "Service_HTTP",
          "virtualAddresses": [
            "10.40.1.10"
          ],
          "pool": "web_pool"
        },
        "web_pool": {
          "class": "Pool",
          "monitors": [
            "http"
          ],
          "members": [
            {
              "servicePort": 80,
              "serverAddresses": [
                "192.40.1.10",
                "192.40.1.11"
              ]
            }
          ]
        }
      }
    }
  }

/**
 * example as3 declare response with multiple tenants
 * used for parse decs function
 */
export const as3Tens = {
    tparty_sample_01: {
      class: "Tenant",
      A1: {
        class: "Application",
        template: "http",
        serviceMain: {
          class: "Service_HTTP",
          virtualAddresses: [
            "10.0.1.10",
          ],
          pool: "/tparty_sample_01/A1/web_pool",
        },
        web_pool: {
          class: "Pool",
          monitors: [
            "http",
          ],
          members: [
            {
              servicePort: 80,
              serverAddresses: [
                "192.0.1.10",
                "192.0.1.11",
              ],
            },
          ],
        },
      },
    },
    tparty_sample_02: {
      class: "Tenant",
      A1: {
        class: "Application",
        template: "http",
        serviceMain: {
          class: "Service_HTTP",
          virtualAddresses: [
            "10.0.2.10",
          ],
          pool: "/tparty_sample_02/A1/web_pool",
        },
        web_pool: {
          class: "Pool",
          monitors: [
            "http",
          ],
          members: [
            {
              servicePort: 80,
              serverAddresses: [
                "192.0.2.10",
                "192.0.2.11",
              ],
            },
          ],
        },
      },
    },
    class: "ADC",
    schemaVersion: "3.0.0",
    id: "1608385896410",
    updateMode: "selective",
    controls: {
      archiveTimestamp: "2020-12-19T13:51:37.821Z",
    },
  }

/**
 * example as3 declare response with targets
 */
export const as3TargetTens = [
    {
        "id": "urn:uuid:33045210-3ab8-4636-9b2a-c98d22ab915d",
        "class": "ADC",
        "label": "Sample 1",
        "remark": "Simple HTTP application with RR pool",
        "target": {
            "address": "10.200.244.5"
        },
        "updateMode": "selective",
        "schemaVersion": "3.0.0",
        "core1_sample_02": {
            "A1": {
                "class": "Application",
                "template": "http",
                "web_pool": {
                    "class": "Pool",
                    "members": [
                        {
                            "servicePort": 80,
                            "serverAddresses": [
                                "192.0.2.10",
                                "192.0.2.11"
                            ]
                        }
                    ],
                    "monitors": [
                        "http"
                    ]
                },
                "serviceMain": {
                    "pool": "/core1_sample_02/A1/web_pool",
                    "class": "Service_HTTP",
                    "virtualAddresses": [
                        "10.0.2.10"
                    ]
                },
                "schemaOverlay": "default"
            },
            "class": "Tenant"
        },
        "core1_sample_01": {
            "A1": {
                "class": "Application",
                "template": "http",
                "web_pool": {
                    "class": "Pool",
                    "members": [
                        {
                            "servicePort": 80,
                            "serverAddresses": [
                                "192.0.1.10",
                                "192.0.1.11"
                            ]
                        }
                    ],
                    "monitors": [
                        "http"
                    ]
                },
                "serviceMain": {
                    "pool": "/core1_sample_01/A1/web_pool",
                    "class": "Service_HTTP",
                    "virtualAddresses": [
                        "10.0.1.10"
                    ]
                },
                "schemaOverlay": "default"
            },
            "class": "Tenant"
        }
    },
    {
        "id": "urn:uuid:33045210-3ab8-4636-9b2a-c98d22ab915d",
        "class": "ADC",
        "label": "Sample 1",
        "remark": "Simple HTTP application with RR pool",
        "target": {
            "address": "10.200.244.6"
        },
        "updateMode": "selective",
        "schemaVersion": "3.0.0",
        "core1_sample_01": {
            "A1": {
                "class": "Application",
                "template": "http",
                "web_pool": {
                    "class": "Pool",
                    "members": [
                        {
                            "servicePort": 80,
                            "serverAddresses": [
                                "192.0.1.10",
                                "192.0.1.11"
                            ]
                        }
                    ],
                    "monitors": [
                        "http"
                    ]
                },
                "serviceMain": {
                    "pool": "/core1_sample_01/A1/web_pool",
                    "class": "Service_HTTP",
                    "virtualAddresses": [
                        "10.0.1.10"
                    ]
                },
                "schemaOverlay": "default"
            },
            "class": "Tenant"
        },
        "core1_sample_02": {
            "A1": {
                "class": "Application",
                "template": "http",
                "web_pool": {
                    "class": "Pool",
                    "members": [
                        {
                            "servicePort": 80,
                            "serverAddresses": [
                                "192.0.2.10",
                                "192.0.2.11"
                            ]
                        }
                    ],
                    "monitors": [
                        "http"
                    ]
                },
                "serviceMain": {
                    "pool": "/core1_sample_02/A1/web_pool",
                    "class": "Service_HTTP",
                    "virtualAddresses": [
                        "10.0.2.10"
                    ]
                },
                "schemaOverlay": "default"
            },
            "class": "Tenant"
        }
    },
    {
        "id": "urn:uuid:33045210-3ab8-4636-9b2a-c98d22ab915d",
        "class": "ADC",
        "label": "Sample 1",
        "remark": "Simple HTTP application with RR pool",
        "target": {
            "address": "192.168.200.131"
        },
        "updateMode": "selective",
        "schemaVersion": "3.0.0",
        "tparty_sample_01": {
            "A1": {
                "class": "Application",
                "template": "http",
                "web_pool": {
                    "class": "Pool",
                    "members": [
                        {
                            "servicePort": 80,
                            "serverAddresses": [
                                "192.0.1.10",
                                "192.0.1.11"
                            ]
                        }
                    ],
                    "monitors": [
                        "http"
                    ]
                },
                "serviceMain": {
                    "pool": "/tparty_sample_01/A1/web_pool",
                    "class": "Service_HTTP",
                    "virtualAddresses": [
                        "10.0.1.10"
                    ]
                },
                "schemaOverlay": "default"
            },
            "class": "Tenant"
        },
        "tparty_sample_02": {
            "A1": {
                "class": "Application",
                "template": "http",
                "web_pool": {
                    "class": "Pool",
                    "members": [
                        {
                            "servicePort": 80,
                            "serverAddresses": [
                                "192.0.2.10",
                                "192.0.2.11"
                            ]
                        }
                    ],
                    "monitors": [
                        "http"
                    ]
                },
                "serviceMain": {
                    "pool": "/tparty_sample_02/A1/web_pool",
                    "class": "Service_HTTP",
                    "virtualAddresses": [
                        "10.0.2.10"
                    ]
                },
                "schemaOverlay": "default"
            },
            "class": "Tenant"
        }
    }
]

export const as3Tasks = {
    "items": [
        {
            "id": "d5f68fdd-3a9c-4a79-9395-67c155100599",
            "results": [
                {
                    "code": 200,
                    "message": "success",
                    "lineCount": 25,
                    "host": "localhost",
                    "tenant": "Sample_01",
                    "runTime": 758
                }
            ],
            "declaration": {
                "class": "ADC",
                "schemaVersion": "3.0.0",
                "id": "urn:uuid:33045210-3ab8-4636-9b2a-c98d22ab915d",
                "label": "Sample 1",
                "remark": "Simple HTTP application with RR pool",
                "Sample_01": {
                    "class": "Tenant",
                    "A1": {
                        "class": "Application",
                        "template": "http",
                        "serviceMain": {
                            "class": "Service_HTTP",
                            "virtualAddresses": [
                                "10.2.1.10"
                            ],
                            "pool": "web_pool"
                        },
                        "web_pool": {
                            "class": "Pool",
                            "monitors": [
                                "http"
                            ],
                            "members": [
                                {
                                    "servicePort": 80,
                                    "serverAddresses": [
                                        "192.2.1.10",
                                        "192.2.1.11"
                                    ]
                                }
                            ]
                        }
                    }
                },
                "updateMode": "selective",
                "controls": {
                    "archiveTimestamp": "2020-12-18T13:29:31.769Z"
                }
            }
        },
        {
            "id": "35087175-4c8a-4153-a043-2e7133109487",
            "results": [
                {
                    "code": 422,
                    "errors": [
                        "/Sample_01/A1/web_pool/members: pool member /Sample_01/A1/web_pool/members/0 static address 192.0.1.10 conflicts with bigip node /tparty_sample_01/192.0.1.10"
                    ],
                    "declarationFullId": "",
                    "message": "declaration is invalid"
                }
            ],
            "declaration": {}
        }
    ]
}