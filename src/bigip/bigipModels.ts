



/**
 * f5Client.discover() output
 * 
 * Provides details about the F5 connected to including installed ATC services
 */
export type DiscoverInfo = {
    hostname?: string;
    version?: string;
    product?: string;
    atc?: {
        as3?: string;
        do?: string;
        fast?: string;
        ts?: string;
        cf?: string;
    }
}


/**
 * F5 TMOS token framework 
 */
export type Token = {
    token: string;
    timeout: number;
    userName: string;
    authProviderName: string;
}

/**
 * body for getting token at '/mgmt/shared/authn/login'
 */
export type AuthTokenReqBody = {
    username: string,
    password: string,
    loginProviderName: string
}

/**
 * github releases response structure (condensed)
 */
export type AtcRelease = {
    version: string,
    id: number,
    assets: Asset[]

}

export type GitRelease = {
    tag_name: string,
    id: number,
    assets: Asset[]
};

export type Asset = {
    name: string,
    id: number,
    size: number,
    browser_download_url: string
};

export type AtcVersion = {
    releases?: AtcRelease[];
    latest?: string;
};

export type AtcVersions = {
    lastCheckDate?: Date | string;
    fast?: AtcVersion;
    as3?: AtcVersion;
    do?: AtcVersion;
    ts?: AtcVersion;
    cf?: AtcVersion;
}

/**
 * types of F5 file download locations
 * - UCS
 *   - uri: /mgmt/shared/file-transfer/ucs-downloads/${fileName}
 *   - path: /var/local/ucs/${fileName}
 * - QKVIEW
 *   - uri: /mgmt/cm/autodeploy/qkview-downloads/${fileName}
 *   - path: /var/tmp/${fileName}
 * - ISO
 *   - uri: /mgmt/cm/autodeploy/software-image-downloads/${fileName}
 *   - path: /shared/images/${fileName}
 */
export type F5DownLoad = 'UCS' | 'QKVIEW' | 'ISO'


/**
 * types of F5 uploads
 * - FILE
 *  - uri: '/mgmt/shared/file-transfer/uploads'
 *  - path: '/var/config/rest/downloads'
 * - ISO
 *  - uri: '/mgmt/cm/autodeploy/software-image-uploads'
 *  - path: '/shared/images'
 */
export type F5Upload = 'ISO' | 'FILE' | 'UCS'


/**
 * atc service info type model
 */
export type AtcInfo = {
    version: string,
    release: string,
    schemaCurrent: string,
    schemaMinimum: string
}

/**
 * ATC metadata model
 * this data has a local cache but also updated from here:
 * https://cdn.f5.com/product/cloudsolutions/f5-extension-metadata/latest/metadata.json
 */
export type AtcMetaDataSdk = {
    components: {
        fast: FastMetaData,  
        do: DoMetaData,
        as3: As3MetaData,
        ts: TsMetaData,
        cf: CfMetaData
    }
}



export type FastMetaData = {
    endpoints: {
        info: {
            uri: string,
            methods: string[]
        }
    },
    versions: {
        [key: string]: {
            downloadUrl: string,
            packageName: string,
            latest: boolean
        }
    },
    componentDependencies: unknown;
};

export type DoMetaData = {
    endpoints: {
        configure: {
            uri: string,
            methods: string[]
        },
        info: {
            uri: string,
            methods: string[]
        },
        inspect: {
            uri: string,
            methods: string[]
        }
    },
    versions: {
        [key: string]: {
            downloadUrl: string,
            packageName: string,
            latest: boolean
        }
    },
    componentDependencies: unknown;
};

export type As3MetaData = {
    endpoints: {
        configure: {
            uri: string,
            methods: string[]
        },
        info: {
            uri: string,
            methods: string[]
        }
    },
    versions: {
        [key: string]: {
            downloadUrl: string,
            packageName: string,
            latest: boolean
        }
    },
    componentDependencies: unknown;
};


export type TsMetaData = {
    endpoints: {
        configure: {
            uri: string,
            methods: string[]
        },
        info: {
            uri: string,
            methods: string[]
        }
    },
    versions: {
        [key: string]: {
            downloadUrl: string,
            packageName: string,
            latest: boolean
        }
    },
    componentDependencies: unknown;
};


export type CfMetaData = {
    endpoints: {
        configure: {
            uri: string,
            methods: string[]
        },
        info: {
            uri: string,
            methods: string[]
        }
        inspect: {
            uri: string,
            methods: string[]
        }
        trigger: {
            uri: string,
            methods: string[]
        }
        reset: {
            uri: string,
            methods: string[]
        }
    },
    versions: {
        [key: string]: {
            downloadUrl: string,
            packageName: string,
            latest: boolean
        }
    },
    componentDependencies: unknown;
};


export type F5TmosProduct = 'BIG-IP' | 'BIG-IQ' | 'NEXT' | 'NEXT-CM';

export type F5InfoApi = {
    product: F5TmosProduct;
    hostname?: string;
    machineId?: string;
    baseMac?: string;
    hostMac?: string;
    halUuid?: string;
    chassisSerialNumber?: string;
    slots?: {
        volume: string;
        product: string;
        version: string;
        build: string;
        isActive: boolean;
    }[];
    license?: {
        licenseEndDateTime: string;
        registrationKey: string;
        activeModules: string[];
        generation: number;
        lastUpdateMicros: number;
    };
    interfaces?: string[];
    isIControlRestSupported?: boolean;
    icrdPort?: number;
    time?: number;
    physicalMemory?: number;
    platform?: string;
    cpu?: string;
    address?: string;
    version?: string;
    platformMarketingName?: string;
    edition?: string;
    build?: string;
    restFrameworkVersion?: string;
    managementAddress?: string;
    mcpDeviceName?: string;
    isClustered?: boolean;
    isVirtual?: boolean;
    hypervisorType?: string;
    generation?: number;
    lastUpdateMicros?: number;
    kind?: string;
    selfLink?: string;
}




/**
 * example classic tmos auth token
 */
 export const exampleAuthToken = {
    "username": "admin",
    "loginReference": {
        "link": "https://localhost/mgmt/cm/system/authn/providers/local/login"
    },
    "loginProviderName": "local",
    "token": {
        "token": "DMLNFTAP22MN7C737JYB3MSGAS",
        "name": "DMLNFTAP22MN7C737JYB3MSGAS",
        "userName": "admin",
        "authProviderName": "local",
        "user": {
            "link": "https://localhost/mgmt/shared/authz/users/admin"
        },
        "groupReferences": [],
        "timeout": 1200,
        "startTime": "2020-11-07T11:56:23.498-0600",
        "address": "192.168.200.20",
        "partition": "[All]",
        "generation": 1,
        "lastUpdateMicros": 1604771783497184,
        "expirationMicros": 1604772983498000,
        "kind": "shared:authz:tokens:authtokenitemstate",
        "selfLink": "https://localhost/mgmt/shared/authz/tokens/DMLNFTAP22MN7C737JYB3MSGAS"
    },
    "generation": 0,
    "lastUpdateMicros": 0
}

/**
 * example classic tmos fail auth response
 */
export const exampleAuthRespFailed = {
    code: 401,
    message: "Authentication failed.",
    originalRequestBody: "{\"username\":\"admin\",\"loginProviderName\":\"local\",\"generation\":0,\"lastUpdateMicros\":0}",
    referer: "192.168.200.20",
    restOperationId: 36136900,
    kind: ":resterrorresponse",
}