import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

// User updates
const USER_UPDATES = [
  { username: "chris@bryantresearch.co.uk", name: "Chris Bryant" },
  { username: "yarahashim13@gmail.com", name: "Yara Hashim" },
  { username: "faisal.albizioui@gmail.com", name: "Faisal Albizioui" },
  { username: "kevin49@orimi.co", name: "Kevin Orimi" }, // Note: using lowercase for better matching
];

async function updateUserNames() {
  console.log("Starting user name updates");
  
  try {
    // Show all users before update
    console.log("Current users in database:");
    const allUsers = await db.select().from(users);
    console.table(allUsers.map(u => ({ id: u.id, username: u.username, name: u.name })));
    
    // Delete user 'test_cathy' (changed from testy_cathy based on the database output)
    console.log("Removing test_cathy user");
    await db.delete(users).where(eq(users.username, "test_cathy"));
    
    // Update remaining user names - using case-insensitive comparison for better matching
    for (const update of USER_UPDATES) {
      console.log(`Updating ${update.username} to name: ${update.name}`);
      
      // Try case insensitive match for username
      const result = await db
        .update(users)
        .set({ name: update.name })
        .where(sql`LOWER(${users.username}) = LOWER(${update.username})`)
        .returning();
      
      if (result.length > 0) {
        console.log(`Successfully updated user: ${update.username} to name: ${update.name}`);
      } else {
        console.log(`User not found: ${update.username}`);
      }
    }
    
    // Show users after update
    console.log("Users after update:");
    const updatedUsers = await db.select().from(users);
    console.table(updatedUsers.map(u => ({ id: u.id, username: u.username, name: u.name })));
    
    console.log("User name updates completed");
  } catch (error) {
    console.error("Error updating user names:", error);
  }
}

// Run the function
updateUserNames().catch(console.error);