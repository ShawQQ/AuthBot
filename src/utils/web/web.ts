import fetch from 'node-fetch';
import { ApiRequest } from "./types/web";

/**
* Utility for api call
* @param {ApiRequest} opt Api request options 
* @return {Promise<T>} api result as T
*/
export async function apiCall<T>(opt: ApiRequest): Promise<T> {
	if(!opt.url.startsWith("https://")){
		opt.url = "https://" + opt.url;
	}
	const response = await fetch(opt.url, {
		method: opt.method,
		headers: opt?.headers,
		body: JSON.stringify(opt?.data),
	});
	
	return (await response.json()) as T;
}

/**
* Generate url query from a string
* @param {any} queryArg arguments of the query
* @return {string} url-encoded query
*/
export function generateQuery(queryArg: any): string {
	return new URLSearchParams(queryArg).toString();
}
