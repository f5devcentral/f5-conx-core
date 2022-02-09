/* eslint-disable @typescript-eslint/no-unused-vars */
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
import path from 'path';


import { getF5Client, ipv6Host } from '../src/utils/testingUtils';
import { getFakeToken } from '../src/utils/testingUtils';
import { AuthTokenReqBody } from '../src/bigip/bigipModels';
import { atcMetaData, iControlEndpoints } from '../src/constants';
import { F5Client } from '../src/bigip/f5Client';
import { as3InfoApiReponse, deviceInfoIPv6 } from '../src/bigip/f5_device_atc_infos';
import { isArray, isObject } from '../src/utils/misc';
import { 
    As3Declaration,
    as3ExampleDec,
    as3TargetTens,
    as3Tasks,
    as3Tens
} from '../src/bigip/as3Models';


//  *** todo: move all build/mocks to fixtureUtils

// test file name
const rpm = 'f5-appsvcs-templates-1.4.0-1.noarch.rpm';
// source file with path
const filePath = path.join(__dirname, 'artifacts', rpm)
// tmp directory
const tmpDir = path.join(__dirname, 'tmp')
// destination test path with file name
const tmp = path.join(tmpDir, rpm)

let f5Client: F5Client;
let nockInst: nock.Scope;
let events = [];
let taskId: string;
let tenant: string;

