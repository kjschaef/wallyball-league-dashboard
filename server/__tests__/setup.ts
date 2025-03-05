
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure websocket for Neon database
neonConfig.webSocketConstructor = ws;

// Setup test database URL for testing
process.env.TEST_DATABASE_URL = 'postgres://test:test@0.0.0.0:5432/test_db';
process.env.NODE_ENV = 'test';
