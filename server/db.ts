import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '../shared/schema.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Please check your .env file.');
}

// Create PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Test connection
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

console.log('📦 Database connection pool created');

