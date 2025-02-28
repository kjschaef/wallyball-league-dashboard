
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

export const getEnvironment = () => {
  return process.env.NODE_ENV || 'development';
}

export function getDatabase(overrideUrl?: string) {
  const env = getEnvironment();
  
  // If we're in test environment and there's no URL provided, we'll
  // use a mock database URL that won't actually connect
  if (env === 'test' && !overrideUrl && !process.env.TEST_DATABASE_URL) {
    // This function will be mocked in tests, so this URL is never actually used
    // It's just a placeholder that matches the expected format
    return drizzle({
      connection: 'postgresql://test:test@localhost:5432/test_db',
      schema,
      ws: ws,
    });
  }
  
  const dbUrl = overrideUrl || (env === 'test' 
    ? process.env.TEST_DATABASE_URL 
    : process.env.DATABASE_URL);
  
  if (!dbUrl) {
    throw new Error(`Database URL must be set for ${env} environment`);
  }

  return drizzle({
    connection: dbUrl,
    schema,
    ws: ws,
  });
}
