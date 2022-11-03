



'/api/v1/login'
'/api/v1/openapi'


'/api/v1/systems'
'/api/v1/sesrvices'
'/api/v1/files'
'/api/v1/health'
'/api/v1/applications'


export type Ntoken = {
    /**
     * token body
     */
    token: string;
    tokenType: 'Bearer';
    /**
     * time to live (TTL) in seconds 3600= 1hr
     */
    expiresIn: number;
    refreshToken: string;
    refreshExpiresIn: number;
    refreshEndDate: string;
}


export interface NextOpenApi {
    openapi: string;
    info: {
        title: string;
        version: string;
        license: {
            name: string;
            url: string;
        }
    }
    servers: [
        {
            url: string;
            description: string
        }
    ]
    paths: {
        [k: string]: {
            [k: string]: {
                [k: string]: unknown
            }
        }
    }
    components: {
        [k: string]: unknown
    }
    security: [
        {
            bearerAuth: unknown;
        }
    ]
}



export const mtokenExample: Ntoken =  {
    token: 'eyJhbGciOiJIUzM4NCIsImtpZCI6ImZkYjQ3ZDg4LWJiZjItNGI3Ny05ZWU0LTZiMTk2ZWUzZTlmMiIsInR5cCI6IkpXVCJ9.eyJFeHRlbnNpb25zIjp7IngtZjUtdXNlci1wYXNzLWNoYW5nZSI6WyJubyJdLCJ4LWY1LXVzZXItcm9sZSI6WyJhZG1pbmlzdHJhdG9yIl0sIngtZjUtdXNlci1zdGF0dXMiOlsiZW5hYmxlZCJdLCJ4LWY1LXVzZXItc3RyYXRlZ3kiOlsibG9jYWwiXX0sIkdyb3VwcyI6bnVsbCwiSUQiOiIwNzY3ZGZhMy1iM2JkLTRkMzQtYmExOC0xMjY0MzExMDhhMGUiLCJOYW1lIjoiYWRtaW4iLCJhdWQiOlsiIl0sImV4cCI6MTY0NDQ0MzY0NiwiaWF0IjoxNjQ0NDQwMDQ2LCJuYmYiOjE2NDQ0NDAwNDYsInN1YiI6IjA3NjdkZmEzLWIzYmQtNGQzNC1iYTE4LTEyNjQzMTEwOGEwZSJ9.imiwoKu9JH7z2ypiNvSrSuBAD7v1yny84c086NasKVCodvLiVs9_NMjTIG3oEK56',
    tokenType: 'Bearer',
    expiresIn: 3600,
    refreshToken: 'MzgxN2NjYTgtYzZlNi00OGNjLTg2MjktMGVhMTc5ZGFkYWIyOgrxLZpRYPCe2f2C8qAqtPXwDeqpb0Lw+VXCRcrnHTd7ZLdtDgdTWyohcEEW6x2ccQ',
    refreshExpiresIn: 1209600,
    refreshEndDate: '2022-05-10T20:55:06Z'
  }


// #####################
// all below this line for NEXT-CM

export type NCMtoken = {
    access_token: string;
    refresh_token: string;
    user_id: string;
}

export const NCMtokenExample: NCMtoken = {
    access_token: "2Bsz4LN6cIlgAZxwRqBCUOMT3kWwzBURQ2Qm2bMc6xb9sFi2utXe/koTFKCxoezUYZFNAChxxmFTHeoU/clipU41He59JSgD4ZgBwTvaAfU/sZWB51flVxaBQF5oCfaMw2PshjC23OtQkCAEAMIwiM3BBVhL8TjhdgaHKejA+yucUz3oUh39/wjX9SL4BfgYlrV3vHZj7MzpiVz0wP5TaYOn/P+cdolZup87zxUghRgiHBxeFdufcznMGAzIPBnn5ExW5I4bnydgCe8cc8l5gZ3WFswoJ9cwOM6lXlVdX+44dwJFLkOWI8b0tTkbexsfY8M7dP8/lfw0wVCJcLoOGJ+vPQSn/RBWtwiCVMo6UgyqWWJ/cZatyLIlMW45TPmEHxKtRvwup+ngJKHGUSlmogy8BxBF0g+H4ZoEJ4c77sNKgqMu3rNLoo2/unjXZUgtjZg+19ghcNXix9p1tReuWbHv8RdbtLg18VoInrdjAFVsTGjIcsurfYkSJRHLCGs7mGJQr2dt",
    refresh_token: "2Bsz4LN6cIlgAZxwRqBCUOMT3kWwzBURQ2Qm2bMc6xb9sFi2utXe/koTFKCxoezUYZFNAChxxmFTHeoU/clipU41He59JSgD4ZgBwTvaAfU/sZWB51flU1mCUHxoCfaMw2PshjC23OtQkCAEAMIwiM3BBVhL8TjhdgaHKejA+yucUz3oUh39/wjX9SL4BfgYlrV3vHZj7MzpiVz0wP5TaYOn/P+cdolZup87zxUghRhhHBxSGtiffznZIg2WPzDOvUxW5I8bsQVgCe8UdcpDgMLWBuYvMMQ4Os3DVlVece44dwJFLkOWI8b0tTkbexsfY8M7dP8/lfw0wVCJcLoOGJ+vPQSn/RBWtwiCVMo6UgyqWWJ/cZatyLIlMW45TPmEDzWGJMw1k+mdJc2SYDJHrTm9Zk8E5mG864ZzHdwY3q515KYvv9Jn5duOgG3aXVl6mr87orcrTcrD0ft/9BWGTeWJ8S5GorwOtlVZypMaek13aSzJcu3Q5+BWR1QnlCOWZivxOth0",
    user_id: "79489b39-bbb1-4497-8350-3ca5132555e0",
  }