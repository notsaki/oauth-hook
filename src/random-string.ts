export function randomString(len: number): string {

	function stringGenerator(length, chars) {
		let result = "";

		for(let i = length; i > 0; --i) {
			result += chars[Math.floor(Math.random() * chars.length)];
		}

		return result;
	}

	return stringGenerator(len, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
}