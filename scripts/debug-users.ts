import { db } from "../server/db";
import { users } from "../shared/schema";

async function debugUsers() {
  console.log("Current users in database with proper formatting:");
  const allUsers = await db.select().from(users);
  
  // Check for null name fields
  const usersWithNullName = allUsers.filter(u => u.name === null);
  if (usersWithNullName.length > 0) {
    console.log("Users with NULL name fields:", usersWithNullName.length);
    console.table(usersWithNullName.map(u => ({ id: u.id, username: u.username, name: "NULL" })));
  }
  
  // Fix any missing names
  for (const user of usersWithNullName) {
    console.log(`Setting name for user ${user.username} to match username...`);
    await db.update(users)
      .set({ name: user.username })
      .where(users.id === user.id);
  }
  
  // Show final results
  const updatedUsers = await db.select().from(users);
  console.log("Final users in database:");
  console.table(updatedUsers.map(u => ({ id: u.id, username: u.username, name: u.name })));
}

// Run the function
debugUsers().catch(console.error);
