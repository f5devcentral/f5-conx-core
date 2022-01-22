


export const cfExampleDec: cfDeclaration = {
    "class": "Cloud_Failover",
    "environment": "azure",
    "schemaVersion": "0.9.1",
    "externalStorage": {
        "scopingTags": {
            "f5_cloud_failover_label": "mydeployment"
        }
    },
    "failoverAddresses": {
        "scopingTags": {
            "f5_cloud_failover_label": "mydeployment"
        }
    },
    "failoverRoutes": {
        "scopingTags": {
            "f5_cloud_failover_label": "mydeployment"
        },
        "scopingAddressRanges": [
            {
                "range": "192.0.2.0/24"
            }
        ],
        "defaultNextHopAddresses": {
            "discoveryType": "static",
            "items": [
                "192.0.2.10",
                "192.0.2.11"
            ]
        }
    },
    "controls": {
        "class": "Controls",
        "logLevel": "info"
    }
}


// https://transform.tools/json-schema-to-typescript

/**
 * Top level schema for enabling cloud failover for BIG-IP
 */
 export type cfDeclaration = CloudFailover1 & CloudFailover2
 export type CloudFailover1 = {
   [k: string]: unknown
 }
 /**
  * Cloud failover top level class
  */
 export type Class = "Cloud_Failover"
 /**
  * Version of ADC Declaration schema this declaration uses
  */
 export type SchemaVersion = string
 /**
  * URL of schema against which to validate. Used by validation in your local environment only (via Visual Studio Code, for example)
  */
 export type Schema = string
 /**
  * Cloud provider environment.
  */
 export type Environment = "aws" | "azure" | "gcp"
 /**
  * Addresses this deployment will manage.
  */
 export type FailoverAddresses = {
   [k: string]: unknown
 }
 /**
  * Route(s) this deployment will manage.
  */
 export type FailoverRoutes = {
   enabled?: Enabled
   defaultResourceLocations?: ResourceLocations
   [k: string]: unknown
 } & {
   [k: string]: unknown
 }
 export type Enabled = boolean
 export type ResourceLocations = {
   subscriptionId?: string
   [k: string]: unknown
 }[]
 /**
  * External storage this deployment will manage.
  */
 export type ExternalStorage =
   | {
       scopingTags: ScopingTags
       [k: string]: unknown
     }
   | {
       scopingName: ScopingName
       [k: string]: unknown
     }
 export type ScopingName = string
 /**
  * File location of a custom certificate bundle to use for cloud API calls.
  */
 export type TrustedCertBundle = string
 
 export interface CloudFailover2 {
   class: Class
   schemaVersion?: SchemaVersion
   $schema?: Schema
   environment: Environment
   failoverAddresses?: FailoverAddresses
   failoverRoutes?: FailoverRoutes
   retryFailover?: RetryFailover
   externalStorage?: ExternalStorage
   trustedCertBundle?: TrustedCertBundle
   controls?: Controls
 }
 /**
  * Feature to trigger failover periodically
  */
 export interface RetryFailover {
   enabled?: boolean
   interval?: number
   [k: string]: unknown
 }
 export interface ScopingTags {
   [k: string]: unknown
 }
 /**
  * Controls class used to set system controls, such as logging level.
  */
 export interface Controls {
   class?: string
   /**
    * Log Level of the system.
    */
   logLevel?: "error" | "warning" | "info" | "debug" | "verbose" | "silly"
   [k: string]: unknown
 }
 
// export interface cfDeclaraion {
//     class: 'Cloud_Failover';
//     environment: 'azure' | 'aws' | 'gcp';
//     schemaVersion?: string;
//     controls?: {
//         class: 'controls';
//         logLevel: 'error' | 'warning' | 'info' | 'debug' | 'verbose' | 'silly';
//     };
//     trustedCertBundle?: string;
//     externalStorage?: {
//         scopingTags?: {
//             [key: string]: string;
//         };
//         scoptingName?: {
//             [key: string]: string;
//         }
//     };
//     retryFailover?: {
//         enable: boolean;
//         interval: number;
//     };
//     failoverAddresses?: {
//         enabled: boolean;
//         scopingTags: {
//             f5_cloud_failover_label: string;
//         };
//     };
//     failoverRoutes?: {
//         enabled: boolean;
//         routeGroupDefinitions: []
//     };
// }

export type cfTriggerDeclaration = {
    action: 'dry-run' | 'execute'
}

export type cfResetDeclartion = {
    resetStateFile: boolean;
}



/**
 * example cfe GET /info response
 */
export const cfInfoResp = {
    "version": "1.9.0",
    "release": "1",
    "schemaCurrent": "1.9.0",
    "schemaMinimum": "0.9.1"
}


/**
 * example cfe GET /inspect response
 */
export const cfInspectResp = {
    "instance": "123",
    "addresses": [
        {
            "privateIpAddress": "1.1.1.1",
            "publicIpAddress": "40.40.40.40",
            "networkInterfaceId": "000AAA"
        }
    ],
    "routes": [
        {
            "routeTableId": "123",
            "routeTableName": "ABC",
            "networkId": "123"
        }
    ],
    "hostName": "failover1.local",
    "deviceStatus": "active",
    "trafficGroup": [
        {
            "name": "/Common/traffic-group-1"
        }
    ]
}

/**
 * example cf GET /declare response
 */
export const cfGetDeclareResp = {
    "message": "string",
    "declaration": {
        "class": "Cloud_Failover",
        "environment": "azure",
        "schemaVersion": "string",
        "externalStorage": {
            "scopingTags": {}
        },
        "failoverAddresses": {
            "scopingTags": {}
        },
        "failoverRoutes": {
            "enabled": "string",
            "routeGroupDefinitions": []
        },
        "controls": {
            "class": "string",
            "logLevel": "string"
        }
    }
}



/**
 * example cfe POST /decalre response
 */
export const cfPostDeclareResp = {
    "message": "success",
    "declaration": cfExampleDec
}

/**
 * example cfe GET trigger response
 */
export const cfGetTriggerResp = {
    "taskState": "SUCCEEDED",
    "message": "Failover Completed Successfully",
    "timestamp": "2019-09-25T23:44:44.381Z",
    "instance": "failover0.local",
    "failoverOperations": {
        "routes": {},
        "addresses": {}
    },
    "code": 200
}

/**
 * exmple cfe POST trigger response (dry-run)
 */
export const cfPostTriggerDrResp = {
    "addresses": {},
    "routes": {}
}


/**
 * exmple cfe POST trigger response
 */
export const cfPostTriggerResp = {
    "taskState": "RUNNING",
    "timestamp": "string",
    "instance": "string",
    "failoverOperations": {
        "routes": {},
        "addresses": {}
    },
    "code": "string"
}


/**
 * example cfe POST /reset response
 */
export const cfPostResetResp = {
    "message": "string"
}