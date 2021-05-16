
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
 * as3 declaration type model
 */
export type As3Dec =  {
    $schema?: string;
    class: 'AS3';
    action?: string;
    persist?: boolean;
    declaration: {
        class: 'ADC';
        schemaVersion: string;
        id?: string;
        label?: string;
        remark?: string;
        target?: unknown;
        [key: string]: unknown;
    };
}


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




export type F5InfoApi = {
    baseMac: string;
    hostMac: string;
    halUuid: string;
    chassisSerialNumber: string;
    slots: {
        volume: string;
        product: string;
        version: string;
        build: string;
        isActive: boolean;
    }[];
    license: {
        licenseEndDateTime: string;
        registrationKey: string;
        activeModules: string[];
        generation: number;
        lastUpdateMicros: number;
    };
    interfaces: string[];
    isIControlRestSupported: boolean;
    icrdPort: number;
    time: number;
    physicalMemory: number;
    platform: string;
    cpu: string;
    machineId: string;
    address: string;
    hostname: string;
    version: string;
    product: 'BIG-IP' | 'BIG-IQ';
    platformMarketingName: string;
    edition: string;
    build: string;
    restFrameworkVersion: string;
    managementAddress: string;
    mcpDeviceName: string;
    isClustered: boolean;
    isVirtual: boolean;
    hypervisorType: string;
    generation: number;
    lastUpdateMicros: number;
    kind: string;
    selfLink: string;
}