import { db, pool } from '../server/db';
import { veganConversions } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { calculateVeganImpact } from '../client/src/lib/calculations';

async function updateVeganCalculations() {
  try {
    console.log('Starting vegan conversion calculations update...');
    
    // Fetch all vegan conversions
    const allConversions = await db.select().from(veganConversions);
    console.log(`Found ${allConversions.length} vegan conversions to update`);
    
    // Update each conversion with the new calculation
    for (const conversion of allConversions) {
      const dateStarted = new Date(conversion.dateStarted);
      const dateEnded = conversion.dateEnded ? new Date(conversion.dateEnded) : null;
      
      // Calculate the new animal impact value using updated numbers
      const newAnimalsSaved = calculateVeganImpact(
        dateStarted,
        dateEnded,
        conversion.dietBefore as any,
        conversion.dietAfter as any,
        conversion.influence || 50
      );
      
      // Update the database
      await db.update(veganConversions)
        .set({ animalsSaved: newAnimalsSaved })
        .where(eq(veganConversions.id, conversion.id));
      
      console.log(`Updated conversion ID ${conversion.id}: ${conversion.personName}`);
      console.log(`  Diet change: ${conversion.dietBefore} → ${conversion.dietAfter}`);
      console.log(`  Influence: ${conversion.influence}%`);
      console.log(`  Old impact: ${conversion.animalsSaved}, New impact: ${newAnimalsSaved}`);
    }
    
    console.log('Vegan conversion calculations have been updated successfully!');
  } catch (error) {
    console.error('Error updating vegan conversion calculations:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
updateVeganCalculations();