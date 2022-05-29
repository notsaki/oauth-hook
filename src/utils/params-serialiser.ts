export function paramsSerialiser(params: object): string {
	return Object
		.keys(params)
		.map(key => `${key}=${params[key]}`)
		.join("&");
}