
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

export const getEnvironment = () => {
  return process.env.NODE_ENV || 'development';
}

export function getDatabase(overrideUrl?: string) {
  const dbUrl = overrideUrl || process.env.DATABASE_URL;
  
  if (!dbUrl) {
    throw new Error(`Database URL must be set for ${getEnvironment()} environment`);
  }

  return drizzle({
    connection: dbUrl,
    schema,
    ws: ws,
  });
}
