const { Pool } = require('pg');
class Database{
	constructor(){
		this._connected = false;
		this._pool = new Pool({
			// user: process.env.DB_USER,
			// host: process.env.DB_HOST,
			// database: process.env.DB_NAME,
			// password: process.env.DB_PASSWORD,
			// port: process.env.DB_PORT
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
	 * @param edit riga da inserire
	 * @param edit.twitch_id id twitch 
	 * @param edit.telegram_id id telegram
	 * @param edit.vip utente vip
	 */
	async insert(edit){
		this.checkConnection();
		if(!await this.userExist(edit)){
			await this._client.query(
				`INSERT INTO "user" 
					(twitch_id, telegram_id, is_vip, telegram_handle)
					VALUES 
					($1, $2, $3, $4);
				`, [edit.twitch_id, edit.telegram_id, edit.is_vip, edit.telegram_handle]);
		}
	}

	/**
	 * Rimuovi un utentee
	 * @param user Utente da rimuovere
	 * @param user.twitch_id id twitch 
	 * @param user.telegram_id id telegram
	 */
	async delete(user){
		this.checkConnection();
		await this._client.query(
			'DELETE FROM "user" telegram_id = $2;'
		, [user.telegram_id])
	}

	/**
	 * Apri connesione al database
	 */
	async open(){
		this._client = await this._pool.connect();
		this._connected = true;
	}

	/**
	 * Chiudi connessione al database
	 */
	async close(){
		this.checkConnection();
		this._client.release();
		this._connected = false;
	}

	
	/**
	 * Crea tabella base per controllo abbonati
	 */
	async createBaseTable(){
		this.checkConnection();
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

	async getCurrentToken(){
		this.checkConnection();
		let result = await this._client.query(
			'SELECT * FROM "access_token";'
		);
		
		if(result.rowCount == 0){
			return false;
		}
		
		let token = {
			access: result.rows[0].access_token,
			refresh: result.rows[0].refresh_token
		}
		return token;
	}

	async updateAccessToken(newToken, refreshToken){
		this.checkConnection();
		await this._client.query(
			`DELETE FROM "access_token";`
		);
		await this._client.query(
			`INSERT INTO "access_token" (access_token, refresh_token) VALUES ($1, $2)`
		, [newToken, refreshToken])
	}

	/**
	 * Controlla che l'utente non esista già
	 * @param user utente da controllare
	 * @param user.twitch_id id twitch 
	 * @param user.telegram_id id telegram
	 */
	async userExist(user){
		let result = await this._client.query(
			'SELECT * from "user" WHERE twitch_id = $1 AND telegram_id = $2;'
		, [user.twitch_id, user.telegram_id]);
		return result.rowCount > 0;
	}

	/**
	 * Ritorna tutti gli utenti attualmente presenti nel database non vip
	 * @returns utenti attualmente presenti nel database non vip
	 */
	async getUsers(){
		this.checkConnection();
		const users = [];
		const result = await this._client.query(
			'SELECT * from "user" WHERE is_vip = false'
		);
		for (const row of result.rows) {
			users.push({
				twitch_id: row.twitch_id,
				telegram_id: row.telegram_id,
				telegram_handle: row.telegram_handle
			});
		}

		return users;
	}

	checkConnection(){
		if(!this._connected){
			throw new Error("Connesione al database non aperta");
		}
	}
}

module.exports = {
	Database: Database
}