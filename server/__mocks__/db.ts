import { mockDeep } from 'jest-mock-extended';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

// Create a deep mock of the database
export const mockDb = mockDeep<PostgresJsDatabase>();

// Export as a jest mock module
export const db = mockDb;