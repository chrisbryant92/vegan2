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
  currency: text("currency").notNull().default('USD'), // GBP, EUR, USD, CAD, AUD, NZD
  organizationImpact: text("organization_impact").notNull().default('average'), // "Highest", "High", "Average", "Low"
  date: timestamp("date").notNull(), // Main date (for One-Off) or last donation date
  isMonthly: boolean("is_monthly").default(false), // Whether this is a monthly donation
  dateStarted: timestamp("date_started"), // When the monthly donation started
  dateEnded: timestamp("date_ended"), // When the monthly donation ended (if applicable)
  notes: text("notes"),
  animalsSaved: integer("animals_saved").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Vegan Conversions table
export const veganConversions = pgTable("vegan_conversions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  personName: text("person_name"),
  dateStarted: timestamp("date_started").notNull(),
  dateEnded: timestamp("date_ended"),
  dietBefore: text("diet_before").notNull(), // Diet type before conversion
  dietAfter: text("diet_after").notNull(), // Diet type after conversion
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
  interactions: integer("interactions").default(0), // Likes, Comments, Shares
  dateStarted: timestamp("date_started").notNull(),
  dateEnded: timestamp("date_ended"),
  description: text("description"),
  animalsSaved: integer("animals_saved").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Campaigns table
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  campaign_type: text("campaign_type"),
  organization: text("organization"),
  start_date: timestamp("start_date"),
  end_date: timestamp("end_date"),
  budget: integer("budget"),
  scope: text("scope"),
  people_reached: integer("people_reached"),
  people_recruited: integer("people_recruited"),
  emails: integer("emails").default(0),
  social_media_actions: integer("social_media_actions").default(0),
  letters: integer("letters").default(0),
  leaflets: integer("leaflets").default(0),
  rallies: integer("rallies").default(0),
  other_actions: integer("other_actions").default(0),
  total_actions: integer("total_actions").default(0),
  notes: text("notes"),
  animals_saved: integer("animals_saved").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  signed: boolean("signed").default(false),
  shared: boolean("shared").default(false),
  contacted: boolean("contacted").default(false),
  recruited: boolean("recruited").default(false),
  donated: boolean("donated").default(false),
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
  currency: z.enum(["GBP", "EUR", "USD", "CAD", "AUD", "NZD"], {
    errorMap: () => ({ message: "Currency is required" })
  }).default("USD"),
  organizationImpact: z.enum(["Highest", "High", "Average", "Low"], {
    errorMap: () => ({ message: "Organization impact is required" })
  }).default("Average"),
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
  dietBefore: z.enum(["meat-heavy", "omnivore", "flexitarian", "pescetarian", "vegetarian", "vegan"]),
  dietAfter: z.enum(["meat-heavy", "omnivore", "flexitarian", "pescetarian", "vegetarian", "vegan"]),
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
  interactions: z.number().min(0, "Must be a positive number"),
  dateStarted: z.string().min(1, "Start date is required"),
  dateEnded: z.string().nullable().optional(),
  description: z.string().optional(),
  userId: z.number().optional(),
  animalsSaved: z.number().optional(),
});

export const insertMediaSharedSchema = createInsertSchema(mediaShared)
  .omit({ id: true, createdAt: true });

// Pro Bono Work table
export const proBonoWork = pgTable("pro_bono_work", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  organization: text("organization").notNull(),
  role: text("role").notNull(),
  dateStarted: timestamp("date_started").notNull(),
  dateEnded: timestamp("date_ended"),
  hoursPerDay: doublePrecision("hours_per_day").notNull(),
  daysPerWeek: integer("days_per_week").notNull(),
  organizationImpact: text("organization_impact").notNull().default('average'), // "Highest", "High", "Average", "Low"
  hourlyValue: doublePrecision("hourly_value").notNull(), // $12 - $200
  rateType: text("rate_type").notNull().default('pro_bono'), // "pro_bono" or "reduced_rate"
  description: text("description"),
  animalsSaved: integer("animals_saved").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCampaignSchema = createInsertSchema(campaigns)
  .omit({ id: true, created_at: true });

export const insertProBonoWorkSchema = createInsertSchema(proBonoWork)
  .omit({ id: true, createdAt: true });

// Form validation schema for campaigns
export const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  emails: z.number().min(0, "Must be a positive number").default(0),
  socialMediaActions: z.number().min(0, "Must be a positive number").default(0),
  letters: z.number().min(0, "Must be a positive number").default(0),
  otherActions: z.number().min(0, "Must be a positive number").default(0),
  userId: z.number().optional(),
  totalActions: z.number().optional(),
  animalsSaved: z.number().optional(),
});

// Form validation schema for pro bono work
export const proBonoWorkSchema = z.object({
  organization: z.string().min(1, "Organization name is required"),
  role: z.string().min(1, "Role/position is required"),
  dateStarted: z.string().min(1, "Start date is required"),
  dateEnded: z.string().nullable().optional(),
  hoursPerDay: z.number().positive("Hours per day must be positive").max(24, "Cannot exceed 24 hours per day"),
  daysPerWeek: z.number().min(1, "Must be at least 1 day").max(7, "Cannot exceed 7 days per week"),
  organizationImpact: z.enum(["Highest", "High", "Average", "Low"], {
    errorMap: () => ({ message: "Organization impact is required" })
  }).default("Average"),
  hourlyValue: z.number().min(12, "Minimum hourly value is $12").max(200, "Maximum hourly value is $200"),
  rateType: z.enum(["pro_bono", "reduced_rate"], {
    errorMap: () => ({ message: "Rate type is required" })
  }).default("pro_bono"),
  description: z.string().optional(),
  userId: z.number().optional(),
  animalsSaved: z.number().optional(),
});

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

export type InsertProBonoWork = z.infer<typeof insertProBonoWorkSchema>;
export type ProBonoWork = typeof proBonoWork.$inferSelect;

// Extending schemas for additional validations
export const registerUserSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginUserSchema = z.object({
  username: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type LoginUser = z.infer<typeof loginUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
