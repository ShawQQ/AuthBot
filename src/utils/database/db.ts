import { Database } from "./interfaces";
import { PostgresDatabase } from "./postgres";

/**
* Database factory
*/
export abstract class DatabaseFactory {
	private static database: Database;
	
	/**
	 * Get the current instance of the database
	 * @return {Database} instance of the database
	 */
	public static getDatabase(): Database {
		if (this.database == undefined) {
			this.database = new PostgresDatabase();
		}
		return this.database;
	}
}
