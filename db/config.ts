
import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "./schema";

export const getEnvironment = () => {
  return process.env.NODE_ENV || 'development';
}

export function getDatabase(overrideUrl?: string) {
  const env = getEnvironment();
  const dbUrl = overrideUrl || (env === 'test' 
    ? process.env.TEST_DATABASE_URL 
    : process.env.DATABASE_URL);
  
  if (!dbUrl) {
    throw new Error(`Database URL must be set for ${env} environment`);
  }

  if (env !== 'production') {
    neonConfig.webSocketConstructor = ws;
  }
  
  const sql = neon(dbUrl);

  return drizzle(sql, { schema });
}
