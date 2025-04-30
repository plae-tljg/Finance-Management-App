import SQLite from 'react-native-sqlite-storage';
import { AppConfig } from '../../config/AppConfig';

export interface Migration {
  version: number;
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;
}

export class DatabaseMigration {
  private static readonly MIGRATION_TABLE = 'migrations';

  constructor(private readonly db: SQLite.SQLiteDatabase) {}

  public async init(): Promise<void> {
    await this.createMigrationTable();
  }

  private async createMigrationTable(): Promise<void> {
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS ${DatabaseMigration.MIGRATION_TABLE} (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `);
  }

  public async getCurrentVersion(): Promise<number> {
    const [results] = await this.db.executeSql(
      `SELECT MAX(version) as version FROM ${DatabaseMigration.MIGRATION_TABLE}`
    );
    return results.rows.item(0)?.version || 0;
  }

  public async applyMigrations(migrations: Migration[]): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const pendingMigrations = migrations.filter(m => m.version > currentVersion);

    for (const migration of pendingMigrations) {
      await this.db.transaction(async (tx) => {
        await migration.up(this.db);
        await tx.executeSql(
          `INSERT INTO ${DatabaseMigration.MIGRATION_TABLE} (version, applied_at) VALUES (?, ?)`,
          [migration.version, new Date().toISOString()]
        );
      });
    }
  }
} 