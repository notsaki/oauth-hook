import {OAuthState} from "./useOAuth";

export type OAuthStateActions = {
	type: "authenticate",
	payload: {
		token: string,
		refresh_token: string,
		expire: Date,
	},
} | {
	type: "logout",
};

export function oAuthReducer(state: OAuthState, action: OAuthStateActions) {
	switch(action.type) {
		case "authenticate":
			return {
				...state,
				token: action.payload.token,
				refresh_token: action.payload.refresh_token,
				expire: action.payload.expire,
			};
		case "logout":
			return {
				...state,
				token: null,
				refresh_token: null,
				expire: null,
			};
		default:
			throw new Error("Invalid auth state action.");
	}
}