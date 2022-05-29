import {useReducer} from "react";
import {Token} from "./token.entity";
import newContext from "./new-context";
import {randomString} from "./utils/random-string";
import {paramsSerialiser} from "./utils/params-serialiser";
import {oauthReducer, OAuthStateActions} from "./auth-state-reducer";

interface OAuthProps {
	children: JSX.Element | JSX.Element[];
	uri: string;
	scope: string;
	audience: string;
	client_id: string;
	redirect_uri: string;
	tokenInitialState?: {
		token: string | null;
		refresh_token: string | null;
		expire: Date | null;
	}
}

export interface OAuthState {
	token: string | null;
	refresh_token: string | null;
	expire: Date | null;
	isAuthenticated: boolean;
}

export interface OAuthContextValue extends OAuthState {
	isAuthenticated: boolean;
	setToken(token: Token): void;
	authenticate(): void;
	refreshToken(): Promise<void>;
	logout(): void;
}

const context = newContext<OAuthContextValue>(undefined!);

export const useOAuth = () => context.useContext();

export function OAuthProvider(props: OAuthProps) {
	const { uri, children, tokenInitialState, ...authProps } = props;

	const params = {
		...authProps,
		response_type: "code",
		response_mode: "query",
	};

	const [oAuthContext, authDispatcher] = useReducer<(state: OAuthState, action: OAuthStateActions) => OAuthState>(oauthReducer, {
		token: tokenInitialState ? tokenInitialState.token : null,
		refresh_token: tokenInitialState ? tokenInitialState.refresh_token : null,
		expire: tokenInitialState ? tokenInitialState.expire : null,
		isAuthenticated: false,
	});

	const code = new URL(window.location.href).searchParams.get("code");

	// Load data from session storage only if session or code on url exists. Otherwise, user has to re-authenticate, so we
	// need a new code challenge and state.
	const code_challenge = oAuthContext.token || code
		? sessionStorage.getItem("oauth-code-challenge") ?? randomString(128)
		: randomString(128);

	const state = oAuthContext.token || code
		? sessionStorage.getItem("oauth-state") ?? randomString(80)
		: randomString(80);

	sessionStorage.setItem("oauth-code-challenge", code_challenge);
	sessionStorage.setItem("oauth-state", state);

	if (code && !(oAuthContext.token && oAuthContext.refresh_token && oAuthContext.expire)) {
		const tokenParams = {
			client_id: params.client_id,
			grant_type: "authorization_code",
			code_verifier: code_challenge,
			code,
			redirect_uri: params.redirect_uri,
			state: state,
		};

		fetch(`${uri}/token`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${code}`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: paramsSerialiser(tokenParams),
		})
			.then(response => {
				if (!response.ok) return;

				response
					.json()
					.then(body => {
							window.history.pushState({}, document.title, params.redirect_uri);

							authDispatcher({
								type: "authenticate",
								payload: {
									token: body.access_token,
									refresh_token: body.refresh_token,
									expire: new Date(Date.now() + body.expires_in),
								},
							});
						}
					);
			});
	}

	if (oAuthContext.expire && oAuthContext.expire.getTime() < Date.now()) {
		refreshToken();
	}

	function authenticate() {
		const urlParams = {
			...params,
			code_challenge: code_challenge,
			state: state,
		};

		window.location.href = `${uri}/authorize?${paramsSerialiser(urlParams)}`;
	}

	async function refreshToken() {
		const tokenParams = {
			client_id: params.client_id,
			grant_type: "refresh_token",
			code_verifier: code_challenge,
			refresh_token: oAuthContext.refresh_token,
			redirect_uri: params.redirect_uri,
			state: state,
		};

		fetch(`${uri}/token`, {
			method: "POST",
			headers: {Authorization: `Bearer ${oAuthContext.token}`, "Content-Type": "application/x-www-form-urlencoded"},
			body: paramsSerialiser(tokenParams),
		})
			.then(response => {
				if (!response.ok) return;

				response
					.json()
					.then(body =>
						authDispatcher({
							type: "authenticate",
							payload: {
								token: body.access_token,
								refresh_token: body.refresh_token,
								expire: new Date(Date.now() + body.expires_in),
							},
						}),
					);
			});
	}

	function logout() {
		authDispatcher({type: "logout"});
	}

	function setToken(token: Token) {
		authDispatcher({ type: "authenticate", payload: { ...token }});
	}

	return (
		<context.ContextProvider value={{
			...oAuthContext,
			setToken,
			authenticate,
			refreshToken,
			logout,
			isAuthenticated: oAuthContext.token !== null,
		}}>
			{children}
		</context.ContextProvider>
	);
}

OAuthProvider.defaultProps = {
	persistenceMethod: "none",
}