import { ApiRequest } from './types/web';

export async function apiCall<T>(opt: ApiRequest): Promise<T>{
	const response = await fetch(opt.url, {
		method: opt.method,
		headers: opt?.headers,
		body: JSON.stringify(opt?.data)
	});
	
	return (await response.json()) as T;
}

export function generateQuery(queryArg: any): string {
	return new URLSearchParams(queryArg).toString();
}