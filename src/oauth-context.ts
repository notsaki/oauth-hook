import { createContext, useContext } from "react";
import { OAuthContextValue } from "./OAuthProvider";

const throwError = () => {
	throw new Error("Context requested outside of provider scope.");
};

const initialContext: OAuthContextValue = {
	token: throwError(),
	// @ts-ignore
	refresh_token: throwError(),
	expire: throwError(),
	isAuthenticated: throwError(),
	// @ts-ignore
	authenticate() { throwError(); },
	// @ts-ignore
	refreshToken() { throwError(); },
	logout() { throwError(); },
};

export const OAuthContext = createContext<OAuthContextValue>(initialContext);

export const useOAuthContext = useContext(OAuthContext);