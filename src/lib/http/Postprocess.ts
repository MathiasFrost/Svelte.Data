/** Modify Response right after response is received
 * @param response The unaltered response from the fetch request
 * @param nullAndValid True if this request accepts null result and received a status code indicating null result  */
export type Postprocess = (response: Response, nullAndValid: boolean) => Promise<Response>;
