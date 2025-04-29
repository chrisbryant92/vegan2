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
  dateStarted: timestamp("date_started").notNull(),
  dateEnded: timestamp("date_ended"),
  meatinessBefore: integer("meatiness_before").notNull(), // Percentage
  meatinessAfter: integer("meatiness_after").notNull(), // Percentage
  influence: integer("influence").notNull(), // Percentage
  notes: text("notes"),
  animalsSaved: integer("animals_saved").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Media Shared table
export const mediaShared = pgTable("media_shared", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  oneOffPieces: integer("one_off_pieces").default(0),
  postsPerMonth: integer("posts_per_month").default(0),
  estimatedReach: integer("estimated_reach").default(0),
  estimatedPersuasiveness: integer("estimated_persuasiveness").default(0),
  dateStarted: timestamp("date_started").notNull(),
  dateEnded: timestamp("date_ended"),
  description: text("description"),
  animalsSaved: integer("animals_saved").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Online Campaigns table
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  emails: integer("emails").default(0),
  socialMediaActions: integer("social_media_actions").default(0),
  letters: integer("letters").default(0),
  otherActions: integer("other_actions").default(0),
  totalActions: integer("total_actions").default(0),
  animalsSaved: integer("animals_saved").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true });

export const insertDonationSchema = createInsertSchema(donations)
  .omit({ id: true, createdAt: true });

// Form validation schema for donations
export const donationSchema = z.object({
  organization: z.string().min(1, "Organization name is required"),
  amount: z.number().positive("Amount must be positive"),
  donationType: z.string().min(1, "Donation type is required"),
  date: z.string().min(1, "Date is required"),
  isMonthly: z.boolean().default(false),
  dateStarted: z.string().nullable().optional(),
  dateEnded: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  userId: z.number().optional(),
  animalsSaved: z.number().optional(),
});

// Form validation schema for vegan conversions
export const veganConversionSchema = z.object({
  personName: z.string().optional(),
  dateStarted: z.string().min(1, "Start date is required"),
  dateEnded: z.string().nullable().optional(),
  meatinessBefore: z.number().min(0, "Must be between 0-100").max(100, "Must be between 0-100"),
  meatinessAfter: z.number().min(0, "Must be between 0-100").max(100, "Must be between 0-100"),
  influence: z.number().min(0, "Must be between 0-100").max(100, "Must be between 0-100"),
  notes: z.string().optional(),
  userId: z.number().optional(),
  animalsSaved: z.number().optional(),
});

export const insertVeganConversionSchema = createInsertSchema(veganConversions)
  .omit({ id: true, createdAt: true });

// Form validation schema for media shared
export const mediaSharedSchema = z.object({
  title: z.string().min(1, "Title is required"),
  oneOffPieces: z.number().min(0, "Must be a positive number"),
  postsPerMonth: z.number().min(0, "Must be a positive number"),
  estimatedReach: z.number().min(0, "Must be a positive number"),
  estimatedPersuasiveness: z.number().min(0, "Must be between 0-100").max(100, "Must be between 0-100"),
  dateStarted: z.string().min(1, "Start date is required"),
  dateEnded: z.string().nullable().optional(),
  description: z.string().optional(),
  userId: z.number().optional(),
  animalsSaved: z.number().optional(),
});

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
