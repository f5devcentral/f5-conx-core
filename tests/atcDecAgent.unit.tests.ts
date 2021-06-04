/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Copyright 2021 F5 Networks, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 'use strict';

// import Logger from '../src/logger';
import { injectAtcAgent } from '../src/bigip/atcAgent'
import assert from 'assert';
import { AdcExampleDec, as3ExampleDec } from './artifacts/as3Mocks';
import { atcMetaData } from '../src/constants';
import { uuidAxiosRequestConfig } from '../src/utils/httpModels';
// import { As3Declaration } from '../src/bigip/as3Models';
// const logger = new Logger('F5_CONX_CORE_LOG_LEVEL');

const userAgent = 'test-agent/1.1.1';
const teemEnv = 'F5_CONX_TEEM'

describe('Inject ATC Declaration Agent Tests', function () {


    it('findAtcDecType As3Declaration - good', async function () {

        const axConfig: uuidAxiosRequestConfig = {
            method: 'POST',
            url: atcMetaData.as3.endPoints.declare,
            data: as3ExampleDec
        }

        await injectAtcAgent(axConfig, userAgent)
            .catch(err => {
                debugger;
            });

        assert.deepStrictEqual(axConfig.data.declaration.controls, {
            class: 'Controls',
            userAgent
        })

    });

    it('findAtcDecType As3Declaration - bad', async function () {

        const axConfig: uuidAxiosRequestConfig = {
            method: 'POST',
            url: atcMetaData.as3.endPoints.declare,
            data: {
                declaration: 'else'
            }
        }

        await injectAtcAgent(axConfig, userAgent)
            .catch(err => {
                debugger;
            });

        assert.ok(!axConfig.data.declaration.controls)

    });

    it('findAtcDecType AdcDeclaration - good', async function () {

        const axConfig: uuidAxiosRequestConfig = {
            method: 'post',
            url: atcMetaData.as3.endPoints.declare,
            data: AdcExampleDec
        }

        await injectAtcAgent(axConfig, userAgent)
            .catch(err => {
                debugger;
            });

        assert.deepStrictEqual(axConfig.data.controls, {
            class: 'Controls',
            userAgent
        })

    });

    it('findAtcDecType AdcDeclaration - bad', async function () {

        const axConfig: uuidAxiosRequestConfig = {
            method: 'POST',
            url: atcMetaData.as3.endPoints.declare,
            data: {
                something: 'else'
            }
        }

        await injectAtcAgent(axConfig, userAgent)
            .catch(err => {
                debugger;
            });

        assert.ok(!axConfig.data.controls)

    });


});