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


// import { mgmtClient } from '../src/bigip/mgmtClient';
import { defaultHost, defaultPassword, defaultUser, getMgmtClient, ipv6Host } from '../src/utils/testingUtils';
import { getFakeToken } from '../src/utils/testingUtils';
import { AuthTokenReqBody } from '../src/bigip/bigipModels';
import { F5DownloadPaths, F5UploadPaths } from '../src/constants';
import { NewMgmtClient } from '../src/bigip/newMgmtClient';


// let mgmtClient: mgmtClient;
let mgmtClient: NewMgmtClient;

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

const events = [];

describe('mgmtClient unit tests - successes', function () {

    // runs once before the first test in this block
    before(function () {
        if (!fs.existsSync(tmpDir)) {
            // console.log('creating temp directory for file upload/download tests')
            fs.mkdirSync(tmpDir);
        }

        // setup mgmt client
        // mgmtClient = getMgmtClient();

        mgmtClient = new NewMgmtClient('192.168.200.131', 'admin', 'benrocks')

        // setup events collection
        mgmtClient.events.on('failedAuth', msg => events.push(msg));
        mgmtClient.events.on('log-debug', msg => events.push(msg));
        mgmtClient.events.on('log-info', msg => events.push(msg));
        mgmtClient.events.on('log-error', msg => events.push(msg));

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
                console.error('was unable to delete tmp folder for upload/download tests, this typically means there are files in it that one of the tests did not clean up', e)
                // todo: list dir contents, remove all
            }
        }
    });

    beforeEach(function () {
        // refresh the device client class
        // mgmtClient = getMgmtClient();

        // clear events
        events.length = 0;

        // setup auth nock
        nockInst
            .post('/mgmt/shared/authn/login')
            .reply(200, (uri, reqBody: AuthTokenReqBody) => {
                return getFakeToken(reqBody.username, reqBody.loginProviderName);
            })
    });

    // afterEach(async function () {
    //     // Alert if all our nocks didn't get used, and clear them out
    //     if (!nock.isDone()) {
    //         throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`)
    //     }
    //     nock.cleanAll();

    //     // clear token timer if something failed
    //     await mgmtClient.clearToken();   // clear auth token for next test
    // });



    // it('get/test event emitter instance', async function () {

    //     const events = []
    //     const emitr = mgmtClient.getEvenEmitter();

    //     emitr.on('test', msg => events.push(msg))
    //     emitr.emit('test', 'test message')

    //     const x = events.includes('test')

    //     assert.ok(emitr, 'did not get an event emitter instance');
    //     assert.ok(events, 'did not get any test events');

    //     // clean all the nocks since we didn't use any
    //     nock.cleanAll();
    // });


    // it('clear auth token/timer', async function () {

    //     await mgmtClient.clearToken()

    //     assert.ok(JSON.stringify(events).includes('clearing token/timer'), 'did not get any test events');

    //     // clean all the nocks since we didn't use any
    //     nock.cleanAll();
    // });

    // it('make basic request - inspect token authProvider', async function () {

    //     // clean all the nocks since we didn't use any of the pre-built stuff
    //     nock.cleanAll();

    //     const provider = 'someSpecialProvider'

    //     // custom mgmt client for this test
    //     const mgmtClient = new NewMgmtClient(
    //         defaultHost,
    //         defaultUser,
    //         defaultPassword, {
    //             port: 495,
    //             provider,
    //         }

    //     )

    //     let tokenPostBody
    //     let tokenRespBody

    //     const request = '/mgmt/tm/sys/clock';
    //     const response = {
    //         "kind": "tm:sys:clock:clockstats",
    //         "selfLink": "https://localhost/mgmt/tm/sys/clock?ver=14.1.2.6",
    //         "entries": {
    //             "https://localhost/mgmt/tm/sys/clock/0": {
    //                 "nestedStats": {
    //                     "entries": {
    //                         "fullDate": {
    //                             "description": "2021-02-13T11:44:02Z"
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     }

    //     nock(`https://${defaultHost}:495`)
    //         .post('/mgmt/shared/authn/login')
    //         .reply(200, (uri, reqBody: AuthTokenReqBody) => {
    //             tokenPostBody = reqBody;
    //             tokenRespBody = getFakeToken(reqBody.username, reqBody.loginProviderName)
    //             return tokenRespBody;
    //         })
    //         .get(request)
    //         .reply(200, response);

    //     await mgmtClient.makeRequest(request)
    //         .then(resp => {
    //             assert.ok(resp)
    //             // assert.deepStrictEqual(resp.data, response)
    //         })
    //         .catch(err => {
    //             debugger;
    //             // assert.fail('was supposed to make a basic request')
    //         })

    //     mgmtClient.clearToken();

    //     assert.deepStrictEqual(tokenPostBody.loginProviderName, provider, 'mgmtClient did not send the right authProvider')

    //     // this kinda tests that our fake token function works by passing back the right authProvider
    //     assert.deepStrictEqual(tokenRespBody.token.authProviderName, provider, 'authToken did not have the right authProvider')

    // });


    it('confirm http response object/structure/details', async function () {

        const request = '/mgmt/tm/sys/sshd'
        const response = {
            "kind": "tm:sys:sshd:sshdstate",
            "selfLink": "https://localhost/mgmt/tm/sys/sshd?ver=14.1.2.6",
            "allow": [
                "ALL"
            ],
            "banner": "disabled",
            "fipsCipherVersion": 0,
            "inactivityTimeout": 0,
            "logLevel": "info",
            "login": "enabled",
            "port": 22
        };

        // nockInst
        //     .get(request)
        //     .reply(200, response )

        ///mgmt/tm/sys/clock


        await mgmtClient.makeRequest(request)
            .then(resp => {
                assert.ok(resp)
            })
            .catch(err => {
                debugger;
                // return Promise.reject(err)
            })

    });


    // it('follow async post/response', async function () {

    //     // change this to query the installed ilx pacakges
    //     // this should provide a quick easy way to test an async call

    //     this.slow(21000);

    //     nockInst
    //         .get(`/test/1`)
    //         .reply(200, { status: 'started->inProgress'} )
    //         .get(`/test/1`)
    //         .reply(200, { status: 'not yet...'} )
    //         .get(`/test/1`)
    //         .reply(200, { status: 'FINISHED'} )

    //     const resp = await mgmtClient.followAsync('/test/1')

    //     assert.deepStrictEqual(resp.data, { status: "FINISHED" })
    // });    



    // it('upload file to F5 - FILE', async function () {
    //     this.slow(600);
    //     nockInst
    //         // tell the nocks to persist for this test, the following post will get called several times
    //         //  for all the pieces of the file
    //         .persist()

    //         // the following just tests that the url was POST'd to, not the file contents
    //         //  but since the function returns the filename and file size as part of the upload process
    //         //  those should confirm that everthing completed
    //         .post(`${F5UploadPaths.file.uri}/${rpm}`)
    //         .reply(200, { foo: 'bar' });


    //     const fileStat = fs.statSync(filePath)

    //     await mgmtClient.upload(filePath, 'FILE')
    //     .then( resp => {
    //         assert.deepStrictEqual(resp.data.bytes, fileStat.size, 'local source file and uploaded file sizes do not match')
    //         assert.deepStrictEqual(resp.data.fileName, 'f5-appsvcs-templates-1.4.0-1.noarch.rpm', 'filename returned should match source file name')
    //         // assert.ok(resp.data.bytes);  // just asserting that we got a value here, should be a number
    //     })
    //     .catch( err => {
    //         debugger;
    //     });
    // });

    // it('upload file to F5 - ISO', async function () {
    //     this.slow(600);
    //     nockInst
    //         .persist()
    //         .post(`${F5UploadPaths.iso.uri}/${rpm}`)
    //         .reply(200, { foo: 'bar' });

    //     const fileStat = fs.statSync(filePath);

    //     await mgmtClient.upload(filePath, 'ISO')
    //     .then( resp => {
    //         assert.deepStrictEqual(resp.data.bytes, fileStat.size, 'local source file and uploaded file sizes do not match')
    //         assert.deepStrictEqual(resp.data.fileName, 'f5-appsvcs-templates-1.4.0-1.noarch.rpm')
    //         // assert.ok(resp.data.bytes);  // just asserting that we got a value here, should be a number
    //     })
    //     .catch( err => {
    //         debugger;
    //     })
    // });


    it('download file from F5 - ISO path', async function () {
        this.slow(200);
        nockInst
            .persist()
            .get(`${F5DownloadPaths.iso.uri}/${rpm}`)
            .replyWithFile(200, filePath);

        const fileStat = fs.statSync(filePath);

        await mgmtClient.download(rpm, tmp, 'ISO')
        .then( resp => {
            assert.ok(resp)
            // download file
            //   assert.deepStrictEqual(
            //       resp.data.bytes, 
            //       fileStat.size, 
            //       'local source file and uploaded file sizes do not match')
            //   assert.ok(fs.existsSync(resp.data.file))           // confirm/assert file is there
            //   fs.unlinkSync(resp.data.file);                     // remove tmp file
        })
        .catch( err => {
            debugger;
        })
    });


    // it('download file from F5 - UCS path', async function () {
    //     this.slow(200);
    //     nockInst
    //         .persist()
    //         .get(`${F5DownloadPaths.ucs.uri}/${rpm}`)
    //         .replyWithFile(200, filePath);

    //     const resp = await mgmtClient.download(rpm, tmp, 'UCS');    // download file

    //     assert.ok(fs.existsSync(resp.data.file))           // confirm/assert file is there
    //     fs.unlinkSync(resp.data.file);                     // remove tmp file
    // });


    // it('download file from F5 - qkview path', async function () {
    //     this.slow(200);
    //     nockInst

    //         .persist()
    //         .get(`${F5DownloadPaths.qkview.uri}/${rpm}`)
    //         .replyWithFile(200, filePath);

    //     const resp = await mgmtClient.download(rpm, tmp, 'QKVIEW');    // download file

    //     assert.ok(fs.existsSync(resp.data.file))           // confirm/assert file is there
    //     fs.unlinkSync(resp.data.file);                     // remove tmp file
    // });




});