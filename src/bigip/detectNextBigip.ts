/* eslint-disable @typescript-eslint/no-unused-vars */
import { ExtHttp } from "../externalHttps";
import { getRandomUUID } from "../utils/misc";


/**
 * 
 * @param host hostname
 * @param extHttp 
 */
export function detectNextSync(host: string) {

    // create a new ext service to make the call
    const extHttp = new ExtHttp({
        rejectUnauthorized: false
    })

    // return new Promise( async (resolve, reject) => {

        // return Promise.all(
            return extHttp.makeRequest({
            url: `https://${host}/api/v1/login`,
            method: "GET",
            auth: {
                username: "vscode-f5",
                password: "discovery"
            },
            validateStatus: function (status) {
                    // only allow 401 response code
                    return status === 401;
                }
        })
        .then( resp => {
    
            const deets = {
                status: resp.status,
                statusText: resp.statusText,
                code: resp.data._errors[0].code,
                detail: resp.data._errors[0].detail
            }
    
            if (
                resp.statusText === 'Unauthorized' &&
                resp.data._errors[0].detail === 'Failed to authenticate.' &&
                typeof resp.data._errors[0].code === 'string'
            ) {
                return deets;
            } else {
                throw Error('not mbip')
            }
        })
        .catch( resp => {
            throw resp;
        })
        // )

        // Promise.all(prom)
    // })

    // return {
    //     status: 401,
    //     statusText: 'yes',
    //     code: '1234-5678',
    //     detail: 'ok'
    // };
}


export type DetectNext = {
    product: 'NEXT' | 'NEXT-CM' | string;
    status: number;
    statusText: string;
    code?: string;
    detail?: string;
    message?: string;
}

/**
 * 
 * @param host hostname
 * @param extHttp 
 */
 export async function detectNextAsync(host: string): Promise<DetectNext> {

    // create a new ext service to make the call
    const extHttp = new ExtHttp({
            rejectUnauthorized: false
        })

    const uuid = getRandomUUID(4, { simple: true });
    const username = 'vscode-f5-' + uuid;
    const password = 'discovery-' + uuid;

        // try the next login
    return await extHttp.makeRequest({
        url: `https://${host}/api/v1/login`,
        method: "GET",
        auth: {
            username,
            password
        },
        validateStatus: function (status) {
                // only allow 401 response code
                return status === 401;
            }
    })
    .then( resp => {

        if (
            resp.statusText === 'Unauthorized' &&
            resp.data._errors[0].detail === 'Failed to authenticate.' &&
            typeof resp.data._errors[0].code === 'string'
        ) {
            return {
                product: "NEXT",
                status: resp.status,
                statusText: resp.statusText,
                code: resp.data?._errors[0].code,
                detail: resp.data?._errors[0].detail
            };
        } else {
            throw Error('not mbip')
        }
    })
    .catch( async resp => {
        // throw resp;

        // not next, so let's see if it's next-cm
        return await extHttp.makeRequest({
            url: `https://${host}/api/login`,
            method: "POST",
            data: {
                username,
                password
            },
            validateStatus: function (status) {
                    // only allow 401 response code
                    return status === 401;
                }
        })
        .then( resp => {
    
            if (
                resp.statusText === 'Unauthorized' &&
                resp.data.message === 'SYSTEM-00008: Incorrect credentials' &&
                resp.data.status === 401
            ) {
                return {
                    product: "NEXT-CM",
                    status: resp.status,
                    statusText: resp.statusText,
                    code: resp.data?.status,
                    message: resp.data?.message
                };
            } else {
                throw Error('not mbip')
            }
        })
        .catch( resp => {
            throw resp;
            
        })
    })
}