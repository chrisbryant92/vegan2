import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Charitable Donations table
export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  organization: text("organization").notNull(),
  amount: doublePrecision("amount").notNull(),
  donationType: text("donation_type").notNull(), // "One-Off" or "Monthly"
  date: timestamp("date").notNull(), // Main date (for One-Off) or last donation date
  isMonthly: boolean("is_monthly").default(false), // Whether this is a monthly donation
  dateStarted: timestamp("date_started"), // When the monthly donation started
  dateEnded: timestamp("date_ended"), // When the monthly donation ended (if applicable)
  notes: text("notes"),
  animalsSaved: integer("animals_saved").notNull(), // Calculated as (amount*1.35)*4.056
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Vegan Conversions table
export const veganConversions = pgTable("vegan_conversions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  personName: text("person_name"),
  relationship: text("relationship").notNull(),
  conversionType: text("conversion_type").notNull(),
  date: timestamp("date").notNull(),
  conversation: boolean("conversation").default(false),
  documentary: boolean("documentary").default(false),
  cookedMeal: boolean("cooked_meal").default(false),
  restaurant: boolean("restaurant").default(false),
  notes: text("notes"),
  animalsSaved: integer("animals_saved").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Media Shared table
export const mediaShared = pgTable("media_shared", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  mediaType: text("media_type").notNull(),
  title: text("title").notNull(),
  platform: text("platform").notNull(),
  date: timestamp("date").notNull(),
  reach: integer("reach"),
  engagement: integer("engagement"),
  description: text("description"),
  animalsSaved: integer("animals_saved").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Online Campaigns table
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  campaignType: text("campaign_type").notNull(),
  organization: text("organization"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  signed: boolean("signed").default(false),
  shared: boolean("shared").default(false),
  contacted: boolean("contacted").default(false),
  recruited: boolean("recruited").default(false),
  donated: boolean("donated").default(false),
  peopleRecruited: integer("people_recruited").default(0),
  notes: text("notes"),
  animalsSaved: integer("animals_saved").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true });

export const insertDonationSchema = createInsertSchema(donations)
  .omit({ id: true, createdAt: true });

export const insertVeganConversionSchema = createInsertSchema(veganConversions)
  .omit({ id: true, createdAt: true });

export const insertMediaSharedSchema = createInsertSchema(mediaShared)
  .omit({ id: true, createdAt: true });

export const insertCampaignSchema = createInsertSchema(campaigns)
  .omit({ id: true, createdAt: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Donation = typeof donations.$inferSelect;

export type InsertVeganConversion = z.infer<typeof insertVeganConversionSchema>;
export type VeganConversion = typeof veganConversions.$inferSelect;

export type InsertMediaShared = z.infer<typeof insertMediaSharedSchema>;
export type MediaShared = typeof mediaShared.$inferSelect;

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

// Extending schemas for additional validations
export const registerUserSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginUser = z.infer<typeof loginUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
