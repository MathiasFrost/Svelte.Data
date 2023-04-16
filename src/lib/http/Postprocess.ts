/** Modify Response right after response is recieved */
export type Postprocess = (response: Response) => Promise<void>;
