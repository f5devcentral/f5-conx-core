
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


import { F5Client } from '../src/bigip/f5Client';
import { getF5Client, ipv6Host } from '../src/utils/testingUtils';
import { getFakeToken } from '../src/utils/testingUtils';
import { AuthTokenReqBody } from '../src/bigip/bigipModels';
import { F5DownloadPaths, iControlEndpoints } from '../src/constants';


import { deviceInfoIPv6 } from './artifacts/f5_device_atc_infos';


let f5Client: F5Client;
let nockScope: nock.Scope;

// test file name
const tmpUcs = 'bigip1_10.200.244.101_20201130T220239571Z.ucs';
// source file with path
const filePath = path.join(__dirname, 'artifacts', tmpUcs)
// tmp directory
const tmpDir = path.join(__dirname, 'tmp')
// destination test path with file name
const tmp = path.join(tmpDir, tmpUcs)

const events = []
let fileName;

describe('f5Client qkview integration tests - ipv6', function () {

    // runs once before the first test in this block
    before(async function () {
        if (!fs.existsSync(tmpDir)) {
            // console.log('creating temp directory for file upload/download tests')
            fs.mkdirSync(tmpDir);
        }

        nockScope = nock(`https://${ipv6Host}`)
            .post(iControlEndpoints.login)
            .reply(200, (uri, reqBody: AuthTokenReqBody) => {
                return getFakeToken(reqBody.username, reqBody.loginProviderName);
            })
            //discover endpoint
            .get(iControlEndpoints.tmosInfo)
            .reply(200, deviceInfoIPv6)

        f5Client = getF5Client({ ipv6: true });

        // f5Client = new F5Client('192.168.200.131', 'admin', 'benrocks')
        // f5Client = new F5Client('10.200.244.101', 'admin', 'benrocks')

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
        nock.cleanAll();
    });



    it('create default qkview on f5', async function () {
        this.slow(12000);


        nockScope
            .post(iControlEndpoints.qkview)
            .reply((uri, requestBody: { name: string }) => {
                fileName = requestBody.name;
                return [
                    202,
                    {
                        "name": fileName,
                        "id": "8f35",
                        "status": "IN_PROGRESS"
                    }
                ]
            })
            .get(`${iControlEndpoints.qkview}/8f35`)
            .reply(() => {
                return [
                    200,
                    {
                        "name": fileName,
                        "id": "8f35",
                        "status": "IN_PROGRESS"
                    }
                ]
            })
            .get(`${iControlEndpoints.qkview}/8f35`)
            .reply(() => {
                return [
                    200,
                    {
                        "name": fileName,
                        "id": "8f35",
                        "status": "SUCCEEDED"
                    }
                ]
            })

        const resp = await f5Client.qkview.create()
            .then(resp => resp)
            .catch(err => {
                debugger;
                return Promise.reject(err);
            })

        assert.deepStrictEqual(resp.data.status, 'SUCCEEDED');
        assert.ok(/\w+.qkview/.test(resp.data.name));

    });



    it('list qkviews on f5', async function () {
        nockScope
            .get(iControlEndpoints.qkview)
            // .reply(404)
            .reply(200, {
                items: [
                    {
                        id: '8f35',
                        name: fileName,
                        status: 'SUCCEEDED'
                    }
                ]
            })

        // const resp = await f5Client.qkview.list()
        //     .then(resp => resp)
        //     .catch(err => {
        //         debugger;
        //         return Promise.reject(err);
        //     })

        // trying a different flow by putting the assert in the .then
        // this flow should only try to validate the data if the function completes successfully
        await f5Client.qkview.list()
            .then(resp => {
                // resp
                fileName = resp.data.items[0].name;
                assert.ok(/\w+.qkview/.test(resp.data.items[0].name))
            })
            .catch(err => {
                debugger;
                return Promise.reject(err);
            })


    });

    it('download qkview from f5', async function () {

        nockScope
            .get(`${F5DownloadPaths.qkview.uri}/${fileName}`)
            .replyWithFile(200, filePath);

        const resp = await f5Client.qkview.download(
            fileName,
            tmpDir
        )
            .then(resp => resp)
            .catch(err => {
                debugger;
                return Promise.reject(err);
            })

        // assert that the file exists
        assert.ok(fs.existsSync(resp.data.file));

        // now delete the file
        fs.unlinkSync(resp.data.file);
    });


    it('get qkview (generate and download)', async function () {

        this.slow(12000);
        let fileName;

        nockScope
            .post(iControlEndpoints.qkview, body => {
                fileName = body.name;
                return body
            })
            .reply((uri, requestBody: { name: string }) => {
                fileName = requestBody.name;
                return [
                    202,
                    {
                        "name": fileName,
                        "id": "8f35",
                        "status": "IN_PROGRESS"
                    }
                ]
            })
            .get(`${iControlEndpoints.qkview}/8f35`)
            .reply(() => {
                return [
                    200,
                    {
                        "name": fileName,
                        "id": "8f35",
                        "status": "IN_PROGRESS"
                    }
                ]
            })
            .get(`${iControlEndpoints.qkview}/8f35`)
            .reply(() => {
                return [
                    200,
                    {
                        "name": fileName,
                        "id": "8f35",
                        "status": "SUCCEEDED"
                    }
                ]
            })
            // the following uri is supposed to have the filename, but we don't know the filename till execution time.  In other tests for replys, we are able to feed it a function to get the filename async during processing, but have not figured that out for initial operations yet
            .get(uri => uri.startsWith(F5DownloadPaths.qkview.uri))
            .replyWithFile(200, filePath);

        const resp = await f5Client.qkview.get(tmpDir)
            .then(resp => resp)
            .catch(err => {
                debugger;
                return Promise.reject(err);
            })

        // assert that the response included an expected file name format
        assert.ok(/\w+.qkview/.test(resp.data.file));

        // assert that the file exists
        assert.ok(fs.existsSync(resp.data.file));

        // now delete the file
        fs.unlinkSync(resp.data.file);
    });


    it('delete qkview on f5', async function () {

        // list qkviews, then delete first one (should be at least one from previous tests)

        nockScope
            .get(iControlEndpoints.qkview)
            .reply(200, {
                items: [
                    {
                        id: '8f35',
                        name: fileName,
                        status: 'SUCCEEDED'
                    }
                ]
            })
            .delete(uri => uri.startsWith(iControlEndpoints.qkview))
            .reply(200)

        const resp = await f5Client.qkview.list()
            .then(async resp => {
                return await f5Client.qkview.delete(resp.data.items[0].id)
            })
            .catch(err => {
                debugger;
                return Promise.reject(err);
            })

        // assert that the file exists
        assert.deepStrictEqual(resp.status, 200);

    });
});