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
        })
    })
}


