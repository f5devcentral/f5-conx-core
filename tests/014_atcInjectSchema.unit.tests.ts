/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import assert from 'assert';

import Logger from '../src/logger';
import { injectSchema } from '../src/bigip/atcSchema'
import { as3ExampleDec } from '../src/bigip/as3Models';
import { doExampleDec, deviceExampleDec } from '../src/bigip/doModels';
import { tsExampleDec } from '../src/bigip/tsModels';
import { atcMetaData } from '../src/constants';
import { cfExampleDec } from '../src/bigip/cfModels';

const logger = new Logger('F5_CONX_CORE_LOG_LEVEL');
logger.console = false;

let workingDec;
const simpleDec = {
    "some": "thing"
};

describe('atc injectSchema Unit Tests', function () {
    
    before(function () {
        // log test file name - makes it easer for troubleshooting
        console.log('       file:', __filename)
    })
    
    beforeEach(function() {
        // runs before each test in this block\
        logger.clearLogs();
      });


    it('not valid atc declaration, NO logger', async function () {

        // clone example declaration
        workingDec = Object.assign({}, simpleDec)

        const addedSchemaDec = await injectSchema(workingDec)
        
        assert.ok(!addedSchemaDec.$schema);
        assert.deepStrictEqual(addedSchemaDec, simpleDec);
        assert.ok(logger.journal.length === 0)
    });
    
    it('not valid atc declaration, with logger', async function () {
        
        // clone example declaration
        workingDec = Object.assign({}, simpleDec)
        
        const addedSchemaDec = await injectSchema(workingDec, logger)
        
        assert.ok(!addedSchemaDec.$schema);
        assert.ok(logger.journal.length === 1)
        assert.ok(logger.journal[0].includes('valid json, but not f5 atc declaration -> no change'))
        assert.deepStrictEqual(addedSchemaDec, simpleDec);
    });

    it('add as3 schema, NO logger', async function () {

        // clone example declaration
        workingDec = Object.assign({}, as3ExampleDec)

        // remove the schema reference
        delete workingDec.$schema;

        const addedSchemaDec = await injectSchema(workingDec)
        
        // assert schema is correct
        assert.ok(addedSchemaDec.$schema === atcMetaData.as3.schema);
        
        // make sure we still have "declaration" key
        assert.ok(addedSchemaDec.declaration);

        assert.ok(logger.journal.length === 0)
    });


    it('add as3 schema with logger', async function () {

        workingDec = Object.assign({}, as3ExampleDec)
        delete workingDec?.$schema

        workingDec = await injectSchema(workingDec, logger)

        assert.ok(workingDec.$schema === atcMetaData.as3.schema);
        assert.ok(logger.journal.length > 0)
    });


    it('add/remove as3 schema, NO logger', async function () {

        workingDec = Object.assign({}, as3ExampleDec)
        delete workingDec?.$schema

        workingDec = await injectSchema(workingDec)
        assert.ok(workingDec.$schema === atcMetaData.as3.schema);

        workingDec = await injectSchema(workingDec)
        assert.ok(!workingDec.$schema);
        assert.ok(logger.journal.length === 0)
    });
    
    
    it('add/remove as3 schema with logger', async function () {

        workingDec = Object.assign({}, as3ExampleDec)
        delete workingDec?.$schema

        workingDec = await injectSchema(workingDec, logger)
        assert.ok(workingDec.$schema === atcMetaData.as3.schema);

        workingDec = await injectSchema(workingDec, logger)
        assert.ok(!workingDec.$schema);
        assert.ok(logger.journal.length > 0)
    });


    it('add/remove do schema, NO logger', async function () {

        workingDec = Object.assign({}, doExampleDec)
        delete workingDec?.$schema

        workingDec =  await injectSchema(workingDec)
        assert.ok(workingDec.$schema === atcMetaData.do.parentSchema);
        
        workingDec =  await injectSchema(workingDec)
        assert.ok(!workingDec.$schema);
        assert.ok(logger.journal.length === 0)
    });


    it('add/remove do schema with logger', async function () {

        workingDec = Object.assign({}, doExampleDec)
        delete workingDec?.$schema

        workingDec =  await injectSchema(workingDec, logger)
        assert.ok(workingDec.$schema === atcMetaData.do.parentSchema);
        
        workingDec =  await injectSchema(workingDec, logger)
        assert.ok(!workingDec.$schema);
        assert.ok(logger.journal.length > 0)
    });


    it('add/remove do/device schema, MO logger', async function () {

        workingDec = Object.assign({}, deviceExampleDec)
        delete workingDec?.$schema

        workingDec =  await injectSchema(workingDec)
        assert.ok(workingDec.$schema === atcMetaData.do.schema);
        
        workingDec =  await injectSchema(workingDec)
        assert.ok(!workingDec.$schema);
        assert.ok(logger.journal.length === 0)
    });


    it('add/remove do/device schema with logger', async function () {

        workingDec = Object.assign({}, deviceExampleDec)
        delete workingDec?.$schema

        workingDec =  await injectSchema(workingDec, logger)
        assert.ok(workingDec.$schema === atcMetaData.do.schema);
        
        workingDec =  await injectSchema(workingDec, logger)
        assert.ok(!workingDec.$schema);
        assert.ok(logger.journal.length > 0)
    });


    it('add/remove ts schema, NO logger', async function () {

        workingDec = Object.assign({}, tsExampleDec)
        delete workingDec?.$schema

        workingDec =  await injectSchema(workingDec)
        assert.ok(workingDec.$schema === atcMetaData.ts.schema);
        
        workingDec =  await injectSchema(workingDec)
        assert.ok(!workingDec.$schema);
        assert.ok(logger.journal.length === 0)
    });


    it('add/remove ts schema with logger', async function () {

        workingDec = Object.assign({}, tsExampleDec)
        delete workingDec?.$schema

        workingDec =  await injectSchema(workingDec, logger)
        assert.ok(workingDec.$schema === atcMetaData.ts.schema);
        
        workingDec =  await injectSchema(workingDec, logger)
        assert.ok(!workingDec.$schema);
        assert.ok(logger.journal.length > 0)
    });


    it('add/remove cf schema, NO logger', async function () {

        workingDec = Object.assign({}, cfExampleDec)
        delete workingDec?.$schema

        workingDec =  await injectSchema(workingDec)
        assert.ok(workingDec.$schema === atcMetaData.cf.schema);
        
        workingDec =  await injectSchema(workingDec)
        assert.ok(!workingDec.$schema);
        assert.ok(logger.journal.length === 0)
    });


    it('add/remove cf schema with logger', async function () {

        workingDec = Object.assign({}, cfExampleDec)
        delete workingDec?.$schema

        workingDec =  await injectSchema(workingDec, logger)
        assert.ok(workingDec.$schema === atcMetaData.cf.schema);
        
        workingDec =  await injectSchema(workingDec, logger)
        assert.ok(!workingDec.$schema);
        assert.ok(logger.journal.length > 0)
    });
    

});