import { serverWritable } from "$lib/store/serverWritable.js";

export const unauthorized = serverWritable<boolean>(false);
