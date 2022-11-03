/* eslint-disable @typescript-eslint/no-unused-vars */
import { AxiosError } from "axios";
import { ExtHttp } from "../externalHttps";
import { getRandomUUID } from "../utils/misc";


export type DetectNext = {
    product: 'NEXT' | 'NEXT-CM';
    status: number;
    statusText: string;
    code?: string;
    detail?: string;
    message?: string;
}


/**
 * Discover if host is next or next-cm by trying to authenticate and analyzing failure messages
 * @param host hostname/fqdn/IP
 */
export async function detectNextAsync(host: string): Promise<DetectNext> {

    // create a new ext service to make the call
    // by default the device cert is self signed, so disable cert checking
    const extHttp = new ExtHttp({
        rejectUnauthorized: false
    })

    // build a random user/pass to send to the auth endpoint
    // this prevents us from locking out known users with multiple attempts
    const uuid = getRandomUUID(4, { simple: true });
    const username = 'vscode-f5-' + uuid;
    const password = 'discovery-' + uuid;

    // try the next login
    return await extHttp.makeRequest({
        url: `https://${host}/api/v1/login`,
        method: "GET",
        timeout: 5,
        auth: {
            username,
            password
        },
        validateStatus: function (status) {
            // only allow 401 response code
            // we are expecting a 401 since the user/pass is just generated for this test
            return status === 401;
        }
    })
        .then(resp => {

            if (

                // next instance auth response
                resp.statusText === 'Unauthorized' &&
                resp.data?._errors?.[0]?.detail === 'Failed to authenticate.' &&
                typeof resp.data?._errors?.[0]?.code === 'string'

            ) {

                return {
                    product: 'NEXT',
                    status: resp.status,
                    statusText: resp.statusText,
                    code: resp.data?._errors[0].code,
                    detail: resp.data?._errors[0].detail
                } as DetectNext;

            } else if (

                // This is CM response to NEXT token/login request
                // it's unique enough, from the message, that we now know it's CM
                resp.status === 401 &&
                resp.statusText === "Unauthorized" &&
                resp.data?.message === "GATEWAY-00022: Invalid token data"

            ) {
                return {
                    product: 'NEXT-CM',
                    status: resp.status,
                    statusText: resp.statusText,
                    code: resp.data?.status,
                    message: resp.data?.message
                } as DetectNext;

            } else {

                throw Error('not next/cm')

            }
        })
    // .catch(async resp => {
    //     // throw resp;
    //     const x = resp;

    //     if (resp instanceof AxiosError) {

    //     }

    //     // not next, so let's see if it's next-cm
    //     return await extHttp.makeRequest({
    //         url: `https://${host}/api/login`,
    //         method: "POST",
    //         timeout: 10,
    //         data: {
    //             username,
    //             password
    //         },
    //         validateStatus: function (status) {
    //             // only allow 401 response code
    //             return status === 401;
    //         }
    //     })
    //         .then(resp => {

    //             if (
    //                 resp.statusText === 'Unauthorized' &&
    //                 resp.data.message === 'SYSTEM-00008: Incorrect credentials' &&
    //                 resp.data.status === 401
    //             ) {
    //                 return {
    //                     product: 'NEXT-CM',
    //                     status: resp.status,
    //                     statusText: resp.statusText,
    //                     code: resp.data?.status,
    //                     message: resp.data?.message
    //                 } as DetectNext;
    //             } else {
    //                 throw Error('not mbip')
    //             }
    //         })
    //         .catch(resp => {
    //             throw resp;

    //         })
    // })
}