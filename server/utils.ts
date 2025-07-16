// Server-side utility functions

// Constants for donation impact calculations
const DONATION_IMPACT_FACTORS = {
  highest: 4.89,  // For the most effective animal welfare charities (4.89 animals per dollar)
  high: 3.1,      // For highly effective charities (3.1 animals per dollar)
  average: 0.007, // For average effectiveness charities (0.007 animals per dollar)
  low: 0.001,     // For lower effectiveness charities (0.001 animals per dollar)
};

// Server-side version of donation impact calculation
export function calculateDonationImpact(amount: number, organizationImpact: string = 'average'): number {
  const impactFactor = DONATION_IMPACT_FACTORS[organizationImpact.toLowerCase() as keyof typeof DONATION_IMPACT_FACTORS] || DONATION_IMPACT_FACTORS.average;
  return Math.round(amount * impactFactor);
}

// Calculate pro bono work impact (converts professional services to animals saved)
export function calculateProBonoImpact(
  hoursPerDay: number,
  daysPerWeek: number,
  hourlyValue: number,
  organizationImpact: string = 'average',
  rateType: string = 'pro_bono',
  startDate: Date,
  endDate?: Date
): number {
  // Calculate total hours worked
  const actualEndDate = endDate || new Date();
  const diffTime = Math.abs(actualEndDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const weeks = diffDays / 7;
  const totalHours = weeks * daysPerWeek * hoursPerDay;
  
  // Calculate monetary value based on rate type
  let monetaryValue = totalHours * hourlyValue;
  if (rateType === 'reduced_rate') {
    monetaryValue = monetaryValue * 0.5; // 50% reduced fee
  }
  // For 'pro_bono', use full value (100%)
  
  // Apply organization impact multiplier
  const impactFactor = DONATION_IMPACT_FACTORS[organizationImpact.toLowerCase() as keyof typeof DONATION_IMPACT_FACTORS] || DONATION_IMPACT_FACTORS.average;
  
  return Math.round(monetaryValue * impactFactor);
}