/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import path from "path";
import fs from 'fs';

import { HttpResponse } from "../utils/httpModels";
import { MgmtClient } from "./mgmtClient";
import { ExtHttp } from '../externalHttps';
import { iControlEndpoints, F5UploadPaths } from '../constants'


/**
 * class for managing Automated Tool Chain services
 *  - install/unInstall
 *  - including download from web and upload to f5)
 *  - will cache files locally to minimize downloads)
 *  - installed services and available versions should be handled at the f5Client level (through discover function and metadata client)
 * 
 * @param mgmtClient connected device mgmt client
 * @param extHttp client for external connectivity
 * 
 */
export class AtcMgmtClient {
    public readonly mgmtClient: MgmtClient;
    public readonly extHttp: ExtHttp;
    isBigiq = false;

    constructor(
        mgmtClient: MgmtClient,
        extHttp: ExtHttp
    ) {
        this.mgmtClient = mgmtClient;
        this.extHttp = extHttp;
    }


    private morphBigiq() {
        // if bigiq, update functions to support the different work flow

        if(this.mgmtClient.hostInfo.product === 'BIG-IQ') {
            // not bigiq, so don't apply any updates
            // return;
            this.isBigiq = true;

            // after upload move rpm here
            // ls -l /usr/lib/dco/packages/f5-appsvcs/


            // remount for update
            // mount -o remount,rw /usr

            // copy package into directory
            // cp /shared/tmp/f5-appsvcs-3.24.0-5.noarch.rpm /usr/lib/dco/packages/f5-appsvcs/
            
            // mount back to ro
            // mount -o remount,ro /usr

            // update package cmd
            // rpm -Uv /usr/lib/dco/packages/f5-appsvcs/f5-appsvcs-3.24.0-5.noarch.rpm

            // restart services
            // tmsh restart /sys service restjavad restnoded
        }


    }

    /**
     * download file from external web location
     * - should be rpm files and rsa signatures
     * 
     * @param url ex.
     * `https://github.com/F5Networks/f5-appsvcs-templates/releases/download/v1.4.0/f5-appsvcs-templates-1.4.0-1.noarch.rpm`
     */
    async download(url: string): Promise<HttpResponse|{data: { file: string, bytes: number}}> {

        this.mgmtClient.events.emit('log-info', {
            msg: 'downloading rpm from web',
            url
        })
        
        // extract path from URL
        const urlPath = new URL(url).pathname
        
        const fileName = path.basename(urlPath);
        
        const localFilePath = path.join(this.extHttp.cacheDir, fileName)
        
        const existing = fs.existsSync(localFilePath)
        
        if(existing) {
            // file was found in cache
            const fileStat = fs.statSync(localFilePath);
            
            const resp = { data: {
                file: localFilePath,
                cache: true,
                bytes: fileStat.size
            }};

            this.mgmtClient.events.emit('log-info', {
                msg: 'found local cached rpm',
                file: resp.data
            })

            return resp;

        } else {
            // file not found in cache, download
            return await this.extHttp.download(url)
        }
        
    }


    /**
     * upload rpm to f5
     * FILE
     *  - uri: '/mgmt/shared/file-transfer/uploads'
     *  - path: '/var/config/rest/downloads'
     * @param rpm `full local path + file name`
     */
    async uploadRpm(rpm: string): Promise<HttpResponse> {

        this.mgmtClient.events.emit('log-info', `uploading atc rpm: ${rpm}`);

        return await this.mgmtClient.upload(rpm, 'FILE')

    }


    /**
     * install rpm on F5 (must be uploaded first)
     * @param rpmName 
     */
    async install(rpmName: string): Promise<HttpResponse> {

        this.mgmtClient.events.emit('log-info', `installing atc rpm: ${rpmName}`)

        return await this.mgmtClient.makeRequest(iControlEndpoints.atcPackageMgmt, {
            method: 'POST',
            data: {
                operation: 'INSTALL',
                packageFilePath: `${F5UploadPaths.file.path}/${rpmName}`
            }
        })
            .then(async resp => {
                // this will follow the rpm install process till it completes, but we need to follow this with another async to wait till the service endpoints become available, which typically requires a service restart of restjavad/restnoded
                const waitTillReady = await this.mgmtClient.followAsync(`${iControlEndpoints.atcPackageMgmt}/${resp.data.id}`)

                // await this.watchAtcRestart();

                this.mgmtClient.events.emit('log-info', `installing atc rpm job complete, waiting for services to restart (~30 seconds)`);

                await new Promise(resolve => { setTimeout(resolve, 30000); });

                // figure out what atc service we installed, via rpmName?
                // then poll that atc service endpoint (info) till it returns a version
                // pust that information into the async array for end user visibility
                // waitTillReady.async.push()

                return waitTillReady;
            })
    }


    /**
     * shows installed atc ilx rpms on f5
     */
    async showInstalled(): Promise<HttpResponse> {

        this.mgmtClient.events.emit('log-info', `gathering installed atc rpms`);

        return await this.mgmtClient.makeRequest(iControlEndpoints.atcPackageMgmt, {
            method: 'POST',
            data: {
                operation: 'QUERY'
            }
        })
            .then(async resp => {
                return await this.mgmtClient.followAsync(`${iControlEndpoints.atcPackageMgmt}/${resp.data.id}`)
            })
    }


    /**
     * uninstall atc/ilx/rpm package on f5
     * @param packageName 
     * ex. 'f5-appsvcs-templates-1.4.0-1.noarch'
     */
    async unInstall(packageName: string): Promise<HttpResponse> {

        // todo: build async follower to start after job completion and watch for services to be available again

        // https://clouddocs.f5.com/products/iapp/iapp-lx/tmos-13_1/icontrollx_rest_api_appendix/package_management_tasks.html

        // https://support.f5.com/csp/article/K51226856

        this.mgmtClient.events.emit('log-info', `un-installing atc rpm: ${packageName}`);

        return await this.mgmtClient.makeRequest(iControlEndpoints.atcPackageMgmt, {
            method: 'POST',
            data: {
                operation: 'UNINSTALL',
                packageName
            }
        })
            .then(async resp => {
                // for uninstall operations, this is just gonna have to work
                const awaitServiceRestart: HttpResponse = await this.mgmtClient.followAsync(`${iControlEndpoints.atcPackageMgmt}/${resp.data.id}`)

                // await this.watchAtcRestart();
                
                this.mgmtClient.events.emit('log-info', `un-installing atc rpm job complete, waiting for services to restart (~30 seconds)`);
  
                await new Promise(resolve => { setTimeout(resolve, 30000); });

                // check if atc services restarted and append thier responses when complete
                // awaitServiceRestart.async.push(await this.mgmtClient.followAsync('/mgmt/tm/sys/service/restnoded/stats'))
                // awaitServiceRestart.async.push(await this.mgmtClient.followAsync('/mgmt/tm/sys/service/restjavad/stats'))
                return awaitServiceRestart;
            })
    }


    /**
     * after the rpm install/unInstall job completes (which happens in seconds), the restnoded/restjavad services need to restart, which can take 20-30 seconds before the service is available for use
     * 
     * Having this function would allow that restart to be monitored so the UI can be refreshed and the service can start being used
     * 
     * to be called at the end of most of the functions above
     */
    async watchAtcRestart(): Promise<unknown> {

        const restnoded = await this.mgmtClient.followAsync('/mgmt/tm/sys/service/restnoded/stats')
        const restjavad = await this.mgmtClient.followAsync('/mgmt/tm/sys/service/restjavad/stats')

        // capture restart information and inject into calling function http response for visibility
        return { restnoded, restjavad };
    }

}