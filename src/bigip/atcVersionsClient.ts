/* eslint-disable @typescript-eslint/no-unused-vars */
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

import { Asset,  AtcVersions, GitRelease } from "./bigipModels";
import { ExtHttp } from '../externalHttps';
import { atcMetaData as _atcMetaData } from '../constants'
import { EventEmitter } from "events";
import * as _atcVersionsBaseCache from './atcVersions.json';


/**
 * class for managing Automated Tool Chain services versions
 * 
 * Uses atc meta data to query each service public repo and get release information
 * 
 * @param extHttp client for external connectivity
 * @param logger logger class for logging events within this class
 * 
 */
export class AtcVersionsClient {
    /**
     * client for handling external HTTP connectivity
     * - also has the cache directory under .cacheDir
     */
    extHttp: ExtHttp;

    /**
     * event emitter instance for this class
     */
    events: EventEmitter;

    /**
     * ATC meta data including api endpoints, github releases url and main repo url
     */
    atcMetaData = _atcMetaData;

    /**
     * base atc version information that comes with the package
     * 
     * *updated with every release of f5-conx-core*
     */
    atcVersionsBaseCache: AtcVersions = _atcVersionsBaseCache;

    /**
     * date of the last ATC version check
     */
    lastCheckDate: Date | string | undefined;

    /**
     * atc version cache name/location
     * 
     * '/home/someUser/f5-conx-core/src/bigip/atcVersions.json'
     */
    atcVersionsFileName = 'atcVersions.json';
    
    /**
     * 
     */
    cachePath: string;

    /**
     * object containing all the LATEST versions/releases/assets information for each ATC service.
     */
    atcVersions: AtcVersions = {};

    constructor(options: {
        extHttp?: ExtHttp,
        cachePath?: string,
        eventEmitter?: EventEmitter
    }
    ) {
        this.extHttp = options.extHttp ? options.extHttp : new ExtHttp();

        this.cachePath = options.cachePath ? path.join(options.cachePath, this.atcVersionsFileName) : this.atcVersionsFileName;

        this.events = options.eventEmitter ? options.eventEmitter : new EventEmitter;
    }


    /**
     * returns atc version information
     * 
     * will only query github to refresh once a day and saves details to file
     */
    async getAtcReleasesInfo(): Promise<AtcVersions> {
        // load info from cache
        await this.loadReleaseInfoFromCache();

        // if we have cache data, get date
        const checkDate = new Date(this.atcVersions?.lastCheckDate).getDate();
        // get todays date
        const todayDate = new Date().getDate();

        // is it today?
        if (checkDate === todayDate) {
            // was already checked/refreshed today, so pass cached info
            this.events.emit('log-info', `atc release version already checked today, returning cache from ${this.cachePath}`);
            return this.atcVersions;
        } else {
            // has not been checked today, refresh
            this.events.emit('log-info', 'atc release version has NOT been checked today, refreshing cache now');
            await this.refreshAtcReleasesInfo();
            return this.atcVersions;
        }

    }


    private async loadReleaseInfoFromCache(): Promise<void> {

        try {
            // load atc versions cache
            const versionFile = fs.readFileSync(this.cachePath).toString();
            this.atcVersions = JSON.parse(versionFile);
        } catch (e) {
            this.events.emit('log-error', `no atc release version metadata found at ${this.atcVersionsFileName}`);
        }
        return;
    }

    /**
     * save atc release/versions information to cache
     */
    private async saveReleaseInfoToCache(): Promise<void> {
        
        try {

            this.events.emit('log-info', `saving atc versions cache to ${this.cachePath}`);
            fs.writeFileSync(
                this.cachePath,
                JSON.stringify(this.atcVersions, undefined, 4)
            );
        } catch (e) {
            this.events.emit('log-error', `not able to save atc versions info to ${this.atcVersionsFileName}`);
        }
        return;
    }

    /*
     * loads all the release information for each ATC service
     * - this should be async to complete in the background once a day
     */
    private async refreshAtcReleasesInfo(): Promise<void> {

        // holds the promises from the axios request calls since the forEach loop is not async aware
        // a request will be sent for each loop iteration, but all responses will be recieved in parallel
        const promiseArray = []

        Object.keys(this.atcMetaData).forEach(async atc => {

            // at launch of extension, load all the latest atc metadata
            const y = this.atcMetaData[atc].gitReleases;
            promiseArray.push(this.extHttp.makeRequest({ url: this.atcMetaData[atc].gitReleases })
                .then( resp => {
                    // loop through reach release and build 
                    const latest: string[] = [];
                    const releases = resp.data.map( (el: GitRelease) => {

                        // get filter/map out only the details we want for each asset
                        const assets = el.assets.map( (asset: Asset) => {
                            return {
                                name: asset.name,
                                id: asset.id,
                                size: asset.size,
                                browser_download_url: asset.browser_download_url
                            };
                        });

                        // remove the leadin "v" from the version number
                        // const version = el.tag_name.replace(/v/, '');
                        const version = el.tag_name;

                        latest.push(version);
                        return {
                            version,
                            id: el.id,
                            assets
                        };
                    });


                    this.atcVersions[atc] = {
                        releases,
                        latest: latest.sort(cmp)[latest.length - 1]
                    };


                }).catch(err => {
                    this.events.emit('log-error', {
                        msg: `refreshAtcReleasesInfo, was not able to fetch release info for ${atc}`,
                        url: this.atcMetaData[atc].gitReleases,
                        resp: err 
                    })
                }));



        });

        // now that all the calls have been made and processin in parallel, wait for all the promises to resolve and update the necessary information
        await Promise.all(promiseArray)

        // if we made i this far and still no atc version information from github
        if(this.atcVersions === {}) {
            // apply base cache that comes with the project
            // this should get updated at every package release
            this.atcVersions = this.atcVersionsBaseCache;
        }

        // inject todays date
        this.atcVersions.lastCheckDate = new Date();
        
        this.saveReleaseInfoToCache();
        return;
    }

}




/**
 * compares semver
 * 
 * https://github.com/substack/semver-compare
 * 
 * @param a 
 * @param b 
 */
export function cmp(a: string, b: string): 1 | -1 | 0 {
    // refactor this into ternary operators

    // remove leading "v" if found, then split on "."
    const pa = a.replace(/v/, '').split('.');
    const pb = b.replace(/v/, '').split('.');
    for (let i = 0; i < 3; i++) {
        const na = Number(pa[i]);
        const nb = Number(pb[i]);
        if (na > nb) { return 1; }
        if (nb > na) { return -1; }
        if (!isNaN(na) && isNaN(nb)) { return 1; }
        if (isNaN(na) && !isNaN(nb)) { return -1; }
    }
    return 0;
}