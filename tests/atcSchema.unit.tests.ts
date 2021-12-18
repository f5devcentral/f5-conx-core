/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import Logger from '../src/logger';
import { injectSchema } from '../src/utils/atcSchema'
import assert from 'assert';
import { as3ExampleDec } from './artifacts/as3Mocks';
import { doExampleDec } from './artifacts/doMocks';
import { tsExampleDec } from './artifacts/tsMocks';

const logger = new Logger('F5_CONX_CORE_LOG_LEVEL');
logger.console = false;


let workingDec;
// delete the schema if there, just to standardize this test array

import { atcMetaData } from '../src';

describe('atcSchema Class Unit Tests', function () {
    
    beforeEach(function() {
        // runs before each test in this block\
        
      });


    it('add as3 schema, no logger', async function () {

        // clone example declaration
        workingDec = Object.assign({}, as3ExampleDec)

        // remove the schema reference
        delete workingDec.$schema;

        logger.clearLogs();
        
        const addedSchemaDec = await injectSchema(workingDec)
        
        assert.ok(addedSchemaDec.$schema === atcMetaData.as3.schema);
        assert.ok(logger.journal.length === 0)
    });


    it('add as3 schema with logger', async function () {

        workingDec = Object.assign({}, as3ExampleDec)
        delete workingDec?.$schema

        workingDec = await injectSchema(workingDec, logger)

        assert.ok(workingDec.$schema === atcMetaData.as3.schema);
        assert.ok(logger.journal.length > 0)
    });


    it('add/remove as3 schema with logger', async function () {
        // tests that atc type was detected and as3 schema injected

        workingDec = Object.assign({}, as3ExampleDec)
        delete workingDec?.$schema

        workingDec = await injectSchema(workingDec, logger)
        assert.ok(workingDec.$schema === atcMetaData.as3.schema);

        workingDec = await injectSchema(workingDec, logger)
        assert.ok(!workingDec.$schema);
        assert.ok(logger.journal.length > 0)
    });


    it('add/remove do schema with logger', async function () {
        // tests that atc type was detected and as3 schema injected

        workingDec = Object.assign({}, doExampleDec)
        delete workingDec?.$schema

        workingDec =  await injectSchema(workingDec, logger)
        assert.ok(workingDec.$schema === atcMetaData.do.schema);
        
        workingDec =  await injectSchema(workingDec, logger)
        assert.ok(!workingDec.$schema);
        assert.ok(logger.journal.length > 0)
    });


    it('add/remove ts schema with logger', async function () {
        // tests that atc type was detected and as3 schema injected

        workingDec = Object.assign({}, tsExampleDec)
        delete workingDec?.$schema

        workingDec =  await injectSchema(workingDec, logger)
        assert.ok(workingDec.$schema === atcMetaData.ts.schema);
        
        workingDec =  await injectSchema(workingDec, logger)
        assert.ok(!workingDec.$schema);
        assert.ok(logger.journal.length > 0)
    });
    



});