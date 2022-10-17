/* eslint-disable @typescript-eslint/no-unused-vars */
import { ExtHttp } from "../externalHttps";


/**
 * 
 * @param host hostname
 * @param extHttp 
 */
export async function detectNext(host: string): Promise<{
    status: number;
    statusText: string;
    code: string;
    detail: string;
}> {

    // create a new ext service to make the call
    const extHttp = new ExtHttp({
            rejectUnauthorized: false
        })

    return await extHttp.makeRequest({
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
}