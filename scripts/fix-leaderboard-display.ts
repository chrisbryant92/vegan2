import { db } from "../server/db";
import { users } from "../shared/schema";
import { sql } from "drizzle-orm";

async function fixLeaderboardDisplay() {
  console.log("Checking current users in database:");
  const allUsers = await db.select().from(users);
  console.table(allUsers.map(u => ({ id: u.id, username: u.username, name: u.name })));
  
  // Update kevin49@orimi.co to Kevin Orimi (Fix case-sensitivity issues)
  console.log("Updating kevin49@orimi.co to name: Kevin Orimi");
  await db.execute(
    sql`UPDATE users SET name = 'Kevin Orimi' WHERE LOWER(username) = LOWER('kevin49@orimi.co')`
  );

  console.log("Ensuring all users have proper names (not using emails as display names):");
  const updatedUsers = await db.select().from(users);
  console.table(updatedUsers.map(u => ({ id: u.id, username: u.username, name: u.name })));
}

// Run the function
fixLeaderboardDisplay().catch(console.error);
