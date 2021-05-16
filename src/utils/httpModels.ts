/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import { Timings } from "@szmarczak/http-timer/dist/source";
import { AxiosRequestConfig, AxiosResponse, Method, ResponseType } from "axios";

// the following models are for making and using http requests within this project (what the end user will use/see).  It seems easier to re-define the model here instead of inheriting from the official axios models.  With multiple layers of model inheritance (inheriting base models from axios), the user looses visibility into what the model actually looks like when using vscode hover/intellisense.  


export type F5HttpRequest = {
    baseURL?: string,
    method?: Method,
    url?: string,
    headers?: any,
    data?: any,
    validateStatus?: any,
    advancedReturn?: boolean,
    contentType?: string,
    responseType?: ResponseType,
    config?: {
        uuid?: string
    }
}



/**
 * custom http response with timings, based on axios response
 */
export type HttpResponse<T = any> = {
    data?: T;
    status: number,
    statusText: string,
    headers: unknown,
    async?: HttpResponse[],
    request?: {
        baseURL: string,
        url: string,
        uuid?: string,
        method: string,
        headers: unknown,
        protocol: string,
        timings: Timings,
    };
};







// the following are only used for setting up the axios instance and injecting the uuid/timing.  
export interface AxiosResponseWithTimings extends AxiosResponse {
    config: uuidAxiosRequestConfig
    async?: HttpResponse[],
}


export interface uuidAxiosRequestConfig extends AxiosRequestConfig {
    uuid?: string,
    transport?: unknown
}

