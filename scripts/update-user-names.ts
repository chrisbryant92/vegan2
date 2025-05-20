import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

// User updates
const USER_UPDATES = [
  { username: "chris@bryantresearch.co.uk", name: "Chris Bryant" },
  { username: "yarahashim13@gmail.com", name: "Yara Hashim" },
  { username: "faisal.albizioui@gmail.com", name: "Faisal Albizioui" },
  { username: "Kevin49@orimi.co", name: "Kevin Orimi" },
];

async function updateUserNames() {
  console.log("Starting user name updates");
  
  try {
    // Delete user 'testy_cathy'
    console.log("Removing testy_cathy user");
    await db.delete(users).where(eq(users.username, "testy_cathy"));
    
    // Update remaining user names
    for (const update of USER_UPDATES) {
      console.log(`Updating ${update.username} to name: ${update.name}`);
      
      const result = await db
        .update(users)
        .set({ name: update.name })
        .where(eq(users.username, update.username))
        .returning();
      
      if (result.length > 0) {
        console.log(`Successfully updated user: ${update.username}`);
      } else {
        console.log(`User not found: ${update.username}`);
      }
    }
    
    console.log("User name updates completed");
  } catch (error) {
    console.error("Error updating user names:", error);
  }
}

// Run the function
updateUserNames().catch(console.error);