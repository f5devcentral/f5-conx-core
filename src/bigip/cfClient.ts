
/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import { AtcInfo } from "./bigipModels";
import { atcMetaData } from '../constants';
import { MgmtClient } from "./mgmtClient";
import { AxiosResponseWithTimings } from "../utils/httpModels";


export class CfClient {
    mgmtClient: MgmtClient;
    metaData: typeof atcMetaData.cf;
    version: AtcInfo;

    constructor(
        versions: AtcInfo,
        cfMetaData: typeof atcMetaData.cf,
        mgmtClient: MgmtClient
    ) {
        this.version = versions;
        this.metaData = cfMetaData;
        this.mgmtClient = mgmtClient;
    }


    async inspect(): Promise<AxiosResponseWithTimings> {
        return await this.mgmtClient.makeRequest(this.metaData.endPoints.inspect);
        // return 'cf-inspect';
    }

    async declare(): Promise<AxiosResponseWithTimings> {
        return await this.mgmtClient.makeRequest(this.metaData.endPoints.declare);
        // return 'cf-deplare';
    }

    async trigger(): Promise<AxiosResponseWithTimings> {
        return await this.mgmtClient.makeRequest(this.metaData.endPoints.trigger);
        // return 'cf-trigger';
    }

    async reset(): Promise<AxiosResponseWithTimings> {
        return await this.mgmtClient.makeRequest(this.metaData.endPoints.reset);
        // return 'cf-reset';
    }
}