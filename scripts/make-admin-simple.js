import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const username = process.argv[2];
if (!username) {
  console.log('Usage: node make-admin-simple.js <username>');
  process.exit(1);
}

try {
  const result = await pool.query(
    'UPDATE users SET role = $1 WHERE username = $2 RETURNING username, role',
    ['admin', username]
  );
  
  if (result.rows.length > 0) {
    console.log(`User ${username} is now an admin`);
  } else {
    console.log(`User ${username} not found`);
  }
} catch (error) {
  console.error('Error:', error);
} finally {
  await pool.end();
  process.exit(0);
}
