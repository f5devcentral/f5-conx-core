
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
import { exec } from 'child_process';
import { HttpResponse } from '../src/utils/httpModels';
import Logger from '../src/logger';
import { ExtHttp } from '../src/externalHttps';
import { EventEmitter } from 'events';

let device: F5Client;


// tmp directory
const tmpDir = path.join(__dirname, 'tmp')
// destination test path with file name
// const tmp = path.join(tmpDir, tmpUcs)

const conxLog = new Logger('F5_CONX_CORE_LOG_LEVEL');
const eventer = new EventEmitter();
const extHttp: ExtHttp = new ExtHttp({ rejectUnauthorized: false, eventEmitter: eventer });

exec('/path/to/test file/test.');


eventer
    .on('log-http-request', msg => conxLog.httpRequest(msg))
    .on('log-http-response', msg => conxLog.httpResponse(msg))
    .on('log-debug', msg => conxLog.debug(msg))
    .on('log-info', msg => conxLog.info(msg))
    .on('log-warn', msg => conxLog.warn(msg))
    .on('log-error', msg => conxLog.error(msg))
    .on('failedAuth', msg => {
        conxLog.error('Failed Authentication Event!', msg);
    });

describe('f5 mock test service - tmos routes tests', function () {




    it('create mini ucs on f5', async function () {


        device = new F5Client(
            'localhost',
            'goodUser',
            'goodPassword',
            {
                port: 8843,
            },
            eventer,
            extHttp
        )

        await device
            .discover()
            .then(disc => {
                conxLog.info('connected', disc, '\n');
            })
            .catch(err => {
                conxLog.error('connect err', err);
            })

        // assert that the response included an expected file name format
        assert.ok(1);
    });



});