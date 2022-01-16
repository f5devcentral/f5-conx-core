


/**
 * f5 host info api @ '/mgmt/shared/identified-devices/config/device-info'
 */
export const deviceInfo = {
    "baseMac": "00:50:00:ff:F4:CB",
    "hostMac": "00:50:00:ff:F4:CB",
    "halUuid": "42167068-xxxx-xxxx-42a5-1e7aac1ada72",
    "chassisSerialNumber": "42167068-xxxx-xxxx-1e7aac1ada72",
    "slots": [
        {
            "volume": "HD1.1",
            "product": "BIG-IP",
            "version": "15.1.0.4",
            "build": "0.0.6",
            "isActive": true
        }
    ],
    "license": {
        "licenseEndDateTime": "2020-11-02T00:00:00-06:00",
        "registrationKey": "FCJVQ-XXXXX-XXXXX-ZUOJJ-NWGPCKG",
        "activeModules": [
            "APM, Base, VE GBB (500 CCU, 2500 Access Sessions)|MEYUYAE-XXXXXXX|Anti-Virus Checks|Base Endpoint Security Checks|Firewall Checks|Network Access|Secure Virtual Keyboard|APM, Web Application|Machine Certificate Checks|Protected Workspace|Remote Desktop|App Tunnel",
            "Best Bundle, VE-5G|COTNXDC-XXXXXXX|Rate Shaping|DNSSEC|GTM Licensed Objects, Unlimited|DNS Licensed Objects, Unlimited|DNS Rate Fallback, 250K|GTM Rate Fallback, 250K|GTM Rate, 250K|DNS Rate Limit, 250K QPS|Routing Bundle, VE|ASM, VE|DNS-GTM, Base, 5Gbps|SSL, VE|Max Compression, VE|AFM, VE|Exclusive Version, v12.1.X - 18.X|VE, Carrier Grade NAT (AFM ONLY)|PSM, VE"
        ],
        "generation": 0,
        "lastUpdateMicros": 1605097948915575
    },
    "interfaces": [
        "1.0",
        "mgmt"
    ],
    "isIControlRestSupported": true,
    "icrdPort": 8100,
    "time": 1605633570403,
    "physicalMemory": 16384,
    "platform": "Z100",
    "cpu": "Intel(R) Xeon(R) CPU E5-2665 0 @ 2.40GHz",
    "machineId": "d4f9b652-73cf-xxxx-xxxx-c5754383db6b",
    "address": "10.21.244.203",
    "hostname": "testHost1.lab.net",
    "version": "15.1.0.4",
    "product": "BIG-IP",
    "platformMarketingName": "BIG-IP Virtual Edition",
    "edition": "Point Release 4",
    "build": "0.0.6",
    "restFrameworkVersion": "15.1.0.4-0.0.6",
    "managementAddress": "10.21.244.110",
    "mcpDeviceName": "/Common/testHost1.lab.net",
    "isClustered": false,
    "isVirtual": true,
    "hypervisorType": "0",
    "generation": 0,
    "lastUpdateMicros": 0,
    "kind": "shared:resolver:device-groups:deviceinfostate",
    "selfLink": "https://localhost/mgmt/shared/identified-devices/config/device-info"
}



/**
 * f5 host info api @ '/mgmt/shared/identified-devices/config/device-info'
 */
export const deviceInfoIPv6 = {
    "baseMac": "00:50:00:ff:F4:CB",
    "hostMac": "00:50:00:ff:F4:CB",
    "halUuid": "42167068-xxxx-xxxx-42a5-1e7aac1ada72",
    "chassisSerialNumber": "42167068-xxxx-xxxx-1e7aac1ada72",
    "slots": [
        {
            "volume": "HD1.1",
            "product": "BIG-IP",
            "version": "15.1.0.4",
            "build": "0.0.6",
            "isActive": true
        }
    ],
    "license": {
        "licenseEndDateTime": "2020-11-02T00:00:00-06:00",
        "registrationKey": "FCJVQ-XXXXX-XXXXX-ZUOJJ-NWGPCKG",
        "activeModules": [
            "APM, Base, VE GBB (500 CCU, 2500 Access Sessions)|MEYUYAE-XXXXXXX|Anti-Virus Checks|Base Endpoint Security Checks|Firewall Checks|Network Access|Secure Virtual Keyboard|APM, Web Application|Machine Certificate Checks|Protected Workspace|Remote Desktop|App Tunnel",
            "Best Bundle, VE-5G|COTNXDC-XXXXXXX|Rate Shaping|DNSSEC|GTM Licensed Objects, Unlimited|DNS Licensed Objects, Unlimited|DNS Rate Fallback, 250K|GTM Rate Fallback, 250K|GTM Rate, 250K|DNS Rate Limit, 250K QPS|Routing Bundle, VE|ASM, VE|DNS-GTM, Base, 5Gbps|SSL, VE|Max Compression, VE|AFM, VE|Exclusive Version, v12.1.X - 18.X|VE, Carrier Grade NAT (AFM ONLY)|PSM, VE"
        ],
        "generation": 0,
        "lastUpdateMicros": 1605097948915575
    },
    "interfaces": [
        "1.0",
        "mgmt"
    ],
    "isIControlRestSupported": true,
    "icrdPort": 8100,
    "time": 1605633570403,
    "physicalMemory": 16384,
    "platform": "Z100",
    "cpu": "Intel(R) Xeon(R) CPU E5-2665 0 @ 2.40GHz",
    "machineId": "d4f9b652-73cf-xxxx-xxxx-c5754383db6b",
    "address": "[2607:f0d0:1002:51::5]",
    "hostname": "testHost1.lab.net",
    "version": "15.1.0.4",
    "product": "BIG-IP",
    "platformMarketingName": "BIG-IP Virtual Edition",
    "edition": "Point Release 4",
    "build": "0.0.6",
    "restFrameworkVersion": "15.1.0.4-0.0.6",
    "managementAddress": "[2607:f0d0:1002:51::5]",
    "mcpDeviceName": "/Common/testHost1.lab.net",
    "isClustered": false,
    "isVirtual": true,
    "hypervisorType": "0",
    "generation": 0,
    "lastUpdateMicros": 0,
    "kind": "shared:resolver:device-groups:deviceinfostate",
    "selfLink": "https://localhost/mgmt/shared/identified-devices/config/device-info"
}





