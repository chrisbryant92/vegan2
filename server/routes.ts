import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertDonationSchema, insertVeganConversionSchema, insertMediaSharedSchema, insertCampaignSchema } from "@shared/schema";

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
      
      // Process the data before validation
      const processedData = {
        ...req.body,
        userId,
        // Ensure isMonthly is treated as a boolean
        isMonthly: req.body.isMonthly === true || req.body.isMonthly === "true",
        // Handle date values
        dateStarted: req.body.dateStarted || null,
        dateEnded: req.body.dateEnded || null,
        notes: req.body.notes || null
      };
      
      console.log("Processed donation data:", processedData);
      
      const validatedData = insertDonationSchema.parse(processedData);
      console.log("Validated donation data:", validatedData);
      
      const donation = await storage.createDonation(validatedData);
      console.log("Created donation:", donation);
      
      res.status(201).json(donation);
    } catch (error) {
      console.error("Error creating donation:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create donation" });
      }
    }
  });

  app.get("/api/donations", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const donations = await storage.getDonations(userId);
      res.json(donations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get donations" });
    }
  });

  app.get("/api/donations/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const donation = await storage.getDonation(id);
      
      if (!donation) {
        return res.status(404).json({ error: "Donation not found" });
      }
      
      if (donation.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to access this donation" });
      }
      
      res.json(donation);
    } catch (error) {
      res.status(500).json({ error: "Failed to get donation" });
    }
  });

  app.put("/api/donations/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const donation = await storage.getDonation(id);
      
      if (!donation) {
        return res.status(404).json({ error: "Donation not found" });
      }
      
      if (donation.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to update this donation" });
      }
      
      const updatedDonation = await storage.updateDonation(id, req.body);
      res.json(updatedDonation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update donation" });
      }
    }
  });

  app.delete("/api/donations/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const donation = await storage.getDonation(id);
      
      if (!donation) {
        return res.status(404).json({ error: "Donation not found" });
      }
      
      if (donation.userId !== req.user!.id) {
        return res.status(403).json({ error: "Not authorized to delete this donation" });
      }
      
      await storage.deleteDonation(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete donation" });
    }
  });

  // Vegan Conversions routes
  app.post("/api/vegan-conversions", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const validatedData = insertVeganConversionSchema.parse({
        ...req.body,
        userId
      });
      
      const conversion = await storage.createVeganConversion(validatedData);
      res.status(201).json(conversion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create vegan conversion" });
      }
    }
  });

  app.get("/api/vegan-conversions", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const conversions = await storage.getVeganConversions(userId);
      res.json(conversions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get vegan conversions" });
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
      const validatedData = insertMediaSharedSchema.parse({
        ...req.body,
        userId
      });
      
      const media = await storage.createMediaShared(validatedData);
      res.status(201).json(media);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create media shared record" });
      }
    }
  });

  app.get("/api/media-shared", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const mediaItems = await storage.getMediaShared(userId);
      res.json(mediaItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to get media shared records" });
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
      res.status(500).json({ error: "Failed to get media shared record" });
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
      
      const updatedMedia = await storage.updateMediaShared(id, req.body);
      res.json(updatedMedia);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update media shared record" });
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
      res.status(500).json({ error: "Failed to delete media shared record" });
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
