




'/api/v1/login'
'/api/v1/openapi'


'/api/v1/systems'
'/api/v1/sesrvices'
'/api/v1/files'
'/api/v1/health'
'/api/v1/applications'


export type Mtoken = {
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

export const mtokenExample =  {
    token: 'eyJhbGciOiJIUzM4NCIsImtpZCI6ImZkYjQ3ZDg4LWJiZjItNGI3Ny05ZWU0LTZiMTk2ZWUzZTlmMiIsInR5cCI6IkpXVCJ9.eyJFeHRlbnNpb25zIjp7IngtZjUtdXNlci1wYXNzLWNoYW5nZSI6WyJubyJdLCJ4LWY1LXVzZXItcm9sZSI6WyJhZG1pbmlzdHJhdG9yIl0sIngtZjUtdXNlci1zdGF0dXMiOlsiZW5hYmxlZCJdLCJ4LWY1LXVzZXItc3RyYXRlZ3kiOlsibG9jYWwiXX0sIkdyb3VwcyI6bnVsbCwiSUQiOiIwNzY3ZGZhMy1iM2JkLTRkMzQtYmExOC0xMjY0MzExMDhhMGUiLCJOYW1lIjoiYWRtaW4iLCJhdWQiOlsiIl0sImV4cCI6MTY0NDQ0MzY0NiwiaWF0IjoxNjQ0NDQwMDQ2LCJuYmYiOjE2NDQ0NDAwNDYsInN1YiI6IjA3NjdkZmEzLWIzYmQtNGQzNC1iYTE4LTEyNjQzMTEwOGEwZSJ9.imiwoKu9JH7z2ypiNvSrSuBAD7v1yny84c086NasKVCodvLiVs9_NMjTIG3oEK56',
    tokenType: 'Bearer',
    expiresIn: 3600,
    refreshToken: 'MzgxN2NjYTgtYzZlNi00OGNjLTg2MjktMGVhMTc5ZGFkYWIyOgrxLZpRYPCe2f2C8qAqtPXwDeqpb0Lw+VXCRcrnHTd7ZLdtDgdTWyohcEEW6x2ccQ',
    refreshExpiresIn: 1209600,
    refreshEndDate: '2022-05-10T20:55:06Z'
  }