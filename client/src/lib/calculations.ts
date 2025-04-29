// Animal impact calculation utilities

// Constants for animal saving calculations
// Formula: (Total Amount Donated*1.35)*4.056
const DONATION_MULTIPLIER = 1.35;
const ANIMALS_SAVED_MULTIPLIER = 4.056;

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
// Using formula: (Total Amount Donated*1.35)*4.056
export function calculateDonationImpact(amount: number): number {
  return Math.round((amount * DONATION_MULTIPLIER) * ANIMALS_SAVED_MULTIPLIER);
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
  const impact = totalPosts * persuasiveness * estimatedReach * 120;
  
  return Math.max(0, Math.round(impact));
}

// Calculate animals saved from campaign participation
export function calculateCampaignImpact(
  participation: {
    signed: boolean,
    shared: boolean,
    contacted: boolean,
    recruited: boolean,
    donated: boolean
  },
  peopleRecruited: number = 0
): number {
  let impact = 0;
  
  // Add impact for each participation type
  if (participation.signed) impact += CAMPAIGN_PARTICIPATION_FACTORS.signed;
  if (participation.shared) impact += CAMPAIGN_PARTICIPATION_FACTORS.shared;
  if (participation.contacted) impact += CAMPAIGN_PARTICIPATION_FACTORS.contacted;
  if (participation.recruited) impact += CAMPAIGN_PARTICIPATION_FACTORS.recruited;
  if (participation.donated) impact += CAMPAIGN_PARTICIPATION_FACTORS.donated;
  
  // Add additional impact for people recruited
  if (peopleRecruited > 0) {
    impact += Math.min(peopleRecruited * 2, 50); // Cap the impact to prevent unrealistic numbers
  }
  
  return Math.max(1, Math.round(impact));
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
