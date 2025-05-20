// Animal impact calculation utilities

// Constants for animal saving calculations
// New donation impact values based on organization effectiveness
const DONATION_IMPACT_FACTORS = {
  highest: 4.89, // animals saved per dollar
  high: 3.1, // animals saved per dollar
  average: 0.007, // animals saved per dollar
  low: 0.001, // animals saved per dollar
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
  const impactFactor = DONATION_IMPACT_FACTORS[organizationImpact.toLowerCase() as keyof typeof DONATION_IMPACT_FACTORS] || DONATION_IMPACT_FACTORS.average;
  return Math.round(amount * impactFactor);
}

// Calculate animals saved from vegan conversions
// Formula: ((Date Ended-Date Started)/3)*(Meatiness Before Conversion-Meatiness After Conversion)*Influence
export function calculateVeganImpact(
  dateStarted: Date,
  dateEnded: Date | null,
  meatinessBefore: number,
  meatinessAfter: number,
  influence: number
): number {
  // If dateEnded is not provided, use current date
  const endDate = dateEnded || new Date();
  
  // Calculate days between dates
  const daysDiff = Math.max(1, Math.floor((endDate.getTime() - dateStarted.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Convert days to 3-day units (days / 3)
  const timeUnits = daysDiff / 3;
  
  // Calculate meatiness difference (as decimal - divide by 100 to convert from percentage)
  const meatinessDiff = (meatinessBefore - meatinessAfter) / 100;
  
  // Calculate influence as decimal - divide by 100 to convert from percentage
  const influenceFactor = influence / 100;
  
  // Calculate and round the result
  return Math.round(timeUnits * meatinessDiff * influenceFactor);
}

// Calculate animals saved from media sharing
// Formula: (((Date Ended-Date Started)*Posts Per Month/30)+One-Off Pieces)*Estimated Persuasiveness*Estimated Reach*120
export function calculateMediaImpact(
  dateStarted: Date,
  dateEnded: Date | null,
  oneOffPieces: number = 0, 
  postsPerMonth: number = 0,
  estimatedReach: number = 0,
  estimatedPersuasiveness: number = 0
): number {
  // If dateEnded is not provided, use current date
  const endDate = dateEnded || new Date();
  
  // Calculate days between dates
  const daysDiff = Math.max(1, Math.floor((endDate.getTime() - dateStarted.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Calculate post count over time period: (daysDiff * postsPerMonth / 30) + oneOffPieces
  const totalPosts = (daysDiff * postsPerMonth / 30) + oneOffPieces;
  
  // Convert persuasiveness percentage to decimal
  const persuasiveness = estimatedPersuasiveness / 100;
  
  // Calculate total animal impact
  // Each person saves 120 animals per year on average when converted
  // Divide by 500 to account for:
  // 1) Realistically only about 1% of people will be persuaded enough to go vegan (not 100%)
  // 2) Estimated reach is often overestimated (only ~20% of friends actually see posts)
  const impact = (totalPosts * persuasiveness * estimatedReach * 120) / 500;
  
  return Math.max(0, Math.round(impact));
}

// Calculate animals saved from campaign participation
// New formula: (Emails*5)+(Social Media Actions*7)+(Letters*50)+(Other Actions*7)
export function calculateCampaignImpact(
  emails: number = 0,
  socialMediaActions: number = 0,
  letters: number = 0,
  otherActions: number = 0
): number {
  const impact = 
    (emails * 5) + 
    (socialMediaActions * 7) + 
    (letters * 50) + 
    (otherActions * 7);
  
  // Return as whole number, minimum 0
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
