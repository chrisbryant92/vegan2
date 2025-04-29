import { users, donations, veganConversions, mediaShared, campaigns } from "@shared/schema";
import type { User, InsertUser, Donation, InsertDonation, VeganConversion, InsertVeganConversion, MediaShared, InsertMediaShared, Campaign, InsertCampaign } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Donation operations
  getDonations(userId: number): Promise<Donation[]>;
  getDonation(id: number): Promise<Donation | undefined>;
  createDonation(donation: InsertDonation): Promise<Donation>;
  updateDonation(id: number, donation: Partial<InsertDonation>): Promise<Donation | undefined>;
  deleteDonation(id: number): Promise<boolean>;

  // Vegan conversions operations
  getVeganConversions(userId: number): Promise<VeganConversion[]>;
  getVeganConversion(id: number): Promise<VeganConversion | undefined>;
  createVeganConversion(conversion: InsertVeganConversion): Promise<VeganConversion>;
  updateVeganConversion(id: number, conversion: Partial<InsertVeganConversion>): Promise<VeganConversion | undefined>;
  deleteVeganConversion(id: number): Promise<boolean>;

  // Media shared operations
  getMediaShared(userId: number): Promise<MediaShared[]>;
  getMediaSharedItem(id: number): Promise<MediaShared | undefined>;
  createMediaShared(media: InsertMediaShared): Promise<MediaShared>;
  updateMediaShared(id: number, media: Partial<InsertMediaShared>): Promise<MediaShared | undefined>;
  deleteMediaShared(id: number): Promise<boolean>;

  // Campaign operations
  getCampaigns(userId: number): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: number): Promise<boolean>;

  // Stat operations
  getUserStats(userId: number): Promise<{
    totalAnimalsSaved: number;
    donationsCount: number;
    donationsAnimalsSaved: number;
    veganCount: number;
    veganAnimalsSaved: number;
    mediaCount: number;
    mediaAnimalsSaved: number;
    campaignsCount: number;
    campaignsAnimalsSaved: number;
  }>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private donations: Map<number, Donation>;
  private veganConversions: Map<number, VeganConversion>;
  private mediaShared: Map<number, MediaShared>;
  private campaigns: Map<number, Campaign>;
  
  private userIdCounter: number;
  private donationIdCounter: number;
  private veganConversionIdCounter: number;
  private mediaSharedIdCounter: number;
  private campaignIdCounter: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.donations = new Map();
    this.veganConversions = new Map();
    this.mediaShared = new Map();
    this.campaigns = new Map();
    
    this.userIdCounter = 1;
    this.donationIdCounter = 1;
    this.veganConversionIdCounter = 1;
    this.mediaSharedIdCounter = 1;
    this.campaignIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours in milliseconds
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  // Donation operations
  async getDonations(userId: number): Promise<Donation[]> {
    return Array.from(this.donations.values())
      .filter(donation => donation.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getDonation(id: number): Promise<Donation | undefined> {
    return this.donations.get(id);
  }

  async createDonation(donation: InsertDonation): Promise<Donation> {
    const id = this.donationIdCounter++;
    const createdAt = new Date();
    const newDonation: Donation = { ...donation, id, createdAt };
    this.donations.set(id, newDonation);
    return newDonation;
  }

  async updateDonation(id: number, donation: Partial<InsertDonation>): Promise<Donation | undefined> {
    const existingDonation = this.donations.get(id);
    if (!existingDonation) return undefined;
    
    const updatedDonation = { ...existingDonation, ...donation };
    this.donations.set(id, updatedDonation);
    return updatedDonation;
  }

  async deleteDonation(id: number): Promise<boolean> {
    return this.donations.delete(id);
  }

  // Vegan conversion operations
  async getVeganConversions(userId: number): Promise<VeganConversion[]> {
    return Array.from(this.veganConversions.values())
      .filter(conversion => conversion.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getVeganConversion(id: number): Promise<VeganConversion | undefined> {
    return this.veganConversions.get(id);
  }

  async createVeganConversion(conversion: InsertVeganConversion): Promise<VeganConversion> {
    const id = this.veganConversionIdCounter++;
    const createdAt = new Date();
    const newConversion: VeganConversion = { ...conversion, id, createdAt };
    this.veganConversions.set(id, newConversion);
    return newConversion;
  }

  async updateVeganConversion(id: number, conversion: Partial<InsertVeganConversion>): Promise<VeganConversion | undefined> {
    const existingConversion = this.veganConversions.get(id);
    if (!existingConversion) return undefined;
    
    const updatedConversion = { ...existingConversion, ...conversion };
    this.veganConversions.set(id, updatedConversion);
    return updatedConversion;
  }

  async deleteVeganConversion(id: number): Promise<boolean> {
    return this.veganConversions.delete(id);
  }

  // Media shared operations
  async getMediaShared(userId: number): Promise<MediaShared[]> {
    return Array.from(this.mediaShared.values())
      .filter(media => media.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getMediaSharedItem(id: number): Promise<MediaShared | undefined> {
    return this.mediaShared.get(id);
  }

  async createMediaShared(media: InsertMediaShared): Promise<MediaShared> {
    const id = this.mediaSharedIdCounter++;
    const createdAt = new Date();
    const newMedia: MediaShared = { ...media, id, createdAt };
    this.mediaShared.set(id, newMedia);
    return newMedia;
  }

  async updateMediaShared(id: number, media: Partial<InsertMediaShared>): Promise<MediaShared | undefined> {
    const existingMedia = this.mediaShared.get(id);
    if (!existingMedia) return undefined;
    
    const updatedMedia = { ...existingMedia, ...media };
    this.mediaShared.set(id, updatedMedia);
    return updatedMedia;
  }

  async deleteMediaShared(id: number): Promise<boolean> {
    return this.mediaShared.delete(id);
  }

  // Campaign operations
  async getCampaigns(userId: number): Promise<Campaign[]> {
    return Array.from(this.campaigns.values())
      .filter(campaign => campaign.userId === userId)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const id = this.campaignIdCounter++;
    const createdAt = new Date();
    const newCampaign: Campaign = { ...campaign, id, createdAt };
    this.campaigns.set(id, newCampaign);
    return newCampaign;
  }

  async updateCampaign(id: number, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const existingCampaign = this.campaigns.get(id);
    if (!existingCampaign) return undefined;
    
    const updatedCampaign = { ...existingCampaign, ...campaign };
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    return this.campaigns.delete(id);
  }

  // User statistics
  async getUserStats(userId: number): Promise<{
    totalAnimalsSaved: number;
    donationsCount: number;
    donationsAnimalsSaved: number;
    veganCount: number;
    veganAnimalsSaved: number;
    mediaCount: number;
    mediaAnimalsSaved: number;
    campaignsCount: number;
    campaignsAnimalsSaved: number;
  }> {
    const userDonations = await this.getDonations(userId);
    const userVeganConversions = await this.getVeganConversions(userId);
    const userMediaShared = await this.getMediaShared(userId);
    const userCampaigns = await this.getCampaigns(userId);

    const donationsAnimalsSaved = userDonations.reduce((sum, donation) => sum + donation.animalsSaved, 0);
    const veganAnimalsSaved = userVeganConversions.reduce((sum, conversion) => sum + conversion.animalsSaved, 0);
    const mediaAnimalsSaved = userMediaShared.reduce((sum, media) => sum + media.animalsSaved, 0);
    const campaignsAnimalsSaved = userCampaigns.reduce((sum, campaign) => sum + campaign.animalsSaved, 0);

    return {
      totalAnimalsSaved: donationsAnimalsSaved + veganAnimalsSaved + mediaAnimalsSaved + campaignsAnimalsSaved,
      donationsCount: userDonations.length,
      donationsAnimalsSaved,
      veganCount: userVeganConversions.length,
      veganAnimalsSaved,
      mediaCount: userMediaShared.length,
      mediaAnimalsSaved,
      campaignsCount: userCampaigns.length,
      campaignsAnimalsSaved
    };
  }
}

export const storage = new MemStorage();
