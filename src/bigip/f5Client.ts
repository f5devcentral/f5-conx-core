
/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import { EventEmitter } from 'events';

import { AtcInfo, F5InfoApi, F5DownLoad, F5Upload } from "./bigipModels";
import { HttpResponse, F5HttpRequest, AxiosResponseWithTimings } from "../utils/httpModels";
// import { MetadataClient } from "./metadata";

import { MgmtClient } from "./mgmtClient";
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
    mgmtClient: MgmtClient;
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
    host: F5InfoApi | undefined;
    /**
     * atc mgmt class for managing f5 automated toolchain packages
     */
    atc: AtcMgmtClient;
    /**
     * f5 ucs client for managing create/delete/download operations of UCS files on f5 device
     */
    ucs: UcsClient;
    /**
     * f5 qkview client for managing create/delete/download operations of qkview files on f5 device
     */
    qkview: QkviewClient;
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

    constructor(
        host: string,
        user: string,
        password: string,
        hostOptions?: {
            port?: number,
            provider?: string,
        },
        eventEmmiter?: EventEmitter,
        extHttp?: ExtHttp
    ) {
        this.mgmtClient = new MgmtClient(
            host,
            user,
            password,
            hostOptions,
            eventEmmiter
        )

        this.cacheDir = process.env.F5_CONX_CORE_CACHE || path.join(process.cwd(), TMP_DIR);

        this.events = eventEmmiter ? eventEmmiter : new EventEmitter();

        // setup external http class (feed it the events instance)
        this.extHttp = extHttp ? extHttp : new ExtHttp({
            eventEmitter: this.events,
        });

        // setup ucsClient
        this.ucs = new UcsClient(this.mgmtClient)

        // setup qkviewClient
        this.qkview = new QkviewClient(this.mgmtClient)

        // setup atc rpm ilx mgmt
        this.atc = new AtcMgmtClient(this.mgmtClient, this.extHttp)

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
    async https(uri: string, options?: F5HttpRequest): Promise<AxiosResponseWithTimings> {
        return await this.mgmtClient.makeRequest(uri, options)
    }


    /**
     * discover information about device
     *  - bigip/bigiq/nginx?
     *  - tmos/nginx version
     *  - installed atc services and versions
     *  
     */
    async discover(): Promise<void> {

        // // refresh atc meta data
        // this.refreshMetaData()
        // .then( resp => {
        //     this.events.emit('log-info', 'Refreshing atc metadata from cloud')
        //     this.atcMetaData = resp.data;
        // })
        // .catch( err => {
        //     this.events.emit('log-info', {
        //         msg: 'was NOT able to access internet to get latest atc metadata',
        //         err
        //     })
        // })

        // get device info
        await this.mgmtClient.makeRequest('/mgmt/shared/identified-devices/config/device-info')
            .then(resp => {

                // assign details to this and mgmtClient class
                this.host = resp.data
                this.mgmtClient.hostInfo = resp.data
            })


        // check FAST installed by getting verion info
        await this.mgmtClient.makeRequest(this.atcMetaData.fast.endPoints.info)
            .then(resp => {
                this.fast = new FastClient(resp.data as AtcInfo, this.atcMetaData.fast, this.mgmtClient);
            })
            .catch(() => {
                // do nothing... but catch the error from bubbling up and causing other issues
                // this.logger.debug(err);
            })

        // check AS3 installed by getting verion info
        await this.mgmtClient.makeRequest(this.atcMetaData.as3.endPoints.info)
            .then(resp => {
                // if http 2xx, create as3 client
                // notice the recast of resp.data type of "unknown" to "AtcInfo"
                this.as3 = new As3Client(resp.data as AtcInfo, this.atcMetaData.as3, this.mgmtClient);
            })
            .catch(() => {
                // do nothing... but catch the error from bubbling up and causing other issues
                // this.logger.debug(err);
            })


        // check DO installed by getting verion info
        await this.mgmtClient.makeRequest(this.atcMetaData.do.endPoints.info)
            .then(resp => {
                this.do = new DoClient(resp.data[0] as AtcInfo, this.atcMetaData.do, this.mgmtClient);
            })
            .catch(() => {
                // do nothing... but catch the error from bubbling up and causing other issues
                // this.logger.debug(err);
            })


        // check TS installed by getting verion info
        await this.mgmtClient.makeRequest(this.atcMetaData.ts.endPoints.info)
            .then(resp => {
                this.ts = new TsClient(resp.data as AtcInfo, this.atcMetaData.ts, this.mgmtClient);
            })
            .catch(() => {
                // do nothing... but catch the error from bubbling up and causing other issues
                // this.logger.debug(err);
            })


        // check CF installed by getting verion info
        await this.mgmtClient.makeRequest(this.atcMetaData.cf.endPoints.info)
            .then(resp => {
                this.cf = new CfClient(resp.data as AtcInfo, this.atcMetaData.cf, this.mgmtClient);
            })
            .catch(() => {
                // do nothing... but catch the error from bubbling up and causing other issues
                // this.logger.debug(err);
            })


        return;
        // return object of discovered services
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
    async upload(localSourcePathFilename: string, uploadType: F5Upload): Promise<AxiosResponseWithTimings> {
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









    // /**
    //  * refresh/get latest ATC metadata from cloud
    //  * 
    //  * https://cdn.f5.com/product/cloudsolutions/f5-extension-metadata/latest/metadata.json
    //  * todo: refresh this file with every packages release via git actions or package.json script
    //  */
    // async refreshMetaData(): Promise<AxiosResponseWithTimings> {
    //     return await this.extHttp.makeRequest({ url: atcMetaDataCloudUrl })
    // }
}