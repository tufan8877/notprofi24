import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === SETTINGS ===
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull().default("Notprofi24.at"),
  address: text("address").notNull().default("Heiligenstädterstraße 152/6, 1190 Wien"),
  email: text("email").notNull().default("office@notprofi24.at"),
  website: text("website").notNull().default("www.notprofi24.at"),
  nextInvoiceNumber: integer("next_invoice_number").notNull().default(1),
});

// === USERS (Replit Auth + Roles) ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // Will be unused for Replit Auth but kept for schema compat
  role: text("role").notNull().default("admin"), // 'admin' only for now
});

// === PROPERTY MANAGERS (Hausverwaltungen) ===
export const propertyManagers = pgTable("property_managers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  email: text("email"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === COMPANIES (Firmen/Notdienst-Partner) ===
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  address: text("address").notNull(),
  phone: text("phone"),
  email: text("email"),
  tags: text("tags").array(), // e.g. ["Installateur", "Elektriker"]
  vatId: text("vat_id"),
  paymentTermsDays: integer("payment_terms_days").default(14),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// === COOPERATIONS (Many-to-Many) ===
export const cooperations = pgTable("cooperations", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  propertyManagerId: integer("property_manager_id").references(() => propertyManagers.id),
});

// === JOBS (Vermittlungsaufträge) ===
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  jobNumber: text("job_number").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  propertyManagerId: integer("property_manager_id").references(() => propertyManagers.id),
  companyId: integer("company_id").references(() => companies.id),
  locationAddress: text("location_address").notNull(),
  trade: text("trade").notNull(), // Gewerk
  description: text("description"),
  status: text("status").notNull().default("open"), // open, done, cancelled
  referralFee: numeric("referral_fee").notNull().default("0"),
  internalNotes: text("internal_notes"),
  invoiceId: integer("invoice_id"), // Link to invoice when billed
});

// === JOB REPORTS (Einsatzprotokolle) ===
export const jobReports = pgTable("job_reports", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id),
  steps: text("steps"),
  times: text("times"),
  material: text("material"),
  result: text("result"),
  photosUrl: text("photos_url"), // Just a string/URL for now
});

// === INVOICES (Monatsrechnungen) ===
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  date: timestamp("date").defaultNow(),
  monthYear: text("month_year").notNull(), // e.g. "2024-01"
  companyId: integer("company_id").references(() => companies.id),
  totalAmount: numeric("total_amount").notNull(),
  status: text("status").notNull().default("created"), // created, sent, paid
  paidAt: timestamp("paid_at"),
});

// === RELATIONS ===
export const propertyManagersRelations = relations(propertyManagers, ({ many }) => ({
  cooperations: many(cooperations),
  jobs: many(jobs),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  cooperations: many(cooperations),
  jobs: many(jobs),
  invoices: many(invoices),
}));

export const cooperationsRelations = relations(cooperations, ({ one }) => ({
  company: one(companies, {
    fields: [cooperations.companyId],
    references: [companies.id],
  }),
  propertyManager: one(propertyManagers, {
    fields: [cooperations.propertyManagerId],
    references: [propertyManagers.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  propertyManager: one(propertyManagers, {
    fields: [jobs.propertyManagerId],
    references: [propertyManagers.id],
  }),
  company: one(companies, {
    fields: [jobs.companyId],
    references: [companies.id],
  }),
  invoice: one(invoices, {
    fields: [jobs.invoiceId],
    references: [invoices.id],
  }),
  report: one(jobReports, { // Changed from many to one based on requirements "optional ein ausführliches Protokoll" usually implies 1:1 or 0:1
    fields: [jobs.id],
    references: [jobReports.jobId],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  company: one(companies, {
    fields: [invoices.companyId],
    references: [companies.id],
  }),
  jobs: many(jobs),
}));


// === INSERT SCHEMAS ===
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertPropertyManagerSchema = createInsertSchema(propertyManagers).omit({ id: true, createdAt: true });
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true });
export const insertCooperationSchema = createInsertSchema(cooperations).omit({ id: true });
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true, invoiceId: true, jobNumber: true }); // jobNumber generated backend
export const insertJobReportSchema = createInsertSchema(jobReports).omit({ id: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, date: true, status: true, paidAt: true, invoiceNumber: true }); // automated

// === TYPES ===
export type Settings = typeof settings.$inferSelect;
export type User = typeof users.$inferSelect;
export type PropertyManager = typeof propertyManagers.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Cooperation = typeof cooperations.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type JobReport = typeof jobReports.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPropertyManager = z.infer<typeof insertPropertyManagerSchema>;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertCooperation = z.infer<typeof insertCooperationSchema>;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type InsertJobReport = z.infer<typeof insertJobReportSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

// Request Types
export type UpdateJobStatusRequest = { status: string };
export type PayInvoiceRequest = { paidAt: string }; // ISO Date string
