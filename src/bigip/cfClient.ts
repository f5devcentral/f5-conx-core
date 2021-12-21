
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
import { cfDeclaration, cfTriggerDeclaration } from "./cfModels";


/**
 * f5 cloud failover client
 * https://github.com/F5Networks/f5-cloud-failover-extension
 * https://clouddocs.f5.com/products/extensions/f5-cloud-failover/latest/
 */
export class CfClient {
    version: AtcInfo;
    static metaData = atcMetaData.cf;
    mgmtClient: MgmtClient;

    constructor(
        versions: AtcInfo,
        mgmtClient: MgmtClient
    ) {
        this.version = versions;
        this.mgmtClient = mgmtClient;
    }

    /**
     * list associated cloud objects
     * @returns axios/http response
     */
    async inspect(): Promise<AxiosResponseWithTimings> {
        return await this.mgmtClient.makeRequest(CfClient.metaData.endPoints.inspect);
    }

    /**
     * get cfe configuration
     * @returns axios/http response
     */
    async getDeclare(): Promise<AxiosResponseWithTimings> {
        return await this.mgmtClient.makeRequest(CfClient.metaData.endPoints.declare);
    }

    /**
     * post/configure cfe
     * @returns axios/http response
     */
    async postDeclare(data: cfDeclaration): Promise<AxiosResponseWithTimings> {
        return await this.mgmtClient.makeRequest(CfClient.metaData.endPoints.declare, {
            method: 'POST',
            data
        });
    }

    /**
     * post last trigger event
     * @returns axios/http response
     */
    async getTrigger(): Promise<AxiosResponseWithTimings> {
        return await this.mgmtClient.makeRequest(CfClient.metaData.endPoints.trigger);
    }

    /**
     * post/execute a trigger
     * @returns axios/http response
     */
    async postTrigger(data: cfTriggerDeclaration): Promise<AxiosResponseWithTimings> {
        return await this.mgmtClient.makeRequest(CfClient.metaData.endPoints.trigger, {
            method: 'POST',
            data
        });
    }

    /**
     * post/reset cfe config
     * 
     * sends/posts
     * ```json
     * {
     *   "resetStateFile": true
     * }
     * ```
     * @returns axios/http response
     */
    async reset(): Promise<AxiosResponseWithTimings> {
        return await this.mgmtClient.makeRequest(CfClient.metaData.endPoints.reset, {
            method: 'POST',
            data: {
                resetStateFile: true
            }
        });
    }
}