import http from 'http';
import path from 'path';
import fs from 'fs';

import { F5DownloadPaths } from '../../src/constants';

const host = 'localhost';
const port = 8080;

// https://stackoverflow.com/questions/49053193/nodejs-request-how-to-send-multipart-form-data-post-request

// test file name
const rpm = 'f5-declarative-onboarding-1.19.0-2.noarch.rpm';
// source file with path
const filePath = path.join(__dirname, 'artifacts', rpm)

const requestListener = function (req, res) {

    server.on('error', function (error) {
        console.error('Errored with the message: ', error);
        process.exit(1);
    });

    res.setHeader("Content-Type", "application/json");
    // console.log(req);
    // const reqUrl = new URL(req.url)
    const reqUri = path.parse(req.url)

    if (reqUri.dir === F5DownloadPaths.ucs.uri || req.url === '/ucs') {

        // multipartServe()
        res.writeHead(200);
        res.end(`${filePath}\nucs download endpoint\n`)

    } else if (reqUri.dir === F5DownloadPaths.qkview.uri || req.url === '/qkview') {

        res.writeHead(200);
        res.end(`${filePath}\qkview download endpoint\n`)

    } else if (reqUri.dir === F5DownloadPaths.iso.uri || req.url === '/iso') {

        res.writeHead(200);
        res.end('iso download endpoint\n')

    } else {
        res.writeHead(404);
        res.end('404 Endpoint Not Found\n');

    }


}

/**
 * download file (multi-part) from f5 (ucs/qkview/iso)
 * - UCS
 *   - uri: /mgmt/shared/file-transfer/ucs-downloads/${fileName}
 *   - path: /var/local/ucs/${fileName}
 * - QKVIEW
 *   - uri: /mgmt/cm/autodeploy/qkview-downloads/${fileName}
 *   - path: /var/tmp/${fileName}
 * - ISO
 *   - uri: /mgmt/cm/autodeploy/software-image-downloads/${fileName}
 *   - path: /shared/images/${fileName}
 * 
 *   **I don't think any of the f5 download paths support non-multipart**
 * 
 * https://support.f5.com/csp/article/K41763344
 * 
 * @param fileName file name on bigip
 * @param localDestPathFile where to put the file (including file name)
 * @param downloadType: type F5DownLoad = "UCS" | "QKVIEW" | "ISO"
 * **expand/update return value**
 */

const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});


export function multipartServe(x?: string) {

    const file = fs.createReadStream(filePath)

    const chunkSize = 512 * 1024;

    // write all the logic to 
    //  - hand back the initial chuck
    //  - return additional chucks as requested (following content-range header)

}