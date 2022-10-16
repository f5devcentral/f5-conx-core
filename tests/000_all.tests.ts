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
// const tmpDir = path.join(__dirname, '..', TMP_DIR)
const cacheDir = path.join(process.cwd(), TMP_DIR)

 // set env vars for the tests
process.env.F5_CONX_CORE_CACHE = cacheDir
// process.env.F5_CONX_CORE_TCP_TIMEOUT = "3000"
process.env.F5_CONX_CORE_LOG_LEVEL = "debug"
process.env.F5_CONX_CORE_LOG_BUFFER = "true"
process.env.F5_CONX_CORE_LOG_CONSOLE = "false"

// removes conflict from vscode-f5 developement
delete process.env.F5_CONX_CORE_EXT_HTTP_AGENT;

// tmp directory
const tmpDir = path.join(__dirname, 'tmp')


before(async function () {

    // remove temp dir if present
    if (fs.existsSync(tmpDir)) {
        console.log(`deleting ${tmpDir} directory/files to prepare for tests`)
        // fs.rmSync(tmpDir, { recursive: true, force: true });
    
    }

    // recreate temp dir
    if (!fs.existsSync(tmpDir)) {
        console.log(`creating ${tmpDir} directory for file upload/download tests`)
        fs.mkdirSync(tmpDir);
    }

});

// // unit test example logger class
// require('./010_logger.unit.tests')

// // unit test external http functions
// require('./011_extHttp.unit.tests')

// // unit test get atc versions information
// require('./012_atcVersionsClient.unit.tests')

// // unit test get atc versions information
// require('./013_atcDecAgent.unit.tests')

// // unit test get atc versions information
// require('./014_atcSchema.unit.tests')

// // // // // // unit test iHealth client class (extends external https class)
// // // // // require('./iHealth.unit.tests')






// // unit test core mgmtClient failures
// require('./040_mgmtClient.failures.unit.test')

// // unit test core mgmtClient
// require('./044_mgmtClient.unit.tests')

// // unit test core mgmtClient
// require('./046_mgmtClient_UCS.unit.tests')







// // f5Client testing
// //  - instantiation
// //  - discovery
// //  - events

// // some basic testing of IPv6 usage
// require('./060_f5Client_ipv6.int.tests')

// // ucs sub-class tests 
// require('./062_f5Client_ucs.int.tests')

// // qkview sub-class tests 
// require('./064_f5Client_qkview.int.tests')



// // ###############################
// // unit test atc ilx rpm mgmt (versions/download/upload/install/unInstall)
// require('./066_f5Client_atcMgmt.int.tests')
// // ###############################



// // AS3 class tests
// require('./070_as3Client.int.tests')

// // // fast class tests
// // require('./072_fastClient.unit.tests')

// // // do class tests
// // require('./074_doClient.unit.tests')

// // // ts class tests
// // require('./076_tsClient.unit.tests')

// // // cf class tests
// require('./078_cfClient.int.tests')




// // runs once after the last test in this block
// after(function () {
//     // if the tmp directory exits, try to delete it
//     //  - should be empty, each test should clean up files as needed
//     if (fs.existsSync(tmpDir)) {
//         try {
//             console.log('deleting temp directory for file upload/download tests')
//             fs.rmdirSync(tmpDir);
//         } catch (e) {
//             console.error('was unable to delete tmp folder for upload/download tests, this typically means there are files in it that one of the tests did not clean up', e)
//             // todo: list dir contents, remove all
//         }
//     }
// });
