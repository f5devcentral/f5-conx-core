
/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import assert from 'assert';
import nock from 'nock';
import fs from 'fs';
import path from 'path';


import { F5Client } from '../src/bigip/f5Client';
import { defaultHost, getF5Client } from '../src/utils/testingUtils';
import { getFakeToken } from '../src/utils/testingUtils';
import { AuthTokenReqBody } from '../src/bigip/bigipModels';
import { F5DownloadPaths, iControlEndpoints } from '../src/constants';


import { deviceInfo } from '../src/bigip/f5_device_atc_infos';
import { ucsListApiReponse } from './artifacts/ucsList'


let f5Client: F5Client;
let nockScope: nock.Scope;

// test file name
const tmpUcs = 'bigip1_10.200.244.101_20201130T220239571Z.ucs';
// source file with path
// const filePath = path.join(__dirname, 'artifacts', tmpUcs)
// tmp directory
const tmpDir = path.join(__dirname, 'tmp')
// destination test path with file name
const tmp = path.join(tmpDir, tmpUcs)

// test file name
const rpm = 'f5-declarative-onboarding-1.19.0-2.noarch.rpm';

const events: string[] = []

describe('f5Client UCS integration tests - ipv6', function () {

    // runs once before the first test in this block
    before(async function () {
        // log test file name - makes it easer for troubleshooting
        console.log('       file:', __filename)

        if (!fs.existsSync(tmpDir)) {
            // console.log('creating temp directory for file upload/download tests')
            fs.mkdirSync(tmpDir);
        }

        nockScope = nock(`https://${defaultHost}`)
            .post(iControlEndpoints.login)
            .reply(200, (uri, reqBody: AuthTokenReqBody) => {
                return getFakeToken(reqBody.username, reqBody.loginProviderName);
            })
            //discover endpoint
            .get(iControlEndpoints.tmosInfo)
            .reply(200, deviceInfo)

        f5Client = getF5Client();

        f5Client.events.on('failedAuth', msg => events.push(msg));
        f5Client.events.on('log-debug', msg => events.push(msg));
        f5Client.events.on('log-info', msg => events.push(msg));
        f5Client.events.on('log-error', msg => events.push(msg));

        await f5Client.discover();
    });

    // runs once after the last test in this block
    after(function () {
        // if the tmp directory exits, try to delete it
        //  - should be empty, each test should clean up files as needed
        if (fs.existsSync(tmpDir)) {
            try {
                // console.log('deleting temp directory for file upload/download tests')
                fs.rmdirSync(tmpDir);
            } catch (e) {
                console.log('was unable to delete tmp folder for upload/download tests, this typically means there are files in it that one of the tests did not clean up', e)
            }
        }

        // clear login at the end of tests
        f5Client.clearLogin();

    });

    beforeEach(async function () {
        // setting the array length to 0 emptys it, so we can use it as a "const"
        events.length = 0;

    });

    afterEach(async function () {
        // Alert if all our nocks didn't get used, and clear them out
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`)
        }
        nock.cleanAll();
    });

    it('create mini ucs on f5', async function () {
        // nock.recorder.rec();
        let ucsFileName;

        nockScope
            .post(iControlEndpoints.bash)
            .reply((uri, requestBody) => {
                // capture mini_ucs file name
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const req = requestBody as Record<string, any>
                ucsFileName = req?.utilCmdArgs.match(/ucs\/([\w\.]+)/)[1];
                // provide some generic 200 responsee that the bash command executed
                return [
                    200,
                    {
                        "kind": "tm:util:bash:runstate",
                        "command": "run",
                        "utilCmdArgs": "*** command to make mini_ucs ***",
                        "commandResult": "*** response that means it worked ***"
                    }
                ]
            })
            .post(iControlEndpoints.bash)
            .reply(() => {
                return [
                    200,
                    {
                        "kind": "tm:util:bash:runstate",
                        "command": "run",
                        "utilCmdArgs": "-c 'ls /var/local/ucs'",
                        "commandResult": `${ucsFileName}\ncs_backup_rotate.conf\ntmp\n`
                    }
                ]
            })

        await f5Client.ucs.create({ mini: true })
            .then(resp => {

                // assert that the response included an expected file name format
                assert.ok(/\w+.mini_ucs.tar.gz/.test(resp.data.file), 'did not recieve expected file name');
                assert.ok(resp.data.commandResult)

            })
            .catch(err => {
                debugger;
                return Promise.reject(err);
            });


    });



    it('generate default UCS on f5', async function () {
        this.slow(12000);
        let ucsFileName;

        nockScope
            .post(iControlEndpoints.backup)
            .reply((uri, requestBody) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const req = requestBody as Record<string, any>
                ucsFileName = req.file
                return [
                    202,
                    {
                        "file": ucsFileName,
                        "action": "BACKUP",
                        "id": "091d2db1-8f35-4544-96ee-09f27b0788c3",
                        "status": "STARTED"
                    }
                ]
            })
            .get('/mgmt/tm/shared/sys/backup/091d2db1-8f35-4544-96ee-09f27b0788c3')
            .reply(() => {
                return [
                    200,
                    {
                        "file": ucsFileName,
                        "action": "BACKUP",
                        "id": "091d2db1-8f35-4544-96ee-09f27b0788c3",
                        "status": "STARTED"
                    }
                ]
            })
            .get('/mgmt/tm/shared/sys/backup/091d2db1-8f35-4544-96ee-09f27b0788c3')
            .reply(() => {
                return [
                    200,
                    {
                        "file": ucsFileName,
                        "action": "BACKUP",
                        "id": "091d2db1-8f35-4544-96ee-09f27b0788c3",
                        "status": "FINISHED"
                    }
                ]
            })

        await f5Client.ucs.create()
            .then(resp => {

                assert.deepStrictEqual(resp.data.status, 'FINISHED');
                assert.ok(/\w+.ucs/.test(resp.data.file));

            })
            .catch(err => {
                debugger;
                return Promise.reject(err);
            });


    });

    it('create ucs with passphrase and no-private-keys on f5', async function () {

        let reqBody: { file: string, action: string, passphrase: string };

        nockScope
            .post(iControlEndpoints.backup)
            .reply(200, (uri, requestBody: { file: string, action: string, passphrase: string }) => {
                reqBody = requestBody;
                return [
                    202
                ]
            })


        await f5Client.ucs.create({ passPhrase: 'catNip', noPrivateKeys: true })
            .then(resp => {
                // no nothing, this should fail
                return resp;
            })
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .catch(err => {
                // do nothing..
                // we expect this to fail, but we just need the post body to confirm it generated the right filename
                // debugger;
                // messaged host for file format
                // const host = defaultHost.replace(/(\[|\])/g, '').replace(/\:/g, '.')
                // confirm it has the right ipv6 fileName format
                // 10.16.2022- had to remove ipv6 functionality/test cause the latest axios wasn't working with it
                //      so this test just checks for static vars
                assert.ok(reqBody.file.includes('10.21.244.110'));

                // confirm body action
                assert.deepStrictEqual(reqBody.action, 'BACKUP_WITH_NO_PRIVATE_KEYS_WITH_ENCRYPTION')
                // confirm body passphrase
                assert.deepStrictEqual(reqBody.passphrase, 'catNip')
            });




        // nock.cleanAll();

    });

    it('create ucs with just passphrase on f5', async function () {

        let reqBody: { file: string, action: string, passphrase: string };

        nockScope
            .post(iControlEndpoints.backup)
            .reply(202, (uri, requestBody: { file: string, action: string, passphrase: string }) => {
                reqBody = requestBody;
            })


        await f5Client.ucs.create({ passPhrase: 'catNip' })
            .then(resp => {
                // nothing, this should fail
                return resp;
            })
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .catch(err => {
                // do nothing..
                // we expect this to fail, but we just need the post body to confirm it generated the right filename
                // debugger;
                // confirm body action
                assert.deepStrictEqual(reqBody.action, 'BACKUP_WITH_ENCRYPTION')
                // confirm body passphrase
                assert.deepStrictEqual(reqBody.passphrase, 'catNip')

            });


    });


    it('create ucs with just no-private-keys on f5', async function () {
        let reqBody: { file: string, action: string, passphrase: string };

        nockScope
            .post(iControlEndpoints.backup)
            .reply(202, (uri, requestBody: { file: string, action: string, passphrase: string }) => {
                reqBody = requestBody;
            })


        await f5Client.ucs.create({ fileName: rpm, noPrivateKeys: true })
            .then(resp => {
                // do nothing, this should fail
                return resp;
            })
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .catch(err => {
                // confirm body action
                assert.deepStrictEqual(reqBody.action, 'BACKUP_WITH_NO_PRIVATE_KEYS')
            });

    });


    it('list ucs on f5', async function () {
        nockScope
            .get(iControlEndpoints.ucs)
            .reply(200, ucsListApiReponse)

        const resp = await f5Client.ucs.list();

        assert.deepStrictEqual(
            resp.data.items[0].apiRawValues.filename,
            '/var/local/ucs/bigip1_10.200.244.101_20201130T223055376Z.ucs'
        )
    });

    it('download ucs from f5', async function () {

        // nockScope
        //     .get(`${F5DownloadPaths.ucs.uri}/${tmpUcs}`)
        //     .replyWithFile(200, filePath);

        // clear prebuilt nocks since this tape already has the auth token
        // nock.cleanAll();

        const nockDef = nock.loadDefs('tests/artifacts/nocks/downloadNock.json').map(item => {
            item.scope = `https://${defaultHost}:443`
            if (item.path !== "/mgmt/shared/authn/login") {
                item.path = `${F5DownloadPaths.ucs.uri}/f5-declarative-onboarding-1.19.0-2.noarch.rpm`
            }
            return item;
        })

        //////  used to replay the nock
        nock.define(nockDef);

        await f5Client.ucs.download(rpm, tmp)
            .then(resp => {
                // assert that the file exists
                assert.ok(fs.existsSync(resp.data.file));

                // now delete the file
                fs.unlinkSync(resp.data.file);
            })
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .catch(err => {
                debugger
            });

        nock.cleanAll();
    });


    // it('get UCS (generate and download)', async function () {

    //     this.slow(12000);
    //     let ucsFileName;

    //     // nockScope
    //     //     .post(iControlEndpoints.backup)
    //     //     .reply(200, (uri, requestBody: { file: string }) => {
    //     //         ucsFileName = requestBody.file;
    //     //         return [
    //     //             202,
    //     //             {
    //     //                 "file": ucsFileName,
    //     //                 "action": "BACKUP",
    //     //                 "id": "091d2db1-8f35-4544-96ee-09f27b0788c3",
    //     //                 "status": "STARTED"
    //     //             }
    //     //         ]
    //     //     })
    //     //     .get('/mgmt/tm/shared/sys/backup/091d2db1-8f35-4544-96ee-09f27b0788c3')
    //     //     .reply(() => {
    //     //         return [
    //     //             200,
    //     //             {
    //     //                 "file": ucsFileName,
    //     //                 "action": "BACKUP",
    //     //                 "id": "091d2db1-8f35-4544-96ee-09f27b0788c3",
    //     //                 "status": "STARTED"
    //     //             }
    //     //         ]
    //     //     })
    //     //     .get('/mgmt/tm/shared/sys/backup/091d2db1-8f35-4544-96ee-09f27b0788c3')
    //     //     .reply(() => {
    //     //         return [
    //     //             200,
    //     //             {
    //     //                 "file": ucsFileName,
    //     //                 "action": "BACKUP",
    //     //                 "id": "091d2db1-8f35-4544-96ee-09f27b0788c3",
    //     //                 "status": "FINISHED"
    //     //             }
    //     //         ]
    //     //     })
    //     //     // .persist()
    //     //     .get(`${F5DownloadPaths.ucs.uri}/${tmpUcs}`)
    //     //     .replyWithFile(200, filePath)


    //     /////  turn on to record the nock
    //     nock.recorder.rec({
    //         output_objects: true,
    //         dont_print: true,
    //     })
    //     ////  enable to have test connect to real f5
    //     f5Client = new F5Client('10.200.244.5', 'admin', 'benrocks')


    //     await f5Client.ucs.get({ localDestPathFile: tmpDir })
    //         .then(resp => {
    //             assert.ok(fs.existsSync(resp.data.file))           // confirm/assert file is there
    //             fs.unlinkSync(resp.data.file);                     // remove tmp file
    //         })
    //         .catch(err => {
    //             debugger
    //         });

    //     ////// used to write the recorded nock to a file
    //     fs.writeFileSync('tests/artifacts/nocks/getUcsNock.json', JSON.stringify(nock.recorder.play(), undefined, 4), 'utf-8');

    //     // // assert that the filePath we got back is what we expect
    //     // assert.deepStrictEqual(resp.data.file, tmp);

    //     // // assert that the response included an expected file name format
    //     // assert.ok(/\w+.ucs/.test(resp.data.file));

    //     // // assert that the file exists
    //     // assert.ok(fs.existsSync(resp.data.file));

    //     // // now delete the file
    //     // fs.unlinkSync(resp.data.file);
    // });

});
