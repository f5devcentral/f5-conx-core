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
import assert from 'assert';

describe('Logger Class Unit Tests', function () {
    let logger: Logger;
    const envs = [];
    const consoleLogShadow = []
    // eslint-disable-next-line @typescript-eslint/ban-types
    let originalConsoleLog: Function;

    before(function () {
        logger = Logger.getLogger();

        // re-set the defaults
        logger.console = true;
        logger.buffer = true;

        // capture current log envs
        envs.push(...Object.entries(process.env)
        .filter( el => el[0].startsWith('F5_CONX_CORE_LOG_') ));

        // delete current log envs
        envs.forEach(el => delete process.env[el[0]] )

        // capture original console.log function
        originalConsoleLog = console.log;

        // redirect console output
        console.log = function(...data: any[]) {
            consoleLogShadow.push(...data)
        }

    });

    after( () => {

        // put all the loggin envs back 
        envs.forEach(el => process.env[el[0]] = el[1] )

        // put back the console.log redirect
        console.log = function (...data: any[]) {
            originalConsoleLog(...data);
        }
    })



    it('get logger instance', function () {
        logger = Logger.getLogger();
        assert.ok(logger);
    });


    it('confirm default - log to console', function () {
        // logger = Logger.getLogger();
        assert.strictEqual(logger.console, true);
    });


    it('confirm default - log to buffer/journal', function () {
        // logger = Logger.getLogger();
        assert.strictEqual(logger.buffer, true);
    });


    it('log debug message - fail', function () {
        logger.debug('should not be here since default loggin level is info')
        // process.env;
        assert.ok(logger.journal.length === 0);
    });



    it('log info message', function () {
        // the following also tests console output
        logger.info('our first log - this should be seen in console!!!')

        assert.ok(JSON.stringify(logger.journal).includes('[INFO]'));
    });


    it('check info message console redirect', function () {
        // the following also tests console output

        assert.ok(JSON.stringify(consoleLogShadow).includes('[INFO]'));
    });


    it('disable console output and log warning message', function () {

        // disable console logging
        process.env.F5_CONX_CORE_LOG_CONSOLE = 'false';

        logger.warning('a warning mesg');

        assert.ok(JSON.stringify(logger.journal).includes('[WARNING]'));
    });


    it('confirm console logging disabled', function () {
        assert.strictEqual(logger.console, false);
    });


    it('log error message', function () {

        logger.error('an error mesg');

        assert.ok(JSON.stringify(logger.journal).includes('[ERROR]'));
    });


    it('enable debug and log debug message', function () {

        // enable debug messages
        process.env.F5_CONX_CORE_LOG_LEVEL = 'debug';

        logger.debug('buggn');

        assert.ok(JSON.stringify(logger.journal).includes('[DEBUG]'));
    });


    it('log debug message with multiple objects/arrays', function () {

        const obj = {
            key1: 'val1',
            key2: 'val2'
        }

        const arry = [
            'item1',
            'item2'
        ]

        logger.debug('buggn', obj, arry);

        assert.ok(JSON.stringify(logger.journal).includes('[DEBUG]'));
    });


    it('confirm multiple logs in buffer/journal', function () {

        assert.ok(logger.journal.length >= 2);
    });


    it('clear log messages', function () {

        logger.clearLogs();
        assert.ok(logger.journal.length === 0);
    });


    it('disable buffer/journal', function () {

        // disable buffer/journal
        process.env.F5_CONX_CORE_LOG_BUFFER = 'false';

        logger.debug('should not see me anywhere...');

        assert.ok(logger.journal.length === 0);
    });

    it('turn logging to minimum - only log error', function () {

        process.env.F5_CONX_CORE_LOG_LEVEL = 'error';
        process.env.F5_CONX_CORE_LOG_BUFFER = 'true';

        logger.debug('log a message through to custom output')
        logger.info('log a message through to custom output')
        logger.warning('log a message through to custom output')
        logger.error('log a message through to custom output')

        assert.ok(logger.journal.length = 1, 'should be a single error message');
    });


    it('inject/test custom output function', function () {

        // reset log level
        delete process.env.F5_CONX_CORE_LOG_LEVEL;

        const customOutput = [];
        logger.output = function (x: string) {
            customOutput.push(x);
        }

        logger.debug('log a message through to custom output')
        logger.info('log a message through to custom output')
        logger.warning('log a message through to custom output')
        logger.error('log a message through to custom output')

        // default log level should not log debug message
        assert.ok(customOutput.length === 3);
    });

});