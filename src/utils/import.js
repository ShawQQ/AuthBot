require('dotenv').config();
const csv = require('csv-parse');
const fs = require('fs');
const twitch = require('../twitch/app');
const { Database } = require('./db');
const db = new Database();
const results = [];
const errors = [];

fs.createReadStream('./src/utils/files/abbonati.csv')
	.pipe(csv({
		separator: ',',
	}))
	.on('data', (data) => results.push(data))
	.on('end', () => {
		db.open().then(async () => {
			for(const row of results){
				try{
					let twitch_id = await twitch.getUser(row[1].split(/\s/).join(''));
					await db.insert({
						twitch_id: twitch_id,
						telegram_id: row[4],
						telegram_handle: row[2],
						is_vip: row[3] === 'SI'
					});
				}catch(e){
					errors.push({
						name: row[1],
						telegram_handle: row[2]
					});
				}
			}
			console.log(errors);
			db.close();
		});
	});