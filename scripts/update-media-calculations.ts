import { pool, db } from '../server/db';
import { mediaShared } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { calculateMediaImpact } from '../client/src/lib/calculations';

async function updateMediaCalculations() {
  console.log('Starting update of media sharing calculations...');
  
  try {
    // Fetch all media shared entries
    const allMediaEntries = await db.select().from(mediaShared);
    console.log(`Found ${allMediaEntries.length} media entries to update`);
    
    let updateCount = 0;
    
    // Process each entry and update the impact calculation
    for (const entry of allMediaEntries) {
      if (!entry.dateStarted) {
        console.log(`Skipping entry ${entry.id} - missing dateStarted`);
        continue;
      }
      
      // Calculate new impact using the updated formula (now dividing by 500 instead of 5000)
      const newImpact = calculateMediaImpact(
        new Date(entry.dateStarted),
        entry.dateEnded ? new Date(entry.dateEnded) : null,
        entry.oneOffPieces || 0,
        entry.postsPerMonth || 0,
        entry.estimatedReach || 0,
        entry.estimatedPersuasiveness || 0
      );
      
      // Only update if the calculation has changed
      if (newImpact !== entry.animalsSaved) {
        console.log(`Updating entry ${entry.id}: ${entry.title}`);
        console.log(`  Old impact: ${entry.animalsSaved} animals`);
        console.log(`  New impact: ${newImpact} animals`);
        
        // Update the entry with the new calculation
        await db.update(mediaShared)
          .set({ animalsSaved: newImpact })
          .where(eq(mediaShared.id, entry.id));
          
        updateCount++;
      }
    }
    
    console.log(`Successfully updated ${updateCount} media entries`);
  } catch (error) {
    console.error('Error updating media calculations:', error);
    throw error;
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the update function
updateMediaCalculations()
  .then(() => {
    console.log('Media calculations update completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to update media calculations:', error);
    process.exit(1);
  });