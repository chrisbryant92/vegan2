#!/usr/bin/env node

// Script to update all donation records with new 4.4 impact factor (down from 4.6)

import { db, pool } from '../server/db.js';
import { donations, proBonoWork } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { calculateDonationImpact } from '../server/utils.js';

async function updateImpactFactors() {
  try {
    console.log('🔄 Updating impact factors from 4.6 to 4.4 animals per dollar...\n');
    
    // Update donations
    console.log('📊 Updating donation records...');
    const allDonations = await db.select().from(donations);
    console.log(`Found ${allDonations.length} donation records to update`);
    
    let donationsUpdated = 0;
    for (const donation of allDonations) {
      // Recalculate with new impact factor
      const newAnimalsSaved = calculateDonationImpact(
        donation.amount,
        donation.organizationImpact || 'average'
      );
      
      // Only update if the value changed
      if (newAnimalsSaved !== donation.animalsSaved) {
        await db.update(donations)
          .set({ animalsSaved: newAnimalsSaved })
          .where(eq(donations.id, donation.id));
        
        console.log(`✓ Updated donation ID ${donation.id}: ${donation.organization}`);
        console.log(`  $${donation.amount} (${donation.organizationImpact || 'average'}) -> ${donation.animalsSaved} → ${newAnimalsSaved} animals`);
        donationsUpdated++;
      }
    }
    
    // Update pro bono work (uses same impact factors)
    console.log('\n💼 Updating pro bono work records...');
    const allProBono = await db.select().from(proBonoWork);
    console.log(`Found ${allProBono.length} pro bono records to update`);
    
    let proBonoupdated = 0;
    for (const work of allProBono) {
      // Calculate total hours worked
      const startDate = new Date(work.dateStarted);
      const endDate = work.dateEnded ? new Date(work.dateEnded) : new Date();
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const weeks = diffDays / 7;
      const totalHours = weeks * work.daysPerWeek * work.hoursPerDay;
      
      // Calculate monetary value based on rate type
      let monetaryValue = totalHours * work.hourlyValue;
      if (work.rateType === 'reduced_rate') {
        monetaryValue = monetaryValue * 0.5;
      }
      
      // Calculate new impact with updated factor
      const newAnimalsSaved = calculateDonationImpact(monetaryValue, work.organizationImpact);
      
      if (newAnimalsSaved !== work.animalsSaved) {
        await db.update(proBonoWork)
          .set({ animalsSaved: newAnimalsSaved })
          .where(eq(proBonoWork.id, work.id));
        
        console.log(`✓ Updated pro bono ID ${work.id}: ${work.organization}`);
        console.log(`  ${totalHours}h × $${work.hourlyValue} (${work.organizationImpact}) -> ${work.animalsSaved} → ${newAnimalsSaved} animals`);
        proBonoupdated++;
      }
    }
    
    console.log('\n✅ Impact factor update completed successfully!');
    console.log(`📈 Updated ${donationsUpdated} donation records`);
    console.log(`💼 Updated ${proBonoupdated} pro bono records`);
    console.log(`🐾 New highest impact rate: 4.4 animals per dollar\n`);
    
  } catch (error) {
    console.error('❌ Error updating impact factors:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the update
updateImpactFactors();