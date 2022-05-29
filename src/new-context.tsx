import React, { createContext, useContext } from "react";

export type ContextProvider<T> = (value: ContextProviderProps<T>) => JSX.Element;
export type ContextHook<T> = () => T;

interface ContextProviderProps<T> {
	children: JSX.Element | JSX.Element[];
	value: T;
}

export interface Context<T> {
	Context: React.Context<T>;
	useContext: ContextHook<T>;
	ContextProvider: ContextProvider<T>;
}

export default function newContext<T>(value: T): Context<T> {
	const Context: React.Context<T> = createContext<T>(value);
	const contextHook: ContextHook<T> = () => useContext(Context);

	const ContextProvider: ContextProvider<T> = (props: ContextProviderProps<T>): JSX.Element => {
		return (
			<Context.Provider value={props.value}>
				{props.children}
			</Context.Provider>
		);
	};

	return {
		Context,
		useContext: contextHook,
		ContextProvider,
	};
}