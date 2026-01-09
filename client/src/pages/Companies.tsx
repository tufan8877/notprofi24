import { useCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany } from "@/hooks/use-companies";
import { usePropertyManagers } from "@/hooks/use-property-managers";
import { useCooperations, useToggleCooperation } from "@/hooks/use-cooperations";
import { Button, Card, Input, Label, Dialog, Badge } from "@/components/ui-components";
import { Plus, Search, Pencil, Trash2, Briefcase, Building } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCompanySchema } from "@shared/schema";
import { z } from "zod";
import { clsx } from "clsx";

type FormData = z.infer<typeof insertCompanySchema>;

export default function Companies() {
  const { data: companies, isLoading } = useCompanies();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const filtered = companies?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Firmen</h1>
          <p className="text-slate-500">Servicepartner und Handwerker verwalten.</p>
        </div>
        <Button onClick={() => { setEditingId(null); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Neue Firma
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border bg-slate-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Suchen..." 
              className="pl-9 bg-white" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-border">
              <tr>
                <th className="px-6 py-3">Firma</th>
                <th className="px-6 py-3">Kontakt</th>
                <th className="px-6 py-3">Tags</th>
                <th className="px-6 py-3 text-right">Status</th>
                <th className="px-6 py-3 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Laden...</td></tr>
              ) : filtered?.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Keine Einträge.</td></tr>
              ) : (
                filtered?.map(company => (
                  <tr key={company.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <div>{company.name}</div>
                          <div className="text-xs text-slate-400 font-normal">{company.contactPerson}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex flex-col">
                        <span>{company.email}</span>
                        <span className="text-xs text-slate-400">{company.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {company.tags?.map((tag: string) => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <Badge variant={company.isActive ? "success" : "destructive"}>
                         {company.isActive ? "Aktiv" : "Inaktiv"}
                       </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingId(company.id); setIsDialogOpen(true); }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <DeleteButton id={company.id} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CompanyDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        editingId={editingId}
      />
    </div>
  );
}

function DeleteButton({ id }: { id: number }) {
  const { mutate, isPending } = useDeleteCompany();
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="text-red-500 hover:text-red-600 hover:bg-red-50"
      onClick={() => { if(confirm("Wirklich löschen?")) mutate(id); }}
      disabled={isPending}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}

function CompanyDialog({ isOpen, onClose, editingId }: { isOpen: boolean; onClose: () => void; editingId: number | null }) {
  const { mutate: create, isPending: isCreating } = useCreateCompany();
  const { mutate: update, isPending: isUpdating } = useUpdateCompany();
  const { data: companies } = useCompanies();
  const { data: managers } = usePropertyManagers();
  const { data: cooperations } = useCooperations();
  const { mutate: toggleCoop } = useToggleCooperation();
  
  const editingCompany = companies?.find(c => c.id === editingId);
  const isPending = isCreating || isUpdating;

  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<FormData & { tagsStr: string }>({
    resolver: zodResolver(insertCompanySchema.extend({ tagsStr: z.string().optional() })),
  });

  useEffect(() => {
    if (isOpen) {
      if (editingCompany) {
        reset({ ...editingCompany, tagsStr: editingCompany.tags?.join(", ") || "" });
      } else {
        reset({ 
          name: "", contactPerson: "", address: "", phone: "", email: "", 
          tagsStr: "", vatId: "", paymentTermsDays: 14, notes: "", isActive: true 
        });
      }
    }
  }, [isOpen, editingCompany, reset]);

  const onSubmit = (data: any) => {
    const tags = data.tagsStr.split(",").map((t: string) => t.trim()).filter(Boolean);
    const payload = { ...data, tags };
    delete payload.tagsStr;

    if (editingId) {
      update({ id: editingId, ...payload }, { onSuccess: onClose });
    } else {
      create(payload, { onSuccess: onClose });
    }
  };

  const handleCoopToggle = (managerId: number) => {
    if (!editingId) return;
    toggleCoop({ companyId: editingId, propertyManagerId: managerId });
  };

  const isCoopActive = (managerId: number) => {
    return cooperations?.some(c => c.companyId === editingId && c.propertyManagerId === managerId);
  };

  return (
    <Dialog 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editingId ? "Firma bearbeiten" : "Neue Firma"}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2">
             <Label htmlFor="name">Firmenname</Label>
             <Input id="name" {...register("name")} className={errors.name ? "border-red-500" : ""} />
             {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="contactPerson">Ansprechpartner</Label>
            <Input id="contactPerson" {...register("contactPerson")} />
          </div>

          <div>
             <Label htmlFor="email">Email</Label>
             <Input id="email" type="email" {...register("email")} />
          </div>

          <div className="col-span-2">
             <Label htmlFor="address">Adresse</Label>
             <Input id="address" {...register("address")} />
          </div>

          <div>
             <Label htmlFor="phone">Telefon</Label>
             <Input id="phone" {...register("phone")} />
          </div>

          <div>
             <Label htmlFor="vatId">UID Nummer</Label>
             <Input id="vatId" {...register("vatId")} />
          </div>

          <div>
             <Label htmlFor="paymentTermsDays">Zahlungsziel (Tage)</Label>
             <Input id="paymentTermsDays" type="number" {...register("paymentTermsDays", { valueAsNumber: true })} />
          </div>

          <div>
             <Label htmlFor="tagsStr">Tags (Komma getrennt)</Label>
             <Input id="tagsStr" placeholder="Installateur, Elektriker..." {...register("tagsStr")} />
          </div>
          
          <div className="col-span-2">
             <Label className="flex items-center gap-2">
                <input type="checkbox" {...register("isActive")} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                Aktiv
             </Label>
          </div>
        </div>

        {/* Cooperations Section - Only visible in edit mode */}
        {editingId && managers && (
          <div className="border-t pt-4">
            <Label>Kooperationen (Hausverwaltungen)</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-border">
              {managers.map(manager => {
                 const active = isCoopActive(manager.id);
                 return (
                  <div 
                    key={manager.id} 
                    className={clsx(
                      "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors border",
                      active ? "bg-primary/5 border-primary/20" : "bg-white border-transparent hover:border-border"
                    )}
                    onClick={() => handleCoopToggle(manager.id)}
                  >
                    <div className={clsx(
                      "w-4 h-4 rounded-sm border flex items-center justify-center transition-colors",
                      active ? "bg-primary border-primary text-white" : "border-slate-300"
                    )}>
                      {active && <span className="text-xs">✓</span>}
                    </div>
                    <span className="text-sm truncate">{manager.name}</span>
                  </div>
                 );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button type="submit" isLoading={isPending}>Speichern</Button>
        </div>
      </form>
    </Dialog>
  );
}
