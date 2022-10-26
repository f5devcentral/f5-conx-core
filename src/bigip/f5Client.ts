/* eslint-disable @typescript-eslint/no-unused-vars */

/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import { EventEmitter } from 'events';

import { AtcInfo, F5InfoApi, F5DownLoad, F5Upload, DiscoverInfo } from "./bigipModels";
import { HttpResponse, F5HttpRequest } from "../utils/httpModels";
// import { MetadataClient } from "./metadata";

import { MgmtClient } from "./mgmtClient";
import { NextMgmtClient } from "./nextClientBase";
import { UcsClient } from "./ucsClient";
import { QkviewClient } from "./qkviewClient";
import { FastClient } from "./fastClient";
import { As3Client } from "./as3Client";
import { DoClient } from "./doClient";
import { TsClient } from "./tsClient";
import { CfClient } from "./cfClient";
import { AtcMgmtClient } from "./atcMgmtClient";
import { ExtHttp } from '../externalHttps';
import { TMP_DIR, atcMetaData as atcMetaDataNew } from '../constants'
import path from 'path';
import { detectNextAsync } from './detectNextBigip';
import { NextOpenApi } from './nextModels';
import { NextCmMgmtClient } from './nextCmClientBase';


/**
 *  Main F5 connectivity client
 * 
 * Basic Example:
 * 
 * ```
 * const mgmtClient = new f5Client(
 *      host: '192.0.2.1',
 *      user: 'admin',
 *      password: 'admin', 
 *      {
 *          port: 8443,
 *          provider: 'tmos'
 *      }
 * );
 * await f5Client.discover();
 * const resp = await f5Client.makeRequest('/mgmt/tm/sys/version');
 * ```
*/
export class F5Client {
    /**
     * core f5 mgmt client for making all F5 device calls
     */
    mgmtClient: MgmtClient | NextMgmtClient | NextCmMgmtClient;
    /**
     * ATC meta data including:
     *  * service endpoint information /info/declare/tasks
     *  * github releases url
     *  * github main repo url
     */
    atcMetaData = atcMetaDataNew;
    /**
     * ### file cache directory
     * 
     * This can be set via environment var or set after instantiation
     * 
     * default is "/f5_cache"
     */
    cacheDir: string;
    /**
     * F5 Device host information api output from
     * 
     * '/mgmt/shared/identified-devices/config/device-info'
     * 
     * Used to understand details of connected device
     * 
     * Same as mgmtClient class
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    host: F5InfoApi | any | undefined;
    /**
     * atc mgmt class for managing f5 automated toolchain packages
     */
    atc: AtcMgmtClient | undefined;
    /**
     * f5 ucs client for managing create/delete/download operations of UCS files on f5 device
     */
    ucs: UcsClient | undefined;
    /**
     * f5 qkview client for managing create/delete/download operations of qkview files on f5 device
     */
    qkview: QkviewClient | undefined;
    /**
     * extenal http client used for making calls to everything but the connected device
     * 
     * This is used for fetching information from services like github
     */
    extHttp: ExtHttp;
    /**
     * connectivity client for interacting with the FAST service
     */
    fast: FastClient | undefined;
    /**
     * connectivity client for interacting with AS3
     */
    as3: As3Client | undefined;
    /**
     * connectivity client for interacting with DO (declarative onboarding)
     */
    do: DoClient | undefined;
    /**
     * connectivity client for interacting with TS (telemetry streaming)
     */
    ts: TsClient | undefined;
    /**
     * connectivity client for interacting with TS (telemetry streaming)
     */
    cf: CfClient | undefined;
    /**
     * event emitter instance
     */
    events: EventEmitter;
    openApi: NextOpenApi | undefined;

    constructor(
        host: string,
        user: string,
        password: string,
        hostOptions?: {
            port?: number,
            provider?: string,
        },
        eventEmmiter?: EventEmitter,
        extHttp?: ExtHttp,
        teemEnv?: string,
        teemAgent?: string
    ) {

        // setup cache dir
        this.cacheDir = process.env.F5_CONX_CORE_CACHE || path.join(process.cwd(), TMP_DIR);

        // setup eventer
        this.events = eventEmmiter ? eventEmmiter : new EventEmitter();

        // setup external http class (feed it the events instance)
        this.extHttp = extHttp ? extHttp : new ExtHttp({
            eventEmitter: this.events,
        });


        // detect cbip vs mbip

        // const v = detectNextAsync(host)
        //     .then(mbip => {
        //         this.mgmtClient = new NextMgmtClient(
        //             host,
        //             user,
        //             password,
        //             hostOptions,
        //             eventEmmiter = this.events,
        //             teemEnv,
        //             teemAgent
        //         )
        //     })
        //     .catch(cbip => {
        this.mgmtClient = new MgmtClient(
            host,
            user,
            password,
            hostOptions,
            eventEmmiter = this.events,
            teemEnv,
            teemAgent
        )

        // setup ucsClient
        this.ucs = new UcsClient(this.mgmtClient)

        // setup qkviewClient
        this.qkview = new QkviewClient(this.mgmtClient)

        // setup atc rpm ilx mgmt
        this.atc = new AtcMgmtClient(this.mgmtClient, this.extHttp)
        // })


        // return v;



    }



