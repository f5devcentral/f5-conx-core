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

import { defaultHost } from '../src/utils/testingUtils';
import { F5DownloadPaths, F5UploadPaths } from '../src/constants';
import { MgmtClient } from '../src/bigip/mgmtClient';
import Logger from '../src/logger';

let mgmtClient: MgmtClient;

//  *** todo: move all build/mocks to fixtureUtils

// test file name
const rpm = 'f5-appsvcs-templates-1.4.0-1.noarch.rpm';
// source file with path
const filePath = path.join(__dirname, 'artifacts', rpm)
// tmp directory
const tmpDir = path.join(__dirname, 'tmp')
// destination test path with file name
const tmp = path.join(tmpDir, rpm)

const nockInst = nock(`https://${defaultHost}`)

const log = Logger.getLogger();

describe('mgmtClient unit tests - successes', function () {

    // runs once before the first test in this block
    before(function () {
        if (!fs.existsSync(tmpDir)) {
            // console.log('creating temp directory for file upload/download tests')
            fs.mkdirSync(tmpDir);
        }

        // mgmtClient = new MgmtClient('192.168.200.131', 'admin', 'benrocks')
        // mgmtClient = new MgmtClient('10.200.244.110', 'admin', 'benrocks', { port: 8443 })

        // log.console = false;

        // setup events collection
        mgmtClient.events.on('failedAuth', msg => log.error(msg));
        mgmtClient.events.on('log-debug', msg => log.debug(msg));
        mgmtClient.events.on('log-info', msg => log.info(msg));
        mgmtClient.events.on('log-error', msg => log.error(msg));

    });



    it('upload file to F5 - UCS', async function () {
        this.slow(600);
        nockInst
            .persist()
            .post(`${F5UploadPaths.ucs.uri}/${rpm}`)
            .reply(200, { foo: 'bar' });

        const fileStat = fs.statSync(filePath);

        await mgmtClient.upload(filePath, 'UCS')
            .then(resp => {
                assert.deepStrictEqual(resp.data.bytes, fileStat.size, 'local source file and uploaded file sizes do not match')
                assert.deepStrictEqual(resp.data.fileName, 'f5-appsvcs-templates-1.4.0-1.noarch.rpm')
                // assert.ok(resp.data.bytes);  // just asserting that we got a value here, should be a number
            })
            .catch(err => {
                debugger;
            })
    });



    it('download file from F5 - UCS path', async function () {
        this.slow(200);
        nockInst
            .persist()
            .get(`${F5DownloadPaths.ucs.uri}/${rpm}`)
            .replyWithFile(200, filePath);

        await mgmtClient.download(rpm, tmp, 'UCS')
            .then(resp => {
                assert.ok(fs.existsSync(resp.data.file))           // confirm/assert file is there
                fs.unlinkSync(resp.data.file);                     // remove tmp file
            })
            .catch(err => {
                debugger
            });

    });





});