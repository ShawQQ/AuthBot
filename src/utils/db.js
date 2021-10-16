const { Client } = require('pg');
class Database{
	_connected;
	client = {}

	constructor(){
		this._connected = false;
		this._client = new Client({
			connectionString: process.env.DATABASE_URL,
			ssl: {
				rejectUnauthorized: !process.env.SANDBOX
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
		if(!this.userExist(edit)){
			await this._client.query(
				`INSERT INTO "user" 
					(twitch_id, telegram_id, is_vip)
					VALUES 
					($1, $2, $3);
				`, [edit.twitch_id, edit.telegram_id, edit.is_vip]);
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
			'DELETE FROM "user" WHERE twitch_id = $1 AND telegram_id = $2'
		, [user.twitch_id, user.telegram_id])
	}

	/**
	 * Apri connesione al database
	 */
	async open(){
		await this._client.connect();
		this._connected = true;
	}

	/**
	 * Chiudi connessione al database
	 */
	async close(){
		this.checkConnection();
		await this._client.end();
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
				twitch_id int NOT NULL UNIQUE,
				telegram_id int NOT NULL UNIQUE,
				is_vip BOOLEAN
			);`
		);
	}

	/**
	 * Controlla che l'utente non esista già
	 * @param user utente da controllare
	 * @param user.twitch_id id twitch 
	 * @param user.telegram_id id telegram
	 */
	async userExist(user){
		let result = await this._client.query(
			'SELECT * from "user" WHERE twitch_id = $1 AND telegram_id = $2'
		, [user.twitch_id, user.telegram_id])
		return result.rowCount > 0;
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