#!/usr/bin/env node

// Beta launch validation script
// Validates all core functionality for the Animal Impact Tracker

import { execSync } from 'child_process';
import { db } from '../server/db.js';
import { 
  calculateDonationImpact, 
  calculateCampaignImpact,
  calculateProBonoImpact 
} from '../server/utils.js';

console.log('🐾 Animal Impact Tracker - Beta Launch Validation\n');

const tests = [];
const failures = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function runTest(testObj) {
  try {
    console.log(`Testing: ${testObj.name}...`);
    testObj.fn();
    console.log(`✅ ${testObj.name} - PASSED\n`);
  } catch (error) {
    console.log(`❌ ${testObj.name} - FAILED`);
    console.log(`   Error: ${error.message}\n`);
    failures.push({ name: testObj.name, error: error.message });
  }
}

// Database Connectivity Test
test('Database Connection', async () => {
  const result = await db.execute('SELECT 1 as test');
  if (!result || result.length === 0) {
    throw new Error('Database connection failed');
  }
});

// Table Structure Validation
test('Database Schema Validation', async () => {
  const tables = ['users', 'donations', 'campaigns', 'vegan_conversions', 'media_shared', 'pro_bono_work', 'feedback'];
  
  for (const table of tables) {
    const result = await db.execute(`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = '${table}'`);
    if (result[0].count === 0) {
      throw new Error(`Table ${table} does not exist`);
    }
  }
});

// Calculation Engine Tests
test('Donation Impact Calculations', () => {
  const testCases = [
    { amount: 100, impact: 'Highest', expected: 460 },
    { amount: 100, impact: 'High', expected: 310 },
    { amount: 100, impact: 'Average', expected: 1 },
    { amount: 100, impact: 'Low', expected: 0 }
  ];
  
  for (const testCase of testCases) {
    const result = calculateDonationImpact(testCase.amount, testCase.impact);
    if (result !== testCase.expected) {
      throw new Error(`Donation calculation failed: ${testCase.amount} at ${testCase.impact} impact should be ${testCase.expected}, got ${result}`);
    }
  }
});

test('Campaign Impact Calculations', () => {
  const result = calculateCampaignImpact(5, 10, 2, 3, 1, 4); // emails, social, letters, leaflets, rallies, other
  const expected = (5*5) + (10*2) + (2*10) + (3*2) + (1*10) + (4*5); // 25+20+20+6+10+20 = 101
  if (result !== expected) {
    throw new Error(`Campaign calculation failed: expected ${expected}, got ${result}`);
  }
});

test('Pro Bono Impact Calculations', () => {
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-02-01');
  const result = calculateProBonoImpact(8, 5, 100, 'Highest', 'pro_bono', startDate, endDate);
  // 31 days = ~4.4 weeks, 8h/day * 5 days/week * 4.4 weeks * $100/hour * 4.6 animals/dollar
  const expectedHours = 8 * 5 * (31/7);
  const expectedValue = expectedHours * 100;
  const expected = Math.round(expectedValue * 4.6);
  
  if (Math.abs(result - expected) > 100) { // Allow small rounding differences
    throw new Error(`Pro bono calculation failed: expected ~${expected}, got ${result}`);
  }
});

// Data Integrity Tests
test('Data Validation', async () => {
  // Check for negative animals saved
  const negativeAnimals = await db.execute(`
    SELECT COUNT(*) as count FROM (
      SELECT animals_saved FROM donations WHERE animals_saved < 0
      UNION ALL
      SELECT animals_saved FROM campaigns WHERE animals_saved < 0
      UNION ALL
      SELECT animals_saved FROM vegan_conversions WHERE animals_saved < 0
      UNION ALL
      SELECT animals_saved FROM pro_bono_work WHERE animals_saved < 0
      UNION ALL
      SELECT animals_saved FROM media_shared WHERE animals_saved < 0
    ) as all_records
  `);
  
  if (negativeAnimals[0].count > 0) {
    throw new Error(`Found ${negativeAnimals[0].count} records with negative animals saved`);
  }
  
  // Check for invalid impact levels
  const invalidImpacts = await db.execute(`
    SELECT COUNT(*) as count FROM donations 
    WHERE organization_impact NOT IN ('Highest', 'High', 'Average', 'Low')
  `);
  
  if (invalidImpacts[0].count > 0) {
    throw new Error(`Found ${invalidImpacts[0].count} donations with invalid impact levels`);
  }
});

