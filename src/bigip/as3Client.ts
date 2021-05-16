/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import { HttpResponse } from "../utils/httpModels";
import { isObject } from "../utils/misc";
import { As3Dec, AtcInfo } from "./bigipModels";
import { MgmtClient } from "./mgmtClient";
import { atcMetaData } from '../constants';


/**
 * AS3 client class that handles AS3 calls
 */
export class As3Client {
    public readonly mgmtClient: MgmtClient;
    // the followin endpoints should be tied back into the metadata so it can be dynamic with versions
    // public readonly taskEndpoint = `/mgmt/shared/appsvcs/task`
    // public readonly declareEndpoint = `/mgmt/shared/appsvcs/declare`

    metaData: typeof atcMetaData.as3;
    /**
     * AS3 service version information
     */
    public readonly version: AtcInfo;
    /**
     * declarations of targets (typically from bigiq)
     */
    public readonly targets: {
        label: string,
        declaration: unknown,
        target: string,
        id: string,
        schemaVersion: string,
        updateMode: string
    }[];
    /**
     * list of tenants/declarations
     */
    public readonly tenants: {
        class: string,
        schemaVersion: string,
        updateMode: string,
        [key: string]: unknown,
    }[]

    constructor(
        versions: AtcInfo,
        as3MetaData: typeof atcMetaData.as3,
        mgmtClient: MgmtClient
    ) {
        this.version = versions;
        this.metaData = as3MetaData;
        this.mgmtClient = mgmtClient;
    }

    /**
     * get as3 tasks
     * @param task ID to get
     * if no task, returns all
     */
    async getTasks(id?: string): Promise<HttpResponse> {

        const url =
            id ? `${atcMetaData.as3.endPoints.tasks}/${id}`
                : atcMetaData.as3.endPoints.tasks;

        return await this.mgmtClient.makeRequest(url)
    }

    /**
     * get AS3 declaration(s)
     * 
     * ** extended/full are pretty much the same **
     * 
     * @param options.expanded get extended/full declartion (includes default tmos settings)
     */
    async getDecs(options?: {
        expanded?: boolean,
        tenant?: string
    }): Promise<HttpResponse> {

        const params = []

        // if we have a tenant, start building the string
        let str = options?.tenant ? `/${options.tenant}` : '';

        if (options?.expanded) {
            params.push('show=expanded');
        }

        // build/append params to string
        str
            = params.length > 0
                ? `${str}?${params.join('&')}`
                : str;

        return await this.mgmtClient.makeRequest(`${atcMetaData.as3.endPoints.declare}${str}`)
    }


    /**
     * Post AS3 delcaration
     * ** async by default **
     * @param data delaration to post
     */
    async postDec(data: unknown): Promise<HttpResponse> {

        const uri = [atcMetaData.as3.endPoints.declare, '?async=true']
        return await this.mgmtClient.makeRequest(uri.join(''), {
            method: 'POST',
            data
        })
            .then(async resp => {

                const asyncUrl = `${atcMetaData.as3.endPoints.tasks}/${resp.data.id}`
                return await this.mgmtClient.followAsync(asyncUrl);
            })
    }



    /**
     * Remove AS3 tenant - works with both bigip and bigiq
     * 
     * ** target parameter is optional!!! **
     * 
     * ```json
     * {
     *      "class": "AS3",
     *      "declaration": {
     *          "class": "ADC",
     *          "schemaVersion": "3.0.0",
     *          "target": "192.168.200.13",
     *          "tenant1": {
     *              "class": "Tenant"
     *          }
     *      }
     * }
     * ```
     * 
     * @param tenant tenant to delete
     * @param dec empty declaration to remove from multi-target system
     */
    // async deleteTenant(x: string): Promise<HttpResponse>;
    // async deleteTenant(x: as3Dec): Promise<HttpResponse>;
    async deleteTenant(x: As3Dec | string): Promise<HttpResponse> {

        // if (typeof x === 'string' || x instanceof String) {
        if (typeof x === 'string') {

            x = {
                class: 'AS3',
                declaration: {
                    class: 'ADC',
                    schemaVersion: '3.0.0',
                    [x]: {
                        class: 'Tenant'
                    }
                }
            }

        }

        // while the "DELETE" http method is waaay easier, this method works for all situations, including bigiq multi-target/tenant
        return await this.mgmtClient.makeRequest(atcMetaData.as3.endPoints.declare, {
            method: 'POST',
            data: x
        })


    }


    /**
     * parse as3 declare responses into target/tenant/declaration lists.
     * This data can be used to repost declarations from multi-target/tenant responses.  
     * This was inspired by what is needed for the extension to list and repost decs in the view
     * - todo: provide better typing for this entire function 'any'=bad
     * @param x delcare endpoint response
     */
    async parseDecs(x: any): Promise<any[]> {

        const tarTens = []
        if (Array.isArray(x)) {

            // loop through targets/devices
            x.forEach((el: any) => {

                // start object that represents target
                const target = {
                    [el.target.address]: <any>{}
                }

                Object.entries(el).forEach(([key, val]) => {
                    if (isObject(val) && key !== 'target' && key !== 'controls') {

                        // append/overwrite object details for each tenant
                        target[el.target.address][key] = val
                        target[el.target.address].target = el.target
                        target[el.target.address].id = el.id
                        target[el.target.address].schemaVersion = el.schemaVersion
                        target[el.target.address].updateMode = el.updateMode

                    }
                });
                tarTens.push(target);
            });


        } else {

            /**
             * should be a single bigip tenants object
             * 	loop through, return object keys 
             */
            for (const [tenant, dec] of Object.entries(x)) {

                if (isObject(dec) && tenant !== 'controls' && tenant !== 'target') {
                    // rebuild each tenant as3 dec
                    tarTens.push({
                        [tenant]: {
                            class: 'AS3',
                            schemaVersion: x.schemaVersion,
                            updateMode: x.updateMode,
                            [tenant]: dec
                        }
                    });
                }
            }
        }
        return tarTens;
    }
}