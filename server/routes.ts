import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { buildPdf, type PdfLine } from "./simplePdf";

function money(v: unknown): string {
  const n = Number(v || 0);
  return `€ ${n.toFixed(2)}`;
}

function safeDate(d: any): Date {
  try {
    return d ? new Date(d) : new Date();
  } catch {
    return new Date();
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Health check (useful on Render)
  app.get("/api/health", async (_req, res) => {
    try {
      // simple DB touch
      await storage.getSettings();
      res.json({ ok: true, db: true });
    } catch (e) {
      res.status(200).json({ ok: true, db: false });
    }
  });

  // === PDF EXPORTS ===
  app.get("/api/jobs/:id/pdf", async (req, res) => {
    const id = Number(req.params.id);
    const job = await storage.getJobForPdf(id);
    if (!job) return res.status(404).json({ message: "Not Found" });

    const s = await storage.getSettings();
    const createdAt = safeDate(job.createdAt);

    const lines: PdfLine[] = [];
    let y = 800;
    const xL = 50;

    lines.push({ text: s?.companyName || "Notprofi24.at", x: xL, y, size: 18 });
    y -= 18;
    lines.push({ text: s?.address || "", x: xL, y, size: 10 });
    y -= 12;
    lines.push({ text: `${s?.email || ""}  |  ${s?.website || ""}`.trim(), x: xL, y, size: 10 });
    y -= 24;

    lines.push({ text: "Auftragsblatt / Einsatzprotokoll", x: xL, y, size: 14 });
    y -= 18;
    lines.push({ text: `Auftragsnummer: ${job.jobNumber}`, x: xL, y, size: 11 });
    y -= 14;
    lines.push({ text: `Erstellt: ${createdAt.toLocaleString("de-AT")}`, x: xL, y, size: 11 });
    y -= 20;

    lines.push({ text: `Hausverwaltung: ${job.propertyManager?.name || "-"}`, x: xL, y });
    y -= 14;
    lines.push({ text: `HV Adresse: ${job.propertyManager?.address || "-"}`, x: xL, y });
    y -= 14;
    lines.push({ text: `HV Kontakt: ${(job.propertyManager?.phone || "").trim()} ${(job.propertyManager?.email || "").trim()}`.trim() || "-", x: xL, y });
    y -= 20;

    lines.push({ text: `Firma: ${job.company?.name || "-"}`, x: xL, y });
    y -= 14;
    lines.push({ text: `Firma Adresse: ${job.company?.address || "-"}`, x: xL, y });
    y -= 14;
    lines.push({ text: `Firma Kontakt: ${(job.company?.phone || "").trim()} ${(job.company?.email || "").trim()}`.trim() || "-", x: xL, y });
    y -= 20;

    lines.push({ text: `Einsatzort: ${job.locationAddress}`, x: xL, y });
    y -= 14;
    lines.push({ text: `Gewerk: ${job.trade}`, x: xL, y });
    y -= 14;
    lines.push({ text: `Status: ${job.status}`, x: xL, y });
    y -= 14;
    lines.push({ text: `Vermittlungsgebühr: ${money(job.referralFee)}`, x: xL, y });
    y -= 18;

    lines.push({ text: "Beschreibung:", x: xL, y, size: 11 });
    y -= 14;
    const desc = (job.description || "-").split("\n");
    for (const row of desc) {
      lines.push({ text: row, x: xL, y });
      y -= 12;
    }
    y -= 10;

    if (job.report) {
      lines.push({ text: "Einsatzprotokoll:", x: xL, y, size: 11 });
      y -= 14;

      const sections: Array<[string, string | null | undefined]> = [
        ["Arbeiten", job.report.steps],
        ["Zeiten", job.report.times],
        ["Material", job.report.material],
        ["Ergebnis", job.report.result],
      ];
      for (const [title, text] of sections) {
        if (!text) continue;
        lines.push({ text: `${title}:`, x: xL, y });
        y -= 12;
        for (const row of String(text).split("\n")) {
          lines.push({ text: row, x: xL + 12, y });
          y -= 12;
        }
        y -= 8;
      }
    }

    const pdf = buildPdf(lines);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${job.jobNumber}.pdf"`);
    res.send(pdf);
  });

  app.get("/api/invoices/:id/pdf", async (req, res) => {
    const id = Number(req.params.id);
    const inv = await storage.getInvoiceForPdf(id);
    if (!inv) return res.status(404).json({ message: "Not Found" });

    const s = await storage.getSettings();
    const invDate = safeDate(inv.date);
    const company = inv.company;

    const lines: PdfLine[] = [];
    let y = 800;
    const xL = 50;

    lines.push({ text: s?.companyName || "Notprofi24.at", x: xL, y, size: 18 });
    y -= 18;
    lines.push({ text: s?.address || "", x: xL, y, size: 10 });
    y -= 12;
    lines.push({ text: `${s?.email || ""}  |  ${s?.website || ""}`.trim(), x: xL, y, size: 10 });
    y -= 26;

    lines.push({ text: "RECHNUNG", x: xL, y, size: 16 });
    y -= 18;
    lines.push({ text: `Rechnungsnummer: ${inv.invoiceNumber}`, x: xL, y });
    y -= 14;
    lines.push({ text: `Rechnungsdatum: ${invDate.toLocaleDateString("de-AT")}`, x: xL, y });
    y -= 14;
    lines.push({ text: `Leistungszeitraum: ${inv.monthYear}`, x: xL, y });
    y -= 22;

    lines.push({ text: "Rechnung an:", x: xL, y, size: 11 });
    y -= 14;
    lines.push({ text: company?.name || "-", x: xL, y });
    y -= 12;
    lines.push({ text: company?.address || "-", x: xL, y });
    y -= 12;
    lines.push({ text: (company?.email || "").trim(), x: xL, y });
    y -= 22;

    lines.push({ text: "Vermittelte Aufträge:", x: xL, y, size: 11 });
    y -= 16;
    lines.push({ text: "Nr. | Datum | Hausverwaltung | Adresse | Gewerk | Gebühr", x: xL, y, size: 9 });
    y -= 12;

    let idx = 1;
    for (const job of inv.jobs || []) {
      const d = safeDate(job.createdAt).toLocaleDateString("de-AT");
      const hv = (job as any).propertyManager?.name || "-";
      const addr = (job as any).propertyManager?.address || "-";
      const line = `${idx}. ${job.jobNumber} | ${d} | ${hv} | ${addr} | ${job.trade} | ${money(job.referralFee)}`;
      lines.push({ text: line, x: xL, y, size: 9 });
      y -= 12;
      idx++;
      if (y < 80) {
        // Basic safeguard: stop writing if it overflows.
        lines.push({ text: "... (weitere Positionen gekürzt)", x: xL, y, size: 9 });
        y -= 12;
        break;
      }
    }

    y -= 10;
    lines.push({ text: `Gesamtsumme: ${money(inv.totalAmount)}`, x: xL, y, size: 12 });
    y -= 18;
    const terms = company?.paymentTermsDays ?? 14;
    lines.push({ text: `Zahlungsziel: ${terms} Tage`, x: xL, y, size: 10 });
    y -= 14;
    lines.push({ text: "Hinweis: Diese Rechnung dient als Zahlungserinnerung für die vermittelten Notdienste.", x: xL, y, size: 10 });

    const pdf = buildPdf(lines);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${inv.invoiceNumber}.pdf"`);
    res.send(pdf);
  });
  
  // === SETTINGS ===
  app.get(api.settings.get.path, async (req, res) => {
    let s = await storage.getSettings();
    if (!s) {
      // Seed default
      s = await storage.updateSettings({ 
        companyName: "Notprofi24.at", 
        address: "Heiligenstädterstraße 152/6, 1190 Wien",
        email: "office@notprofi24.at",
        website: "www.notprofi24.at",
        nextInvoiceNumber: 1
      });
    }
    res.json(s);
  });
  
  app.post(api.settings.update.path, async (req, res) => {
    const s = await storage.updateSettings(req.body);
    res.json(s);
  });

  // === PROPERTY MANAGERS ===
  app.get(api.propertyManagers.list.path, async (req, res) => {
    const list = await storage.getPropertyManagers();
    res.json(list);
  });
  
  app.get(api.propertyManagers.get.path, async (req, res) => {
    const item = await storage.getPropertyManager(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Not Found" });
    res.json(item);
  });
  
  app.post(api.propertyManagers.create.path, async (req, res) => {
    const item = await storage.createPropertyManager(req.body);
    res.status(201).json(item);
  });

  app.put(api.propertyManagers.update.path, async (req, res) => {
    const item = await storage.updatePropertyManager(Number(req.params.id), req.body);
    res.json(item);
  });
  
  app.delete(api.propertyManagers.delete.path, async (req, res) => {
    await storage.deletePropertyManager(Number(req.params.id));
    res.status(204).send();
  });

  // === COMPANIES ===
  app.get(api.companies.list.path, async (req, res) => {
    const list = await storage.getCompanies();
    res.json(list);
  });

  app.get(api.companies.get.path, async (req, res) => {
    const item = await storage.getCompany(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Not Found" });
    res.json(item);
  });

  app.post(api.companies.create.path, async (req, res) => {
    const item = await storage.createCompany(req.body);
    res.status(201).json(item);
  });

  app.put(api.companies.update.path, async (req, res) => {
    const item = await storage.updateCompany(Number(req.params.id), req.body);
    res.json(item);
  });

  app.delete(api.companies.delete.path, async (req, res) => {
    await storage.deleteCompany(Number(req.params.id));
    res.status(204).send();
  });

  // === COOPERATIONS ===
  app.get(api.cooperations.list.path, async (req, res) => {
    const list = await storage.getCooperations();
    res.json(list);
  });

  app.post(api.cooperations.toggle.path, async (req, res) => {
    await storage.toggleCooperation(req.body);
    res.json({ success: true });
  });

  // === JOBS ===
  app.get(api.jobs.list.path, async (req, res) => {
    const list = await storage.getJobs();
    res.json(list);
  });

  app.get(api.jobs.get.path, async (req, res) => {
    const item = await storage.getJob(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Not Found" });
    res.json(item);
  });

  app.post(api.jobs.create.path, async (req, res) => {
    // Generate unique job number: "NP24-timestamp-random" or similar
    const jobNumber = `NP24-${Date.now().toString().slice(-6)}`;
    const item = await storage.createJob({ ...req.body, jobNumber });
    res.status(201).json(item);
  });

  app.put(api.jobs.update.path, async (req, res) => {
    const item = await storage.updateJob(Number(req.params.id), req.body);
    res.json(item);
  });

  // === REPORTS ===
  app.post(api.reports.createOrUpdate.path, async (req, res) => {
    const jobId = Number(req.params.jobId);
    const item = await storage.createOrUpdateJobReport({ ...req.body, jobId });
    res.json(item);
  });

  // === INVOICES ===
  app.get(api.invoices.list.path, async (req, res) => {
    const list = await storage.getInvoices();
    res.json(list);
  });

  app.post(api.invoices.generate.path, async (req, res) => {
    const { monthYear } = req.body; // "2024-01"
    
    // 1. Get all jobs for this month
    const allJobs = await storage.getJobsForMonth(monthYear);
    const openJobs = allJobs.filter(j => !j.invoiceId && j.status === 'done');
    
    // 2. Group by company
    const jobsByCompany: Record<number, typeof openJobs> = {};
    for (const job of openJobs) {
      if (!job.companyId) continue;
      if (!jobsByCompany[job.companyId]) jobsByCompany[job.companyId] = [];
      jobsByCompany[job.companyId].push(job);
    }
    
    // 3. Create invoice for each company
    const generatedInvoices = [];
    for (const [companyIdStr, companyJobs] of Object.entries(jobsByCompany)) {
      const companyId = Number(companyIdStr);
      const totalAmount = companyJobs.reduce((sum, j) => sum + Number(j.referralFee || 0), 0);
      
      if (totalAmount === 0) continue;

      const settings = await storage.getSettings();
      const nextNum = settings?.nextInvoiceNumber || 1;
      const invoiceNumber = `RE-${monthYear.replace('-', '')}-${String(nextNum).padStart(4, '0')}`;
      
      // Update settings for next invoice number
      if (settings) {
        await storage.updateSettings({ ...settings, nextInvoiceNumber: nextNum + 1 });
      }

      const invoice = await storage.createInvoice({
        monthYear,
        companyId,
        totalAmount: totalAmount.toString(),
        invoiceNumber,
        date: new Date(),
        status: 'created'
      });

      // Link jobs
      for (const job of companyJobs) {
        await storage.linkJobToInvoice(job.id, invoice.id);
      }
      
      generatedInvoices.push(invoice);
    }

    res.status(201).json(generatedInvoices);
  });
  
  app.patch(api.invoices.markPaid.path, async (req, res) => {
    const { paidAt } = req.body;
    const item = await storage.updateInvoiceStatus(Number(req.params.id), 'paid', new Date(paidAt));
    res.json(item);
  });

  // === SEED DATA (DEV only) ===
  if (process.env.NODE_ENV !== "production" && process.env.SEED_DATA === "true") {
    await seedData();
  }

  return httpServer;
}

async function seedData() {
  const pms = await storage.getPropertyManagers();
  if (pms.length === 0) {
    const pm1 = await storage.createPropertyManager({ name: "HV Müller", address: "Hauptstr 1, Wien", email: "mueller@hv.at", phone: "0123456" });
    const pm2 = await storage.createPropertyManager({ name: "ImmoWest", address: "Westbahnstr 5, Wien", email: "office@immowest.at", phone: "0987654" });
    
    const c1 = await storage.createCompany({ name: "RohrMax", address: "Gasgasse 10", tags: ["Installateur"], email: "info@rohrmax.at" });
    const c2 = await storage.createCompany({ name: "Elektro Blitz", address: "Stromstr 2", tags: ["Elektriker"], email: "blitz@elektro.at" });

    // Link
    await storage.toggleCooperation({ companyId: c1.id, propertyManagerId: pm1.id });
    await storage.toggleCooperation({ companyId: c2.id, propertyManagerId: pm2.id });
    
    // Job
    await storage.createJob({ 
      jobNumber: "NP24-TEST-001", 
      propertyManagerId: pm1.id, 
      companyId: c1.id, 
      locationAddress: "Testgasse 5, Top 10", 
      trade: "Installateur", 
      status: "done", 
      referralFee: "50"
    });
  }
}