// Foreign Key Integrity
test('Foreign Key Relationships', async () => {
  const orphanedRecords = await db.execute(`
    SELECT 
      'donations' as table_name, COUNT(*) as orphaned_count
    FROM donations d 
    LEFT JOIN users u ON d.user_id = u.id 
    WHERE u.id IS NULL
    UNION ALL
    SELECT 'campaigns', COUNT(*)
    FROM campaigns c 
    LEFT JOIN users u ON c.user_id = u.id 
    WHERE u.id IS NULL
    UNION ALL
    SELECT 'vegan_conversions', COUNT(*)
    FROM vegan_conversions v 
    LEFT JOIN users u ON v.user_id = u.id 
    WHERE u.id IS NULL
    UNION ALL
    SELECT 'pro_bono_work', COUNT(*)
    FROM pro_bono_work p 
    LEFT JOIN users u ON p.user_id = u.id 
    WHERE u.id IS NULL
    UNION ALL
    SELECT 'media_shared', COUNT(*)
    FROM media_shared m 
    LEFT JOIN users u ON m.user_id = u.id 
    WHERE u.id IS NULL
  `);
  
  const totalOrphaned = orphanedRecords.reduce((sum, row) => sum + row.orphaned_count, 0);
  if (totalOrphaned > 0) {
    throw new Error(`Found ${totalOrphaned} orphaned records with invalid user references`);
  }
});

// Authentication System Test
test('User Authentication System', async () => {
  const users = await db.execute('SELECT COUNT(*) as count FROM users');
  if (users[0].count === 0) {
    throw new Error('No users found in database');
  }
  
  const sessions = await db.execute('SELECT COUNT(*) as count FROM session WHERE expire > NOW()');
  console.log(`   Found ${sessions[0].count} active session(s)`);
});

// Feedback System Test
test('Feedback System', async () => {
  const feedbackCount = await db.execute('SELECT COUNT(*) as count FROM feedback');
  console.log(`   Found ${feedbackCount[0].count} feedback record(s)`);
  
  // Test that feedback can be retrieved
  const pendingFeedback = await db.execute("SELECT * FROM feedback WHERE status = 'pending' ORDER BY created_at DESC LIMIT 1");
  if (pendingFeedback.length > 0) {
    console.log(`   Latest feedback: "${pendingFeedback[0].subject}" (${pendingFeedback[0].type})`);
  }
});

// Run all tests
async function runAllTests() {
  console.log(`Running ${tests.length} validation tests...\n`);
  
  for (const test of tests) {
    await runTest(test);
  }
  
  console.log('='.repeat(60));
  
  if (failures.length === 0) {
    console.log('🎉 ALL TESTS PASSED! System is ready for beta launch.');
    console.log('\n✅ Database connectivity: Working');
    console.log('✅ Schema validation: All tables present');
    console.log('✅ Calculation engines: All formulas accurate');
    console.log('✅ Data integrity: No corruption detected');
    console.log('✅ Foreign keys: All relationships valid');
    console.log('✅ Authentication: User system functional');
    console.log('✅ Feedback system: Ready for user input');
    console.log('\n🚀 The Animal Impact Tracker is ready for beta users!');
  } else {
    console.log(`❌ ${failures.length} TEST(S) FAILED:`);
    failures.forEach(failure => {
      console.log(`   • ${failure.name}: ${failure.error}`);
    });
    console.log('\n⚠️  Please fix these issues before beta launch.');
    process.exit(1);
  }
}

runAllTests().catch(error => {
  console.error('Fatal error during validation:', error);
  process.exit(1);
});