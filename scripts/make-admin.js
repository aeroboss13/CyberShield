import { db } from '../dist/db.js';
import { users } from '../dist/shared/schema.js';
import { eq } from 'drizzle-orm';

const username = process.argv[2];
if (!username) {
  console.log('Usage: node make-admin.js <username>');
  process.exit(1);
}

try {
  const result = await db.update(users)
    .set({ role: 'admin' })
    .where(eq(users.username, username))
    .returning();
  
  if (result.length > 0) {
    console.log(`User ${username} is now an admin`);
  } else {
    console.log(`User ${username} not found`);
  }
} catch (error) {
  console.error('Error:', error);
} finally {
  process.exit(0);
}
