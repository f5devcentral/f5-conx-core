/* eslint-disable @typescript-eslint/ban-types */
/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import fs from 'fs';
import crypto from 'crypto';
import { AxiosResponseWithTimings } from './httpModels';
import { AxiosRequestHeaders } from 'axios';


/**
 * delays async response of function
 * https://stackoverflow.com/questions/38956121/how-to-add-delay-to-promise-inside-then
 * @param ms time to wait
 * @param value value to return
 */
export function wait<T>(ms: number, value?: T): Promise<T> {
    return new Promise<T>((resolve) => setTimeout(resolve, ms, value));
}

/**
 * validates json blob
 * @param json
 * @returns parsed json object
 */
 export async function isValidJson(json: string): Promise<unknown> {
    try {
        return JSON.parse(json);
        // return true;
    } catch (e) {
        throw e;
    }
}


/**
 * builds a short randon uuid - just for some randomness during testing
 * 
 * @param length
 * @example 
 * getRandomUUID(8) // returns 8pSJP15R
 * 
 */
export function getRandomUUID(length: number, options?: {
    simple: boolean
} ): string {
    // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript

    // was using the last part of a uuidv4 string, but that required an external dep to generate the uuid
    const result = [];

    const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '1234567890';

    const set = [];
    if(options?.simple) {
        set.push(lowerCase, numbers);
    } else {
        set.push(upperCase, lowerCase, numbers)
    }
    
    const chars = set.join('');
        
    for (let i = 0; i < length; i++) {
        result.push(chars.charAt(Math.floor(Math.random() * chars.length)));
    }
    return result.join('');
}


// https://stackoverflow.com/questions/8834126/how-to-efficiently-check-if-variable-is-array-or-object-in-nodejs-v8
export function isObject(a: unknown): boolean {
    // the TS v4.0+ spec recommends using the following to detect an object...
    // value !== null && typeof value === 'object'

    return (!!a) && (a.constructor === Object);
}

export function isArray(a: unknown): boolean {
    return (!!a) && (a.constructor === Array);
}

// /**
//  * checks if input is object
//  * 
//  * ***an array is an object!!! ***
//  * - use Array.isArray(x) => boolean
//  * @param x 
//  * @returns boolean
//  */
//  export function isObject(x: unknown): boolean {
// 	return (x !== null && typeof x === 'object' ? true : false);
// }


/**
 * Verify file against provided hash
 *
 * @param file local file location
 * @param hash expected SHA 256 hash
 *
 * @returns true/false based on hash verification result
 */
export function verifyHash(file: string, extensionHash: string): boolean {
    const createHash = crypto.createHash('sha256');
    const input = fs.readFileSync(file);
    createHash.update(input);
    const computedHash = createHash.digest('hex');

    if (extensionHash !== computedHash) {
        return false;
    }
    return true;
}



/**
 * returns simplified http response object
 * 
 * ```ts
 *     return {
 *      data: resp.data,
 *      headers: resp.headers,
 *      status: resp.status,
 *      statusText: resp.statusText,
 *      request: {
 *          uuid: resp.config.uuid,
 *          baseURL: resp.config.baseURL,
 *          url: resp.config.url,
 *          method: resp.request.method,
 *          headers: resp.config.headers,
 *          protocol: resp.config.httpsAgent.protocol,
 *          timings: resp.request.timings
 *      }
 *  }
 * ```
 * @param resp orgininal axios response with timing
 * @returns simplified http response
 */
 export async function simplifyHttpResponse(resp: AxiosResponseWithTimings): Promise<AxiosResponseWithTimings> {
    
    // const h = JSON.parse(JSON.stringify(resp.headers));
    
    // only return the things we need
    return {
        status: resp.status,
        statusText: resp.statusText,
        data: resp.data,
        headers: resp.headers as AxiosRequestHeaders | Partial<Record<string, string> & { "set-cookie"?: string[]; }>,
        request: {
            uuid: resp.config.uuid,
            baseURL: resp.config.baseURL,
            url: resp.config.url,
            method: resp.request.method,
            headers: resp.request.headers,
            protocol: resp.config.httpsAgent.protocol,
            // timings: resp.request.timings
        }
    }
}