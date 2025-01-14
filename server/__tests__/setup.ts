
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure websocket for Neon database
neonConfig.webSocketConstructor = ws;

// Setup test database URL for testing
process.env.TEST_DATABASE_URL = 'postgres://test:test@localhost:5432/test_db';
