import fs from 'fs';
const DB_PATH = './db.json';

// Load or initialize DB
export let db: any = fs.existsSync(DB_PATH)
  ? JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
  : {
      tickers: [],
      clients: [],
      brokerOperators: [],
    };

// Save DB
export function saveDB() {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}