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