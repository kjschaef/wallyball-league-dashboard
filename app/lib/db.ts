import { getDatabase } from '@db/config';

let db: ReturnType<typeof getDatabase>;

export function getDb() {
  if (!db) {
    db = getDatabase();
  }
  return db;
}
