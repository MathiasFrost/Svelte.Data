/** TODOC */
export type OIDCConfigurations<TAudience extends string> = Readonly<Record<TAudience, OIDCConfiguration>> & {
	onSignInPrompt: (audience: TAudience) => void;
};

/** TODOC */
export interface OIDCConfiguration {
	metadataAddress: string;
	clientId: string;
	redirectUri: string;
	scopeSets: string[];
}
