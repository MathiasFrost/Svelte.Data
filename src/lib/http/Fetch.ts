/** An enhanced fetch that adds `nullStatusCodes` param that is passed from the HTTPRequestBuilder in nullable requests */
export type Fetch = (input: RequestInfo | URL, init?: RequestInit | undefined, nullStatusCodes?: number[]) => Promise<Response>;

/** An enhanced send that add */
export type XmlHttpRequestSend = (body?: Document | XMLHttpRequestBodyInit | null) => void;
