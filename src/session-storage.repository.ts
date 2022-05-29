import {SessionStorageKey} from "./entities/session-storage.entity";

interface SessionStorageRepository {
	setItem(key: SessionStorageKey, value: string | number | null): void;
	getItem(key: SessionStorageKey): string | null;
}

export const sessionStorageRepository: SessionStorageRepository = {
	setItem(key: SessionStorageKey, value: string | number | null): void {
		if(value === null) {
			sessionStorage.removeItem(key);
			return;
		}

		sessionStorage.setItem(key, value.toString());
	},

	getItem(key: SessionStorageKey): string | null {
		return sessionStorage.getItem(key);
	}
}