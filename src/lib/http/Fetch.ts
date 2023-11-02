/** `typeof window.fetch` */
export type Fetch = (input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>;
