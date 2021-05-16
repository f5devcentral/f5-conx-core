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
import { ExtHttp } from '../src/externalHttps';

const testHost = 'nockTestApi'
let extHttp: ExtHttp;
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



describe('ExtHttps class tests', function () {


    before(function () {

        // setup nock
        nockScope = nock(`https://${testHost}`)

        // instantiate new client
        extHttp = new ExtHttp();

        // setup event capture
        extHttp.events.on('log-debug', msg => events.push(msg));
        extHttp.events.on('log-info', msg => events.push(msg));
        extHttp.events.on('log-error', msg => events.push(msg));
    });

    afterEach(function () {
        events.length = 0;
    })



    it('create instance with rejectUnauthorized - make test call', async () => {

        nockScope
            .post('/post')
            .reply(function (uri, body) {
                return [
                    200,
                    body,
                ]
            })

        // instantiate new client
        const newExtHttp = new ExtHttp({ rejectUnauthorized: false });

        await newExtHttp.makeRequest({
            url: `https://${testHost}/post`,
            method: "POST",
            data: {
                hi: "yo"
            }
        })
            .then(resp => {

                assert.deepStrictEqual(resp.data, { hi: "yo" })
                // There is really no good way to test this since it's an internal setting we pass to axios that we can't really see later in any call, furthermore, with nock, there all requests are probably made with a self-signed cert and the testing framework is setting this setting anyway.  But this test will actually make sure the setting can be set and doesn't cause any errors
            })
            .catch(err => {
                debugger;
                return Promise.reject(err)
            })
    })




    it('make simple https get', async () => {

        nockScope
            .get('/random')
            .reply(200, { value: 'something' })


        await extHttp.makeRequest({
            url: `https://${testHost}/random`
        })
            .then(resp => {

                assert.deepStrictEqual(resp.data.value, 'something')
            })
            .catch(err => {
                debugger;
                return Promise.reject(err)
            })


    });


    it('make simple https get - insert header', async () => {

        nockScope
            .get('/get')
            .reply(function (uri, body) {
                return [
                    200,
                    { value: 'something' },
                    {
                        headerone: this.req.headers['headerone'],
                        "user-agent": this.req.headers['user-agent']
                    },
                ]
            })

        await extHttp.makeRequest({
            url: `https://${testHost}/get`,
            headers: {
                headerOne: 'toK3n'
            }
        })
            .then(resp => {

                assert.deepStrictEqual(resp.headers['user-agent'], 'F5 Conx Core')
                assert.deepStrictEqual(resp.headers['headerone'], 'toK3n')
            })
            .catch(err => {
                debugger;
                return Promise.reject(err)
            })
    })



    it('make simple https post', async () => {

        nockScope
            .post('/post')
            .reply(function (uri, body) {
                return [
                    200,
                    body,
                ]
            })

        await extHttp.makeRequest({
            url: `https://${testHost}/post`,
            method: "POST",
            data: {
                hi: "yo"
            }
        })
            .then(resp => {

                assert.deepStrictEqual(resp.data, { hi: "yo" })
                assert.deepStrictEqual(events.length, 2, 'should only have req/resp (2) events')
            })
            .catch(err => {
                debugger;
                return Promise.reject(err)
            })
    })




    it('download file', async function () {

        this.slow(1000);

        nockScope
            .get(`/${rpm}`)
            .replyWithFile(200, filePath);

        const url = `https://${testHost}/${rpm}`;

        await extHttp.download(url)
            .then(resp => {

                // assert it downloaded the file we wanted
                assert.deepStrictEqual(path.parse(resp.data.file).base, rpm)

                // assert that the file is local
                assert.ok(fs.existsSync(resp.data.file))
                fs.unlinkSync(resp.data.file);  // now delete file
            })
            .catch(err => {
                debugger;
                // throw err;
            });
    });




    it('upload file', async function () {
        this.slow(1000);

        // this is just a general test to uploading a file with this project

        nockScope
            .persist()
            .post(`/upload/${rpm}`)
            .reply(200, { upload: 'successful' });

        const url = `https://${testHost}/upload/${rpm}`;

        await extHttp.upload(url, filePath)
            .then(resp => {
                // assert that the function completed and returned expected details
                assert.deepStrictEqual(resp.data.fileName, rpm)
                assert.ok(resp.data.bytes > 100)

            })
            .catch(err => {
                debugger;
                return Promise.reject(err)
            });

    });

});