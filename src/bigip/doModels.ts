/* eslint-disable @typescript-eslint/no-unused-vars */





/**
 * parent class DO declaration (typically for deploying through bigiq)
 */
 export type DoDecParent = {
    class: 'DO',
    declaration: DoDecDevice
    targetUsername: string,
    targetHost: string,
    targetSshKey: {
        path: string,
    },
    bigIqSettings: {
        failImportOnConflict: boolean,
        conflictPolicy: string,
        deviceConflictPolicy: string,
        versionedConflictPolicy: string
    }
};

/**
 * 
 * DO declaration body (typical NON-BIGIQ deployment)
 * 
 */
export type DoDecDevice = {
    schemaVersion: string;
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