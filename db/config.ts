
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

export const getEnvironment = () => {
  if (process.env.NODE_ENV === 'test') return 'test';
  if (process.env.NODE_ENV === 'production') return 'production';
  return 'development';
}

export function getDatabase(url?: string) {
  const env = getEnvironment();
  const dbUrl = url || process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!dbUrl) {
    throw new Error(`DATABASE_URL must be set for ${env} environment`);
  }

  return drizzle({
    connection: dbUrl,
    schema,
    ws: ws,
  });
}
