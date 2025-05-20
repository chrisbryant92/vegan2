import { db, pool } from '../server/db';
import { mediaShared } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { calculateMediaImpact } from '../client/src/lib/calculations';

async function updateMediaImpactValues() {
  try {
    console.log('Starting media impact update script...');
    
    // Fetch all media shared entries
    const allMedia = await db.select().from(mediaShared);
    console.log(`Found ${allMedia.length} media entries to update`);
    
    // Update each entry with the new calculation
    for (const media of allMedia) {
      const dateStarted = new Date(media.dateStarted);
      const dateEnded = media.dateEnded ? new Date(media.dateEnded) : new Date();
      
      // Calculate the new animal impact value
      const newAnimalsSaved = calculateMediaImpact(
        dateStarted,
        dateEnded,
        media.oneOffPieces || 0,
        media.postsPerMonth || 0,
        media.estimatedReach || 0,
        media.estimatedPersuasiveness || 50
      );
      
      // Update the database
      await db.update(mediaShared)
        .set({ animalsSaved: newAnimalsSaved })
        .where(eq(mediaShared.id, media.id));
      
      console.log(`Updated media ID ${media.id}: ${media.title}`);
      console.log(`  Old impact: ${media.animalsSaved}, New impact: ${newAnimalsSaved}`);
    }
    
    console.log('Media impact values have been updated successfully!');
  } catch (error) {
    console.error('Error updating media impact values:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
updateMediaImpactValues();