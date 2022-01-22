/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-empty-function */
/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import { time } from "console";
import path from "path";
import { ExtHttp } from "./externalHttps";

/**
 * basic frame work to interact with iHealth
 *  from Sergio Pereira
 * https://clouddocs.f5.com/api/ihealth/Authentication.html
 */
export class IhealthClient extends ExtHttp {
    username: string;
    private _password: string;
    private _api_host = 'https://ihealth-api.f5.com';
    private _host = 'https://api.f5.com';
    private _headers = { 'Accept': 'application/vnd.f5.ihealth.api.v1.0+json' }
    private _authURL = '/auth/pub/sso/login/ihealth-api';
    /**
     * list/add/delete qkviews endpoint
     * https://clouddocs.f5.com/api/ihealth/QKView_Collection_Methods.html
     */
    private _collectionURL = '/qkview-analyzer/api/qkviews';
    private _cookies: string[] | undefined;
    private _cookiesExpiration!: number;

    /**
     * token timer value
     * 
     * Starts when a token is refreshed, start value is token time out
     * 
     * An asyncronous timer counts down till zero
     * 
     */
    tokenTimeout: number | undefined;


    /**
     * system interval id for the async token timer
     * 
     * **pre-emptivly clears token at <10 seconds but keeps counting to zero**
     */
    protected _tokenIntervalId: NodeJS.Timeout | undefined;


    /**
     * qkview metadata for listing and fetching further qkview details
     */
    qkviews: qkviewMetaData[] = [];


    constructor(
        username: string,
        password: string,
        // userAgent: string
    ) {
        super();
        this.username = username;
        this._password = password;
        // this.userAgent = userAgent
        // this.init();
        this.axios.defaults.withCredentials = true;
    }


    /**
     * Login to iHealth with user creds and save auth cookie
     */
    private async login() {

        return this.makeRequest({
            method: 'POST',
            url: `${this._host}${this._authURL}`,
            data: {
                user_id: this.username,
                user_secret: this._password
            }
        })
            .then(resp => {
                this._cookies = resp.headers['set-cookie']
                this._cookiesExpiration = resp.data.expires;
                // current time in seconds
                const now = Date.now() / 1000;
                // token expire time in seconds, rounded down
                const expiresInSeconds = Math.floor(this._cookiesExpiration - now);
                this.events.emit('log-info', `iHealthClient login successful, token expires in ${expiresInSeconds}`)
                this.events.emit('log-debug', {
                    message: `iHealthClient login cookie details`,
                    cookies: this._cookies,
                    expires: this._cookiesExpiration
                })
                this.tokenTimer()
                return {
                    cookies: this._cookies,
                    expires: this._cookiesExpiration,
                    expiresInSeconds
                }
            })
    }

    /**
     * clear login token
     *  - to be used when we detect login failure scenario
     */
    async clearLogin() {
        this.events.emit('log-info', `iHealthClient clearing token/timer with ${this.tokenTimeout} left`);
        const tokenTimeOut = this.tokenTimeout;
        this._cookies = undefined;
        // this._token = undefined;
        clearInterval(this._tokenIntervalId);
        return tokenTimeOut;
    }


    /**
     * bigip auth token lifetime countdown
     * will clear auth token details when finished
     * prompting the next http call to get a new token
     */
    private async tokenTimer(): Promise<void> {

        this.events.emit('iHealthClient-token-timer-start', `Starting token timer: ${this.tokenTimeout}`);

        // clear any timer we are currently tracking
        clearInterval(this._tokenIntervalId);

        this._tokenIntervalId = setInterval(() => {
            this.tokenTimeout--;

            // capture the self timer instance
            const timerId = this._tokenIntervalId;

            this.events.emit('iHealthClient-token-timer-count', this.tokenTimeout);

            // kill the token 10 seconds early to give us time to get a new one with all the other calls going on
            if (this.tokenTimeout <= 10) {
                this._cookies = undefined; // clearing token details should get a new token
            }

            // keep running the timer so everything looks good, but clear the rest when it reaches 0
            if (this.tokenTimeout <= 0) {
                clearInterval(this._tokenIntervalId);

                // just in case this timer got orphaned from the main class, also clear using self reference
                clearInterval(timerId);

                this.events.emit('iHealthClient-token-timer-expired', 'authToken expired -> will refresh with next HTTPS call');
                // this.clearToken();
            }
        }, 1000);

    }