describe('as3Client integration tests', function () {

    before(function () {
        // log test file name - makes it easer for troubleshooting
        console.log('       file:', __filename)
    })

    beforeEach(async function () {

        // clear events
        events = [];

        nockInst = nock(`https://${ipv6Host}`)
            .post(iControlEndpoints.login)
            .reply(200, (uri, reqBody: AuthTokenReqBody) => {
                return getFakeToken(reqBody.username, reqBody.loginProviderName);
            })
            //discover endpoint
            .get(iControlEndpoints.tmosInfo)
            .reply(200, deviceInfoIPv6)
            .get(atcMetaData.as3.endPoints.info)
            .reply(200, as3InfoApiReponse)

        f5Client = getF5Client({ ipv6: true });
        // f5Client = new F5Client(
        //     'localhost',
        //     'goodUser',
        //     'goodPassword',
        //     {
        //         port: 8843,
        //     },
        // );

        f5Client.events
            .on('log-http-request', msg => events.push(msg))
            .on('log-http-response', msg => events.push(msg))
            .on('failedAuth', msg => events.push(msg))
            .on('log-debug', msg => events.push(msg))
            .on('log-info', msg => events.push(msg))
            .on('log-error', msg => events.push(msg));

        await f5Client.discover();
    });

    afterEach(async function () {
        // Alert if all our nocks didn't get used, and clear them out
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`)
        }
        nock.cleanAll();

        // clear token timer if something failed
        await f5Client.clearLogin();   // clear auth token for next test
    });



    it('parse dec function - no target', async function () {

        // clear nocks since we aren't using them for this test
        nock.cleanAll();

        const tenList = await f5Client.as3.parseDecs(as3Tens);

        assert.ok(tenList.length > 1, 'did not return array of tenant decs');

    });



    it('parse dec function - targets', async function () {

        // clear nocks since we aren't using them for this test
        nock.cleanAll();

        const tenList = await f5Client.as3.parseDecs(as3TargetTens);

        assert.ok(tenList.length > 1, 'did not return array of targets');

    });



    it('get as3 version information', async function () {

        // clear nocks since we aren't using them for this test
        nock.cleanAll();

        assert.ok(isObject(f5Client.as3.version), 'no as3 version object detected');

    });



    it('get as3 version information - fail (as3 not installed)', async function () {

        // clear the original token timer - so it doesn't just keep running...
        await f5Client.clearLogin();

        // overwrite instantiation where no AS3 is installed
        nockInst = nock(`https://${ipv6Host}`)
            .post(iControlEndpoints.login)
            .reply(200, (uri, reqBody: AuthTokenReqBody) => {
                return getFakeToken(reqBody.username, reqBody.loginProviderName);
            })
            //discover with no AS3
            .get(iControlEndpoints.tmosInfo)
            .reply(200, deviceInfoIPv6)


        const f5ClientLocal = getF5Client({ ipv6: true });
        await f5ClientLocal.discover()

        const x = isObject(f5ClientLocal.as3?.version)
        // this test can/should fail if testing against real f5 with AS3 service...
        assert.ok(!x, 'as3 should not be installed');

        await f5ClientLocal.clearLogin();
    });


    it('post broken declaration', async function () {

        nockInst
            .post('/mgmt/shared/appsvcs/declare?async=true')
            .reply(202, { "id": "84c6" })
            .get('/mgmt/shared/appsvcs/task/84c6')
            .reply(422, {
                "id": "84c6",
                "results": [
                    {
                        code: 422,
                        errors: [
                            'some error about broken declaration'
                        ],
                        message: 'declaration is invalid'
                    }
                ]
            })

        // the following comments allow bad ts comments and disables ts compilation errors for the structure of the declaration we are posting
        //  this is intentenional since this is testing the input of bad as3 declarations

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const resp = f5Client.as3.postDec({
            declaration: {
                class: 'Tenant',
                something: 'missing'
            }
        })

        await assert.rejects(resp);
    });





    it('post sample declaration', async function () {

        this.slow(12000);

        const exampleAs3Declaration_1: As3Declaration = {
            "$schema": "https://raw.githubusercontent.com/F5Networks/f5-appsvcs-extension/master/schema/latest/as3-schema.json",
            "class": "AS3",
            "action": "deploy",
            "persist": true,
            "declaration": {
                "class": "ADC",
                "schemaVersion": "3.0.0",
                "id": "urn:uuid:33045210-3ab8-4636-9b2a-c98d22ab915d",
                "label": "Sample 1",
                "remark": "Simple HTTP application with RR pool",
                "Sample_01": {
                    "class": "Tenant",
                    "A1": {
                        "class": "Application",
                        "template": "http",
                        "serviceMain": {
                            "class": "Service_HTTP",
                            "virtualAddresses": [
                                "10.244.99.10"
                            ],
                            "pool": "web_pool"
                        },
                        "web_pool": {
                            "class": "Pool",
                            "monitors": [
                                "http"
                            ],
                            "members": [
                                {
                                    "servicePort": 80,
                                    "serverAddresses": [
                                        "192.244.99.10",
                                        "192.244.99.11"
                                    ]
                                }
                            ]
                        }
                    }
                }
            }
        }

        
        nockInst
            .post('/mgmt/shared/appsvcs/declare?async=true')
            .reply(202, { "id": "88ab689d-84c6-461f-b324-2685a1d447c9" })
            .get('/mgmt/shared/appsvcs/task/88ab689d-84c6-461f-b324-2685a1d447c9')
            .reply(200, {
                "id": "88ab689d-84c6-461f-b324-2685a1d447c9",
                "results": [
                    {
                        "message": "in progress"
                    }
                ]
            })
            .get('/mgmt/shared/appsvcs/task/88ab689d-84c6-461f-b324-2685a1d447c9')
            .reply(200, {
                "id": "88ab689d-84c6-461f-b324-2685a1d447c9",
                "results": [
                    {
                        "message": "success"
                    }
                ],
                declaration: exampleAs3Declaration_1
            })

        // this operation is async by default
        const resp = await f5Client.as3.postDec(exampleAs3Declaration_1)
            .then(resp => resp)
            .catch(err => {
                debugger;
                return err
            })

        // capture posted tenant name
        const tens = await f5Client.as3.parseDecs(resp.data.declaration)
        tenant = Object.keys(tens[0])[0]

        assert.ok(resp.data.id);
        assert.ok(isObject(resp.data.declaration));
        assert.ok(isObject(resp.data.results[0]));

    });


    it('post a second declaration', async function () {

        this.slow(12000);

        const exampleAs3Declaration_2: As3Declaration = {
            "$schema": "https://raw.githubusercontent.com/F5Networks/f5-appsvcs-extension/master/schema/latest/as3-schema.json",
            "class": "AS3",
            "action": "deploy",
            "persist": true,
            "declaration": {
                "class": "ADC",
                "schemaVersion": "3.0.0",
                "id": "urn:uuid:33045210-3ab8-4636-9b2a-c98d22ab915d",
                "label": "Sample 2",
                "remark": "Simple HTTP application with RR pool",
                "Sample_02": {
                    "class": "Tenant",
                    "A2": {
                        "class": "Application",
                        "template": "http",
                        "serviceMain": {
                            "class": "Service_HTTP",
                            "virtualAddresses": [
                                "10.245.99.10"
                            ],
                            "pool": "web_pool"
                        },
                        "web_pool": {
                            "class": "Pool",
                            "monitors": [
                                "http"
                            ],
                            "members": [
                                {
                                    "servicePort": 80,
                                    "serverAddresses": [
                                        "192.245.99.10",
                                        "192.245.99.11"
                                    ]
                                }
                            ]
                        }
                    }
                }
            }
        }

        nockInst
        .post('/mgmt/shared/appsvcs/declare?async=true')
        .reply(202, { "id": "461f-b324" })
        .get('/mgmt/shared/appsvcs/task/461f-b324')
        .reply(200, {
            "id": "461f-b324",
            "results": [
                {
                    "message": "in progress"
                }
            ]
        })
        .get('/mgmt/shared/appsvcs/task/461f-b324')
        .reply(200, {
            "id": "461f-b324",
            "results": [
                {
                    "message": "success"
                }
            ],
            declaration: exampleAs3Declaration_2
        })

        // this operation is async by default
        const resp = await f5Client.as3.postDec(exampleAs3Declaration_2)
            .then(resp => resp)
            .catch(err => {
                debugger;
                return err
            })

        // capture posted tenant name
        const tens = await f5Client.as3.parseDecs(resp.data.declaration)
        // tenant = Object.keys(tens[0])[0]

        assert.ok(resp.data.id);
        assert.ok(isObject(resp.data.declaration));
        assert.ok(isObject(resp.data.results[0]));

    });




    it('get all tenants/declarations', async function () {

        nockInst
            .get(atcMetaData.as3.endPoints.declare)
            .reply(200,
                {
                    id: '1111',
                    label: 'example tenant declaration',
                    remark: 'Simple applications',
                    class: 'ADC',
                    tenant1: {
                        class: 'Tenant'
                    },
                    tenant2: {
                        class: 'Tenant'
                    }
                }
            )

        // get all as3 declarations from device
        const resp = await f5Client.as3.getDecs();
        // parse response into list of target/tenant details
        const tenList = await f5Client.as3.parseDecs(resp.data);
        // get the first target/tenant object, and return first key (should only be one)
        // this tenant will be used to get a single tenant in the next test
        tenant = Object.keys(tenList[0])[0];

        // tenant response check
        assert.ok(tenant);
        // tenants should also be in the main class
        assert.ok(f5Client.as3.tenants.length === 2)

        // this flow allows the tests to work with mocks and against a real F5
    });



    it('get single tenant declaration', async function () {

        nockInst
            .get(`${atcMetaData.as3.endPoints.declare}/${tenant}`)
            .reply(200,
                {
                    id: '1111',
                    label: 'example tenant declaration',
                    remark: 'Simple applications',
                    class: 'ADC',
                    tenant1: {
                        class: 'Tenant'
                    }
                }
            )

        // using tenant from previous test...
        const resp = await f5Client.as3.getDecs({ tenant });
        assert.deepStrictEqual(resp.data.class, 'ADC');
    });



    it('get single tenant declaration - expanded param', async function () {

        nockInst
            .get(`${atcMetaData.as3.endPoints.declare}/${tenant}?show=expanded`)
            .reply(200,
                {
                    id: '1111',
                    label: 'example tenant declaration',
                    remark: 'Simple applications',
                    class: 'ADC',
                    tenant1: {
                        class: 'Tenant'
                    }
                }
            )

        // using tenant from previous test...
        const resp = await f5Client.as3.getDecs({ tenant, expanded: true });
        assert.deepStrictEqual(resp.data.class, 'ADC');
    });



    it('delete sample declaration - tenant definition', async function () {

        // nock.recorder.rec();

        nockInst
            .post('/mgmt/shared/appsvcs/declare')
            .reply(200, {
                "results": [{
                    "code": 200,
                    "message": "success",
                }]
            })

        // delete tenant from previous test
        const resp = await f5Client.as3.deleteTenant(as3ExampleDec);

        assert.deepStrictEqual(resp.data.results[0].message, 'success');

        // nock.recorder.play();

    });



    it('post sample declaration - async (again)', async function () {

        this.slow(12000);

        nockInst
            .post('/mgmt/shared/appsvcs/declare?async=true')
            .reply(202, { "id": "2685a1d447c9" })
            .get('/mgmt/shared/appsvcs/task/2685a1d447c9')
            .reply(200, {
                "id": "2685a1d447c9",
                "results": [
                    {
                        "message": "in progress"
                    }
                ]
            })
            .get('/mgmt/shared/appsvcs/task/2685a1d447c9')
            .reply(200, {
                "id": "2685a1d447c9",
                "results": [
                    {
                        "message": "success"
                    }
                ],
                declaration: as3ExampleDec
            })
        // we are doing this again so we can test deleting a declaration with the POST method
        const resp = await f5Client.as3.postDec(as3ExampleDec);

        // capture posted tenant name again
        const tens = await f5Client.as3.parseDecs(resp.data.declaration)
        tenant = Object.keys(tens[0])[0]

        assert.ok(resp.data.id);
        assert.ok(isObject(resp.data.declaration));
        assert.ok(isObject(resp.data.results[0]));
    });


    it('get all tasks', async function () {

        nockInst
            .get(atcMetaData.as3.endPoints.tasks)
            // .get(f5Client.as3.taskEndpoint)
            .reply(200, as3Tasks)

        const resp = await f5Client.as3.getTasks();

        // capture a task id for next test
        taskId = resp.data?.items[0]?.id
        assert.ok(isArray(resp.data?.items));
    });



    it('get single task', async function () {

        nockInst
            .get(`${atcMetaData.as3.endPoints.tasks}/${taskId}`)
            .reply(200,
                {
                    id: '1111',
                    results: ['successful declaration']
                }
            )

        const resp = await f5Client.as3.getTasks(taskId);
        assert.ok(resp.data.id);
    });
});




