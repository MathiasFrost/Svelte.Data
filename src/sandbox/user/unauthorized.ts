import { serverWritable } from "$lib/store/index.js";

export const unauthorized = serverWritable<boolean>(false);
