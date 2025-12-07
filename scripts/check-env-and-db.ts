import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from '../src/db';
import { documents } from '../src/db/schema';
import { sql } from 'drizzle-orm';

async function check() {
  console.log('Checking environment variables...');
  if (process.env.OPENAI_API_KEY) {
    console.log('OPENAI_API_KEY is present.');
  } else if (process.env.AI_GATEWAY_API_KEY) {
      console.log('OPENAI_API_KEY is MISSING, but AI_GATEWAY_API_KEY is present (OK).');
  } else {
      console.error('Neither OPENAI_API_KEY nor AI_GATEWAY_API_KEY is present.');
  }

  if (process.env.AI_GATEWAY_API_KEY) {
    console.log('AI_GATEWAY_API_KEY is present.');
  } else {
      console.log('AI_GATEWAY_API_KEY is MISSING (optional if OPENAI_API_KEY is set).');
  }

  if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL is present.');
  } else {
    console.error('DATABASE_URL is MISSING.');
  }

  /*
  console.log('Checking database content...');
  try {
    const result = await db.select({ count: sql<number>`count(*)` }).from(documents);
    console.log(`Number of documents in DB: ${result[0].count}`);
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
  */
}

check();
