/** Modify RequestInit right before request is sent */
export type Preprocess = (requestInit: RequestInit) => Promise<void>;
