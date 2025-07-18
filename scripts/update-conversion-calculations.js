#!/usr/bin/env node

// Script to update all vegan conversion records with new 146 animals/year baseline

import { db, pool } from '../server/db.js';
import { veganConversions } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

// Updated diet impact values (using 146 animals/year baseline)
const DIET_ANIMALS_PER_YEAR = {
  'meat-heavy': -29.2,  // Costs 29.2 animals/year (20% more than omnivore baseline: 146 * 0.2)
  'omnivore': 0,        // Baseline - saves 0 animals/year (146 animals consumed)
  'flexitarian': 58.4,  // Saves 58.4 animals/year (40% reduction: 146 * 0.4)
  'pescetarian': 116.8, // Saves 116.8 animals/year (80% reduction: 146 * 0.8)
  'vegetarian': 131.4,  // Saves 131.4 animals/year (90% reduction: 146 * 0.9)
  'vegan': 146          // Saves 146 animals/year (100% reduction: full baseline)
};

function calculateVeganImpact(dateStarted, dateEnded, dietBefore, dietAfter, influence) {
  // If dateEnded is not provided, use current date
  const endDate = dateEnded || new Date();
  
  // Calculate years between dates
  const daysDiff = Math.max(1, Math.floor((endDate.getTime() - dateStarted.getTime()) / (1000 * 60 * 60 * 24)));
  const years = daysDiff / 365;
  
  // Calculate diet difference in animals saved per year
  const animalsBefore = DIET_ANIMALS_PER_YEAR[dietBefore] || 0;
  const animalsAfter = DIET_ANIMALS_PER_YEAR[dietAfter] || 0;
  const dietDifference = animalsAfter - animalsBefore;
  
  // Calculate influence as decimal - divide by 100 to convert from percentage
  const influenceFactor = influence / 100;
  
  // Calculate total impact: years × diet difference × influence
  const impact = years * dietDifference * influenceFactor;
  
  // Return rounded result, minimum 0
  return Math.max(0, Math.round(impact));
}

async function updateConversionCalculations() {
  try {
    console.log('🔄 Updating vegan conversion calculations with new 146 animals/year baseline...\n');
    
    // Update vegan conversions
    console.log('🌱 Updating vegan conversion records...');
    const allConversions = await db.select().from(veganConversions);
    console.log(`Found ${allConversions.length} conversion records to update`);
    
    let conversionsUpdated = 0;
    for (const conversion of allConversions) {
      // Recalculate with new baseline
      const dateStarted = new Date(conversion.dateStarted);
      const dateEnded = conversion.dateEnded ? new Date(conversion.dateEnded) : null;
      
      const newAnimalsSaved = calculateVeganImpact(
        dateStarted,
        dateEnded,
        conversion.dietBefore,
        conversion.dietAfter,
        conversion.influence || 50
      );
      
      // Only update if the value changed
      if (newAnimalsSaved !== conversion.animalsSaved) {
        await db.update(veganConversions)
          .set({ animalsSaved: newAnimalsSaved })
          .where(eq(veganConversions.id, conversion.id));
        
        console.log(`✓ Updated conversion ID ${conversion.id}: ${conversion.personName}`);
        console.log(`  ${conversion.dietBefore} → ${conversion.dietAfter} (${conversion.influence}% influence)`);
        console.log(`  ${conversion.animalsSaved} → ${newAnimalsSaved} animals saved`);
        conversionsUpdated++;
      }
    }
    
    console.log('\n✅ Conversion calculation update completed successfully!');
    console.log(`🌱 Updated ${conversionsUpdated} conversion records`);
    console.log(`📊 New baseline: 146 animals/year for omnivore diet\n`);
    
  } catch (error) {
    console.error('❌ Error updating conversion calculations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the update
updateConversionCalculations();