    /**
     * clear auth token
     *  - mainly for unit tests...
     */
    async clearLogin(): Promise<number> {
        return await this.mgmtClient.clearToken();
    }



    /**
     * Make HTTP request
     * 
     * @param uri     request URI
     * @param options function options
     * 
     * @returns request response
     */
    async https(uri: string, options?: F5HttpRequest): Promise<HttpResponse> {
        return await this.mgmtClient.makeRequest(uri, options)
    }


    /**
     * discover information about device
     *  - bigip/bigiq/nginx?
     *  - tmos/nginx version
     *  - installed atc services and versions
     *  
     */
    async discover(): Promise<DiscoverInfo> {

        // discover if mbip, overwrite with NextMgmtClient
        const type = await detectNextAsync(this.mgmtClient.host)
            .then(type => {

                if (type.product === 'NEXT') {

                    this.mgmtClient = new NextMgmtClient(
                        this.mgmtClient.host,
                        this.mgmtClient.user,
                        this.mgmtClient.password,
                        {
                            port: this.mgmtClient.port,
                            provider: this.mgmtClient.provider,
                        },
                        this.mgmtClient.events,
                        this.mgmtClient.teemEnv,
                        this.mgmtClient.teemAgent
                    )

                } else {

                    // this is NEXT-CM
                    this.mgmtClient = new NextCmMgmtClient(
                        this.mgmtClient.host,
                        this.mgmtClient.user,
                        this.mgmtClient.password,
                        {
                            port: this.mgmtClient.port,
                            provider: this.mgmtClient.provider,
                        },
                        this.mgmtClient.events,
                        this.mgmtClient.teemEnv,
                        this.mgmtClient.teemAgent
                    )
                }

                this.mgmtClient.hostInfo = {};
                this.mgmtClient.hostInfo.product = type.product
                return type;

            })




        const returnInfo: DiscoverInfo = {
            product: this.mgmtClient.hostInfo.product
        };

        if (this.mgmtClient instanceof MgmtClient) {
            // this is a classic bigip as defined by the class type
            // this means that we only discover things we KNOW are in classic AS OF 10/25/2022

            // get device info
            await this.mgmtClient.makeRequest('/mgmt/shared/identified-devices/config/device-info')
                .then(resp => {

                    // assign details to this and mgmtClient class
                    this.host = resp.data
                    this.mgmtClient.hostInfo = resp.data

                    returnInfo.hostname = this.host?.hostname;
                    returnInfo.version = this.host?.version;
                    returnInfo.product = this.host?.product;

                })


            // check DO installed by getting verion info
            await this.mgmtClient.makeRequest(this.atcMetaData.do.endPoints.info)
                .then(resp => {
                    this.do = new DoClient(resp.data[0] as AtcInfo, this.atcMetaData.do, this.mgmtClient as MgmtClient);
                    if (!returnInfo.atc) {
                        returnInfo.atc = {}
                    }
                    returnInfo.atc.do = this.do.version.version;
                })
                .catch(() => {
                    // do nothing... but catch the error from bubbling up and causing other issues
                    // this.logger.debug(err);
                })


            // check TS installed by getting verion info
            await this.mgmtClient.makeRequest(this.atcMetaData.ts.endPoints.info)
                .then(resp => {
                    this.ts = new TsClient(resp.data as AtcInfo, this.atcMetaData.ts, this.mgmtClient as MgmtClient);
                    if (!returnInfo.atc) {
                        returnInfo.atc = {}
                    }
                    returnInfo.atc.ts = this.ts.version.version;
                })
                .catch(() => {
                    // do nothing... but catch the error from bubbling up and causing other issues
                    // this.logger.debug(err);
                })


            // check CF installed by getting verion info
            await this.mgmtClient.makeRequest(this.atcMetaData.cf.endPoints.info)
                .then(resp => {
                    this.cf = new CfClient(resp.data as AtcInfo, this.mgmtClient as MgmtClient);
                    if (!returnInfo.atc) {
                        returnInfo.atc = {}
                    }
                    returnInfo.atc.cf = this.cf.version.version;
                })
                .catch(() => {
                    // do nothing... but catch the error from bubbling up and causing other issues
                    // this.logger.debug(err);
                })





        } else if (this.mgmtClient.hostInfo.product === 'NEXT') {
            // this is mbip, only discover things unique to mbip here...
            // todo; setup mbip details for F5InfoApi details on this.host -> these details will be used the higher logic to understand how to ineract with the type of bigip we are working with

            // get swagger file from connected instance
            //      This file is 1-2Mb, we sure we want to do this EVERYTIME?
            await this.mgmtClient.makeRequest('/api/v1/openapi')
                .then(resp => {
                    this.openApi = resp.data
                });


            this.host = {}  // build the base object name to put all the mbip details
            await this.mgmtClient.makeRequest('/api/v1/systems')
                .then(resp => this.host.systems = resp.data._embedded.systems);


            await this.mgmtClient.makeRequest('/api/v1/services')
                .then(resp => this.host.services = resp.data._embedded.services);


            await this.mgmtClient.makeRequest('/api/v1/files')
                .then(resp => this.host.files = resp.data._embedded.files);


            await this.mgmtClient.makeRequest('/api/v1/health')
                .then(resp => this.host.health = resp.data._embedded.health);



            // check FAST installed by getting verion info
            await this.mgmtClient.makeRequest(this.atcMetaData.fast.endPoints.info)
                .then(resp => {
                    this.fast = new FastClient(resp.data as AtcInfo, this.atcMetaData.fast, this.mgmtClient);
                    returnInfo.atc = {}
                    returnInfo.atc.fast = this.fast.version.version
                })
                .catch(err => {
                    // do nothing... but catch the error from bubbling up and causing other issues
                    // this.logger.debug(err);
                    debugger;
                })

            // check AS3 installed by getting verion info
            await this.mgmtClient.makeRequest(this.atcMetaData.as3.endPoints.info)
                .then(resp => {
                    // if http 2xx, create as3 client
                    // notice the recast of resp.data type of "unknown" to "AtcInfo"
                    this.as3 = new As3Client(resp.data as AtcInfo, this.atcMetaData.as3, this.mgmtClient);
                    if (!returnInfo.atc) {
                        returnInfo.atc = {}
                    }
                    returnInfo.atc.as3 = this.as3.version.version;
                })
                .catch(err => {
                    // do nothing... but catch the error from bubbling up and causing other issues
                    // this.logger.debug(err);
                    debugger;
                })

        } else {
            // this is all NEXT-CM setup

            /**
             * no as3 or fast info endpoints implemented to provide status/verioning details
             * so, at this point we will just assume as3/fast are working, like next, and hook them in...
             */
            const as3Info = {
                version: 'as3ncm_1_?',
                release: '0.0.1-dev',
                schemaCurrent: 'where_is_schema?',
                schemaMinimum: '>1'
            }
            this.as3 = new As3Client(as3Info as AtcInfo, this.atcMetaData.as3, this.mgmtClient);

            const fastInfo = {
                version: 'fastncm_1_?',
                release: '0.0.1-dev',
                schemaCurrent: 'where_is_schema?',
                schemaMinimum: '>1'
            }
            this.fast = new FastClient(fastInfo as AtcInfo, this.atcMetaData.fast, this.mgmtClient);

            returnInfo.atc = {
                as3: as3Info.version,
                fast: fastInfo.version
            }

        }





        // return object of discovered services
        return returnInfo;
    }


