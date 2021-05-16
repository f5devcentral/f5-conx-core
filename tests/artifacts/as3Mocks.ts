


export const as3ExampleDec = {
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