import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"), // Optional for OAuth users
  name: text("name").notNull(),
  email: text("email").unique(),
  displayName: text("display_name"),
  profilePhoto: text("profile_photo"), // URL or path to uploaded image
  tags: text("tags").array().default([]), // Array of tags for grouping/leaderboards
  googleId: text("google_id").unique(), // For Google OAuth
  facebookId: text("facebook_id").unique(), // For Facebook OAuth
  authProvider: text("auth_provider").default("local"), // "local", "google", "facebook"
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

// Profile update schema
export const profileUpdateSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(50, "Display name must be under 50 characters"),
  tags: z.array(z.string().min(1).max(30)).max(10, "Maximum 10 tags allowed").optional(),
});

// Password change schema
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

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

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name"),
  email: text("email"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("bug"), // "bug", "suggestion", "question"
  status: text("status").notNull().default("pending"), // "pending", "sent", "acknowledged"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Store Products table - Sync with Printful catalog
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  printfulId: integer("printful_id").unique().notNull(), // Printful catalog product ID
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"), // Main product image URL
  category: text("category"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Product Variants table - Different sizes, colors, etc.
export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  printfulVariantId: integer("printful_variant_id").unique().notNull(), // Printful variant ID
  name: text("name").notNull(), // e.g., "Small - Black"
  size: text("size"),
  color: text("color"),
  colorCode: text("color_code"), // Hex color code
  price: doublePrecision("price").notNull(),
  currency: text("currency").notNull().default("USD"),
  image: text("image"), // Variant-specific image
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  printfulOrderId: integer("printful_order_id").unique(), // Printful order ID when submitted
  status: text("status").notNull().default("draft"), // "draft", "pending", "submitted", "processing", "shipped", "delivered", "cancelled"
  totalAmount: doublePrecision("total_amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  
  // Shipping information
  shippingName: text("shipping_name").notNull(),
  shippingEmail: text("shipping_email").notNull(),
  shippingPhone: text("shipping_phone"),
  shippingAddress1: text("shipping_address1").notNull(),
  shippingAddress2: text("shipping_address2"),
  shippingCity: text("shipping_city").notNull(),
  shippingState: text("shipping_state").notNull(),
  shippingCountry: text("shipping_country").notNull().default("US"),
  shippingZip: text("shipping_zip").notNull(),
  
  // Payment information
  paymentMethod: text("payment_method"), // "stripe", "paypal", etc.
  paymentId: text("payment_id"), // Payment processor transaction ID
  paidAt: timestamp("paid_at"),
  
  // Fulfillment information
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Order Items table - Individual products in an order
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  variantId: integer("variant_id").notNull().references(() => productVariants.id),
  quantity: integer("quantity").notNull(),
  price: doublePrecision("price").notNull(), // Price at time of order
  currency: text("currency").notNull().default("USD"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cart Items table - User shopping cart
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").notNull().references(() => productVariants.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCampaignSchema = createInsertSchema(campaigns)
  .omit({ id: true, created_at: true });

export const insertProBonoWorkSchema = createInsertSchema(proBonoWork)
  .omit({ id: true, createdAt: true });

export const insertFeedbackSchema = createInsertSchema(feedback)
  .omit({ id: true, createdAt: true });

export const insertProductSchema = createInsertSchema(products)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertProductVariantSchema = createInsertSchema(productVariants)
  .omit({ id: true, createdAt: true });

export const insertOrderSchema = createInsertSchema(orders)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertOrderItemSchema = createInsertSchema(orderItems)
  .omit({ id: true, createdAt: true });

export const insertCartItemSchema = createInsertSchema(cartItems)
  .omit({ id: true, createdAt: true, updatedAt: true });

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

// Form validation schema for feedback
export const feedbackSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  type: z.enum(["bug", "suggestion", "question"], {
    errorMap: () => ({ message: "Feedback type is required" })
  }).default("bug"),
  userId: z.number().optional(),
});

// Form validation schema for adding items to cart
export const addToCartSchema = z.object({
  productId: z.number().positive("Product ID is required"),
  variantId: z.number().positive("Product variant is required"),
  quantity: z.number().min(1, "Quantity must be at least 1").max(10, "Maximum 10 items per product"),
});

// Form validation schema for updating cart items
export const updateCartItemSchema = z.object({
  quantity: z.number().min(0, "Quantity cannot be negative").max(10, "Maximum 10 items per product"),
});

// Form validation schema for creating orders
export const createOrderSchema = z.object({
  shippingName: z.string().min(1, "Name is required"),
  shippingEmail: z.string().email("Valid email is required"),
  shippingPhone: z.string().optional(),
  shippingAddress1: z.string().min(1, "Address is required"),
  shippingAddress2: z.string().optional(),
  shippingCity: z.string().min(1, "City is required"),
  shippingState: z.string().min(2, "State is required"),
  shippingCountry: z.string().min(2, "Country is required").default("US"),
  shippingZip: z.string().min(5, "ZIP code is required"),
  notes: z.string().optional(),
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

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;
export type ProductVariant = typeof productVariants.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;

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
