/** Modify Response right after response is received
 * @param response The unaltered response from the fetch request
 * @param nullable True if this request accepts null result and received a status code indicating null result  */
export type Postprocess = (response: Response, nullable: boolean, retry: () => Promise<Response>, retryCount: number) => Promise<Response | null>;
