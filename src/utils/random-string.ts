import {randomBytes} from "crypto";

export function randomString(len: number): string {
	return randomBytes(len).toString("base64url");
}