import { ipcMain } from 'electron';
import * as path from 'path';
import { app } from 'electron';
import * as fs from 'fs';
import lowdb from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';

// データベースファイルのパスを取得
const dbPath = path.join(app.getPath('userData'), 'database.json');

// データベーススキーマ定義
interface Schema {
  sample_data: {
    id: number;
    name: string;
    value: number;
    category: string;
    date: string;
  }[];
}

// lowdb インスタンス
let db: lowdb.LowdbSync<Schema>;

export function initDatabase() {
  try {
    console.log('Database path:', dbPath);
    
    // ディレクトリが存在するか確認
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // データベース初期化
    const adapter = new FileSync<Schema>(dbPath);
    db = lowdb(adapter);
    
    // テーブル（コレクション）がなければ初期化
    db.defaults({ sample_data: [] }).write();
    
    // サンプルデータを挿入（データが空の場合のみ）
    const sampleData = db.get('sample_data').value();
    if (sampleData.length === 0) {
      db.get('sample_data')
        .push(
          { id: 1, name: '製品A', value: 120, category: '電子機器', date: '2024-01-15' },
          { id: 2, name: '製品B', value: 85, category: '電子機器', date: '2024-01-20' },
          { id: 3, name: '製品C', value: 200, category: '家具', date: '2024-02-10' },
          { id: 4, name: '製品D', value: 65, category: '衣類', date: '2024-02-15' },
          { id: 5, name: '製品E', value: 150, category: '家具', date: '2024-03-01' },
          { id: 6, name: '製品F', value: 95, category: '衣類', date: '2024-03-10' }
        )
        .write();
      console.log('Sample data inserted');
    }

    // IPCハンドラの設定
    setupIpcHandlers();
    console.log('Database initialized successfully');
  } catch (error: unknown) {
    console.error('Database initialization error:', error);
  }
}

function setupIpcHandlers() {
  // SQLクエリの模擬実行 (実際はJSONデータに対する操作)
  ipcMain.handle('execute-query', async (_, query: string) => {
    try {
      // クエリの基本的な構文解析（簡易版）
      const lowerQuery = query.toLowerCase().trim();
      
      // SELECTクエリの簡易処理
      if (lowerQuery.startsWith('select')) {
        // すべてのデータを返す簡易実装
        // 実際のアプリでは、ここでクエリを解析して適切なフィルタリングを行う
        const data = db.get('sample_data').value();
        return { success: true, data };
      } 
      // INSERT処理の簡易実装
      else if (lowerQuery.startsWith('insert')) {
        // 実際のアプリでは、ここでクエリを解析して適切なデータ挿入を行う
        // この例では単純に新しいIDを生成して固定データを挿入
        const maxId = db.get('sample_data')
          .map('id')
          .max()
          .value() || 0;
          
        db.get('sample_data')
          .push({
            id: maxId + 1,
            name: '新製品',
            value: 100,
            category: 'その他',
            date: new Date().toISOString().split('T')[0]
          })
          .write();
          
        return { success: true, changes: 1 };
      }
      // UPDATE処理の簡易実装
      else if (lowerQuery.startsWith('update')) {
        // この例では、すべての製品の値を10%増加
        const data = db.get('sample_data').value();
        data.forEach((item: Schema['sample_data'][0]) => {
          item.value = Math.round(item.value * 1.1);
        });
        
        db.set('sample_data', data).write();
        return { success: true, changes: data.length };
      }
      // DELETE処理の簡易実装
      else if (lowerQuery.startsWith('delete')) {
        // この例では、特定のカテゴリを削除
        const initialCount = db.get('sample_data').size().value();
        db.get('sample_data')
          .remove({ category: 'その他' })
          .write();
          
        const newCount = db.get('sample_data').size().value();
        return { success: true, changes: initialCount - newCount };
      }
      else {
        return { success: false, error: 'Unsupported operation' };
      }
    } catch (error: unknown) {
      console.error('Query execution error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
}