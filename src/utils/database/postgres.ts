import { Client } from "pg";
import { Database, UserEdit, AccessToken } from "./interfaces";
import 'dotenv/config';

export class PostgresDatabase implements Database{
	private _connected: boolean = false;
	private _client: Client;

	constructor(){
		this._connected = false;
		this._client = new Client({
			// user: process.env.DB_USER,
			// host: process.env.DB_HOST,
			// database: process.env.DB_NAME as unknown as string,
			// password: process.env.DB_PASSWORD as unknown as string,
			// port: process.env.DB_PORT as unknown as number
			connectionString: process.env.DATABASE_URL,
			ssl: {
				rejectUnauthorized: false
			}
		});
	}

	/**
	 * Ritorna lo stato corrente della connessione
	 */
	get connected(){
		return this._connected;
	}

	public async insert(edit: UserEdit){
		await this.checkConnection();
		if(!await this.userExist(edit)){
			await this._client.query(
				`INSERT INTO "user" 
					(twitch_id, telegram_id, is_vip)
					VALUES 
					($1, $2, $3);
				`, [edit.twitch_id, edit.telegram_id, edit.is_vip]);
		}
	}

	public async delete(user: UserEdit){
		await this.checkConnection();
		await this._client.query(
			'DELETE FROM "user" telegram_id = $2;'
		, [user.telegram_id])
	}

	public async open(){
		await this._client.connect();
		this._connected = true;
	}

	public async close(){
		await this.checkConnection();
		await this._client.end();
		this._connected = false;
	}
	
	public async createBaseTable(){
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

	public async getCurrentToken(): Promise<AccessToken>{
		await this.checkConnection();
		let result = await this._client.query(
			'SELECT * FROM "access_token";'
		);
		if(result.rowCount == 0) return undefined;
		return {
			access: result.rows[0].access_token,
			refresh: result.rows[0].refresh_token
		}
	}

	public async updateAccessToken(token: AccessToken){
		await this.checkConnection();
		await this._client.query(
			`DELETE FROM "access_token";`
		);
		await this._client.query(
			`INSERT INTO "access_token" (access_token, refresh_token) VALUES ($1, $2)`
		, [token.access, token.refresh])
	}

	public async getUsers(): Promise<UserEdit[]>{
		await this.checkConnection();
		const users: UserEdit[] = [];
		const result = await this._client.query(
			'SELECT * from "user" WHERE is_vip = false'
		);
		for (const row of result.rows) {
			users.push({
				twitch_id: row.twitch_id,
				telegram_id: row.telegram_id,
				is_vip: false
			});
		}

		return users;
	}

	/**
	 * Controlla che l'utente non esiste già nel database
	 * @param user utente da controllare
	 * @returns true se l'utente è presente, false altrimenti
	 */
	private async userExist(user: UserEdit): Promise<boolean>{
		let result = await this._client.query(
			'SELECT * from "user" WHERE twitch_id = $1 AND telegram_id = $2;'
		, [user.twitch_id, user.telegram_id]);
		return result.rowCount > 0;
	}

	/**
	 * Controlla che la connessione al database sia aperta
	 * @throws Error se la connessione non risulta aperta
	 * @returns true se la connessione è aperta
	 */
	private async checkConnection(): Promise<boolean>{
		if(!this._connected) await this.open();
		return true;
	}
}
