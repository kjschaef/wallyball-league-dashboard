
import { getDatabase } from "./config";

export const db = getDatabase(process.env.DATABASE_URL);
