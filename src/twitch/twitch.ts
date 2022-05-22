import { ApiRequest } from "../utils/web/types/web";
import { apiCall } from "../utils/web/web";
import {
	Twitch,
	TwitchUser,
	UserAuthToken,
	TwitchSub,
	AdminToken,
	AuthResult,
} from "./types/twitch";
import { generateQuery } from "../utils/web/web";
import { Database } from "src/utils/database/interfaces";
import { DatabaseFactory } from "../utils/database/db";

/**
* Implementations of core twitch functionality
*/
export class TwitchInstance implements Twitch {
	static CLIENT_ID: string = process.env.TWITCH_CLIENT_ID;
	static CLIENT_SECRET: string = process.env.TWITCH_CLIENT_SECRET;
	static OAUTH_2_COMPLETE: string = process.env.OAUTH2_COMPLETE;
	static OAUTH2_START: string =
	"id.twitch.tv/oauth2/authorize?client_id=" +
	TwitchInstance.CLIENT_ID +
	"&redirect_uri=" +
	process.env.OAUTH2_URI +
	"&response_type=code&scope=user:read:subscriptions&prompt=none";
	private static db: Database = DatabaseFactory.getDatabase();
	
	/**
	* Return the twitch id of the specified user
	* @param {UserAuthToken} user OAuth2 token for the user
	* @return {Promise<number>} twitch id of the suer
	*/
	async getUser(user: UserAuthToken): Promise<number> {
		const req: ApiRequest = {
			url: "api.twitch.tv/helix/users",
			headers: {
				"Content-Type": "application/json",
				"Client-ID": TwitchInstance.CLIENT_ID,
				Authorization: "Bearer " + user.token,
			},
			method: "GET",
		};
		const twitchUser = await apiCall<TwitchUser>(req);
		if (twitchUser?.data?.length !== 0) {
			return twitchUser.data[0].id;
		} else {
			throw new Error("Utente non trovato");
		}
	}
	
	/**
	* Get the current subs of the admin channel
	* @return {Promise<Array<number>>} list of the ids of the current subscribers 
	*/
	async getCurrentSubs(): Promise<Array<number>> {
		const token: UserAuthToken = await this.updateAdminToken();
		return await this._getCurrentSub("", token);
	}
	
	/**
	* Complete the authentication process
	* @param { string } code OAuth2 code
	* @return {Promise<AuthResult>} Object containing the twitch id of the user and the result of checkUserSub
	*/
	async completeAuth(code: string): Promise<AuthResult> {
		const query = generateQuery({
			client_id: TwitchInstance.CLIENT_ID,
			client_secret: TwitchInstance.CLIENT_SECRET,
			grant_type: "authorization_code",
			code: code,
			redirect_uri: TwitchInstance.OAUTH_2_COMPLETE,
		});
		const opt: ApiRequest = {
			url: "id.twitch.tv/oauth2/token?" + query,
			method: "POST",
		};
		const result: UserAuthToken = await apiCall<UserAuthToken>(opt);
		return {
			is_sub: await this.checkUserSub(result),
			twitch_id: await this.getUser(result),
		};
	}
	
	/**
	* Need implementation
	*/
	adminAuth(): void {
		throw new Error("Method not implemented.");
	}
	/**
	* Need implentation
	*/
	confirmAdminAuth(): void {
		throw new Error("Method not implemented.");
	}
	
	/**
	 * Get all the subscribers to the broadcaster channel recursively 
	 * @param {string} pagination current page of subscribers 
	 * @param {UserAuthToken} token OAuth2 token of the admin channel 
	 * @return {Promise<Array<number>>} list of ids
	 */
	private async _getCurrentSub(
		pagination: string,
		token: UserAuthToken
		): Promise<Array<number>> {
			const broadcasterId: number = await this.getUser(token);
			const queryParam = {
				broadcaster_id: broadcasterId,
				first: 100,
				after: "",
			};
			if (pagination) {
				queryParam.after = pagination;
			}
			const opt: ApiRequest = {
				url: "api.twitch.tv/helix/subscriptions?" + generateQuery(queryParam),
				method: "GET",
				headers: {
					"Client-ID": TwitchInstance.CLIENT_ID,
					Authorization: "Bearer " + token.token,
				},
			};
			const data: TwitchSub = await apiCall<TwitchSub>(opt);
			let users: number[] = [];
			for (const user of data.data) {
				users.push(user.user_id);
			}
			if (data.data.length !== 0) {
				users = users.concat(
					await this._getCurrentSub(data.pagination.cursor, token)
					);
				}
				return users;
			}
	
	/**
	 * Get and refresh the broadcaster OAuth2 token 
	 * @return {Promise<UserAuthToken>} the new OAuth2 token
	 */
	private async updateAdminToken(): Promise<UserAuthToken> {
		const oldToken: AdminToken = await TwitchInstance.db.getCurrentToken();
		if (oldToken === undefined) throw new Error("Token non disponibile");
		const queryParam: String = generateQuery({
			grant_type: "refresh_token",
			refresh_token: oldToken.refresh,
			client_id: TwitchInstance.CLIENT_ID,
			client_secret: TwitchInstance.CLIENT_SECRET,
		});
		const result = await apiCall<AdminToken>({
			url: "id.twitch.tv/oauth2/token?" + queryParam,
			method: "POST",
		});
		const newToken: UserAuthToken = {
			token: result.token,
			expires: Date.now(),
			creationDate: Date.now(),
		};
		TwitchInstance.db.updateAccessToken(result);
		return newToken;
	}
	
	/**
	 * Check if a user is subscribed to the broadcaster channel
	 * @param {UserAuthToken} userToken OAuth2 token of the user 
	 * @return {Promise<boolean>} true if the user is subbed, false otherwise
	 */
	private async checkUserSub(userToken: UserAuthToken): Promise<boolean> {
		const adminToken: UserAuthToken = await this.updateAdminToken();
		const ids: Array<number> = [
			await this.getUser(adminToken),
			await this.getUser(userToken),
		];
		const queryParam = generateQuery({
			broadcaster_id: ids[0],
			user_id: ids[1],
		});
		const opt: ApiRequest = {
			url: "api.twitch.tv/helix/subscriptions/user?" + queryParam,
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"Client-ID": TwitchInstance.CLIENT_ID,
				Authorization: "Bearer " + userToken.token,
			},
		};
		const result = await apiCall<any>(opt);
		return result.error === undefined;
	}
}
		