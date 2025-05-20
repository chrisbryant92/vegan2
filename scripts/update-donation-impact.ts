import { db, pool } from '../server/db';
import { donations } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { calculateDonationImpact } from '../client/src/lib/calculations';

async function updateDonationImpactValues() {
  try {
    console.log('Starting donation impact update script...');
    
    // Fetch all donations
    const allDonations = await db.select().from(donations);
    console.log(`Found ${allDonations.length} donations to update`);
    
    // Update each donation with the new calculation
    for (const donation of allDonations) {
      // Calculate the new animal impact value
      const newAnimalsSaved = calculateDonationImpact(
        donation.amount,
        donation.organizationImpact || 'average'
      );
      
      // Update the database
      await db.update(donations)
        .set({ animalsSaved: newAnimalsSaved })
        .where(eq(donations.id, donation.id));
      
      console.log(`Updated donation ID ${donation.id}: ${donation.organization}`);
      console.log(`  Amount: $${donation.amount}, Impact level: ${donation.organizationImpact || 'average'}`);
      console.log(`  Old impact: ${donation.animalsSaved}, New impact: ${newAnimalsSaved}`);
    }
    
    console.log('Donation impact values have been updated successfully!');
  } catch (error) {
    console.error('Error updating donation impact values:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
updateDonationImpactValues();