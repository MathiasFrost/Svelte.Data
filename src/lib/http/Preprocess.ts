import type { HTTPRequestBuilder } from "$lib/http/HTTPRequestBuilder.js";

/** Modify RequestInit right before request is sent */
export type Preprocess = (requestInit: RequestInit, builder: HTTPRequestBuilder) => Promise<void>;
