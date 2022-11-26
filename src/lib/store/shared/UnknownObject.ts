export type UnknownObject = {
	[k: string]: number | string | boolean | undefined | null | UnknownObject;
};
