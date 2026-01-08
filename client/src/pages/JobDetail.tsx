import { useJob, useUpdateJob, useSaveReport } from "@/hooks/use-jobs";
import { Button, Card, Input, Label, Badge } from "@/components/ui-components";
import { ArrowLeft, Printer, Save, CheckCircle2, Clock, AlertTriangle, FileText } from "lucide-react";
import { useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertJobReportSchema } from "@shared/schema";
import { z } from "zod";
import { useEffect } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

type ReportData = z.infer<typeof insertJobReportSchema>;

export default function JobDetail() {
  const [match, params] = useRoute("/jobs/:id");
  const id = parseInt(params?.id || "0");
  const { data: job, isLoading } = useJob(id);
  const { mutate: updateStatus } = useUpdateJob();
  const { mutate: saveReport, isPending: isSavingReport } = useSaveReport();

  const { register, handleSubmit, reset } = useForm<ReportData>({
    resolver: zodResolver(insertJobReportSchema.omit({ jobId: true })),
  });

  useEffect(() => {
    if (job?.report) {
      // TypeScript gymnastics to omit jobId from report for reset
      const { jobId, id, ...reportData } = job.report; 
      reset(reportData);
    }
  }, [job, reset]);

  if (isLoading) return <div className="p-8 text-center">Laden...</div>;
  if (!job) return <div className="p-8 text-center text-red-500">Auftrag nicht gefunden.</div>;

  const handleStatusChange = (newStatus: string) => {
    updateStatus({ id, status: newStatus });
  };

  const onReportSubmit = (data: any) => {
    saveReport({ jobId: id, ...data });
  };

  const handlePrint = () => {
    window.open(`/api/jobs/${id}/pdf`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" className="rounded-full w-10 h-10 p-0" onClick={() => window.history.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
             <h1 className="text-3xl font-bold text-slate-900">{job.jobNumber}</h1>
             <Badge variant={job.status === 'done' ? 'success' : job.status === 'cancelled' ? 'destructive' : 'warning'}>
               {job.status === 'open' ? 'Offen' : job.status === 'done' ? 'Erledigt' : 'Storniert'}
             </Badge>
          </div>
          <p className="text-slate-500">
             Erstellt am {format(new Date(job.createdAt || new Date()), "dd. MMMM yyyy, HH:mm", { locale: de })}
          </p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={handlePrint}>
             <Printer className="w-4 h-4 mr-2" /> PDF Export
           </Button>
           {job.status === 'open' && (
             <Button onClick={() => handleStatusChange('done')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
               <CheckCircle2 className="w-4 h-4 mr-2" /> Als Erledigt markieren
             </Button>
           )}
           {job.status === 'done' && (
             <Button variant="outline" onClick={() => handleStatusChange('open')}>
               Wieder öffnen
             </Button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
           <Card>
             <h3 className="text-lg font-bold mb-4 border-b pb-2">Auftragsdetails</h3>
             <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
               <div>
                 <dt className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Standort</dt>
                 <dd className="mt-1 text-base font-medium">{job.locationAddress}</dd>
               </div>
               <div>
                 <dt className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Gewerk</dt>
                 <dd className="mt-1 text-base font-medium">{job.trade}</dd>
               </div>
               <div className="sm:col-span-2">
                 <dt className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Beschreibung</dt>
                 <dd className="mt-1 text-base text-slate-700 whitespace-pre-wrap">{job.description || "-"}</dd>
               </div>
             </dl>
           </Card>

           <Card>
             <h3 className="text-lg font-bold mb-4 border-b pb-2 flex items-center gap-2">
               <FileText className="w-5 h-5 text-primary" />
               Einsatzprotokoll
             </h3>
             <form onSubmit={handleSubmit(onReportSubmit)} className="space-y-4">
                <div>
                   <Label htmlFor="steps">Durchgeführte Arbeiten</Label>
                   <textarea 
                     id="steps"
                     className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px]"
                     placeholder="Schritte beschreiben..."
                     {...register("steps")}
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="times">Zeiten</Label>
                    <Input id="times" placeholder="z.B. 14:00 - 15:30" {...register("times")} />
                  </div>
                  <div>
                    <Label htmlFor="material">Material</Label>
                    <Input id="material" placeholder="Verwendetes Material" {...register("material")} />
                  </div>
                </div>
                <div>
                   <Label htmlFor="result">Ergebnis / Status</Label>
                   <Input id="result" placeholder="Heizung läuft wieder..." {...register("result")} />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" isLoading={isSavingReport}>
                    <Save className="w-4 h-4 mr-2" /> Protokoll speichern
                  </Button>
                </div>
             </form>
           </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
           <Card>
             <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-4">Beteiligte</h3>
             <div className="space-y-6">
               <div>
                 <p className="text-xs font-medium text-slate-500 mb-1">Hausverwaltung</p>
                 <div className="font-medium text-slate-900">{job.propertyManager?.name}</div>
                 <div className="text-xs text-slate-500 mt-0.5">{job.propertyManager?.phone}</div>
               </div>
               <div>
                 <p className="text-xs font-medium text-slate-500 mb-1">Ausführende Firma</p>
                 <div className="font-medium text-blue-600">{job.company?.name}</div>
                 <div className="text-xs text-slate-500 mt-0.5">{job.company?.phone}</div>
               </div>
             </div>
           </Card>

           <Card className="bg-slate-50 border-none shadow-inner">
             <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-4">Intern</h3>
             <div>
               <p className="text-xs font-medium text-slate-500 mb-1">Vermittlungsprovision</p>
               <div className="text-xl font-bold text-slate-900">€ {parseFloat(job.referralFee || "0").toFixed(2)}</div>
             </div>
             {job.internalNotes && (
               <div className="mt-4 pt-4 border-t border-slate-200">
                 <p className="text-xs font-medium text-slate-500 mb-1">Notizen</p>
                 <p className="text-sm text-slate-600 italic">{job.internalNotes}</p>
               </div>
             )}
           </Card>
        </div>
      </div>
    </div>
  );
}
