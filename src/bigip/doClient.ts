
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
import { AxiosResponseWithTimings } from "../utils/httpModels";


export class DoClient {
    mgmtClient: MgmtClient;
    metaData: typeof atcMetaData.do;
    version: AtcInfo;

    constructor(
        versions: AtcInfo,
        doMetaData: typeof atcMetaData.do,
        mgmtClient: MgmtClient
    ) {
        this.version = versions;
        this.metaData = doMetaData;
        this.mgmtClient = mgmtClient;
    }

    /**
     * get current DO declaration from f5 device
     * @returns 
     */
     async get(): Promise<AxiosResponseWithTimings> {
        
        return this.mgmtClient.makeRequest(this.metaData.endPoints.declare, {
            validateStatus: () => true
        });
        // return 'do-get';
    }

    /**
     * post do declaration to f5 device
     * @returns 
     */
    async post(data: unknown): Promise<AxiosResponseWithTimings> {

        return await this.mgmtClient.makeRequest(this.metaData.endPoints.declare, {
            method: 'POST',
            data
        })
            .then(async resp => {

                const asyncUrl = `${this.metaData.endPoints.declare}/task/${resp.data.id}`;
                return this.mgmtClient.followAsync(asyncUrl)
                .catch( () => {
                    return this.task(resp.data.id);
                });

            });
    }

    /**
     * inspect DO
     * @returns 
     */
    async inpsect(): Promise<AxiosResponseWithTimings> {
        return this.mgmtClient.makeRequest(this.metaData.endPoints.inspect, {
            validateStatus: () => true
        });
    }

    /**
     * get DO task
     * @returns 
     */
    async task(id?: string): Promise<AxiosResponseWithTimings> {

        /**
         * getting the direct task by ID from DO, only returns very high level information. not the expected details like other atc services, so we have to get all task details and filter what we need
         */

        return this.mgmtClient.makeRequest(`${this.metaData.endPoints.declare}/task`, {
            validateStatus: () => true
        })
        .then( resp => {
            if (id) {
                return resp.data = resp.data.filter( (el: { id: string; }) => el.id === id);
            } else {
                 return resp;
            }
        });
    }
}