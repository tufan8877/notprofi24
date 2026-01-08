import { useJobs, useCreateJob, useUpdateJob } from "@/hooks/use-jobs";
import { usePropertyManagers } from "@/hooks/use-property-managers";
import { useCompanies } from "@/hooks/use-companies";
import { Button, Card, Input, Label, Dialog, Badge } from "@/components/ui-components";
import { Plus, Search, FileText, ChevronRight, Filter } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertJobSchema } from "@shared/schema";
import { z } from "zod";
import { Link } from "wouter";
import { format } from "date-fns";
import { de } from "date-fns/locale";

type FormData = z.infer<typeof insertJobSchema>;

export default function Jobs() {
  const { data: jobs, isLoading } = useJobs();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filter logic
  const filtered = jobs?.filter(j => 
    j.jobNumber.toLowerCase().includes(search.toLowerCase()) || 
    j.locationAddress.toLowerCase().includes(search.toLowerCase()) ||
    j.company?.name.toLowerCase().includes(search.toLowerCase()) ||
    j.propertyManager?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Vermittlungsaufträge</h1>
          <p className="text-slate-500">Alle Aufträge im Überblick.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Neuer Auftrag
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border bg-slate-50/50 flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Suchen nach Nr, Adresse, Firma..." 
              className="pl-9 bg-white" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="bg-white">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-border">
              <tr>
                <th className="px-6 py-3">Auftrag</th>
                <th className="px-6 py-3">Standort / Gewerk</th>
                <th className="px-6 py-3">Partner</th>
                <th className="px-6 py-3 text-right">Provision</th>
                <th className="px-6 py-3 text-right">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Laden...</td></tr>
              ) : filtered?.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Keine Aufträge gefunden.</td></tr>
              ) : (
                filtered?.map(job => (
                  <tr key={job.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => window.location.href=`/jobs/${job.id}`}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{job.jobNumber}</div>
                      <div className="text-xs text-slate-400">
                        {format(new Date(job.createdAt || new Date()), "dd. MMM yyyy", { locale: de })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900">{job.locationAddress}</div>
                      <Badge variant="outline" className="mt-1">{job.trade}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                          {job.propertyManager?.name || "-"}
                        </span>
                        <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit flex items-center gap-1">
                          → {job.company?.name || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      € {parseFloat(job.referralFee || "0").toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                       <Link href={`/jobs/${job.id}`} className="inline-flex items-center text-slate-400 hover:text-primary transition-colors">
                         <ChevronRight className="w-5 h-5" />
                       </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <JobDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, any> = {
    open: { variant: "warning", label: "Offen" },
    done: { variant: "success", label: "Erledigt" },
    cancelled: { variant: "destructive", label: "Storniert" },
  };
  const config = map[status] || { variant: "outline", label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function JobDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { mutate, isPending } = useCreateJob();
  const { data: managers } = usePropertyManagers();
  const { data: companies } = useCompanies();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(insertJobSchema),
  });

  const onSubmit = (data: FormData) => {
    mutate(data, { 
      onSuccess: () => {
        reset();
        onClose();
      }
    });
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Neuer Vermittlungsauftrag" maxWidth="max-w-3xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="propertyManagerId">Hausverwaltung</Label>
            <select 
              id="propertyManagerId" 
              {...register("propertyManagerId", { valueAsNumber: true })}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Bitte wählen...</option>
              {managers?.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            {errors.propertyManagerId && <p className="text-xs text-red-500 mt-1">Pflichtfeld</p>}
          </div>

          <div>
            <Label htmlFor="companyId">Beauftragte Firma</Label>
            <select 
              id="companyId" 
              {...register("companyId", { valueAsNumber: true })}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Bitte wählen...</option>
              {companies?.filter(c => c.isActive).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.companyId && <p className="text-xs text-red-500 mt-1">Pflichtfeld</p>}
          </div>

          <div className="col-span-2">
            <Label htmlFor="locationAddress">Einsatzort Adresse</Label>
            <Input id="locationAddress" {...register("locationAddress")} className={errors.locationAddress ? "border-red-500" : ""} />
            {errors.locationAddress && <p className="text-xs text-red-500 mt-1">{errors.locationAddress.message}</p>}
          </div>

          <div>
            <Label htmlFor="trade">Gewerk</Label>
            <Input id="trade" placeholder="z.B. Elektriker" {...register("trade")} className={errors.trade ? "border-red-500" : ""} />
            {errors.trade && <p className="text-xs text-red-500 mt-1">{errors.trade.message}</p>}
          </div>

          <div>
            <Label htmlFor="referralFee">Provision (€)</Label>
            <Input id="referralFee" type="number" step="0.01" {...register("referralFee")} />
          </div>

          <div className="col-span-2">
            <Label htmlFor="description">Beschreibung</Label>
            <textarea 
              className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
              {...register("description")}
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="internalNotes">Interne Notizen</Label>
            <Input id="internalNotes" {...register("internalNotes")} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button type="submit" isLoading={isPending}>Auftrag erstellen</Button>
        </div>
      </form>
    </Dialog>
  );
}
