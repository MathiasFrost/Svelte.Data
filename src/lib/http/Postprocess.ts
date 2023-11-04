import type { HTTPRequestBuilder } from "$lib/http/HTTPRequestBuilder.js";

/** Modify Response right after response is received
 * @param response The unaltered response from the fetch request
 * @param builder The builder used to make this request */
export type Postprocess = (response: Response, builder: HTTPRequestBuilder) => Promise<Response>;
