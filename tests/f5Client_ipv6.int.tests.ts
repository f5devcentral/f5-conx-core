/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import nock from 'nock';
import { F5Client } from '../src/bigip/f5Client';
import { 
    as3InfoApiReponse, 
    deviceInfo, 
    doInfoApiReponse, 
    fastInfoApiResponse,
    tsInfoApiReponse,
    cfInfoApiReponse 
} from './artifacts/f5_device_atc_infos';

import { 
    getF5Client,
    ipv6Host 
} from '../src/utils/testingUtils';
import { getFakeToken } from '../src/utils/testingUtils';
// import localAtcMetadata from '../src/bigip/atc_metadata.old.json';
import { AuthTokenReqBody } from '../src/bigip/bigipModels';
import { atcMetaData, F5DownloadPaths, F5UploadPaths } from '../src/constants';
import Logger from '../src/logger';


// test file name
const rpm = 'f5-appsvcs-templates-1.4.0-1.noarch.rpm';
// source file with path
const filePath = path.join(__dirname, 'artifacts', rpm)
// tmp directory
const tmpDir = path.join(__dirname, 'tmp')
// destination test path with file name
const tmp = path.join(tmpDir, rpm)

const nockInst = nock(`https://${ipv6Host}`)

let f5Client: F5Client;
// const events = [];
const log = Logger.getLogger();

log.console = false;

describe('f5Client basic tests - ipv6', async function () {

    before(function () {
        if (!fs.existsSync(tmpDir)) {
            // console.log('creating temp directory for file upload/download tests')
            fs.mkdirSync(tmpDir);
        }
    });
 
    beforeEach( async () => {
        // log.clearLogs();
        
        // setup mgmt client
        f5Client = getF5Client({ ipv6: true });

        // f5Client.events.on('failedAuth', msg => events.push(msg));
        // f5Client.events.on('log-debug', msg => events.push(msg));
        // f5Client.events.on('log-info', msg => events.push(msg));
        // f5Client.events.on('log-error', msg => events.push(msg));

        // setup events collection
        f5Client.events.on('failedAuth', msg => log.error(msg));
        f5Client.events.on('log-debug', msg => log.debug(msg));
        f5Client.events.on('log-info', async msg => {
            log.info(msg)
        });
        f5Client.events.on('log-error', msg => log.error(msg));

        nockInst
        .post('/mgmt/shared/authn/login')
        .reply(200, (uri, reqBody: AuthTokenReqBody) => {
            return getFakeToken(reqBody.username, reqBody.loginProviderName);
        })
    });

    afterEach(function () {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`)
        }
        nock.cleanAll();
        f5Client.clearLogin();
    });





    it('should make basic request (https) - additional mgmt client params', async function () {
        nockInst
            .get('/foo')
            .reply(200, { foo: 'bar' });


        const resp = await f5Client.https('/foo');
        assert.deepStrictEqual(resp.data, { foo: 'bar' })
        await f5Client.clearLogin();
    });

    // it('clear login', async function () {
    //     // log.clearLogs();

    //     const num = await f5Client.clearLogin()

    //     const x = log.journal[log.journal.length - 1]
    //     assert.ok(JSON.stringify(x).includes('clearing token/timer'), 'did not get any test events');

    //     nock.cleanAll();    // clean all the nocks since we didn't use any
    // });  


    it('discovery - nothing installed', async function () {
        nockInst

            .get('/mgmt/shared/identified-devices/config/device-info')
            .reply(200, deviceInfo)

            .get(atcMetaData.fast.endPoints.info)
            .reply(404, {
                message: `Public URI path not registered: ${atcMetaData.fast.endPoints.info}`,
            })
            
            .get(atcMetaData.as3.endPoints.info)
            .reply(404, {
                message: `Public URI path not registered: ${atcMetaData.as3.endPoints.info}`,
            })
            
            .get(atcMetaData.do.endPoints.info)
            .reply(404, {
                message: `Public URI path not registered: ${atcMetaData.do.endPoints.info}`,
              })

            .get(atcMetaData.ts.endPoints.info)
            .reply(404, {
                message: `Public URI path not registered: ${atcMetaData.ts.endPoints.info}`,
              })

            .get(atcMetaData.cf.endPoints.info)
            .reply(404, {
                message: `Public URI path not registered: ${atcMetaData.cf.endPoints.info}`,
              })

        const resp = await f5Client.discover()
        .catch( err => {
            debugger;
        })

        assert.deepStrictEqual(f5Client.fast, undefined);
        assert.deepStrictEqual(f5Client.as3, undefined);
        assert.deepStrictEqual(f5Client.do, undefined);
        assert.deepStrictEqual(f5Client.ts, undefined);
        assert.deepStrictEqual(f5Client.cf, undefined);
    });



    it('discovery - all services installed', async function () {
        nockInst

            .get('/mgmt/shared/identified-devices/config/device-info')
            .reply(200, deviceInfo)

            .get(atcMetaData.fast.endPoints.info)
            .reply(200, fastInfoApiResponse)
            
            .get(atcMetaData.as3.endPoints.info)
            .reply(200, as3InfoApiReponse)

            .get(atcMetaData.do.endPoints.info)
            .reply(200, doInfoApiReponse)

            .get(atcMetaData.ts.endPoints.info)
            .reply(200, tsInfoApiReponse)

            .get(atcMetaData.cf.endPoints.info)
            .reply(200, cfInfoApiReponse)

        const resp = await f5Client.discover();

        assert.ok(f5Client.host)
        assert.ok(f5Client.fast)
        assert.ok(f5Client.as3)
        assert.ok(f5Client.do)
        assert.ok(f5Client.ts)
        assert.ok(f5Client.cf)
    });

    /**
     * the following tests just confirm that the f5Client is able to upload/download files through the mgmtClient
     */
    it('download file from F5 - UCS path', async function () {
        this.slow(200);
        nockInst
            .persist()
            .get(`${F5DownloadPaths.ucs.uri}/${rpm}`)
            .replyWithFile(200, filePath);

        const resp = await f5Client.download(rpm, tmp, 'UCS');    // download file

        assert.ok(fs.existsSync(resp.data.file))           // confirm/assert file is there
        fs.unlinkSync(resp.data.file);                     // remove tmp file
    });

    it('upload file to F5 - FILE', async function () {
        this.slow(600);
        nockInst
            // tell the nocks to persist for this test, the following post will get called several times
            //  for all the pieces of the file
            .persist()

            // so the following just tests that the url was POST'd to, not the file contents
            //  but since the function returns the filename and file size as part of the upload process
            //  those should confirm that everthing completed
            .post(`${F5UploadPaths.file.uri}/${rpm}`)
            .reply(200, { foo: 'bar' });

        const resp = await f5Client.upload(filePath, 'FILE');
        assert.deepStrictEqual(resp.data.fileName, 'f5-appsvcs-templates-1.4.0-1.noarch.rpm')
        assert.ok(resp.data.bytes);  // just asserting that we got a value here, should be a number
    });



});