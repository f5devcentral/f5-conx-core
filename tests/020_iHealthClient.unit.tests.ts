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

import { TMP_DIR } from '../src/constants'
import { IhealthClient } from '../src/iHealthClient';
import { isArray } from '../src/utils/misc';

const testHost = 'nockTestApi'
let iHealthClient: IhealthClient;
const events = [];

let nockScope: nock.Scope;

// test file name
const rpm = 'f5-appsvcs-templates-1.4.0-1.noarch.rpm';
// source file with path
const filePath = path.join(__dirname, 'artifacts', rpm)
// tmp directory
// const tmpDir = path.join(__dirname, 'tmp')
const tmpDir = path.join(__dirname, TMP_DIR)
// destination test path with file name
const tmp = path.join(tmpDir, rpm)



describe('IhealthClient class unit tests', function () {


    before(function () {
        // log test file name - makes it easer for troubleshooting
        console.log('       file:', __filename)

        // removes conflict from vscode-f5 developement
        delete process.env.F5_CONX_CORE_EXT_HTTP_AGENT;

        // setup nock
        // nockScope = nock(`https://${testHost}`)

        // instantiate new client
        iHealthClient = new IhealthClient('testies@v4.com', 'asdf');

        // setup event capture
        iHealthClient.events
            .on('log-http-request', msg => events.push(msg))
            .on('log-http-response', msg => events.push(msg))
            .on('log-debug', msg => events.push(msg))
            .on('log-info', msg => events.push(msg))
            .on('log-warn', msg => events.push(msg))
            .on('log-error', msg => events.push(msg));
    });

    // afterEach(function () {
    //     events.length = 0;
    // })



    it('create instance with rejectUnauthorized - make test call', async () => {

        // nockScope
        //     .post('/post')
        //     .reply(function (uri, body) {
        //         return [
        //             200,
        //             body,
        //         ]
        //     })

        // instantiate new client
        // const newExtHttp = new ExtHttp({ rejectUnauthorized: false });

        const id = await iHealthClient.listQkviews()
            .then(resp => {

                // const x = isArray(resp.data.id)

                assert.ok(1)
                // example response
                const respData = {
                    id: [
                        "55555555",
                    ],
                }
                // return resp.data.id[0]
            })
        .catch(err => {
            debugger;
            return Promise.reject(err)
        })


        // await iHealthClient.qkviewMetaData(id)
        // .then(resp => {
        //     assert.ok(1)
        // })
    })




    // it('make simple https get', async () => {

    //     nockScope
    //         .get('/random')
    //         .reply(200, { value: 'something' })


    //     await extHttp.makeRequest({
    //         url: `https://${testHost}/random`
    //     })
    //         .then(resp => {

    //             assert.deepStrictEqual(resp.data.value, 'something')
    //         })
    //         .catch(err => {
    //             debugger;
    //             return Promise.reject(err)
    //         })


    // });


    // it('make simple https get - insert header', async () => {

    //     nockScope
    //         .get('/get')
    //         .reply(function (uri, body) {
    //             return [
    //                 200,
    //                 { value: 'something' },
    //                 {
    //                     headerone: this.req.headers['headerone'],
    //                     "user-agent": this.req.headers['user-agent']
    //                 },
    //             ]
    //         })

    //     await extHttp.makeRequest({
    //         url: `https://${testHost}/get`,
    //         headers: {
    //             headerOne: 'toK3n'
    //         }
    //     })
    //         .then(resp => {

    //             assert.deepStrictEqual(resp.headers['user-agent'], 'F5 Conx Core')
    //             assert.deepStrictEqual(resp.headers['headerone'], 'toK3n')
    //         })
    //         .catch(err => {
    //             debugger;
    //             return Promise.reject(err)
    //         })
    // })



    // it('make simple https post', async () => {

    //     nockScope
    //         .post('/post')
    //         .reply(function (uri, body) {
    //             return [
    //                 200,
    //                 body,
    //             ]
    //         })

    //     await extHttp.makeRequest({
    //         url: `https://${testHost}/post`,
    //         method: "POST",
    //         data: {
    //             hi: "yo"
    //         }
    //     })
    //         .then(resp => {

    //             assert.deepStrictEqual(resp.data, { hi: "yo" })
    //             assert.deepStrictEqual(events.length, 2, 'should only have req/resp (2) events')
    //         })
    //         .catch(err => {
    //             debugger;
    //             return Promise.reject(err)
    //         })
    // })




    // it('download file', async function () {

    //     this.slow(1000);

    //     nockScope
    //         .get(`/${rpm}`)
    //         .replyWithFile(200, filePath);

    //     const url = `https://${testHost}/${rpm}`;

    //     await extHttp.download(url)
    //         .then(resp => {

    //             // assert it downloaded the file we wanted
    //             assert.deepStrictEqual(path.parse(resp.data.file).base, rpm)

    //             // assert that the file is local
    //             assert.ok(fs.existsSync(resp.data.file))
    //             fs.unlinkSync(resp.data.file);  // now delete file
    //         })
    //         .catch(err => {
    //             debugger;
    //             // throw err;
    //         });
    // });




    // it('upload file', async function () {
    //     this.slow(1000);

    //     // this is just a general test to uploading a file with this project

    //     nockScope
    //         .persist()
    //         .post(`/upload/${rpm}`)
    //         .reply(200, { upload: 'successful' });

    //     const url = `https://${testHost}/upload/${rpm}`;

    //     await extHttp.upload(url, filePath)
    //         .then(resp => {
    //             // assert that the function completed and returned expected details
    //             assert.deepStrictEqual(resp.data.fileName, rpm)
    //             assert.ok(resp.data.bytes > 100)

    //         })
    //         .catch(err => {
    //             debugger;
    //             return Promise.reject(err)
    //         });

    // });

});




const exampleQkview = {
    files: "https://ihealth-api.f5.com/qkview-analyzer/api/qkviews/55555555/files",
    commands: "https://ihealth-api.f5.com/qkview-analyzer/api/qkviews/55555555/commands",
    bigip: "https://ihealth-api.f5.com/qkview-analyzer/api/qkviews/55555555/bigip",
    gui_uri: "https://ihealth.f5.com/qkview-analyzer/qv/55555555",
    primary_blade_uri: null,
    chassis_serial: "NWGPCKG",
    hostname: "dev01.lab.io",
    visible_in_gui: "true",
    description: "dev01_10.10.2020.qkview",
    f5_support_case: "",
    entitlement: {
      expiration_date: null,
      days_left: null,
    },
    generation_date: 1602324468000,
    upload: {
      performed_by: {
        name: "Awesome F5 User",
        email: "a.f5.user@v4.com",
      },
      date: 1640608128000,
    },
    expiration_date: 1643200128000,
    processing_status: "COMPLETE",
    processing_messages: "",
    file_size: 135522910,
    file_name: "dev01_10.10.2020.qkview",
    diagnostics: "https://ihealth-api.f5.com/qkview-analyzer/api/qkviews/55555555/diagnostics",
    secondary_blade_uri: null,
    id: "55555555",
  }