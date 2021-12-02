export interface UserEdit{
	twitch_id: number,
	telegram_id: number,
	is_vip: boolean
};

export interface AccessToken{
	access: String,
	refresh: String
};

export interface Database{
	/**
	 * Inserisci un nuovo utente
	 * @param edit utente da inserire
	 */
	insert: (edit: UserEdit) => Promise<void>,
	/**
	 * Elimina un utente
	 * @param user utente da eliminare
	 */
	delete: (edit: UserEdit) => Promise<void>,
	/**
	 * Apri connesione al database
	 */
	open: () => Promise<void>,
	/**
	 * Chiudi connessione al database
	 */
	close: () => Promise<void>,
	/**
	 * Crea tabella base per controllo abbonati
	 */
	createBaseTable: () => Promise<void>,
	/**
	 * Ritorna il token OAuth2 per il canale collegato al bot
	 * @returns false se non esiste nessun token, il token altrimenti
	 */
	getCurrentToken: () => Promise<AccessToken>,
	/**
	 * Aggiorna il token OAuth2 per il canale collegato al bot
	 * @param token nuovo token
	 */
	updateAccessToken: (token: AccessToken) => Promise<void>,
	/**
	 * Ritorna tutti gli utenti attualmente presenti nel database non vip
	 * @returns utenti attualmente presenti nel database non vip
	 */
	getUsers: () => Promise<UserEdit[]>
};