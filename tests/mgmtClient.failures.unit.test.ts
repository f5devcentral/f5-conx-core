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

import { defaultHost, getFakeToken, getMgmtClient } from '../src/utils/testingUtils';
import { failedAuthResp } from './artifacts/authToken';
import { MgmtClient } from '../src/bigip/mgmtClient';
import { AuthTokenReqBody } from '../src/bigip/bigipModels';


describe('mgmtClient tests - failures', async function () {

    before( async function () {
        // set timeout for testing
        process.env.F5_CONX_CORE_TCP_TIMEOUT = "10000"
    })

    after( async function () {
        // un-set timeout after these tests
        delete process.env.F5_CONX_CORE_TCP_TIMEOUT
    })

    afterEach(async function () {
        // Alert if all our nocks didn't get used, and clear them out
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`)
        }
        nock.cleanAll();
    });



    it('fail tcp connection', async function () {
        // here we use the same mocking as evertyhing else, but
        // delay the connection more than tcp timeout, nock will 
        // pre-empt the timeout.  timeout set with env vars
        // https://github.com/nock/nock#delay-the-connection
        nock(`https://192.0.0.1:8443`)
        .post('/mgmt/shared/authn/login')
        .delayConnection(60000)
        .reply(200, (uri, reqBody: AuthTokenReqBody) => {
            return getFakeToken(reqBody.username, reqBody.loginProviderName);
        })
        // .get('/foo')
        // .reply(200, { foo: 'bar' });

        const eventsLocal = [];
        const mgmtClientLocal = new MgmtClient(
            '192.0.0.1',
            'admin',
            'pasdnqer',
            {
                port: 8443
            }
        )

        mgmtClientLocal.events.on('failedAuth', msg => eventsLocal.push(msg));
        mgmtClientLocal.events.on('log-debug', msg => eventsLocal.push(msg));
        mgmtClientLocal.events.on('log-info', msg => eventsLocal.push(msg));
        mgmtClientLocal.events.on('log-error', msg => eventsLocal.push(msg));

        await mgmtClientLocal.makeRequest('/foo')
            .then( resp => {
             // look at response
             debugger;
            })
            .catch(err => {
                // if this test failed, check events to see why
                // examples:
                // 'token request failed: connect ETIMEDOUT 192.0.0.1:8443'
                // 'token request failed: timeout of 10000ms exceeded'
                assert.ok(eventsLocal[eventsLocal.length - 1].includes('token request failed'))
            })

    });

    it('fail host dns resolve', async function () {

        const eventsLocal = [];
        const mgmtClientLocal = new MgmtClient(
            'bigip1.asdfqwer.io',
            'admin',
            'pasdnqer',
            {
                port: 8443
            }
        )

        mgmtClientLocal.events.on('failedAuth', msg => eventsLocal.push(msg));
        mgmtClientLocal.events.on('log-debug', msg => eventsLocal.push(msg));
        mgmtClientLocal.events.on('log-info', msg => eventsLocal.push(msg));
        mgmtClientLocal.events.on('log-error', msg => eventsLocal.push(msg));

        await mgmtClientLocal.makeRequest('/foo')
            // .then( resp => {
            //  // look at response
            // })
            .catch(err => {
                // if this test failed, check events to see why
                // debugger;
            })

        assert.ok(eventsLocal.includes('token request failed: getaddrinfo ENOTFOUND bigip1.asdfqwer.io'))
    });

    it('fail auth', async function () {
        nock(`https://${defaultHost}`)
            .post('/mgmt/shared/authn/login')
            .reply(401, failedAuthResp)


        const eventsLocal = [];
        const mgmtClientLocal = getMgmtClient();

        // setup event listeners
        mgmtClientLocal.events.on('failedAuth', msg => eventsLocal.push(msg));
        mgmtClientLocal.events.on('log-debug', msg => eventsLocal.push(msg));
        mgmtClientLocal.events.on('log-info', msg => eventsLocal.push(msg));
        mgmtClientLocal.events.on('log-error', msg => eventsLocal.push(msg));

        await mgmtClientLocal.makeRequest('/foo')
            .then( resp => {
             // look at response
            })
            .catch(err => {
                // this should fail and provide an event why
                // debugger;
                assert.ok(JSON.stringify(eventsLocal).includes('Authentication failed.'))
            })

    });
});