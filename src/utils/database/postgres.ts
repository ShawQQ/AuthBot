import { Client } from "pg";
import { Database, UserEdit } from "./interfaces";
import { AdminToken } from "../../twitch/types/twitch";
require("dotenv");

/**
* Postgres implementation of the Database interface
*/
export class PostgresDatabase implements Database {
	private _connected: boolean = false;
	private _client: Client;
	
	/**
	 * Base costructor
	 */
	constructor() {
		this._connected = false;
		console.log(process.env);
		this._client = new Client({
			user: process.env.DB_USER as unknown as string,
			host: process.env.DB_HOST as unknown as string,
			database: process.env.DB_NAME as unknown as string,
			password: process.env.DB_PASSWORD as unknown as string,
			port: process.env.DB_PORT as unknown as number,
		});
	}
	
	/**
	* Return the current status of the connection
	*/
	get connected() {
		return this._connected;
	}
	
	/**
	 * Insert a new user
	 * @param {UserEdit} edit user data 
	 */
	public async insert(edit: UserEdit) {
		await this.checkConnection();
		if (!(await this.userExist(edit))) {
			await this._client.query(
				`INSERT INTO "user" 
				(twitch_id, telegram_id, is_vip, telegram_handle)
				VALUES 
				($1, $2, $3, $4);
				`,
				[edit.twitch_id, edit.telegram_id, edit.is_vip, edit.telegram_handle]
			);
		}
	}
	
	/**
	 * Delete a user
	 * @param {UserEdit} user User to delete 
	 */
	public async delete(user: UserEdit) {
		await this.checkConnection();
		await this._client.query('DELETE FROM "user" telegram_id = $2;', [
			user.telegram_id,
		]);
	}
	
	/**
	 * Open a new connection to the database
	 */
	public async open() {
		await this._client.connect();
		this._connected = true;
	}
		
	/**
	 * Close the connection to the database
	 */
	public async close() {
		await this.checkConnection();
		await this._client.end();
		this._connected = false;
	}
	
	/**
	 * Create user and token table
	 */
	public async createBaseTable() {
		await this.checkConnection();
		await this._client.query(
			`CREATE TABLE IF NOT EXISTS "user" (
				id SERIAL NOT NULL PRIMARY KEY,  
				twitch_id int UNIQUE,
				telegram_id int UNIQUE,
				telegram_handle varchar(255),
				is_vip BOOLEAN
			);
			CREATE TABLE IF NOT EXISTS "access_token" (
				id SERIAL NOT NULL PRIMARY KEY,
				access_token varchar(255) UNIQUE,
				refresh_token varchar(255) UNIQUE
			);`
		);
	}
				
	/**
	 * Get the current OAuth2 for the broadcaster
	 * @return {Promise<AdminToken>} OAuth2 Token
	 */
	public async getCurrentToken(): Promise<AdminToken> {
		await this.checkConnection();
		const result = await this._client.query('SELECT * FROM "access_token";');
		if (result.rowCount == 0) return undefined;
		return {
			token: result.rows[0].access_token,
			refresh: result.rows[0].refresh_token,
		};
	}
		
	/**
	 * Update the OAuth2 token for the broadcaster
	 * @param {AdminToken} token the new OAuth2 token
	 */
	public async updateAccessToken(token: AdminToken) {
		await this.checkConnection();
		await this._client.query(`DELETE FROM "access_token";`);
		await this._client.query(
			`INSERT INTO "access_token" (access_token, refresh_token) VALUES ($1, $2)`,
			[token.token, token.refresh]
		);
	}
	
	/**
	 * Get the current users
	 * @return {Promise<UserEdit[]>} array of user
	 */
	public async getUsers(): Promise<UserEdit[]> {
		await this.checkConnection();
		const users: UserEdit[] = [];
		const result = await this._client.query(
			'SELECT * from "user" WHERE is_vip = false'
		);
		for (const row of result.rows) {
			users.push({
				twitch_id: row.twitch_id,
				telegram_id: row.telegram_id,
				telegram_handle: row.telegram_handle,
				is_vip: false,
			});
		}
		
		return users;
	}
	

	/**
	* Check if the users already exist
	* @param {UserEdit} user to check
	* @return {Promise<boolean>} if the user exists, false otherwise
	*/
	private async userExist(user: UserEdit): Promise<boolean> {
		const result = await this._client.query(
			'SELECT * from "user" WHERE twitch_id = $1 AND telegram_id = $2;',
			[user.twitch_id, user.telegram_id]
		);
		return result.rowCount > 0;
	}
		
	/**
	* Check if a connection to the database is already present
	* @return {Promise<boolean>} true if the connection exists, false otherwise
	*/
	private async checkConnection(): Promise<boolean> {
		if (!this._connected) await this.open();
		return true;
	}
}
	