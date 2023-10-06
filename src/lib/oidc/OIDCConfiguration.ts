/** TODOC */
export type OIDCConfigurations<TAudience extends string> = Readonly<Record<TAudience, OIDCConfiguration<TAudience>>>;

/** TODOC */
export interface OIDCConfiguration<TAudience extends string> {
	authority: string;
	clientId: string;
	redirectUri: string;
	scope: string;
	onSignInPrompt: (audience: TAudience) => void;
}
