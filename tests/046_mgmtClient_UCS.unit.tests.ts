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
import * as fs from 'fs';
import path from 'path';

import { defaultHost, getFakeToken, getMgmtClient } from '../src/utils/testingUtils';
import { F5DownloadPaths, F5UploadPaths } from '../src/constants';
import { MgmtClient } from '../src/bigip/mgmtClient';
import Logger from '../src/logger';
import { AuthTokenReqBody } from '../src/bigip/bigipModels';

let mgmtClient: MgmtClient;

//  *** todo: move all build/mocks to fixtureUtils

// test file name
const rpm = 'f5-declarative-onboarding-1.19.0-2.noarch.rpm';
// source file with path
const filePath = path.join(__dirname, 'artifacts', rpm)
// tmp directory
const tmpDir = path.join(__dirname, 'tmp')
// destination test path with file name
const tmp = path.join(tmpDir, rpm)

const nockInst = nock(`https://${defaultHost}`)


// https://stackoverflow.com/questions/40960113/how-to-use-nock-to-record-request-and-responses-to-files-and-use-it-to-playback

const logger = new Logger('F5_CONX_CORE_LOG_LEVEL');
logger.console = false;

describe('ucs download dev', function () {
    
    // runs once before the first test in this block
    before(function () {
        // log test file name - makes it easer for troubleshooting
        console.log('       file:', __filename)

        const x = this.currentTest
        if (!fs.existsSync(tmpDir)) {
            // console.log('creating temp directory for file upload/download tests')
            fs.mkdirSync(tmpDir);
        }

        // mgmtClient = new MgmtClient('192.168.200.131', 'admin', 'benrocks')
        // mgmtClient = new MgmtClient('10.200.244.5', 'admin', 'benrocks')
        mgmtClient = getMgmtClient()
        // mgmtClient = new MgmtClient('10.200.244.110', 'admin', 'benrocks', { port: 8443 })

        // setup events collection
        mgmtClient.events.on('failedAuth', msg => logger.error(msg));
        mgmtClient.events.on('log-debug', msg => logger.debug(msg));
        mgmtClient.events.on('log-info', msg => logger.info(msg));
        mgmtClient.events.on('log-error', msg => logger.error(msg));

    })

    beforeEach(function () {
        // refresh the device client class
        // mgmtClient = getMgmtClient();

        // clear logs
        logger.clearLogs

        // setup auth nock
        nockInst
            .post('/mgmt/shared/authn/login')
            .reply(200, (uri, reqBody: AuthTokenReqBody) => {
                return getFakeToken(reqBody.username, reqBody.loginProviderName);
            })
    });

    afterEach(async function () {
        // Alert if all our nocks didn't get used, and clear them out
        if (!nock.isDone()) {
            // throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`)
        }
        nock.cleanAll();

        // clear token timer if something failed
        await mgmtClient.clearToken();   // clear auth token for next test
    });

    it('upload file to F5 - UCS', async function () {
        // upload file so we have a consistent file to download

        this.slow(600);
        nockInst
        .persist()
        .post(`${F5UploadPaths.ucs.uri}/${rpm}`)
        .reply(200, { foo: 'bar' });
        
        const fileStat = fs.statSync(filePath);
        
        await mgmtClient.upload(filePath, 'UCS')
        .then(resp => {
            assert.deepStrictEqual(resp.data.bytes, fileStat.size, 'local source file and uploaded file sizes do not match')
            assert.deepStrictEqual(resp.data.fileName, rpm)
            // assert.ok(resp.data.bytes);  // just asserting that we got a value here, should be a number
        })
        .catch(err => {
            debugger;
        })
        
    });
    
    
    
    it('download file from F5 - UCS path', async function () {
        this.slow(200);

        
        ///////  turn on to record the nock
        // nock.recorder.rec({
        //     output_objects: true,
        //     dont_print: true,
        // })
        //////  enable to have test connect to real f5
        // mgmtClient = new MgmtClient('10.200.244.5', 'admin', 'benrocks')

        // load and update nock tape for the local 'defaultHost' and download path
        const nockDef = nock.loadDefs('tests/artifacts/nocks/downloadNock.json').map(item => {
            item.scope = `https://${defaultHost}:443`
            if(item.path !== "/mgmt/shared/authn/login") {
                item.path = `${F5DownloadPaths.ucs.uri}/f5-declarative-onboarding-1.19.0-2.noarch.rpm`
            }
            return item;
        })

        //////  used to replay the nock
        nock.define(nockDef);

        await mgmtClient.download(rpm, tmp, 'UCS')
        .then(resp => {
            assert.ok(fs.existsSync(resp.data.file))           // confirm/assert file is there
            fs.unlinkSync(resp.data.file);                     // remove tmp file
        })
        .catch(err => {
            debugger
        });
        

        ////// used to write the recorded nock to a file
        // fs.writeFileSync('tests/artifacts/nocks/downloadNock.json', JSON.stringify(nock.recorder.play(), undefined, 4), 'utf-8');
    });





});