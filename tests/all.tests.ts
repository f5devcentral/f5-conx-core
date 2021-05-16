/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

/**
 * This test suite is a mix of unit/integration tests
 * It starts with basic unit testing of components, then builds up into integration testing
 * higher level components
 */

import path from "path"
import fs from 'fs';
import { TMP_DIR } from '../src/constants'

// source file with path
// const filePath = path.join(__dirname, 'artifacts', tmpUcs)
// tmp directory
const tmpDir = path.join(__dirname, '..', TMP_DIR)
const cacheDir = path.join(process.cwd(), TMP_DIR)

 // set env vars for the tests
process.env.F5_CONX_CORE_CACHE = cacheDir
// process.env.F5_CONX_CORE_TCP_TIMEOUT = "3000"
process.env.F5_CONX_CORE_LOG_LEVEL = "debug"
process.env.F5_CONX_CORE_LOG_BUFFER = "true"
process.env.F5_CONX_CORE_LOG_CONSOLE = "false"

// removes conflict from vscode-f5 developement
delete process.env.F5_CONX_CORE_EXT_HTTP_AGENT;

// unit test example logger class
require('./logger.unit.tests')

// unit test external http functions
require('./extHttp.unit.tests')

// unit test get atc versions information
require('./atcVersionsClient.unit.tests')

// // // // // unit test iHealth client class (extends external https class)
// // // // require('./iHealth.unit.tests')

// unit test core mgmtClient failures
require('./mgmtClient.failures.unit.test')


// unit test core mgmtClient
require('./mgmtClient.unit.tests')


// f5Client testing
//  - instantiation
//  - discovery
//  - events

// some basic testing of IPv6 usage
require('./f5Client_ipv6.int.tests')


// ucs sub-class tests 
require('./f5Client_ucs.int.tests')

// qkview sub-class tests 
require('./f5Client_qkview.int.tests')



// ###############################
// unit test atc ilx rpm mgmt (versions/download/upload/install/unInstall)
require('./f5Client_atcMgmt.int.tests')
// ###############################



// AS3 class tests
require('./as3Client.int.tests')

// // fast class tests
// require('./fastClient.unit.tests')

// // do class tests
// require('./doClient.unit.tests')

// // ts class tests
// require('./tsClient.unit.tests')

// // cf class tests
// require('./cfClient.unit.tests')


before(async function () {
    if (!fs.existsSync(tmpDir)) {
        console.log('creating temp directory for file upload/download tests')
        fs.mkdirSync(tmpDir);
    }

});

// runs once after the last test in this block
after(function () {
    // if the tmp directory exits, try to delete it
    //  - should be empty, each test should clean up files as needed
    if (fs.existsSync(tmpDir)) {
        try {
            console.log('deleting temp directory for file upload/download tests')
            fs.rmdirSync(tmpDir);
        } catch (e) {
            console.error('was unable to delete tmp folder for upload/download tests, this typically means there are files in it that one of the tests did not clean up', e)
            // todo: list dir contents, remove all
        }
    }
});
