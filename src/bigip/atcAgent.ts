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

import { uuidAxiosRequestConfig } from "../utils/httpModels";
import { atcMetaData } from '../constants'

export async function injectAtcAgent(req: uuidAxiosRequestConfig, userAgent: string): Promise<void> {

    const atcDeclareEndPoints = [
        atcMetaData.fast.endPoints.declare,
        atcMetaData.as3.endPoints.declare,
        `${atcMetaData.as3.endPoints.declare}?async=true`,
        atcMetaData.do.endPoints.declare,
        atcMetaData.ts.endPoints.declare,
        atcMetaData.cf.endPoints.declare
    ];

    // if posting atc declaration
    if ((req.method === 'POST' || req.method === 'post') && atcDeclareEndPoints.includes(req.url)) {

        const controls = {
            class: "Controls",
            userAgent
        };

        switch (true) {

            case req.data?.class === "AS3":
                req.data.declaration.controls = controls;
                break;
            case req.data?.class === "ADC":
                req.data.controls = controls;
                break;
            case req.data?.class === "Device":
                req.data.controls = controls;
                break;
            case req.data?.class === "DO":
                req.data.declaration.controls = controls;
                break;
        }
    }
}
