import { users, donations, veganConversions, mediaShared, campaigns, proBonoWork } from "@shared/schema";
import type { User, InsertUser, Donation, InsertDonation, VeganConversion, InsertVeganConversion, MediaShared, InsertMediaShared, Campaign, InsertCampaign, ProBonoWork, InsertProBonoWork } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, desc, sql, count, sum } from "drizzle-orm";
import { pool } from "./db";
import { calculateDonationImpact } from "./utils";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

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

  // Pro Bono Work operations
  getProBonoWork(userId: number): Promise<ProBonoWork[]>;
  getProBonoWorkItem(id: number): Promise<ProBonoWork | undefined>;
  createProBonoWork(work: InsertProBonoWork): Promise<ProBonoWork>;
  updateProBonoWork(id: number, work: Partial<InsertProBonoWork>): Promise<ProBonoWork | undefined>;
  deleteProBonoWork(id: number): Promise<boolean>;

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
    proBonoCount: number;
    proBonoAnimalsSaved: number;
  }>;
  
  // Leaderboard operations
  getLeaderboard(): Promise<{
    id: number;
    username: string;
    name: string;
    totalAnimalsSaved: number;
    donationsAnimalsSaved: number;
    veganAnimalsSaved: number;
    mediaAnimalsSaved: number;
    campaignsAnimalsSaved: number;
  }[]>;

  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private donations: Map<number, Donation>;
  private veganConversions: Map<number, VeganConversion>;
  private mediaShared: Map<number, MediaShared>;
  private campaigns: Map<number, Campaign>;
  private proBonoWork: Map<number, ProBonoWork>;
  
  private userIdCounter: number;
  private donationIdCounter: number;
  private veganConversionIdCounter: number;
  private mediaSharedIdCounter: number;
  private campaignIdCounter: number;
  private proBonoWorkIdCounter: number;
  
  sessionStore: any;

  constructor() {
    this.users = new Map();
    this.donations = new Map();
    this.veganConversions = new Map();
    this.mediaShared = new Map();
    this.campaigns = new Map();
    this.proBonoWork = new Map();
    
    this.userIdCounter = 1;
    this.donationIdCounter = 1;
    this.veganConversionIdCounter = 1;
    this.mediaSharedIdCounter = 1;
    this.campaignIdCounter = 1;
    this.proBonoWorkIdCounter = 1;
    
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
    const newDonation: Donation = { 
      ...donation,
      id, 
      createdAt,
      currency: donation.currency ?? 'USD',
      organizationImpact: donation.organizationImpact ?? 'average',
      isMonthly: donation.isMonthly ?? false,
      dateStarted: donation.dateStarted ?? null,
      dateEnded: donation.dateEnded ?? null,
      notes: donation.notes ?? null
    };
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
      .sort((a, b) => new Date(b.dateStarted).getTime() - new Date(a.dateStarted).getTime());
  }

  async getVeganConversion(id: number): Promise<VeganConversion | undefined> {
    return this.veganConversions.get(id);
  }

  async createVeganConversion(conversion: InsertVeganConversion): Promise<VeganConversion> {
    const id = this.veganConversionIdCounter++;
    const createdAt = new Date();
    const newConversion: VeganConversion = { 
      ...conversion,
      id, 
      createdAt,
      personName: conversion.personName ?? null,
      dateEnded: conversion.dateEnded ?? null,
      notes: conversion.notes ?? null
    };
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
      .sort((a, b) => new Date(b.dateStarted).getTime() - new Date(a.dateStarted).getTime());
  }

  async getMediaSharedItem(id: number): Promise<MediaShared | undefined> {
    return this.mediaShared.get(id);
  }

  async createMediaShared(media: InsertMediaShared): Promise<MediaShared> {
    const id = this.mediaSharedIdCounter++;
    const createdAt = new Date();
    
    // Make sure all required fields are explicitly defined to handle nullable correctly
    const newMedia: MediaShared = { 
      id,
      userId: media.userId, 
      title: media.title,
      dateStarted: media.dateStarted,
      dateEnded: media.dateEnded || null,
      animalsSaved: media.animalsSaved,
      oneOffPieces: media.oneOffPieces || 0,
      postsPerMonth: media.postsPerMonth || 0,
      interactions: media.interactions || 0,
      description: media.description || null,
      createdAt
    };
    
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
      .sort((a, b) => new Date(b.start_date || new Date()).getTime() - new Date(a.start_date || new Date()).getTime());
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const id = this.campaignIdCounter++;
    const created_at = new Date();
    const newCampaign: Campaign = { 
      ...campaign, 
      id, 
      created_at,
      campaign_type: campaign.campaign_type ?? null,
      organization: campaign.organization ?? null,
      notes: campaign.notes ?? null,
      start_date: campaign.start_date ?? null,
      end_date: campaign.end_date ?? null,
      budget: campaign.budget ?? null,
      scope: campaign.scope ?? null,
      people_reached: campaign.people_reached ?? null,
      people_recruited: campaign.people_recruited ?? null,
      emails: campaign.emails ?? null,
      social_media_actions: campaign.social_media_actions ?? null,
      letters: campaign.letters ?? null,
      other_actions: campaign.other_actions ?? null,
      total_actions: campaign.total_actions ?? null,
      signed: campaign.signed ?? false,
      shared: campaign.shared ?? false,
      contacted: campaign.contacted ?? false,
      recruited: campaign.recruited ?? false,
      donated: campaign.donated ?? false
    };
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

  async getProBonoWork(userId: number): Promise<ProBonoWork[]> {
    return Array.from(this.proBonoWork.values()).filter(work => work.userId === userId);
  }

  async getProBonoWorkItem(id: number): Promise<ProBonoWork | undefined> {
    return this.proBonoWork.get(id);
  }

  async createProBonoWork(work: InsertProBonoWork): Promise<ProBonoWork> {
    const id = this.proBonoWorkIdCounter++;
    const createdAt = new Date();
    
    const newWork: ProBonoWork = { 
      ...work, 
      id, 
      createdAt,
      hoursPerDay: work.hoursPerDay || 0,
      daysPerWeek: work.daysPerWeek || 0,
      organizationImpact: work.organizationImpact || 'Average',
      hourlyValue: work.hourlyValue || 0,
      dateEnded: work.dateEnded || null,
      description: work.description || null
    };
    
    this.proBonoWork.set(id, newWork);
    return newWork;
  }

  async updateProBonoWork(id: number, work: Partial<InsertProBonoWork>): Promise<ProBonoWork | undefined> {
    const existingWork = this.proBonoWork.get(id);
    if (!existingWork) return undefined;
    
    const updatedWork = { ...existingWork, ...work };
    this.proBonoWork.set(id, updatedWork);
    return updatedWork;
  }

  async deleteProBonoWork(id: number): Promise<boolean> {
    const work = this.proBonoWork.get(id);
    if (!work) return false;
    
    this.proBonoWork.delete(id);
    return true;
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
    proBonoCount: number;
    proBonoAnimalsSaved: number;
  }> {
    const userDonations = await this.getDonations(userId);
    const userVeganConversions = await this.getVeganConversions(userId);
    const userMediaShared = await this.getMediaShared(userId);
    const userCampaigns = await this.getCampaigns(userId);
    const userProBonoWork = await this.getProBonoWork(userId);

    const donationsAnimalsSaved = userDonations.reduce((sum, donation) => sum + donation.animalsSaved, 0);
    const veganAnimalsSaved = userVeganConversions.reduce((sum, conversion) => sum + conversion.animalsSaved, 0);
    const mediaAnimalsSaved = userMediaShared.reduce((sum, media) => sum + media.animalsSaved, 0);
    const campaignsAnimalsSaved = userCampaigns.reduce((sum, campaign) => sum + campaign.animals_saved, 0);
    const proBonoAnimalsSaved = userProBonoWork.reduce((sum, work) => sum + work.animalsSaved, 0);

    return {
      totalAnimalsSaved: donationsAnimalsSaved + veganAnimalsSaved + mediaAnimalsSaved + campaignsAnimalsSaved + proBonoAnimalsSaved,
      donationsCount: userDonations.length,
      donationsAnimalsSaved,
      veganCount: userVeganConversions.length,
      veganAnimalsSaved,
      mediaCount: userMediaShared.length,
      mediaAnimalsSaved,
      campaignsCount: userCampaigns.length,
      campaignsAnimalsSaved,
      proBonoCount: userProBonoWork.length,
      proBonoAnimalsSaved,
    };
  }

  // Leaderboard operations  
  async getLeaderboard(): Promise<{
    id: number;
    username: string;
    name: string;
    totalAnimalsSaved: number;
    donationsAnimalsSaved: number;
    veganAnimalsSaved: number;
    mediaAnimalsSaved: number;
    campaignsAnimalsSaved: number;
  }[]> {
    const allUsers = Array.from(this.users.values());
    const leaderboard = [];
    
    for (const user of allUsers) {
      const stats = await this.getUserStats(user.id);
      
      leaderboard.push({
        id: user.id,
        username: user.username,
        name: user.name,
        totalAnimalsSaved: stats.totalAnimalsSaved,
        donationsAnimalsSaved: stats.donationsAnimalsSaved,
        veganAnimalsSaved: stats.veganAnimalsSaved,
        mediaAnimalsSaved: stats.mediaAnimalsSaved,
        campaignsAnimalsSaved: stats.campaignsAnimalsSaved
      });
    }
    
    // Sort by total animals saved (highest first)
    return leaderboard.sort((a, b) => b.totalAnimalsSaved - a.totalAnimalsSaved);
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Donation operations
  async getDonations(userId: number): Promise<Donation[]> {
    return db.select()
      .from(donations)
      .where(eq(donations.userId, userId))
      .orderBy(desc(donations.date));
  }

  async getDonation(id: number): Promise<Donation | undefined> {
    const [donation] = await db.select().from(donations).where(eq(donations.id, id));
    return donation;
  }

  async createDonation(donation: InsertDonation): Promise<Donation> {
    const [newDonation] = await db.insert(donations).values(donation).returning();
    return newDonation;
  }

  async updateDonation(id: number, donation: Partial<InsertDonation>): Promise<Donation | undefined> {
    const [updatedDonation] = await db.update(donations)
      .set(donation)
      .where(eq(donations.id, id))
      .returning();
    return updatedDonation;
  }

  async deleteDonation(id: number): Promise<boolean> {
    const result = await db.delete(donations).where(eq(donations.id, id));
    return true; // If no error occurs, consider it successful
  }

  // Vegan conversion operations
  async getVeganConversions(userId: number): Promise<VeganConversion[]> {
    try {
      console.log("Executing database query for vegan conversions...");
      const result = await db.select()
        .from(veganConversions)
        .where(eq(veganConversions.userId, userId));
      console.log("Query successful, got results:", result);
      return result;
    } catch (error) {
      console.error("Database error in getVeganConversions:", error);
      return [];
    }
  }

  async getVeganConversion(id: number): Promise<VeganConversion | undefined> {
    const [conversion] = await db.select().from(veganConversions).where(eq(veganConversions.id, id));
    return conversion;
  }

  async createVeganConversion(conversion: InsertVeganConversion): Promise<VeganConversion> {
    const [newConversion] = await db.insert(veganConversions).values(conversion).returning();
    return newConversion;
  }

  async updateVeganConversion(id: number, conversion: Partial<InsertVeganConversion>): Promise<VeganConversion | undefined> {
    const [updatedConversion] = await db.update(veganConversions)
      .set(conversion)
      .where(eq(veganConversions.id, id))
      .returning();
    return updatedConversion;
  }

  async deleteVeganConversion(id: number): Promise<boolean> {
    const result = await db.delete(veganConversions).where(eq(veganConversions.id, id));
    return true; // If no error occurs, consider it successful
  }

  // Media shared operations
  async getMediaShared(userId: number): Promise<MediaShared[]> {
    return db.select()
      .from(mediaShared)
      .where(eq(mediaShared.userId, userId))
      .orderBy(desc(mediaShared.dateStarted));
  }

  async getMediaSharedItem(id: number): Promise<MediaShared | undefined> {
    const [media] = await db.select().from(mediaShared).where(eq(mediaShared.id, id));
    return media;
  }

  async createMediaShared(media: InsertMediaShared): Promise<MediaShared> {
    console.log("Creating media shared with data:", media);
    const [newMedia] = await db.insert(mediaShared).values(media).returning();
    console.log("Created media shared:", newMedia);
    return newMedia;
  }

  async updateMediaShared(id: number, media: Partial<InsertMediaShared>): Promise<MediaShared | undefined> {
    const [updatedMedia] = await db.update(mediaShared)
      .set(media)
      .where(eq(mediaShared.id, id))
      .returning();
    return updatedMedia;
  }

  async deleteMediaShared(id: number): Promise<boolean> {
    const result = await db.delete(mediaShared).where(eq(mediaShared.id, id));
    return true; // If no error occurs, consider it successful
  }

  // Campaign operations
  async getCampaigns(userId: number): Promise<Campaign[]> {
    return db.select()
      .from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.created_at));
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [newCampaign] = await db.insert(campaigns).values(campaign).returning();
    return newCampaign;
  }

  async updateCampaign(id: number, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const [updatedCampaign] = await db.update(campaigns)
      .set(campaign)
      .where(eq(campaigns.id, id))
      .returning();
    return updatedCampaign;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    const result = await db.delete(campaigns).where(eq(campaigns.id, id));
    return true; // If no error occurs, consider it successful
  }

  async getProBonoWork(userId: number): Promise<ProBonoWork[]> {
    try {
      console.log(`Getting pro bono work for user: ${userId}`);
      const result = await db.select().from(proBonoWork).where(eq(proBonoWork.userId, userId));
      console.log(`Retrieved pro bono work:`, result);
      return result;
    } catch (error) {
      console.error('Error getting pro bono work:', error);
      return [];
    }
  }

  async getProBonoWorkItem(id: number): Promise<ProBonoWork | undefined> {
    try {
      const [work] = await db.select().from(proBonoWork).where(eq(proBonoWork.id, id));
      return work || undefined;
    } catch (error) {
      console.error('Error getting pro bono work item:', error);
      return undefined;
    }
  }

  async createProBonoWork(work: InsertProBonoWork): Promise<ProBonoWork> {
    try {
      const [newWork] = await db
        .insert(proBonoWork)
        .values(work)
        .returning();
      return newWork;
    } catch (error) {
      console.error('Error creating pro bono work:', error);
      throw error;
    }
  }

  async updateProBonoWork(id: number, work: Partial<InsertProBonoWork>): Promise<ProBonoWork | undefined> {
    try {
      const [updatedWork] = await db
        .update(proBonoWork)
        .set(work)
        .where(eq(proBonoWork.id, id))
        .returning();
      return updatedWork || undefined;
    } catch (error) {
      console.error('Error updating pro bono work:', error);
      return undefined;
    }
  }

  async deleteProBonoWork(id: number): Promise<boolean> {
    try {
      const result = await db.delete(proBonoWork).where(eq(proBonoWork.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting pro bono work:', error);
      return false;
    }
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
    proBonoCount: number;
    proBonoAnimalsSaved: number;
  }> {
    // Get all user data for accurate calculations
    const userDonations = await this.getDonations(userId);
    
    // Vegan conversions stats
    const veganResult = await db
      .select({
        count: count(),
        totalSaved: sum(veganConversions.animalsSaved)
      })
      .from(veganConversions)
      .where(eq(veganConversions.userId, userId));
    
    // Media shared stats
    const mediaResult = await db
      .select({
        count: count(),
        totalSaved: sum(mediaShared.animalsSaved)
      })
      .from(mediaShared)
      .where(eq(mediaShared.userId, userId));
    
    // Campaigns stats - Note: using animals_saved (snake_case) to match database column
    const campaignsResult = await db
      .select({
        count: count(),
        totalSaved: sum(campaigns.animals_saved)
      })
      .from(campaigns)
      .where(eq(campaigns.userId, userId));

    // Calculate donations impact using the same formula as the donations page
    const donationsCount = userDonations.length;
    let donationsAnimalsSaved = 0;
    
    // Calculate total animals saved for donations using the same method as the donations page
    for (const donation of userDonations) {
      // Get the total amount for this donation
      let totalAmount = donation.amount;
      if (donation.isMonthly && donation.dateStarted) {
        const startDate = new Date(donation.dateStarted);
        const endDate = donation.dateEnded ? new Date(donation.dateEnded) : new Date();
        const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const monthsDiff = daysDiff / 30;
        totalAmount = monthsDiff * donation.amount;
      }
      
      // Calculate animals saved for this donation based on its impact level
      const impactLevel = donation.organizationImpact || "Average";
      donationsAnimalsSaved += calculateDonationImpact(totalAmount, impactLevel);
    }
    
    const veganCount = Number(veganResult[0]?.count || 0);
    const veganAnimalsSaved = Number(veganResult[0]?.totalSaved || 0);
    
    const mediaCount = Number(mediaResult[0]?.count || 0);
    const mediaAnimalsSaved = Number(mediaResult[0]?.totalSaved || 0);
    
    const campaignsCount = Number(campaignsResult[0]?.count || 0);
    const campaignsAnimalsSaved = Number(campaignsResult[0]?.totalSaved || 0);

    // Pro bono work stats
    const proBonoResult = await db
      .select({
        count: count(),
        totalSaved: sum(proBonoWork.animalsSaved)
      })
      .from(proBonoWork)
      .where(eq(proBonoWork.userId, userId));

    const proBonoCount = Number(proBonoResult[0]?.count || 0);
    const proBonoAnimalsSaved = Number(proBonoResult[0]?.totalSaved || 0);

    return {
      totalAnimalsSaved: donationsAnimalsSaved + veganAnimalsSaved + mediaAnimalsSaved + campaignsAnimalsSaved + proBonoAnimalsSaved,
      donationsCount,
      donationsAnimalsSaved,
      veganCount,
      veganAnimalsSaved,
      mediaCount,
      mediaAnimalsSaved,
      campaignsCount,
      campaignsAnimalsSaved,
      proBonoCount,
      proBonoAnimalsSaved,
    };
  }
  
  async getLeaderboard(): Promise<{
    id: number;
    username: string;
    name: string;
    totalAnimalsSaved: number;
    donationsAnimalsSaved: number;
    veganAnimalsSaved: number;
    mediaAnimalsSaved: number;
    campaignsAnimalsSaved: number;
  }[]> {
    try {
      // Get all users
      const allUsers = await db.select().from(users);
      
      // Get stats for each user and create leaderboard
      const leaderboard = [];
      
      for (const user of allUsers) {
        // Get user stats
        const stats = await this.getUserStats(user.id);
        
        leaderboard.push({
          id: user.id,
          username: user.username,
          name: user.name,
          totalAnimalsSaved: stats.totalAnimalsSaved,
          donationsAnimalsSaved: stats.donationsAnimalsSaved,
          veganAnimalsSaved: stats.veganAnimalsSaved,
          mediaAnimalsSaved: stats.mediaAnimalsSaved,
          campaignsAnimalsSaved: stats.campaignsAnimalsSaved
        });
      }
      
      // Sort by total animals saved (highest first)
      return leaderboard.sort((a, b) => b.totalAnimalsSaved - a.totalAnimalsSaved);
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      return [];
    }
  }
}

// Switch from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