    /**
     * upload file to f5 -> used for ucs/ilx-rpms/.conf-merges
     * 
     * types of F5 uploads
     * - FILE
     *  - uri: '/mgmt/shared/file-transfer/uploads'
     *  - path: '/var/config/rest/downloads'
     * - ISO
     *  - uri: '/mgmt/cm/autodeploy/software-image-uploads'
     *  - path: '/shared/images'
     * 
     * @param localSourcePathFilename 
     * @param uploadType
     */
    async upload(localSourcePathFilename: string, uploadType: F5Upload): Promise<HttpResponse> {
        return this.mgmtClient.upload(localSourcePathFilename, uploadType)
    }


    /**
     * download file from f5 (ucs/qkview/iso)
     * - UCS
     *   - uri: /mgmt/shared/file-transfer/ucs-downloads/${fileName}
     *   - path: /var/local/ucs/${fileName}
     * - QKVIEW
     *   - uri: /mgmt/cm/autodeploy/qkview-downloads/${fileName}
     *   - path: /var/tmp/${fileName}
     * - ISO
     *   - uri: /mgmt/cm/autodeploy/software-image-downloads/${fileName}
     *   - path: /shared/images/${fileName}
     * 
     * @param fileName file name on bigip
     * @param localDestPathFile where to put the file (including file name)
     * @param downloadType: type F5DownLoad = "UCS" | "QKVIEW" | "ISO"
     */
    async download(fileName: string, localDestPath: string, downloadType: F5DownLoad): Promise<HttpResponse> {
        // todo: update response typeing to include http details
        return this.mgmtClient.download(fileName, localDestPath, downloadType)
    }

}