/**
 * fast info api @ '/mgmt/shared/fast/info'
 */
export const fastInfoApiResponse = {
    "version": "1.4.0",
    "as3Info": {
        "version": "3.22.0",
        "release": "2",
        "schemaCurrent": "3.22.0",
        "schemaMinimum": "3.0.0"
    },
    "installedTemplates": [
        {
            "name": "bigip-fast-templates",
            "hash": "99bf347ba5556df2e8c7100a97ea4c24171e436ed9f5dc9dfb446387f29e0bfe",
            "supported": true,
            "templates": [
                {
                    "name": "bigip-fast-templates/dns",
                    "hash": "9bc94a7e31b55ef492e807040a0c50095c8dab1430a64abc11d5f845ae7c0925"
                },
                {
                    "name": "bigip-fast-templates/http",
                    "hash": "5f12993264f23266b8843748126b2cc78fb93adb5d1c3be53dd7326b56cd503a"
                },
                {
                    "name": "bigip-fast-templates/tcp",
                    "hash": "794954684a493595286bb49529cee8991403550e5f21cd61ef2c8f458a31ffe3"
                }
            ],
            "schemas": [
                {
                    "name": "bigip-fast-templates/f5",
                    "hash": "81543cec7f82e8e8b6aabe2ce8d1c401fde62479a66408b30f6cba4c257f0aab"
                }
            ],
            "enabled": true,
            "updateAvailable": false
        },
        {
            "name": "examples",
            "hash": "c2952188146772dc1adbcde6d7618b330cccd5d18c0c20952b2bd339b8889c87",
            "supported": true,
            "templates": [
                {
                    "name": "examples/simple_http",
                    "hash": "66decdd5532cfc6ab33d8072fd2e0ded8ff9d4c37c786f6e8f1a68253134958a"
                },
                {
                    "name": "examples/simple_https",
                    "hash": "4bf590871835bb09196a6b74e6ca3ba2563c61a179a0d0eeebad3ba719d9a45b"
                },
                {
                    "name": "examples/simple_tcp",
                    "hash": "9eb588d6c62176ce837d4f6d94f0af213ef7905bd2f8171c2dcf52db9929d3c1"
                },
                {
                    "name": "examples/simple_udp",
                    "hash": "6b44589c24c8383482ddb3e2866622611e51e92a524b3f41f2d2e68320f384e5"
                },
                {
                    "name": "examples/simple_udp_defaults",
                    "hash": "cece6f97b28d46339f29a4e9a03fae93429d6f1d88d0a3f46e66b26587de8075"
                },
                {
                    "name": "examples/simple_waf",
                    "hash": "757764b324fa68274d2669a54dc598a66656a0f43689493c9b15d5f2c576ccc3"
                }
            ],
            "schemas": [
                {
                    "name": "examples/types",
                    "hash": "0105f0af93b9c27e737cb8337d3af5f67d9379668d4bf84a1b091306fbf9055c"
                }
            ],
            "enabled": true,
            "updateAvailable": false
        }
    ]
};


/**
 * as3 info api @ '/mgmt/shared/appsvcs/info'
 */
export const as3InfoApiReponse = {
    "version": "3.22.0",
    "release": "2",
    "schemaCurrent": "3.22.0",
    "schemaMinimum": "3.0.0"
};




/**
 * do info api @ '/mgmt/shared/declarative-onboarding/info'
 */
export const doInfoApiReponse = [
    {
        "id": 0,
        "selfLink": "https://localhost/mgmt/shared/declarative-onboarding/info",
        "result": {
            "class": "Result",
            "code": 200,
            "status": "OK",
            "message": "",
            "errors": []
        },
        "version": "1.15.0",
        "release": "3",
        "schemaCurrent": "1.15.0",
        "schemaMinimum": "1.0.0"
    }
];

/**
 * ts info api @ '/mgmt/shared/telemetry/info'
 */
export const tsInfoApiReponse = {
    "nodeVersion": "v8.11.1",
    "version": "1.14.0",
    "release": "2",
    "schemaCurrent": "1.14.0",
    "schemaMinimum": "0.9.0"
};

/**
 * cf info api @ '/mgmt/shared/cloud-failover/declare'
 */
export const cfInfoApiReponse = {
    
}
