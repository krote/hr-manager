import { ipcMain } from 'electron';
import * as path from 'path';
import { app } from 'electron';
import Database from 'better-sqlite3';

// データベースファイルのパスを取得
const dbPath = path.join(app.getPath('userData'), 'database.sqlite');

// データベース接続の初期化
let db: Database.Database;

export function initDatabase() {
  try {
    db = new Database(dbPath);
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
    const count = db.prepare('SELECT COUNT(*) as count FROM sample_data').get();
    if (count.count === 0) {
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
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

function setupIpcHandlers() {
  // SQLクエリを実行するIPC
  ipcMain.handle('execute-query', async (_, query: string) => {
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
    } catch (error) {
      console.error('Query execution error:', error);
      return { success: false, error: error.message };
    }
  });
}