import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Ensure environment variables are loaded when this module initializes.
config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Check .env.local');
}

const pool = new Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });
