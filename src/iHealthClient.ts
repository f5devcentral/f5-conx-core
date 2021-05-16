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

// import { makeRequest } from "./utils/f5Https";



/**
 * basic frame work to interact with iHealth
 *  from Sergio Pereira
 */
export class IhealthClient {
    username: string;
    private _password: string;
    private _api_host = 'https://ihealth-api.f5.com';
    private _host = 'https://api.f5.com';
    private _headers = { 'Accept': 'application/vnd.f5.ihealth.api.v1.0+json' }
    private _authURL = '/auth/pub/sso/login/ihealth-api';
    private _cookies = {};


    constructor(
        username: string,
        password: string
    ) {
        this.username = username;
        this._password = password;
    }


    /**
     * Login to iHealth with user creds and save auth cookie
     */
    private async login () {

    }

    /**
     * clear login token
     *  - to be used when we detect login failure scenario
     */
    private clearLogin () {

    }


    /**
     * list qkview IDs = '/qkview-analyzer/api/qkviews/'
     */
    async listQkviews() {

        if (!this._cookies) {
            this.login();
        }

        // const resp = makeRequest(this._api_host, '/qkview-analyzer/api/qkviews/', )
    }

    /**
     * list commands = '/qkview-analyzer/api/qkviews/{qkview_id}/commands'
     * 
     * @param id qkview-id
     */
    async listCommands(id: string) {
        // makeRequest(this._api_host, '/qkview-analyzer/api/qkviews/', )
    }


    /**
     * cmd output = '/qkview-analyzer/api/qkviews/{qkview_id}/commands/{a}'
     * 
     * @param id qkview-id
     * @param cmd command to execute on qkview
     */
    async qkviewCommand (id: string, cmd: string) {

    }

    /**
     * get diagnostics for qkview
     *  - '/qkview-analyzer/api/qkviews/{qkview_id}/diagnostics?set=hit'
     * @param id qkview-id
     */
    async getDiagnostics (id:string) {

    }
}