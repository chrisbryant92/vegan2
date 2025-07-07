import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { db, pool } from "./db";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { donations, campaigns, insertDonationSchema, insertVeganConversionSchema, insertMediaSharedSchema, insertCampaignSchema, campaignSchema, proBonoWorkSchema, insertProBonoWorkSchema } from "@shared/schema";
import { sum, count } from "drizzle-orm";
import { calculateDonationImpact } from "./utils";
import { calculateProBonoImpact } from "../client/src/lib/calculations";
import { z } from "zod";

// Authentication middleware
const ensureAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Get user stats
  app.get("/api/stats", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get statistics" });
    }
  });
  
  // Get leaderboard
  app.get("/api/leaderboard", ensureAuthenticated, async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to get leaderboard data" });
    }
  });

  // Donations routes
  app.post("/api/donations", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      console.log("Donation request body:", req.body);
      
      // Create a donation object directly without relying on schema types
      // This avoids the automatic validation that happens when using InsertDonation type
      const amount = Number(req.body.amount);
      const organizationImpact = req.body.organizationImpact || "Average";
      
      const processedData: {
        organization: string;
        amount: number;
        organizationImpact: string;
        donationType: string;
        date: Date;
        isMonthly: boolean;
        dateStarted: Date | null;
        dateEnded: Date | null;
        notes: string | null;
        animalsSaved: number;
        userId: number;
      } = {
        organization: req.body.organization,
        amount: amount,
        organizationImpact: organizationImpact,
        donationType: req.body.donationType,
        date: new Date(req.body.date),
        isMonthly: req.body.isMonthly === true || req.body.isMonthly === "true",
        dateStarted: req.body.dateStarted ? new Date(req.body.dateStarted) : null,
        dateEnded: req.body.dateEnded ? new Date(req.body.dateEnded) : null,
        notes: req.body.notes || null,
        animalsSaved: calculateDonationImpact(amount, organizationImpact),
        userId
      };
      
      console.log("Processed donation data:", processedData);
      
      // Execute database query directly to avoid Zod validation
      const [donation] = await db.insert(donations).values(processedData).returning();
      console.log("Created donation:", donation);
      
      res.status(201).json(donation);
    } catch (error) {
      console.error("Error creating donation:", error);
      res.status(500).json({ error: "Failed to create donation: " + (error instanceof Error ? error.message : String(error)) });
    }
  });

  app.get("/api/donations", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      // Access database directly
      const donationList = await db.select()
        .from(donations)
        .where(eq(donations.userId, userId))
        .orderBy(desc(donations.date));
      
      res.json(donationList);
    } catch (error) {
      console.error("Error getting donations:", error);
      res.status(500).json({ error: "Failed to get donations" });
    }
  });

  app.get("/api/donations/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [donation] = await db.select()
        .from(donations)
        .where(eq(donations.id, id));
      
      if (!donation) {
        return res.status(404).json({ error: "Donation not found" });
      }
      
      if (donation.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to access this donation" });
      }
      
      res.json(donation);
    } catch (error) {
      console.error("Error getting donation:", error);
      res.status(500).json({ error: "Failed to get donation" });
    }
  });

  app.put("/api/donations/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [donationCheck] = await db.select().from(donations).where(eq(donations.id, id));
      
      if (!donationCheck) {
        return res.status(404).json({ error: "Donation not found" });
      }
      
      if (donationCheck.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to update this donation" });
      }
      
      // Create a processed data object with only fields that are present in the body
      const processedData: any = {};
      
      if (req.body.organization) processedData.organization = req.body.organization;
      if (req.body.amount) processedData.amount = Number(req.body.amount);
      if (req.body.organizationImpact) processedData.organizationImpact = req.body.organizationImpact;
      if (req.body.donationType) processedData.donationType = req.body.donationType;
      if (req.body.isMonthly !== undefined) processedData.isMonthly = req.body.isMonthly === true || req.body.isMonthly === "true";
      if (req.body.date) processedData.date = new Date(req.body.date);
      if (req.body.dateStarted) processedData.dateStarted = new Date(req.body.dateStarted);
      if (req.body.dateEnded) processedData.dateEnded = new Date(req.body.dateEnded);
      if (req.body.notes !== undefined) processedData.notes = req.body.notes || null;
      if (req.body.animalsSaved) processedData.animalsSaved = Number(req.body.animalsSaved);
      
      // Execute database query directly to avoid Zod validation issues
      const [updatedDonation] = await db.update(donations)
        .set(processedData)
        .where(eq(donations.id, id))
        .returning();
      
      res.json(updatedDonation);
    } catch (error) {
      console.error("Error updating donation:", error);
      res.status(500).json({ error: "Failed to update donation: " + (error instanceof Error ? error.message : String(error)) });
    }
  });

  app.patch("/api/donations/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [donationCheck] = await db.select().from(donations).where(eq(donations.id, id));
      
      if (!donationCheck) {
        return res.status(404).json({ error: "Donation not found" });
      }
      
      if (donationCheck.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to update this donation" });
      }
      
      console.log("PATCH donation request body:", req.body);
      
      // Create a processed data object with only fields that are present in the body
      const processedData: any = {};
      
      if (req.body.organization) processedData.organization = req.body.organization;
      if (req.body.amount) processedData.amount = Number(req.body.amount);
      if (req.body.currency) processedData.currency = req.body.currency;
      if (req.body.organizationImpact) processedData.organizationImpact = req.body.organizationImpact;
      if (req.body.donationType) processedData.donationType = req.body.donationType;
      if (req.body.isMonthly !== undefined) processedData.isMonthly = req.body.isMonthly === true || req.body.isMonthly === "true";
      if (req.body.date) processedData.date = new Date(req.body.date);
      if (req.body.dateStarted) processedData.dateStarted = new Date(req.body.dateStarted);
      if (req.body.dateEnded) processedData.dateEnded = req.body.dateEnded ? new Date(req.body.dateEnded) : null;
      if (req.body.notes !== undefined) processedData.notes = req.body.notes || null;
      if (req.body.animalsSaved) processedData.animalsSaved = Number(req.body.animalsSaved);
      
      console.log("Processed PATCH data:", processedData);
      
      // Execute database query directly
      const [updatedDonation] = await db.update(donations)
        .set(processedData)
        .where(eq(donations.id, id))
        .returning();
      
      console.log("Updated donation:", updatedDonation);
      res.json(updatedDonation);
    } catch (error) {
      console.error("Error updating donation with PATCH:", error);
      res.status(500).json({ error: "Failed to update donation: " + (error instanceof Error ? error.message : String(error)) });
    }
  });

  app.delete("/api/donations/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [donationCheck] = await db.select().from(donations).where(eq(donations.id, id));
      
      if (!donationCheck) {
        return res.status(404).json({ error: "Donation not found" });
      }
      
      if (donationCheck.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to delete this donation" });
      }
      
      // Execute delete query directly
      await db.delete(donations).where(eq(donations.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting donation:", error);
      res.status(500).json({ error: "Failed to delete donation" });
    }
  });

  // Vegan Conversions routes
  app.post("/api/vegan-conversions", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      console.log("Vegan conversion request body:", req.body);
      
      // Create a conversion object with properly parsed dates
      const processedData = {
        personName: req.body.personName || null,
        dateStarted: new Date(req.body.dateStarted),
        dateEnded: req.body.dateEnded ? new Date(req.body.dateEnded) : null,
        dietBefore: req.body.dietBefore,
        dietAfter: req.body.dietAfter,
        influence: Number(req.body.influence),
        notes: req.body.notes || null,
        animalsSaved: Number(req.body.animalsSaved),
        userId
      };
      
      console.log("Processed vegan conversion data:", processedData);
      
      // Use storage method that expects properly formatted data
      const conversion = await storage.createVeganConversion(processedData);
      res.status(201).json(conversion);
    } catch (error) {
      console.error("Error creating vegan conversion:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create vegan conversion: " + (error instanceof Error ? error.message : String(error)) });
      }
    }
  });

  app.get("/api/vegan-conversions", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      console.log("Getting vegan conversions for user:", userId);
      const conversions = await storage.getVeganConversions(userId);
      console.log("Retrieved vegan conversions:", conversions);
      res.json(conversions);
    } catch (error) {
      console.error("Error getting vegan conversions:", error);
      res.status(500).json({ error: "Failed to get vegan conversions: " + (error instanceof Error ? error.message : String(error)) });
    }
  });

  app.get("/api/vegan-conversions/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const conversion = await storage.getVeganConversion(id);
      
      if (!conversion) {
        return res.status(404).json({ error: "Vegan conversion not found" });
      }
      
      if (conversion.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to access this conversion" });
      }
      
      res.json(conversion);
    } catch (error) {
      res.status(500).json({ error: "Failed to get vegan conversion" });
    }
  });

  app.put("/api/vegan-conversions/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const conversion = await storage.getVeganConversion(id);
      
      if (!conversion) {
        return res.status(404).json({ error: "Vegan conversion not found" });
      }
      
      if (conversion.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to update this conversion" });
      }
      
      const updatedConversion = await storage.updateVeganConversion(id, req.body);
      res.json(updatedConversion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update vegan conversion" });
      }
    }
  });

  app.delete("/api/vegan-conversions/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const conversion = await storage.getVeganConversion(id);
      
      if (!conversion) {
        return res.status(404).json({ error: "Vegan conversion not found" });
      }
      
      if (conversion.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to delete this conversion" });
      }
      
      await storage.deleteVeganConversion(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete vegan conversion" });
    }
  });

  // Media Shared routes
  app.post("/api/media-shared", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      console.log("Media shared request body:", req.body);
      
      // Create a media shared object with properly parsed dates
      const processedData = {
        title: req.body.title,
        oneOffPieces: Number(req.body.oneOffPieces || 0),
        postsPerMonth: Number(req.body.postsPerMonth || 0),
        estimatedReach: Number(req.body.estimatedReach || 0),
        estimatedPersuasiveness: Number(req.body.estimatedPersuasiveness || 0),
        dateStarted: new Date(req.body.dateStarted),
        dateEnded: req.body.dateEnded ? new Date(req.body.dateEnded) : null,
        description: req.body.description || null,
        animalsSaved: Number(req.body.animalsSaved),
        userId
      };
      
      console.log("Processed media shared data:", processedData);
      
      // Use storage method that expects properly formatted data
      const media = await storage.createMediaShared(processedData);
      res.status(201).json(media);
    } catch (error) {
      console.error("Error creating media shared:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create media shared record: " + (error instanceof Error ? error.message : String(error)) });
      }
    }
  });

  app.get("/api/media-shared", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      console.log("Getting media shared items for user:", userId);
      const mediaItems = await storage.getMediaShared(userId);
      console.log("Retrieved media shared items:", mediaItems);
      res.json(mediaItems);
    } catch (error) {
      console.error("Error getting media shared items:", error);
      res.status(500).json({ error: "Failed to get media shared records: " + (error instanceof Error ? error.message : String(error)) });
    }
  });

  app.get("/api/media-shared/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const media = await storage.getMediaSharedItem(id);
      
      if (!media) {
        return res.status(404).json({ error: "Media shared record not found" });
      }
      
      if (media.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to access this media record" });
      }
      
      res.json(media);
    } catch (error) {
      console.error("Error getting media shared item:", error);
      res.status(500).json({ error: "Failed to get media shared record: " + (error instanceof Error ? error.message : String(error)) });
    }
  });

  app.put("/api/media-shared/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const media = await storage.getMediaSharedItem(id);
      
      if (!media) {
        return res.status(404).json({ error: "Media shared record not found" });
      }
      
      if (media.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to update this media record" });
      }
      
      // Create a processed data object with only fields that are present in the body
      const processedData: any = {};
      
      if (req.body.title) processedData.title = req.body.title;
      if (req.body.oneOffPieces !== undefined) processedData.oneOffPieces = Number(req.body.oneOffPieces);
      if (req.body.postsPerMonth !== undefined) processedData.postsPerMonth = Number(req.body.postsPerMonth);
      if (req.body.estimatedReach !== undefined) processedData.estimatedReach = Number(req.body.estimatedReach);
      if (req.body.estimatedPersuasiveness !== undefined) processedData.estimatedPersuasiveness = Number(req.body.estimatedPersuasiveness);
      if (req.body.dateStarted) processedData.dateStarted = new Date(req.body.dateStarted);
      if (req.body.dateEnded) processedData.dateEnded = new Date(req.body.dateEnded);
      if (req.body.description !== undefined) processedData.description = req.body.description || null;
      if (req.body.animalsSaved) processedData.animalsSaved = Number(req.body.animalsSaved);
      
      const updatedMedia = await storage.updateMediaShared(id, processedData);
      res.json(updatedMedia);
    } catch (error) {
      console.error("Error updating media shared:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update media shared record: " + (error instanceof Error ? error.message : String(error)) });
      }
    }
  });

  app.delete("/api/media-shared/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const media = await storage.getMediaSharedItem(id);
      
      if (!media) {
        return res.status(404).json({ error: "Media shared record not found" });
      }
      
      if (media.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to delete this media record" });
      }
      
      await storage.deleteMediaShared(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting media shared:", error);
      res.status(500).json({ error: "Failed to delete media shared record: " + (error instanceof Error ? error.message : String(error)) });
    }
  });

  // Campaigns routes
  app.post("/api/campaigns", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      console.log("Campaign request body:", req.body);
      
      // Let's directly use a SQL INSERT statement to avoid column mapping issues
      const insertQuery = `
        INSERT INTO campaigns (
          name, campaign_type, organization, start_date, end_date, 
          budget, scope, people_reached, people_recruited, emails, 
          social_media_actions, letters, other_actions, total_actions, 
          notes, animals_saved, user_id, signed, shared, contacted, 
          recruited, donated
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
        ) RETURNING *
      `;

      const values = [
        req.body.name,               // $1 - name
        null,                        // $2 - campaign_type
        req.body.organization || null, // $3 - organization
        null,                        // $4 - start_date
        null,                        // $5 - end_date
        null,                        // $6 - budget
        null,                        // $7 - scope
        null,                        // $8 - people_reached
        null,                        // $9 - people_recruited
        Number(req.body.emails || 0), // $10 - emails
        Number(req.body.socialMediaActions || 0), // $11 - social_media_actions
        Number(req.body.letters || 0), // $12 - letters
        Number(req.body.otherActions || 0), // $13 - other_actions
        Number(req.body.totalActions || 0), // $14 - total_actions
        req.body.notes || null,      // $15 - notes
        Number(req.body.animalsSaved), // $16 - animals_saved
        userId,                      // $17 - user_id
        false,                       // $18 - signed
        false,                       // $19 - shared
        false,                       // $20 - contacted
        false,                       // $21 - recruited
        false                        // $22 - donated
      ];

      console.log("Executing direct SQL insert with values:", values);
      
      // Import pool from db.ts
      const { pool } = await import('./db');
      
      // Execute direct SQL query
      const result = await pool.query(insertQuery, values);
      const campaign = result.rows[0];
      console.log("Created campaign:", campaign);
      
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign: " + (error instanceof Error ? error.message : String(error)) });
    }
  });

  app.get("/api/campaigns", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      console.log("Getting campaigns for user:", userId);
      
      // Access database directly
      const campaignsList = await db.select()
        .from(campaigns)
        .where(eq(campaigns.userId, userId))
        .orderBy(desc(campaigns.created_at));
      
      console.log("Retrieved campaigns:", campaignsList);
      res.json(campaignsList);
    } catch (error) {
      console.error("Error getting campaigns:", error);
      res.status(500).json({ error: "Failed to get campaigns: " + (error instanceof Error ? error.message : String(error)) });
    }
  });

  app.get("/api/campaigns/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [campaign] = await db.select()
        .from(campaigns)
        .where(eq(campaigns.id, id));
      
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      if (campaign.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to access this campaign" });
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Error getting campaign:", error);
      res.status(500).json({ error: "Failed to get campaign: " + (error instanceof Error ? error.message : String(error)) });
    }
  });

  app.put("/api/campaigns/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [campaignCheck] = await db.select()
        .from(campaigns)
        .where(eq(campaigns.id, id));
      
      if (!campaignCheck) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      if (campaignCheck.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to update this campaign" });
      }
      
      // Create a processed data object with only fields that are present in the body
      const processedData: any = {};
      
      if (req.body.name !== undefined) processedData.name = req.body.name;
      if (req.body.emails !== undefined) processedData.emails = Number(req.body.emails);
      if (req.body.socialMediaActions !== undefined) processedData.social_media_actions = Number(req.body.socialMediaActions);
      if (req.body.letters !== undefined) processedData.letters = Number(req.body.letters);
      if (req.body.otherActions !== undefined) processedData.other_actions = Number(req.body.otherActions);
      if (req.body.totalActions !== undefined) processedData.total_actions = Number(req.body.totalActions);
      if (req.body.notes !== undefined) processedData.notes = req.body.notes || null;
      if (req.body.animalsSaved !== undefined) processedData.animals_saved = Number(req.body.animalsSaved);
      
      console.log("Updating campaign with processed data:", processedData);
      
      // Execute database query directly
      const [updatedCampaign] = await db.update(campaigns)
        .set(processedData)
        .where(eq(campaigns.id, id))
        .returning();
      
      res.json(updatedCampaign);
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ error: "Failed to update campaign: " + (error instanceof Error ? error.message : String(error)) });
    }
  });

  app.delete("/api/campaigns/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [campaignCheck] = await db.select()
        .from(campaigns)
        .where(eq(campaigns.id, id));
      
      if (!campaignCheck) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      if (campaignCheck.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to delete this campaign" });
      }
      
      // Execute delete query directly
      await db.delete(campaigns).where(eq(campaigns.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ error: "Failed to delete campaign: " + (error instanceof Error ? error.message : String(error)) });
    }
  });

  // Pro bono work routes
  app.get('/api/pro-bono', ensureAuthenticated, async (req, res) => {
    try {
      const proBonoWork = await storage.getProBonoWork(req.user.id);
      res.json(proBonoWork);
    } catch (error) {
      console.error('Error getting pro bono work:', error);
      res.status(500).json({ error: 'Failed to get pro bono work' });
    }
  });

  app.post('/api/pro-bono', ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = proBonoWorkSchema.parse(req.body);
      
      // Calculate animals saved using the new pro bono calculation
      const animalsSaved = calculateProBonoImpact(
        new Date(validatedData.dateStarted),
        validatedData.dateEnded ? new Date(validatedData.dateEnded) : null,
        validatedData.hoursPerDay,
        validatedData.daysPerWeek,
        validatedData.organizationImpact,
        validatedData.hourlyValue
      );

      const proBonoWorkData = {
        ...validatedData,
        userId: req.user.id,
        animalsSaved,
        dateStarted: new Date(validatedData.dateStarted),
        dateEnded: validatedData.dateEnded ? new Date(validatedData.dateEnded) : null,
      };

      const newProBonoWork = await storage.createProBonoWork(proBonoWorkData);
      res.status(201).json(newProBonoWork);
    } catch (error) {
      console.error('Error creating pro bono work:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create pro bono work record' });
      }
    }
  });

  app.put('/api/pro-bono/:id', ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = proBonoWorkSchema.partial().parse(req.body);
      
      // Recalculate animals saved if relevant fields are updated
      let animalsSaved;
      if (validatedData.dateStarted || validatedData.dateEnded || validatedData.hoursPerDay || validatedData.daysPerWeek || validatedData.organizationImpact || validatedData.hourlyValue) {
        const existingWork = await storage.getProBonoWorkItem(id);
        if (!existingWork) {
          return res.status(404).json({ error: 'Pro bono work not found' });
        }

        animalsSaved = calculateProBonoImpact(
          validatedData.dateStarted ? new Date(validatedData.dateStarted) : existingWork.dateStarted,
          validatedData.dateEnded !== undefined ? (validatedData.dateEnded ? new Date(validatedData.dateEnded) : null) : existingWork.dateEnded,
          validatedData.hoursPerDay ?? existingWork.hoursPerDay,
          validatedData.daysPerWeek ?? existingWork.daysPerWeek,
          validatedData.organizationImpact ?? existingWork.organizationImpact,
          validatedData.hourlyValue ?? existingWork.hourlyValue
        );
      }

      const updateData = {
        ...validatedData,
        ...(animalsSaved !== undefined && { animalsSaved }),
        ...(validatedData.dateStarted && { dateStarted: new Date(validatedData.dateStarted) }),
        ...(validatedData.dateEnded !== undefined && { dateEnded: validatedData.dateEnded ? new Date(validatedData.dateEnded) : null }),
      };

      const updatedProBonoWork = await storage.updateProBonoWork(id, updateData);
      if (!updatedProBonoWork) {
        return res.status(404).json({ error: 'Pro bono work not found' });
      }
      res.json(updatedProBonoWork);
    } catch (error) {
      console.error('Error updating pro bono work:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update pro bono work record' });
      }
    }
  });

  app.delete('/api/pro-bono/:id', ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProBonoWork(id);
      if (!success) {
        return res.status(404).json({ error: 'Pro bono work not found' });
      }
      res.status(200).json({ message: 'Pro bono work deleted successfully' });
    } catch (error) {
      console.error('Error deleting pro bono work:', error);
      res.status(500).json({ error: 'Failed to delete pro bono work record' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
