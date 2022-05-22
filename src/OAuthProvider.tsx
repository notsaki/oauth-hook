import * as React from "react";
import { useReducer, useRef } from "react";
import { OAuthContext } from "./oauth-context";
import { paramsSerialiser } from "./params-serialiser";
import { randomString } from "./random-string";
import { oauthReducer, OAuthStateActions } from "./oauth-state-reducer";

interface OAuthProps {
	children: React.ReactNode;
	uri: string;
	scope: string;
	audience: string;
	client_id: string;
	redirect_uri: string;
}

export interface OAuthState {
	token: string | null;
	refresh_token: string | null;
	expire: Date | null;
	isAuthenticated: boolean;
	authenticate();
	refreshToken();
	logout();
}

export interface OAuthContextValue extends OAuthState {
	isAuthenticated: boolean;
}

export function OAuthProvider(props: OAuthProps) {
	const { uri, children, ...authProps } = props;

	const params = {
		...authProps,
		response_type: "code",
		response_mode: "query",
	};

	const code = new URL(window.location.href).searchParams.get("code");
	const code_challenge = useRef(sessionStorage.getItem("oauth-code-challenge") ?? randomString(128));
	const state = useRef(sessionStorage.getItem("oauth-state") ?? randomString(80));

	sessionStorage.setItem("oauth-code-challenge", code_challenge.current);
	sessionStorage.setItem("oauth-state", state.current);

	const [oAuthContext, authDispatcher] = useReducer<(state: OAuthState, action: OAuthStateActions) => OAuthState>(oauthReducer, {
		token: null,
		refresh_token: null,
		expire: null,
		isAuthenticated: false,
		authenticate,
		refreshToken,
		logout,
	});

	if(code && !oAuthContext.token) {
		const tokenParams = {
			client_id: params.client_id,
			grant_type: "authorization_code",
			code_verifier: code_challenge.current,
			code,
			redirect_uri: params.redirect_uri,
			state: state.current,
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
				if(!response.ok) return;

				response
					.json()
					.then(body =>
						authDispatcher({
							type: "authenticate",
							payload: {
								token: body.token,
								refresh_token: body.refresh_token,
								expire: new Date(Date.now() + body.expire),
							},
						}),
					);
			});
	}

	if(oAuthContext.expire && oAuthContext.expire.getTime() < Date.now()) {
		refreshToken();
	}

	function authenticate() {
		const urlParams = {
			...params,
			code_challenge: code_challenge.current,
			state: state.current,
		};

		window.location.href = `${uri}/authorize?${paramsSerialiser(urlParams)}`;
	}

	function refreshToken() {
		const tokenParams = {
			client_id: params.client_id,
			grant_type: "refresh_token",
			code_verifier: code_challenge.current,
			refresh_token: oAuthContext.refresh_token,
			redirect_uri: params.redirect_uri,
			state: state.current,
		};

		fetch(`${uri}/token`, {
			method: "POST",
			headers: { Authorization: `Bearer ${oAuthContext.token}`, "Content-Type": "application/x-www-form-urlencoded" },
			body: paramsSerialiser(tokenParams),
		})
			.then(response => {
				if(!response.ok) return;

				response
					.json()
					.then(body =>
						authDispatcher({
							type: "authenticate",
							payload: {
								token: body.token,
								refresh_token: body.refresh_token,
								expire: new Date(Date.now() + body.expire),
							},
						}),
					);
			});
	}

	function logout() {
		authDispatcher({ type: "logout" });
	}

	return (
		<OAuthContext.Provider value={{
			...oAuthContext,
			isAuthenticated: oAuthContext.token !== null,
		}}>
			{children}
		</OAuthContext.Provider>
	)
}