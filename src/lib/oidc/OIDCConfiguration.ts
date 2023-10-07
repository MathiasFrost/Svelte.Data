/** Collection of configuration for each audience */
export type OIDCConfigurations<TAudience extends string> = Readonly<Record<TAudience, OIDCConfiguration<TAudience>>>;

/** Configuration for a single OIDC audience */
export interface OIDCConfiguration<TAudience extends string> {
	/** OIDC provider's authority URI */
	authority: string;

	/** OIDC provider's metadata document URI. Will be inferred from authority if not speified. */
	metadataUri?: string;

	/** OIDC protocol client_id */
	clientId: string;

	/** OIDC protocol redirect_id */
	redirectUri: string;

	/** OIDC protocol scope */
	scope: string;

	/** Invoked when acquiring access_token requires user interaction */
	onSignInPrompt?: (audience: TAudience) => void;

	/** Set to true if we want to immediately redirect to OIDC provider's authorization endpoint when user interaction is required */
	autoSignIn?: boolean;
}
