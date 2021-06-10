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