    /**
     * list qkviews/IDs = '/qkview-analyzer/api/qkviews/' 
     * 
     * **includes all metaData -> held in qkviews class param**
     */
    async listQkviews() {

        if (!this._cookies) {
            await this.login();
        }

        await this.makeRequest({
            url: `${this._api_host}${this._collectionURL}`,
            headers: {
                // cookie : this._cookies
            }
        })
        .then( async resp => {

            // get the qkview IDs
            const qkviewIds = resp.data.id

            // array for async promises
            const promiseArray = [];

            // loop through each qkview ID and gather meta data
            await Promise.all(qkviewIds.map(async id => {
                // GET and push the qkveiw details to local array
                await this.qkviewMetaData(id)
                .then( resp => {
                    // inject the qkview id back into metadata response
                    resp.data.id = id;
                    this.qkviews.push(resp.data)
                })
            }));

            // wait for all the qkview metadata requests to finish
            await Promise.all(promiseArray)

            // return the qkview details back to caller
            return this.qkviews;
        })
    }


    /**
     * list qkviews/IDs = '/qkview-analyzer/api/qkviews/'
     */
    async qkviewMetaData(id: string) {

        if (!this._cookies) {
            await this.login();
        }

        return this.makeRequest({
            url: `${this._api_host}${this._collectionURL}/${id}`,
            headers: {
                // 'cookie' : this._cookies
            }
        })

    }

    /**
     * list qkviews/IDs = '/qkview-analyzer/api/qkviews/'
     */
    async uploadiHealth(file: path.ParsedPath) {

        if (!this._cookies) {
            await this.login();
        }

        const form = new FormData()
        .append('qkview', file.base)

        return this.makeRequest({
            method: 'POST',
            url: `${this._api_host}${this._collectionURL}`,
            headers: {
                // 'cookie' : this._cookies,
                'Content-Type': 'multipart/form-data'
            },
            data: {
                FormData: form
            }
        })
    }

    /**
     * list commands = '/qkview-analyzer/api/qkviews/{qkview_id}/commands'
     * 
     * https://clouddocs.f5.com/api/ihealth/QKView_Command_Output.html
     * 
     * @param id qkview-id
     */
    async listCommands(id: string) {
        if (!this._cookies) {
            await this.login();
        }

        return this.makeRequest({
            url: `${this._api_host}${this._collectionURL}/${id}/commands`,
            headers: {
                // 'cookie' : this._cookies
            }
        })
    }


    /**
     * cmd output = '/qkview-analyzer/api/qkviews/{qkview_id}/commands/{a}'
     * 
     * https://clouddocs.f5.com/api/ihealth/QKView_Command_Output.html
     * 
     * @param id qkview-id
     * @param cmd command to execute on qkview
     */
    async qkviewCommand(id: string, cmd: string) {
        if (!this._cookies) {
            await this.login();
        }

        return this.makeRequest({
            url: `${this._api_host}${this._collectionURL}/${id}/commands/${cmd}`,
            headers: {
                // 'cookie' : this._cookies
            }
        })
    }

    /**
     * get diagnostics for qkview
     *  - '/qkview-analyzer/api/qkviews/{qkview_id}/diagnostics?set=hit'
     * https://clouddocs.f5.com/api/ihealth/QKView_Diagnostics.html
     * @param id qkview-id
     */
    async getDiagnostics(id: string) {

        if (!this._cookies) {
            await this.login();
        }

        return this.makeRequest({
            url: `${this._api_host}${this._collectionURL}/${id}/diagnostics`,
            headers: {
                // 'cookie' : this._cookies
            }
        })
    }
}


export type qkviewMetaData = {
    files: string;
    commands: string;
    bigip: string;
    gui_uri: string;
    primary_blade_uri: string;
    chassis_serial: string;
    hostname: string;
    visible_in_gui: boolean;
    description: string;
    f5_support_case: string;
    entitlement: {
        expiriation_date: string;
        days_left: string;
    };
    generation_date: number;
    upload: {
        performed_by: {
            name: string;
            email: string;
        };
        date: number
    };
    expiration_date: number;
    processing_status: string;
    processing_messages: string;
    file_size: number;
    file_name: string;
    diagnostics: string;
    secondary_blade_url: string;
    id: number | string;
}