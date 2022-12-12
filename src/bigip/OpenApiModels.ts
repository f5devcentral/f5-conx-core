

/**
 * open api typescript models supporting f5 next
 */


export interface OpenApi {
    openapi: string;
    info: OaInfoObject
    paths: {
        [k: string]: OaPathItemObject
    }
    servers?: OaServersObject;
    components?: OaComponentsObject;
    security?: [
        {
            bearerAuth: unknown;
        }
    ]
}

export type OaComponentsObject = {
    schemas?: unknown;
    responses?: unknown;
    parameters?: unknown;
    examples?: unknown;
    requestBodies?: unknown;
    headers?: unknown;
    securitySchemas?: unknown;
    links?: unknown;
    callbacks?: unknown;
}

export type OaPathItemObject = {
    $ref?: string;
    summary?: string;
    description?: string;
    get?: OaOperationObject;
    put?: OaOperationObject;
    post?: OaOperationObject;
    delete?: OaOperationObject;
    parameters?: OaParameterObject | OaReferenceObject;
}

export type OaInfoObject = {
    title: string;
    description?: string;
    termsOfService?: string;
    contract: OaContact;
    license: OaLicense;
    version: string;
}

export type OaOperationObject = {
    tags?: string[];
    summary?: string;
    description?: string;
    externalDocs?: unknown;
    operationId?: string;
    parameters?: unknown;
    requestBody?: OaRequestBodyObject | OaRequestBodyObject;
    responses: unknown;
    callbacks?: unknown;
    depricated?: boolean;
    security?: unknown;
    servers?: unknown
}

export type OaParameterObject = {
    name: string;
    in: string;
    description?: string;
    required: boolean;
    deprecated?: boolean;
    allowEmptyValue?: boolean;
}

export type OaRequestBodyObject = {
    description?: string;
    required?: boolean;
    content: {
        [k: string]: OaMediaTypeObject;
        ['application/json']?: OaMediaTypeObject;
    }
}

export type OaMediaTypeObject = {
    schema?: OaReferenceObject | unknown;
    example?: unknown;
    examples?: unknown[];
    encoding?: unknown;
}

export type OaReferenceObject = {
    $ref: string;
}

export type OaContact = {
    name?: string;
    url?: string;
    email?: string;
}
export type OaLicense = {
    name?: string;
    url?: string;
}

export type OaServersObject = {
    url: string;
    description?: string;
    variables?: [string, OaServerVars][];
}[]

export type OaServerVars = {
    default: string;
    enum?: string[];
    description?: string;
}
