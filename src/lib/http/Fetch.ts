/** An enhanced fetch */
export type Fetch = (input: RequestInfo | URL, init?: RequestInit | undefined, nullStatusCodes?: number[]) => Promise<Response>;
