/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import { AtcInfo } from "./bigipModels";
import { atcMetaData } from '../constants'
import { MgmtClient } from "./mgmtClient";

export class TsClient {
    mgmtClient: MgmtClient;
    metaData: typeof atcMetaData.ts;
    version: AtcInfo;
    
    constructor (
        versions: AtcInfo,
        tsMetaData: typeof atcMetaData.ts,
        mgmtClient: MgmtClient
    ) {
        this.version = versions;
        this.metaData = tsMetaData;
        this.mgmtClient = mgmtClient;
    }

    // async get (): Promise<string> {
    //     return 'ts-get';
    // }

    // async post (): Promise<string> {
    //     return 'ts-post';
    // }

    // async inpsect (): Promise<string> {
    //     return 'ts-inpsect';
    // }

    // async remove () {

    //     // if bigiq, target/tenant are needed
    // }
}