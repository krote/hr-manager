"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = void 0;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const electron_2 = require("electron");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
// データベースファイルのパスを取得
const dbPath = path.join(electron_2.app.getPath('userData'), 'database.sqlite');
// データベース接続の初期化
let db;
function initDatabase() {
    try {
        db = new better_sqlite3_1.default(dbPath);
        console.log('Database connected at:', dbPath);
        // サンプルテーブルの作成（初回実行時のみ）
        db.exec(`
      CREATE TABLE IF NOT EXISTS sample_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        value INTEGER,
        category TEXT,
        date TEXT
      )
    `);
        // サンプルデータの挿入（テスト用）
        const result = db.prepare('SELECT COUNT(*) as count FROM sample_data').get();
        if (result.count === 0) {
            const insert = db.prepare('INSERT INTO sample_data (name, value, category, date) VALUES (?, ?, ?, ?)');
            insert.run('製品A', 120, '電子機器', '2024-01-15');
            insert.run('製品B', 85, '電子機器', '2024-01-20');
            insert.run('製品C', 200, '家具', '2024-02-10');
            insert.run('製品D', 65, '衣類', '2024-02-15');
            insert.run('製品E', 150, '家具', '2024-03-01');
            insert.run('製品F', 95, '衣類', '2024-03-10');
            console.log('Sample data inserted');
        }
        // IPCハンドラの設定
        setupIpcHandlers();
    }
    catch (err) {
        console.error('Database initialization error:', err);
    }
}
exports.initDatabase = initDatabase;
function setupIpcHandlers() {
    // SQLクエリを実行するIPC
    electron_1.ipcMain.handle('execute-query', async (_, query) => {
        try {
            // クエリがSELECTの場合
            if (query.trim().toLowerCase().startsWith('select')) {
                const stmt = db.prepare(query);
                const rows = stmt.all();
                return { success: true, data: rows };
            }
            // それ以外（INSERT, UPDATE, DELETE, CREATE TABLE など）
            else {
                const stmt = db.prepare(query);
                const info = stmt.run();
                return { success: true, changes: info.changes };
            }
        }
        catch (error) {
            console.error('Query execution error:', error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    });
}
