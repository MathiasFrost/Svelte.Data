/** Modify Response right after response is received */
export type Postprocess = (response: Response) => Promise<void>;
