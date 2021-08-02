const { Client } = require('pg');
const client = new Client({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT
});

const edit = async (edit) => {
	await connect();
	let query = edit.id !== undefined ? update(edit) : insert(edit);
	result = await client.query(query);
	await client.end();
}

const fetch = async (filters) => {
	await connect();
	let query = parseFilters(filters);
	res = await client.query(query);
	await client.end();
	return res;
}

function update(edit){
	let queryStr = `UPDATE "${edit.table}" SET `;
	for (const field in edit.fields) {
		if (Object.hasOwnProperty.call(edit.fields, field)) {
			const element = edit.fields[field];
			queryStr += `${field} = ${element}, `;
		}
	}
	queryStr = queryStr.slice(0, queryStr.length - 2);
	queryStr +=` WHERE id = ${edit.id}`;
	return queryStr;
}

function insert(edit){
	let queryStr = `INSERT INTO "${edit.table}" (`;
	for (const field in edit.fields) {
		if (Object.hasOwnProperty.call(edit.fields, field)) {
			queryStr += `${field}, `;
		}
	}
	queryStr = queryStr.slice(0, queryStr.length - 2);
	queryStr += " ) VALUES (";
	for (const field in edit.fields) {
		if (Object.hasOwnProperty.call(edit.fields, field)) {
			const element = edit.fields[field];
			queryStr += `${element}, `;
		}
	}
	queryStr = queryStr.slice(0, queryStr.length - 2);
	queryStr += ")";
	return queryStr;
}

function parseFilters(filters){
	let queryStr = `SELECT * FROM "${filters.table}" WHERE `;
	filters.values.forEach(element => {
		queryStr += `${element.field} ${element.operator} ${element.value} AND `;
	});
	queryStr = queryStr.slice(0, queryStr.length - 4);
	return queryStr;
}

async function connect(){
	await client.connect();
}

module.exports = {
	edit: edit,
	fetch: fetch
};