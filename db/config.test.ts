import { getEnvironment, getDatabase } from './config';

describe('Database Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getEnvironment', () => {
    it('should return development when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      expect(getEnvironment()).toBe('development');
    });

    it('should return the NODE_ENV value when set', () => {
      process.env.NODE_ENV = 'production';
      expect(getEnvironment()).toBe('production');
      
      process.env.NODE_ENV = 'test';
      expect(getEnvironment()).toBe('test');
    });
  });

  describe('getDatabase', () => {
    it('should use DATABASE_URL from environment when available', () => {
      process.env.DATABASE_URL = 'postgres://testuser:testpass@localhost:5432/testdb';
      const db = getDatabase();
      expect(db).toBeDefined();
    });

    it('should use provided override URL when specified', () => {
      const overrideUrl = 'postgres://override:override@localhost:5432/overridedb';
      const db = getDatabase(overrideUrl);
      expect(db).toBeDefined();
    });
  });
});