import { Database} from './interfaces';
import { PostgresDatabase } from './postgres';

export abstract class DatabaseFactory{
	private static database: Database;

	public static getDatabase(): Database{
		if(this.database == undefined){
			this.database = new PostgresDatabase();
		}
		return this.database;
	}
}