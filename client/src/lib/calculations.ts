// Animal impact calculation utilities

// Constants for animal saving calculations
// Donation impact values based on organization effectiveness
// These values represent the number of animals saved per dollar donated
const DONATION_IMPACT_FACTORS = {
  highest: 4.4,   // For the most effective animal welfare charities (4.4 animals per dollar - geometric mean of 9 estimates)
  high: 3.1,      // For highly effective charities (3.1 animals per dollar)
  average: 0.007, // For average effectiveness charities (0.007 animals per dollar)
  low: 0.001,     // For lower effectiveness charities (0.001 animals per dollar)
};

const VEGAN_CONVERSION_FACTORS = {
  fullVegan: 365, // animals saved per year
  vegetarian: 180, // animals saved per year
  reducetarian: 90, // animals saved per year
  veganDays: 52, // animals saved per year (weekly vegan day)
  veganMeal: 1, // animals saved per meal
};

const MEDIA_IMPACT_FACTORS = {
  documentary: 5, // base impact
  video: 3,
  article: 2,
  podcast: 2,
  book: 4,
  social: 1,
};

const CAMPAIGN_PARTICIPATION_FACTORS = {
  signed: 1,
  shared: 2,
  contacted: 3,
  recruited: 5,
  donated: 3,
};

// Calculate animals saved from charitable donations
// Using new formula based on organization impact
export function calculateDonationImpact(amount: number, organizationImpact: string = 'average'): number {
  const impactKey = organizationImpact.toLowerCase() as keyof typeof DONATION_IMPACT_FACTORS;
  const impactFactor = DONATION_IMPACT_FACTORS[impactKey] || DONATION_IMPACT_FACTORS.average;
  const result = Math.round(amount * impactFactor);
  
  console.log("Donation impact calculation:", {
    amount,
    organizationImpact,
    impactKey,
    impactFactor,
    result
  });
  
  return result;
}

// Diet type animals saved per year mapping
// Based on 146 animals consumed per year by average meat-eater (updated baseline)
// Data source: https://docs.google.com/spreadsheets/d/1KUcEWd50HoJ3i89azb1O1-HRWGChkRU18xPvRN2zGKQ/edit?gid=1826119359#gid=1826119359
const DIET_ANIMALS_PER_YEAR = {
  'meat-heavy': -29.2,  // Costs 29.2 animals/year (20% more than omnivore baseline: 146 * 0.2)
  'omnivore': 0,        // Baseline - saves 0 animals/year (146 animals consumed)
  'flexitarian': 58.4,  // Saves 58.4 animals/year (40% reduction: 146 * 0.4)
  'pescetarian': 116.8, // Saves 116.8 animals/year (80% reduction: 146 * 0.8)
  'vegetarian': 131.4,  // Saves 131.4 animals/year (90% reduction: 146 * 0.9)
  'vegan': 146          // Saves 146 animals/year (100% reduction: full baseline)
} as const;

export type DietType = keyof typeof DIET_ANIMALS_PER_YEAR;

// Calculate animals saved from vegan conversions
// Formula: (Years × Diet Difference in animals/year) × Influence
export function calculateVeganImpact(
  dateStarted: Date,
  dateEnded: Date | null,
  dietBefore: DietType,
  dietAfter: DietType,
  influence: number
): number {
  // If dateEnded is not provided, use current date
  const endDate = dateEnded || new Date();
  
  // Calculate years between dates
  const daysDiff = Math.max(1, Math.floor((endDate.getTime() - dateStarted.getTime()) / (1000 * 60 * 60 * 24)));
  const years = daysDiff / 365;
  
  // Calculate diet difference in animals saved per year
  const animalsBefore = DIET_ANIMALS_PER_YEAR[dietBefore];
  const animalsAfter = DIET_ANIMALS_PER_YEAR[dietAfter];
  const dietDifference = animalsAfter - animalsBefore;
  
  // Calculate influence as decimal - divide by 100 to convert from percentage
  const influenceFactor = influence / 100;
  
  // Calculate total impact: years × diet difference × influence
  const impact = years * dietDifference * influenceFactor;
  
  // Return rounded result, minimum 0
  return Math.max(0, Math.round(impact));
}

