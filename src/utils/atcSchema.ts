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

// import { AdcDeclaration, As3Declaration } from '..';
//  import { isValidJson } from "./utils/utils";
//  import { window } from "vscode";
import { atcMetaData } from '..';
import Logger from '../logger';
// import { isValidJson } from './misc';
//  import { logger } from './logger';


/**
 * detects ATC dec type and injects appropriate schema
 *  - will also remove schema reference
 * 
 * @param dec: json parsed declaration (as3/do/ts/cf)
 * @param (optional) logger class with .info
 */
export async function injectSchema(dec: Record<string, unknown>, logger?: Logger): Promise<Record<string, unknown>> {

    // if schema already in declaration, remove it and return
    if (dec.$schema) {
        
        logger?.info('Removing schema from declaration');
        delete dec.$schema
        return dec

    } else {

        if (dec.class === 'AS3') {
            // the following add the schema to the beginning of the dec as compared
            //      to the typical dec.$schema param add would put it at the end
            logger?.info('got a regular new as3 declaration with deployment parameters -> adding as3 schema');
            dec = { "$schema": atcMetaData.as3.schema, ...dec };

        } else if (dec.class === 'ADC') {

            // typically come from getting existing decs from as3 service
            // so, we wrap the declartion with details of the necessary ADC class
             logger?.info('got a bare ADC dec -> wrapping with AS3 object/params/schema');

            dec = {
                "$schema": atcMetaData.as3.schema,
                "class": "AS3",
                dec: dec
            };

        } else if (dec.class === 'DO') {

            logger?.info('Detected DO/BIG-IQ dec -> adding schema');
            dec = { "$schema": "https://raw.githubusercontent.com/F5Networks/f5-declarative-onboarding/master/src/schema/latest/remote.schema.json", ...dec };

        } else if (dec.class === 'Device') {

            logger?.info('Detected DO/Device dec -> adding schema');
            dec = { "$schema": atcMetaData.do.schema, ...dec };

        } else if (dec.class === 'Telemetry') {

            logger?.info('Detected TS declaration -> adding schema');
            dec = { "$schema": atcMetaData.ts.schema, ...dec };
        }

    }

    return dec;
}