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