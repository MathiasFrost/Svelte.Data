import { browserWritable } from "$lib/store/index.js";

/** */
export const user = browserWritable<{ name: string } | null>(null);
