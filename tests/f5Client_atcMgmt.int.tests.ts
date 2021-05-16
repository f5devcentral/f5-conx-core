
/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import assert from 'assert';
import nock from 'nock';
import fs from 'fs';
import path from 'path';
import { F5UploadPaths } from '../src/constants'

import { F5Client } from '../src/bigip/f5Client';
import { getF5Client, ipv6Host } from '../src/utils/testingUtils';
import { getFakeToken } from '../src/utils/testingUtils';
import { AuthTokenReqBody } from '../src/bigip/bigipModels';
import { iControlEndpoints } from '../src/constants';

import { deviceInfoIPv6 } from './artifacts/f5_device_atc_infos';
import { isObject } from '../src/utils/misc';


let f5Client: F5Client;
let nockScope: nock.Scope;

// test file name
const rpm = 'f5-appsvcs-templates-1.4.0-1.noarch.rpm';
// source file with path
const filePath = path.join(__dirname, 'artifacts', rpm)

const events = []
let installedRpm;

describe('f5Client rpm mgmt integration tests', function () {

    // runs once before the first test in this block
    before(async function () {

        nockScope = nock(`https://${ipv6Host}`)
            .post(iControlEndpoints.login)
            .reply(200, (uri, reqBody: AuthTokenReqBody) => {
                return getFakeToken(reqBody.username, reqBody.loginProviderName);
            })
            //discover endpoint
            .get(iControlEndpoints.tmosInfo)
            .reply(200, deviceInfoIPv6)

        f5Client = getF5Client({ ipv6: true });

        // un-comment to allow testing to actualy f5 device
        // f5Client = new F5Client('192.168.200.131', 'admin', 'benrocks')

        f5Client.events.on('failedAuth', msg => events.push(msg));
        f5Client.events.on('log-debug', msg => events.push(msg));
        f5Client.events.on('log-info', msg => events.push(msg));
        f5Client.events.on('log-error', msg => events.push(msg));

        await f5Client.discover();
    });

    // runs once after the last test in this block
    after(function () {
        // clear login at the end of tests
        f5Client.clearLogin();
    });

    beforeEach(async function () {
        // setting the array length to 0 emptys it, so we can use it as a "const"
        events.length = 0;

    });

    afterEach(async function () {
        // Alert if all our nocks didn't get used, and clear them out
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`)
        }
        // clear any persistent nocks between tests
        nockScope.persist(false)
        
        nock.cleanAll();
    });




    it('download package', async function () {
        this.slow(200);

        // These next two tests are focused on regular external download capability, this test just downloads a file from an external resource, the next test is the same test, but it should see that the file is already locally cached and return it

        const url = 'https://github.com/F5Networks/f5-appsvcs-templates/releases/download/v1.4.0/f5-appsvcs-templates-1.4.0-1.noarch.rpm'
        const urlPath = new URL(url).pathname       // extract path from URL
        const fileName = path.basename(urlPath);    // get file name from url
        
        // const nockScopeGit = nock(`https://test.io`)
        // const url = 'https://test.io/someDir/download/test/package1.rpm'
        const nockScopeGit = nock(`https://github.com`)
        
        nockScopeGit
            .get(urlPath)
            .replyWithFile(200, filePath)
            
        await f5Client.atc.download(url)
            .then(resp => {

                // get filename from downloaded location
                const downloadedFileName = path.basename(resp.data.file)
                assert.deepStrictEqual(downloadedFileName, fileName);
                assert.ok(resp.data.bytes);

            })
            .catch(err => {
                debugger;
                return Promise.reject(err);
            });
    });


    it('download package - again from local cache', async function () {
        this.slow(200);
        nock.cleanAll();    // clean all nocks since we won't be using them for this test

        // this test plays off the previous test that should have downloaded a file, now this test should try to download the same file, see that it is already in the local cache and return it, instead of downloading a fresh copy

        const url = 'https://test.io/someDir/download/test/package1.rpm'
        // const url = 'https://github.com/F5Networks/f5-appsvcs-templates/releases/download/v1.4.0/f5-appsvcs-templates-1.4.0-1.noarch.rpm'

        const urlPath = new URL(url).pathname       // extract path from URL
        const fileName = path.basename(urlPath);    // get file name from url
        await f5Client.atc.download(url)
            .then(resp => {

                // get filename from downloaded location
                const downloadedFileName = path.basename(resp.data.file)
                assert.deepStrictEqual(downloadedFileName, fileName);
                assert.ok(resp.data.bytes > 100);   // does the file actually have size?
                assert.ok(resp.data.cache);        // did we get the cached flag?

                fs.unlinkSync(resp.data.file);
            })
            .catch(err => {
                debugger;
                return Promise.reject(err);
            });
    });

    
    it('download package - github redirect', async function () {
        this.slow(200);

        // this test is like the regurlar download, but from something like github that redirects the request to another caching service like AWS

        // this test is necessary since it seems that the "timing" package added to this axios request library breaks the redirect.  
        // Currently working through a solution.  
        // Option 1: just remove the timings for entire external http class for now, since they are really required for anything.  
        // Option 2: allow 302 and re-implement redirect following.  
        // Option 3: create a unique single axios instance with all same tweaks, but without the timings, just for downloads

        const nockScopeGit = nock(`https://github.com`)
        const url = 'https://github.com/F5Networks/f5-appsvcs-templates/releases/download/v1.4.0/f5-appsvcs-templates-1.4.0-1.noarch.rpm'
        
        const urlPath = new URL(url).pathname       // extract path from URL
        const fileName = path.basename(urlPath);    // get file name from url
        
        nockScopeGit
            .get(urlPath)
            .reply(302, undefined, [
                'Status',
                '302 Found',
                'Location',
                'https://github.com/otherFiles/newFile.pkg',
            ])
            .get('/otherFiles/newFile.pkg')
            .replyWithFile(200, filePath)
            
        await f5Client.atc.download(url)
            .then(resp => {

                // get filename from downloaded location
                const downloadedFileName = path.basename(resp.data.file)
                assert.deepStrictEqual(downloadedFileName, fileName);
                assert.ok(resp.data.bytes);
                assert.ok(!resp.data.cache);

                fs.unlinkSync(resp.data.file);
            })
            .catch(err => {
                debugger;
                return Promise.reject(err);
            });

    });
    


    it('upload package', async function () {
        this.slow(1200);

        nockScope
            .persist()
            .post(`${F5UploadPaths.file.uri}/${rpm}`)
            .reply(200, { foo: 'bar' })
            
            await f5Client.atc.uploadRpm(filePath)
            .then(resp => {
                assert.deepStrictEqual(resp.data.fileName, rpm);
                assert.ok(resp.data.bytes);
            })
            .catch(err => {
                debugger;
                return Promise.reject(err);
            })
    });
    
    
    
    it('install package', async function () {
        this.slow('15s');
        
        nockScope
            .persist(false)            
            .post(iControlEndpoints.atcPackageMgmt, {
                operation: 'INSTALL',
                packageFilePath: `/var/config/rest/downloads/${rpm}`
            })
            .reply(202, {
                "id": "63b48c20",
                "status": "CREATED",
            })

            .get(`${iControlEndpoints.atcPackageMgmt}/63b48c20`)
            .reply(200, { status: "STARTED" })

            .get(`${iControlEndpoints.atcPackageMgmt}/63b48c20`)
            .reply(200, { status: 'FINISHED' });

        await f5Client.atc.install(rpm)
            .then(resp => {
                assert.deepStrictEqual(resp.data.status, 'FINISHED');
            })
            .catch(err => {
                debugger;
                return Promise.reject(err);
            })

    });




    it('list installed packages - confirm package INSTALLED', async function () {
        this.slow(15000);

        nockScope
            .post(iControlEndpoints.atcPackageMgmt, {
                operation: 'QUERY',
            })
            .reply(202, { "id": "63b48c20" })

            .get(`${iControlEndpoints.atcPackageMgmt}/63b48c20`)
            .reply(200, { status: "STARTED" })

            .get(`${iControlEndpoints.atcPackageMgmt}/63b48c20`)
            .reply(200, {
                status: 'FINISHED',
                queryResponse: [{
                    packageName: path.parse(rpm).name
                }]
            });


        await f5Client.atc.showInstalled()
            .then(resp => {
                assert.deepStrictEqual(resp.data.status, 'FINISHED');
                // loop through installed packages and return the object matching the rpm installed in previous step
                installedRpm = resp.data.queryResponse.filter((el: { packageName: string }) => {
                    return el.packageName === path.parse(rpm).name
                })[0]
                assert.ok(isObject(installedRpm));
            })
            .catch(err => {
                debugger;
                return Promise.reject(err);
            })
    });


    it('remove installed package', async function () {
        this.slow(15000);

        nockScope
            .post(iControlEndpoints.atcPackageMgmt, {
                operation: 'UNINSTALL',
                packageName: installedRpm.packageName
            })
            .reply(202, {
                "id": "c4b16c2a",
                "status": "CREATED",
            })

            .get(`${iControlEndpoints.atcPackageMgmt}/c4b16c2a`)
            .reply(200, { status: "STARTED" })

            .get(`${iControlEndpoints.atcPackageMgmt}/c4b16c2a`)
            .reply(200, { status: 'FINISHED' });


        await f5Client.atc.unInstall(installedRpm.packageName)
            .then(resp => {
                assert.deepStrictEqual(resp.data.status, 'FINISHED');
            })
            .catch(err => {
                debugger;
                return Promise.reject(err);
            })
    });



    it('list installed packages - confirm package REMOVED', async function () {
        this.slow(15000);

        nockScope
            .post(iControlEndpoints.atcPackageMgmt, {
                operation: 'QUERY',
            })
            .reply(202, { "id": "63b48c20" })

            .get(`${iControlEndpoints.atcPackageMgmt}/63b48c20`)
            .reply(200, { status: "STARTED" })

            .get(`${iControlEndpoints.atcPackageMgmt}/63b48c20`)
            .reply(200, {
                status: 'FINISHED',
                queryResponse: [{
                    packageName: 'some other package'
                }]
            });

        await f5Client.atc.showInstalled()
            .then(resp => {
                // loop through and try to find rpm installed earlier
                installedRpm = resp.data.queryResponse.filter((el: { packageName: string }) => {
                    return el.packageName === path.parse(rpm).name
                })
                assert.deepStrictEqual(resp.data.status, 'FINISHED');
                // rpm we uninstalled, should not be found in the installed list
                assert.deepStrictEqual(installedRpm, []);
            })
            .catch(err => {
                debugger;
                return Promise.reject(err);
            })
    });




});