// Calculate animals saved from media sharing
// Formula: Total Posts * (Persuasiveness/100) * Reach * 0.001 * 120
// Uses 0.1% conversion rate (0.001) for realistic social media impact
export function calculateMediaImpact(
  dateStarted: Date,
  dateEnded: Date | null,
  oneOffPieces: number = 0, 
  postsPerMonth: number = 0,
  interactions: number = 0
): number {
  // If dateEnded is not provided, use current date
  const endDate = dateEnded || new Date();
  
  // Calculate days between dates
  const daysDiff = Math.max(1, Math.floor((endDate.getTime() - dateStarted.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Calculate post count over time period: (daysDiff * postsPerMonth / 30) + oneOffPieces
  const totalPosts = (daysDiff * postsPerMonth / 30) + oneOffPieces;
  
  // Calculate reach: interactions * 20 (assumption that reach is 20x interactions)
  const estimatedReach = interactions * 20;
  
  // Calculate total animal impact with realistic conversion rate:
  // 1) Total posts over the time period
  // 2) Estimated reach per post (20x interactions)
  // 3) 0.1% conversion rate (0.001) - realistic for social media influence
  // 4) 10 animals saved per person per year if they reduce meat consumption
  const impact = totalPosts * estimatedReach * 0.001 * 10;
  
  return Math.max(0, Math.round(impact));
}

// Calculate animals saved from campaign participation
// Formula: (Emails*5)+(Social Media Actions*2)+(Letters/Phone Calls*10)+(Leaflets*2)+(Rallies*10)+(Other Actions*5)
export function calculateCampaignImpact(
  emails: number = 0,
  socialMediaActions: number = 0,
  letters: number = 0,
  leaflets: number = 0,
  rallies: number = 0,
  otherActions: number = 0
): number {
  const impact = 
    (emails * 5) + 
    (socialMediaActions * 2) + 
    (letters * 10) + 
    (leaflets * 2) + 
    (rallies * 10) + 
    (otherActions * 5);
  
  // Return as whole number, minimum 0
  return Math.max(0, Math.round(impact));
}

// Calculate animals saved from pro bono work
export function calculateProBonoImpact(
  dateStarted: Date,
  dateEnded: Date | null,
  hoursPerDay: number,
  daysPerWeek: number,
  organizationImpact: string,
  hourlyValue: number
): number {
  const endDate = dateEnded || new Date();
  const daysDiff = Math.max(1, Math.floor((endDate.getTime() - dateStarted.getTime()) / (1000 * 60 * 60 * 24)));
  const weeks = daysDiff / 7;
  
  // Calculate total hours worked
  const totalHours = weeks * daysPerWeek * hoursPerDay;
  
  // Calculate total dollar value of work
  const totalValue = totalHours * hourlyValue;
  
  // Organization impact multipliers
  const impactMultipliers = {
    'Highest': 4.89,
    'High': 3.1,
    'Average': 0.007,
    'Low': 0.001
  };
  
  const multiplier = impactMultipliers[organizationImpact as keyof typeof impactMultipliers] || 0.007;
  
  // Calculate animals saved: dollar value * organization impact multiplier
  const impact = totalValue * multiplier;
  
  return Math.max(0, Math.round(impact));
}

// Get description for impact calculation
export function getImpactDescription(category: string, subtype: string): string {
  const descriptions: Record<string, Record<string, string>> = {
    donation: {
      animalShelter: "Supporting animal shelters helps rescue, care for, and rehome animals in need.",
      wildlifeConservation: "Wildlife conservation efforts protect endangered species and their habitats.",
      rescueOperation: "Rescue operations save animals from cruelty, neglect, and natural disasters.",
      animalRights: "Animal rights organizations advocate for better treatment and legal protections for animals.",
      default: "Your donations directly support efforts to save and protect animals."
    },
    vegan: {
      fullVegan: "A fully vegan diet saves approximately 365 animals per year from factory farming.",
      vegetarian: "A vegetarian diet saves approximately 180 animals per year from factory farming.",
      reducetarian: "Reducing meat consumption even partially can save dozens of animals each year.",
      veganDays: "Having regular vegan days (like Meatless Monday) saves animals each week.",
      veganMeal: "Every vegan meal choice makes a difference for animals.",
      default: "Plant-based dietary choices reduce demand for animal products and save lives."
    },
    media: {
      documentary: "Documentaries can profoundly change viewers' understanding of animal issues.",
      video: "Videos effectively convey animal welfare messages and encourage compassionate choices.",
      article: "Articles educate readers about animal issues and inspire action.",
      podcast: "Podcasts reach audiences with in-depth discussions about animal welfare.",
      social: "Social media posts spread awareness quickly to diverse audiences.",
      default: "Sharing animal welfare content influences others to make more compassionate choices."
    },
    campaign: {
      petition: "Petitions demonstrate public support for animal welfare policies.",
      boycott: "Boycotts apply economic pressure to change harmful business practices.",
      protest: "Protests raise visibility of animal welfare issues and demand change.",
      callToAction: "Calls to action mobilize people to support animal welfare causes.",
      fundraiser: "Fundraisers provide essential resources for animal protection efforts.",
      default: "Your activism directly contributes to systemic changes that protect animals."
    }
  };

  return descriptions[category]?.[subtype] || descriptions[category]?.default || "Your actions help save animals.";
}
