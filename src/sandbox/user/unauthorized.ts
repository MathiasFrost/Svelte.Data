import { serverWritable } from "$lib/utils/serverStore.js";

export const unauthorized = serverWritable<boolean>(false);
