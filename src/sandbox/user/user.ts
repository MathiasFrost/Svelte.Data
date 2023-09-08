import { browserWritable } from "$lib/store/index.js";

/** TODOC */
export const user = browserWritable<{ name: string } | null>(null);
