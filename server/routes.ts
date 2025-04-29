import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { donations, insertDonationSchema, insertVeganConversionSchema, insertMediaSharedSchema, insertCampaignSchema } from "@shared/schema";

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

  // Donations routes
  app.post("/api/donations", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      console.log("Donation request body:", req.body);
      
      // Create a donation object directly without relying on schema types
      // This avoids the automatic validation that happens when using InsertDonation type
      const processedData: {
        organization: string;
        amount: number;
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
        amount: Number(req.body.amount),
        donationType: req.body.donationType,
        date: new Date(req.body.date),
        isMonthly: req.body.isMonthly === true || req.body.isMonthly === "true",
        dateStarted: req.body.dateStarted ? new Date(req.body.dateStarted) : null,
        dateEnded: req.body.dateEnded ? new Date(req.body.dateEnded) : null,
        notes: req.body.notes || null,
        animalsSaved: Number(req.body.animalsSaved),
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
        meatinessBefore: Number(req.body.meatinessBefore),
        meatinessAfter: Number(req.body.meatinessAfter),
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
      const validatedData = insertCampaignSchema.parse({
        ...req.body,
        userId
      });
      
      const campaign = await storage.createCampaign(validatedData);
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create campaign" });
      }
    }
  });

  app.get("/api/campaigns", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const campaigns = await storage.getCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: "Failed to get campaigns" });
    }
  });

  app.get("/api/campaigns/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.getCampaign(id);
      
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      if (campaign.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to access this campaign" });
      }
      
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: "Failed to get campaign" });
    }
  });

  app.put("/api/campaigns/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.getCampaign(id);
      
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      if (campaign.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to update this campaign" });
      }
      
      const updatedCampaign = await storage.updateCampaign(id, req.body);
      res.json(updatedCampaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update campaign" });
      }
    }
  });

  app.delete("/api/campaigns/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.getCampaign(id);
      
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      if (campaign.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to delete this campaign" });
      }
      
      await storage.deleteCampaign(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete campaign" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
