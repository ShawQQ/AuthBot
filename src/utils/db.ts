import { Client } from 'pg';

export interface UserEdit{
	twitch_id: number,
	telegram_id: number,
	is_vip: boolean
};

export interface AccessToken{
	access: String,
	refresh: String
};

class Database{
	private _connected: boolean = false;
	private _client: Client;

	constructor(){
		this._connected = false;
		this._client = new Client({
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

	/**
	 * Inserisci un nuovo utente
	 * @param edit utente da inserire
	 */
	public async insert(edit: UserEdit){
		this.checkConnection();
		if(!await this.userExist(edit)){
			await this._client.query(
				`INSERT INTO "user" 
					(twitch_id, telegram_id, is_vip)
					VALUES 
					($1, $2, $3);
				`, [edit.twitch_id, edit.telegram_id, edit.is_vip]);
		}
	}

	/**
	 * Elimina un utente
	 * @param user utente da eliminare
	 */
	public async delete(user: UserEdit){
		this.checkConnection();
		await this._client.query(
			'DELETE FROM "user" WHERE twitch_id = $1 AND telegram_id = $2;'
		, [user.twitch_id, user.telegram_id])
	}

	/**
	 * Apri connesione al database
	 */
	public async open(){
		await this._client.connect();
		this._connected = true;
	}

	/**
	 * Chiudi connessione al database
	 */
	public async close(){
		this.checkConnection();
		await this._client.end();
		this._connected = false;
	}

	
	/**
	 * Crea tabella base per controllo abbonati
	 */
	public async createBaseTable(){
		this.checkConnection();
		await this._client.query(
			`CREATE TABLE IF NOT EXISTS "user" (
				id SERIAL NOT NULL PRIMARY KEY,  
				twitch_id int UNIQUE,
				telegram_id int UNIQUE,
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
	 * Ritorna il token OAuth2 per il canale collegato al bot
	 * @returns false se non esiste nessun token, il token altrimenti
	 */
	public async getCurrentToken(): Promise<boolean | AccessToken>{
		this.checkConnection();
		let result = await this._client.query(
			'SELECT * FROM "access_token";'
		);
		if(result.rowCount == 0) return false;
		return {
			access: result.rows[0].access_token,
			refresh: result.rows[0].refresh_token
		}
	}

	/**
	 * Aggiorna il token OAuth2 per il canale collegato al bot
	 * @param token nuovo token
	 */
	public async updateAccessToken(token: AccessToken){
		this.checkConnection();
		await this._client.query(
			`DELETE FROM "access_token";`
		);
		await this._client.query(
			`INSERT INTO "access_token" (access_token, refresh_token) VALUES ($1, $2)`
		, [token.access, token.refresh])
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
	 * Ritorna tutti gli utenti attualmente presenti nel database non vip
	 * @returns utenti attualmente presenti nel database non vip
	 */
	public async getUsers(): Promise<UserEdit[]>{
		this.checkConnection();
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
	 * Controlla che la connessione al database sia aperta
	 * @throws Error se la connessione non risulta aperta
	 * @returns true se la connessione è aperta
	 */
	private checkConnection(): boolean{
		if(!this._connected){
			throw new Error("Connesione al database non aperta");
		}
		return true;
	}
}

export class DatabaseFactory{
	private static database: Database = new Database();

	public static getDatabase(): Database{
		return this.database;
	}
}