
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

export const getEnvironment = () => {
  return process.env.NODE_ENV || 'development';
}

export function getDatabase() {
  const env = getEnvironment();
  const dbUrl = env === 'test' 
    ? process.env.TEST_DATABASE_URL 
    : process.env.DATABASE_URL;
  
  if (!dbUrl) {
    throw new Error(`Database URL must be set for ${env} environment`);
  }

  return drizzle({
    connection: dbUrl,
    schema,
    ws: ws,
  });
}
