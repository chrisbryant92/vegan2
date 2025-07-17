import { db, pool } from '../server/db';
import { proBonoWork } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { calculateProBonoImpact } from '../server/utils';

async function updateProBonoCalculations() {
  try {
    console.log('Starting pro bono work calculations update...');
    
    // Fetch all pro bono work records
    const allProBonoWork = await db.select().from(proBonoWork);
    console.log(`Found ${allProBonoWork.length} pro bono work records to update`);
    
    // Update each record with the new calculation
    for (const work of allProBonoWork) {
      const dateStarted = new Date(work.dateStarted);
      const dateEnded = work.dateEnded ? new Date(work.dateEnded) : undefined;
      
      // Calculate the new animal impact value using updated donation factors
      const newAnimalsSaved = calculateProBonoImpact(
        work.hoursPerDay,
        work.daysPerWeek, 
        work.hourlyValue,
        work.organizationImpact || 'average',
        work.rateType || 'pro_bono',
        dateStarted,
        dateEnded
      );
      
      // Update the database
      await db.update(proBonoWork)
        .set({ animalsSaved: newAnimalsSaved })
        .where(eq(proBonoWork.id, work.id));
      
      console.log(`Updated pro bono work ID ${work.id}: ${work.organization} - ${work.role}`);
      console.log(`  Period: ${work.dateStarted} to ${work.dateEnded || 'ongoing'}`);
      console.log(`  Rate type: ${work.rateType}, Impact level: ${work.organizationImpact}`);
      console.log(`  Old impact: ${work.animalsSaved}, New impact: ${newAnimalsSaved}`);
    }
    
    console.log('Pro bono work calculations have been updated successfully!');
  } catch (error) {
    console.error('Error updating pro bono work calculations:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
updateProBonoCalculations();