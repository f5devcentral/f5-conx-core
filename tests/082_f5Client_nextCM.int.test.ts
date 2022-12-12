/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */

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
import { getFakeToken } from '../src/utils/testingUtils';
import { AuthTokenReqBody } from '../src/bigip/bigipModels';
import { atcMetaData, F5DownloadPaths, iControlEndpoints } from '../src/constants';
import {
    defaultHost,
    defaultPassword,
    defaultUser,
    getMgmtClient,
    getF5Client,
    ipv6Host
} from '../src/utils/testingUtils';


import { deviceInfoIPv6 } from '../src/bigip/f5_device_atc_infos';
import { HttpResponse } from '../src/utils/httpModels';
import Logger from '../src/logger';
import { isArray, isObject } from '../src/utils/misc';
import { as3ExampleDec } from '../src';


let f5Client: F5Client;
// let nockScope: nock.Scope;

// // test file name
// // const tmpUcs = 'bigip1_10.200.244.101_20201130T220239571Z.ucs';
// // source file with path
// // const filePath = path.join(__dirname, 'artifacts', tmpUcs)
// // tmp directory
const tmpDir = path.join(__dirname, 'tmp')
// // destination test path with file name
// const tmp = path.join(tmpDir, tmpUcs)

// test file name
// const rpm = 'f5-declarative-onboarding-1.19.0-2.noarch.rpm';

const logger = new Logger('F5_M_LOG_LEVEL');
logger.console = true;
// logger.logLevel = 'INFO';
process.env.F5_M_LOG_LEVEL = 'DEBUG'

// set env to inject default cookies
// process.env.F5_CONX_CORE_COOKIES = "peanut=/butter/salt; cookie=monster";
process.env.F5_CONX_CORE_COOKIES = "udf.sid=s%3AaLVTgY7QNC-F887_p0osPg9354NmElfZ.TtUIuDF1gYhkwqY7n%2B1Wo4zqAGtDg4VMrGUzLg98hHY"
// const udfNext = 'e5fdfd3c-f976-4fc8-b794-f52e83de0e28.access.udf.f5.com';  // mbip3
const udfNext = '91a4bfd3-b94f-4c2b-a8dd-b9d6ccff31bd.access.udf.f5.com';  // cm

// const events: string[] = []

describe('nextClientBase unit tests', function () {

    // runs once before the first test in this block
    before(async function () {
        // log test file name - makes it easer for troubleshooting
        console.log('       file:', __filename)

        if (!fs.existsSync(tmpDir)) {
            // console.log('creating temp directory for file upload/download tests')
            fs.mkdirSync(tmpDir);
        }

        // nockScope = nock(`https://${ipv6Host}`)
        //     .post(iControlEndpoints.login)
        //     .reply(200, (uri, reqBody: AuthTokenReqBody) => {
        //         return getFakeToken(reqBody.username, reqBody.loginProviderName);
        //     })
        //     //discover endpoint
        //     .get(iControlEndpoints.tmosInfo)
        //     .reply(200, deviceInfoIPv6)

        // f5Client = getF5Client({ ipv6: true });
        f5Client = new F5Client(
            udfNext,
            'admin',
            'Welcome123!'
        );

        f5Client.events
            .on('log-http-request', msg => logger.httpRequest(msg))
            .on('log-http-response', msg => logger.httpResponse(msg))
            .on('log-debug', msg => logger.debug(msg))
            .on('log-info', msg => logger.info(msg))
            .on('log-warn', msg => logger.warn(msg))
            .on('log-error', msg => logger.error(msg))
            .on('failedAuth', msg => {
                logger.error('Failed Authentication Event!', msg);
            });

    });

    // runs once after the last test in this block
    after(function () {
        // if the tmp directory exits, try to delete it
        //  - should be empty, each test should clean up files as needed
        if (fs.existsSync(tmpDir)) {
            try {
                // console.log('deleting temp directory for file upload/download tests')
                fs.rmdirSync(tmpDir);
            } catch (e) {
                console.log('was unable to delete tmp folder for upload/download tests, this typically means there are files in it that one of the tests did not clean up', e)
            }
        }

        // clear login at the end of tests
        f5Client.clearLogin();

    });

    beforeEach(async function () {
        // setting the array length to 0 emptys it, so we can use it as a "const"
        // events.length = 0;

    });

    afterEach(async function () {
        // Alert if all our nocks didn't get used, and clear them out
        // if (!nock.isDone()) {
        //     throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`)
        // }
        nock.cleanAll();

    });


    it('auth token -> discover details', async function () {

        // clean all the nocks since we didn't use any of the pre-built stuff
        nock.cleanAll();

        // kick off discovery
        const discover = await f5Client.discover();

        // auth token details
        assert.ok(isObject(f5Client.mgmtClient.token), 'auth token not found to finish discovery')

        // discover should have also called /api/system/v1/info and saved the following details
        assert.ok(typeof f5Client.mgmtClient.hostInfo!.version === 'string')
        assert.ok(typeof f5Client.mgmtClient.hostInfo!.build === 'string')

        // auth token has to work to get here
        assert.deepStrictEqual(discover.product, 'NEXT-CM', 'product != NEXT-CM')
        assert.ok(typeof discover.hostname === 'string', 'hostname not in discovery')
        assert.ok(typeof discover.version === 'string', 'verion not in discovery')

    });


    it('check out cm main openapi', async function () {

        // clean all the nocks since we didn't use any of the pre-built stuff
        nock.cleanAll();

        assert.ok(typeof f5Client.openApi?.openapi === 'string', 'no openapi version')
        assert.ok(isObject(f5Client.openApi?.info), 'no openapi info')
        assert.ok(isObject(f5Client.openApi?.paths), 'no openapi paths')

    });

    it('check out cm device inventory', async function () {

        // clean all the nocks since we didn't use any of the pre-built stuff
        nock.cleanAll();

        const resp = await f5Client.https('/api/device/v1/inventory')
            .then(resp => resp)
            .catch(err => {
                debugger;
                return err
            })

        assert.ok(isArray(resp.data?._embedded?.devices))

    });

});