/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import { inspect } from 'util';
import {
    AxiosResponseWithTimings,
    uuidAxiosRequestConfig
} from './utils/httpModels';


const LOG_LEVELS = {
    error: 3,
    warn: 4,
    info: 6,
    debug: 7
};

/**
 * logLevel definitions
 */
export type logLevels = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'


// levels have been updated to allign better with typical syslog
// https://support.solarwinds.com/SuccessCenter/s/article/Syslog-Severity-levels?language=en_US

/**
 *
 * Basic Example:
 * 
 * ```ts
 * // set logging to debug
 * process.env.F5_CONX_CORE_LOG_LEVEL = 'DEBUG';
 * 
 * // instantiate and import logger
 * import { logger } from './logger';
 * 
 * // turn off console logging
 * logger.console = false;
 * 
 * // create OUTPUT channel
 * const f5OutputChannel = window.createOutputChannel('f5');
 * 
 * // inject vscode output into logger
 * logger.output = function (log: string) {
 *     f5OutputChannel.appendLine(log);
};
 * ```
 * 
 * ```bash
 * export F5_CONX_CORE_LOG_LEVEL='DEBUG'
 * ```
 */
export default class Logger {
    /**
     * journal array of log messages
     */
    readonly journal = [];

    /**
     * log level
     */
    logLevel: logLevels = "INFO";

    /**
     * buffer log messages in the journal
     * @default true
     */
    buffer = true;

    /**
     * output log messages to console
     * @default true
     */
    console = true;


    /**
     * logging environment variable
     * 
     * the "VSCODE_F5_LOG_LEVEL" of the following;
     * 
     * process.env.VSCODE_F5_LOG_LEVEL = 'DEBUG';
     */
    logEnv: string;

    // private static instance: Logger = new Logger();

    constructor(env: string) {
        this.logEnv = env;
        // set the log level during instantiation
        this.logLevel = process.env[this.logEnv] as unknown as logLevels || 'INFO';
    }

    // /**
    //  * Get logger instance (singleton)
    //  * 
    //  * @returns logger instance
    //  */
    // static getLogger(): Logger {
    //     return Logger.instance;
    // }


    /**
     * clear/delete buffer/journal
     */
    clearLogs(): number {
        return this.journal.length = 0;
    }

    private haveLogEnv() {
        if (!this.logEnv) {
            throw Error('NO LOGGER ENV SET')
        }
        // assign log level
        this.logLevel = process.env[this.logEnv] as unknown as logLevels || 'INFO';
    }


    /**
     * 
     * log http request information depending on env logging level (info/debug)
     * 
     * ex. process.env.F5_CONX_CORE_LOG_LEVEL === 'INFO/DEBUG'
     * 
     * @param config 
     */
    async httpRequest(config: uuidAxiosRequestConfig): Promise<void> {
        // use logging level env to log "info" or "debug" request information

        if (process.env[this.logEnv] === 'DEBUG') {

            this.debug('debug-http-request', config);
        } else {

            this.info(`HTTPS-REQU [${config.uuid}]: ${config.method} -> ${config.baseURL}${config.url}`);
        }
    }

    /**
     * 
     * log http response information depending on env logging level (info/debug)
     * 
     * ex. process.env.F5_CONX_CORE_LOG_LEVEL === 'INFO/DEBUG'
     * 
     * @param resp 
     */
    async httpResponse(resp: AxiosResponseWithTimings): Promise<void> {

        if (process.env[this.logEnv] === 'DEBUG') {

            // *** delete method modified the original object causing other errors... ***
            // delete resp.config.httpAgent;
            // delete resp.config.httpsAgent;
            // delete resp.config.transformRequest;
            // delete resp.config.transformResponse;
            // delete resp.config.adapter;
            // delete resp.request.socket;
            // delete resp.request.res;
            // delete resp.request.connection;
            // delete resp.request.agent;

            // re-assign the information we want/need for user debugging
            const thinResp = {
                status: resp.status,
                statusText: resp.statusText,
                headers: resp.headers,
                request: {
                    baseURL: resp.config.baseURL,
                    url: resp.config.url,
                    method: resp.request.method,
                    headers: resp.config.headers,
                    timings: resp.request.timings
                },
                data: resp.data
            };

            this.debug('debug-http-response', thinResp);
        } else {

            this.info(`HTTPS-RESP [${resp.config.uuid}]: ${resp.status} - ${resp.statusText}`);
        }
    }




    /**
     * overwritable function to allow additional output integrations
     * 
     * ```ts
     * // inject vscode output into logger
     * logger.output = function (log: string) {
     *     f5OutputChannel.appendLine(log);
     * };
     * ```
     * @param x log message
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    output = function (x: string): void {
        // by default, do nothing...
        // to be overwritten by user/app
        // I guess we could have just emitted an event...
        // but, this function method could be modified to allow formatting changes
    };


    /**
     * Log debug message
     */
    debug(...msg: [unknown, ...unknown[]]): void {
        const x = LOG_LEVELS.debug
        const y = LOG_LEVELS[this._checkLogLevel()]
        if (x <= y) {
            this.log('DEBUG', ...msg);
        }

    }

    /**
     * Log informational message
     */
    info(...msg: [unknown, ...unknown[]]): void {
        if (LOG_LEVELS.info <= LOG_LEVELS[this._checkLogLevel()]) {
            this.log('INFO', ...msg);
        }
    }

    /**
     * Log warning message
     */
    warn(...msg: [unknown, ...unknown[]]): void {
        if (LOG_LEVELS.warn <= LOG_LEVELS[this._checkLogLevel()]) {
            this.log('WARNING', ...msg);
        }
    }


    /**
     * Log error message
     */
    error(...msg: [unknown, ...unknown[]]): void {
        // all error messages get logged...
        this.log('ERROR', ...msg);
    }



    /** 
     * base log function
     */
    log(level: logLevels, ...messageParts: unknown[]): void {

        // join all the log message parts
        const message = messageParts.map(this.stringify).join(' ');

        // make timestamp
        const dateTime = new Date().toISOString();

        // put everything together
        const log = `[${dateTime}] [${level}]: ${message}`;

        // pass log to external output function option
        this.output(`${this.journal.length + 1} ${log}`);
        // /\/\/\ added journal lenght to output so I can see if singleton is actually being used in the differen implementations

        if (this.buffer) {
            // todo: put some sort of limit on the buffer size (max 500?)
            this.journal.push(log);
        }

        if (this.console) {
            console.log(log);
        }

    }




    private _checkLogLevel(): string {

        this.haveLogEnv()

        const logLevels = Object.keys(LOG_LEVELS);
        // const logLevelFromEnvVar = process.env.F5_CONX_CORE_LOG_LEVEL || 'info';

        // check/update log level with every log
        this.logLevel = process.env[this.logEnv] as unknown as logLevels || 'INFO';

        if (process.env.F5_CONX_CORE_LOG_BUFFER) {
            this.buffer = (process.env.F5_CONX_CORE_LOG_BUFFER == 'true');
        }

        if (process.env.F5_CONX_CORE_LOG_CONSOLE) {
            this.console = (process.env.F5_CONX_CORE_LOG_CONSOLE == 'true');
        }

        if (this.logLevel && logLevels.includes(this.logLevel.toLowerCase())) {
            return this.logLevel.toLowerCase();
        }

        return 'info';

    }

    private stringify(val: unknown): string {
        if (typeof val === 'string') { return val; }
        return inspect(val, {
            colors: false,
            depth: 6, // heuristic
        });
    }


}

// const logThing = Logger.getLogger();
// export default logThing;