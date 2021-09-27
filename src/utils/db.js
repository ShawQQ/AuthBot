const { Client } = require('pg');
const client = new Client({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT
});

const insert = async (edit) => {
	await client.query(
		`INSERT INTO "user" 
			(twitch_id, telegram_id, is_vip)
			VALUES 
			($1, $2, $3);
		`, [edit.twitch_id, edit.telegram_id, edit.is_vip]);
}

const isSubbed = async (twitch_id) => {
	let result = await client.query(
		`
			SELECT * FROM "user" WHERE "twitch_id" = $1
		`, [twitch_id]);
	return result.rows.length > 0;
} 

const createBaseTable = async () => {
	await client.query(
		`CREATE TABLE IF NOT EXISTS "user" (
			id SERIAL NOT NULL PRIMARY KEY,  
			twitch_id int NOT NULL UNIQUE,
			telegram_id int NOT NULL UNIQUE,
			is_vip BOOLEAN
		);`
	);
}

const open = async () => {
	await client.connect();
}

const close = async() => {
	await client.end();
}
module.exports = {
	insert: insert,
	isSubbed: isSubbed,
	open: open,
	close: close,
	createBaseTable: createBaseTable,
};