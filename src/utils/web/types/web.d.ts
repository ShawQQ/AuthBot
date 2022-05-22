export type ApiRequest = {
	url: string,
	method: string,
	headers?: {
		[_key: string]: string
	},
	data?: any
}