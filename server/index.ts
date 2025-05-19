
import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';

const app = express();
const port = process.env.PORT || 5000;

// Session store setup
const SessionStore = MemoryStore(session);

// Middleware
app.use(express.json());
app.use(session({
  cookie: { maxAge: 86400000 },
  store: new SessionStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  resave: false,
  secret: process.env.SESSION_SECRET || 'development_secret',
  saveUninitialized: false,
}));

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

// Basic route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
