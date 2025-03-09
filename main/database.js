const sqlite = require('sqlite3').verbose();
const Database = require('nedb');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

// DBへの参照
let db;

const userDataPath = app.getPath('userData');
const dbDir = path.join(userDataPath, 'databases');

if(!fs.existsSync(dbDir)){
    fs.mkdirSync(dbDir, { recursive:true});
}

async function initDatabases(){
    return new Promise((resolve, reject) => {
        // SQLite準備
        const dbPath = path.join(dbDir, 'hr.db');
        db = new sqlite.Database(dbPath, (err) => {
            if(err){
                console.error('SQLiteデータベースの接続に失敗しました', err);
                reject(err);
                return;
            }

            // SQLiteテーブルの作成
            db.serialize( () => {
                db.run(`CREATE TABLE IF NOT EXISTS uers(
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE,
                    role TEXT,
                    department TEXT,
                    manager_id TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )`);

                resolve();
            });
        });
    });
}

async function getUsers() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM users ORDER BY name", [], (err,rows) => {
            if(err){
                reject(err);
                return;
            }
            resolve(rows);
        });
    });
}

async function getUserById(id) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) =>{
            if(err){
                reject(err);
                return;
            }
            resolve(row);
        });
    });
}

module.exports = {
    initDatabases,
    getUserById,
    getUsers
};

