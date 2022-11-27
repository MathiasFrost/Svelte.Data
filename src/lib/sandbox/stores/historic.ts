import {historicWritable} from "$lib/store/historic/HistoricWritable";

/** @internal */
export const historic = historicWritable<string>("initial value");
