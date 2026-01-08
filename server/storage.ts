import { db } from "./db";
import {
  settings, users, propertyManagers, companies, jobs, jobReports, invoices, cooperations,
  type InsertSettings, type InsertUser, type InsertPropertyManager, type InsertCompany,
  type InsertJob, type InsertJobReport, type InsertInvoice, type InsertCooperation,
  type User, type PropertyManager, type Company, type Job, type JobReport, type Invoice, type Cooperation
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Settings
  getSettings(): Promise<typeof settings.$inferSelect | undefined>;
  updateSettings(data: InsertSettings): Promise<typeof settings.$inferSelect>;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Property Managers
  getPropertyManagers(): Promise<PropertyManager[]>;
  getPropertyManager(id: number): Promise<PropertyManager | undefined>;
  createPropertyManager(pm: InsertPropertyManager): Promise<PropertyManager>;
  updatePropertyManager(id: number, pm: Partial<InsertPropertyManager>): Promise<PropertyManager>;
  deletePropertyManager(id: number): Promise<void>;

  // Companies
  getCompanies(): Promise<Company[]>;
  getCompany(id: number): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company>;
  deleteCompany(id: number): Promise<void>;

  // Cooperations
  getCooperations(): Promise<Cooperation[]>;
  toggleCooperation(coop: InsertCooperation): Promise<void>;

  // Jobs
  getJobs(): Promise<(Job & { company: Company | null, propertyManager: PropertyManager | null })[]>;
  getJob(id: number): Promise<(Job & { report?: JobReport }) | undefined>;
  getJobForPdf(id: number): Promise<(Job & { company: Company | null, propertyManager: PropertyManager | null, report: JobReport | null }) | undefined>;
  createJob(job: InsertJob & { jobNumber: string }): Promise<Job>;
  updateJob(id: number, job: Partial<InsertJob>): Promise<Job>;
  
  // Job Reports
  createOrUpdateJobReport(report: InsertJobReport & { jobId: number }): Promise<JobReport>;

  // Invoices
  getInvoices(): Promise<(Invoice & { company: Company | null })[]>;
  createInvoice(invoice: InsertInvoice & { invoiceNumber: string, date: Date, status: string }): Promise<Invoice>;
  getInvoiceForPdf(id: number): Promise<(Invoice & { company: Company | null, jobs: (Job & { propertyManager: PropertyManager | null })[] }) | undefined>;
  getJobsForMonth(monthYear: string): Promise<Job[]>;
  updateInvoiceStatus(id: number, status: string, paidAt?: Date): Promise<Invoice>;
  linkJobToInvoice(jobId: number, invoiceId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getSettings() {
    const [s] = await db.select().from(settings).limit(1);
    return s;
  }
  
  async updateSettings(data: InsertSettings) {
    const [existing] = await db.select().from(settings).limit(1);
    if (existing) {
      const [updated] = await db.update(settings).set(data).where(eq(settings.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(settings).values(data).returning();
      return created;
    }
  }

  // Users
  async getUser(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username: string) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(insertUser: InsertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Property Managers
  async getPropertyManagers() {
    return db.select().from(propertyManagers).orderBy(desc(propertyManagers.createdAt));
  }
  async getPropertyManager(id: number) {
    const [pm] = await db.select().from(propertyManagers).where(eq(propertyManagers.id, id));
    return pm;
  }
  async createPropertyManager(pm: InsertPropertyManager) {
    const [newPm] = await db.insert(propertyManagers).values(pm).returning();
    return newPm;
  }
  async updatePropertyManager(id: number, pm: Partial<InsertPropertyManager>) {
    const [updated] = await db.update(propertyManagers).set(pm).where(eq(propertyManagers.id, id)).returning();
    return updated;
  }
  async deletePropertyManager(id: number) {
    await db.delete(propertyManagers).where(eq(propertyManagers.id, id));
  }

  // Companies
  async getCompanies() {
    return db.select().from(companies).orderBy(desc(companies.createdAt));
  }
  async getCompany(id: number) {
    const [c] = await db.select().from(companies).where(eq(companies.id, id));
    return c;
  }
  async createCompany(c: InsertCompany) {
    const [newC] = await db.insert(companies).values(c).returning();
    return newC;
  }
  async updateCompany(id: number, c: Partial<InsertCompany>) {
    const [updated] = await db.update(companies).set(c).where(eq(companies.id, id)).returning();
    return updated;
  }
  async deleteCompany(id: number) {
    await db.delete(companies).where(eq(companies.id, id));
  }

  // Cooperations
  async getCooperations() {
    return db.select().from(cooperations);
  }
  async toggleCooperation(coop: InsertCooperation) {
    const [existing] = await db.select().from(cooperations).where(
      and(
        eq(cooperations.companyId, coop.companyId), 
        eq(cooperations.propertyManagerId, coop.propertyManagerId)
      )
    );
    if (existing) {
      await db.delete(cooperations).where(eq(cooperations.id, existing.id));
    } else {
      await db.insert(cooperations).values(coop);
    }
  }

  // Jobs
  async getJobs() {
    return db.query.jobs.findMany({
      with: {
        company: true,
        propertyManager: true
      },
      orderBy: desc(jobs.createdAt)
    });
  }
  async getJob(id: number) {
    return db.query.jobs.findFirst({
      where: eq(jobs.id, id),
      with: {
        report: true
      }
    });
  }

  async getJobForPdf(id: number) {
    return db.query.jobs.findFirst({
      where: eq(jobs.id, id),
      with: {
        company: true,
        propertyManager: true,
        report: true,
      },
    });
  }
  async createJob(job: InsertJob & { jobNumber: string }) {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }
  async updateJob(id: number, job: Partial<InsertJob>) {
    const [updated] = await db.update(jobs).set(job).where(eq(jobs.id, id)).returning();
    return updated;
  }

  // Job Reports
  async createOrUpdateJobReport(report: InsertJobReport & { jobId: number }) {
    const [existing] = await db.select().from(jobReports).where(eq(jobReports.jobId, report.jobId));
    if (existing) {
      const [updated] = await db.update(jobReports).set(report).where(eq(jobReports.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(jobReports).values(report).returning();
      return created;
    }
  }

  // Invoices
  async getInvoices() {
    return db.query.invoices.findMany({
      with: { company: true },
      orderBy: desc(invoices.date)
    });
  }
  async createInvoice(invoice: InsertInvoice & { invoiceNumber: string, date: Date, status: string }) {
    const [newInv] = await db.insert(invoices).values(invoice).returning();
    return newInv;
  }

  async getInvoiceForPdf(id: number) {
    return db.query.invoices.findFirst({
      where: eq(invoices.id, id),
      with: {
        company: true,
        jobs: {
          with: {
            propertyManager: true,
          },
        },
      },
    });
  }
  async getJobsForMonth(monthYear: string) {
    // Basic string matching for monthYear "YYYY-MM" in createdAt timestamp
    // Ideally use proper date filtering
    return db.select().from(jobs).where(
      sql`TO_CHAR(${jobs.createdAt}, 'YYYY-MM') = ${monthYear}`
    );
  }
  async updateInvoiceStatus(id: number, status: string, paidAt?: Date) {
     const [updated] = await db.update(invoices).set({ status, paidAt }).where(eq(invoices.id, id)).returning();
     return updated;
  }
  async linkJobToInvoice(jobId: number, invoiceId: number) {
    await db.update(jobs).set({ invoiceId }).where(eq(jobs.id, jobId));
  }
}

export const storage = new DatabaseStorage();
