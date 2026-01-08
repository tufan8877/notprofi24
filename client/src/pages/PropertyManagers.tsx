import { usePropertyManagers, useCreatePropertyManager, useUpdatePropertyManager, useDeletePropertyManager } from "@/hooks/use-property-managers";
import { Button, Card, Input, Label, Dialog } from "@/components/ui-components";
import { Plus, Search, Pencil, Trash2, Building } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPropertyManagerSchema } from "@shared/schema";
import { z } from "zod";

type FormData = z.infer<typeof insertPropertyManagerSchema>;

export default function PropertyManagers() {
  const { data: managers, isLoading } = usePropertyManagers();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const filteredManagers = managers?.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Hausverwaltungen</h1>
          <p className="text-slate-500">Verwalten Sie Ihre Partner-Hausverwaltungen.</p>
        </div>
        <Button onClick={() => { setEditingId(null); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Neue Hausverwaltung
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border bg-slate-50/50 flex gap-2">
          <div className="relative flex-1 max-w-sm">
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
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Adresse</th>
                <th className="px-6 py-3">Kontakt</th>
                <th className="px-6 py-3 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Laden...</td></tr>
              ) : filteredManagers?.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Keine Einträge gefunden.</td></tr>
              ) : (
                filteredManagers?.map(manager => (
                  <tr key={manager.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <Building className="w-4 h-4" />
                        </div>
                        {manager.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{manager.address}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex flex-col">
                        <span>{manager.email}</span>
                        <span className="text-xs text-slate-400">{manager.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingId(manager.id); setIsDialogOpen(true); }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <DeleteButton id={manager.id} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ManagerDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        editingId={editingId}
      />
    </div>
  );
}

function DeleteButton({ id }: { id: number }) {
  const { mutate, isPending } = useDeletePropertyManager();
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

function ManagerDialog({ isOpen, onClose, editingId }: { isOpen: boolean; onClose: () => void; editingId: number | null }) {
  const { mutate: create, isPending: isCreating } = useCreatePropertyManager();
  const { mutate: update, isPending: isUpdating } = useUpdatePropertyManager();
  const { data: managers } = usePropertyManagers();
  
  const editingManager = managers?.find(m => m.id === editingId);
  const isPending = isCreating || isUpdating;

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(insertPropertyManagerSchema),
  });

  // Reset form when dialog opens/closes/mode changes
  useState(() => {
    if (isOpen) {
      if (editingManager) {
        Object.entries(editingManager).forEach(([key, value]) => {
          setValue(key as keyof FormData, value as any);
        });
      } else {
        reset({ name: "", address: "", phone: "", email: "", notes: "" });
      }
    }
  }); // Note: This is a hacky effect simulation. Real effect:
  
  // UseEffect to reset form properly
  const React = require("react");
  React.useEffect(() => {
    if (isOpen) {
      if (editingManager) {
        reset(editingManager);
      } else {
        reset({ name: "", address: "", phone: "", email: "", notes: "" });
      }
    }
  }, [isOpen, editingManager, reset]);

  const onSubmit = (data: FormData) => {
    if (editingId) {
      update({ id: editingId, ...data }, { onSuccess: onClose });
    } else {
      create(data, { onSuccess: onClose });
    }
  };

  return (
    <Dialog 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editingId ? "Hausverwaltung bearbeiten" : "Neue Hausverwaltung"}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} className={errors.name ? "border-red-500" : ""} />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="address">Adresse</Label>
          <Input id="address" {...register("address")} className={errors.address ? "border-red-500" : ""} />
          {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
          </div>
          <div>
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" {...register("phone")} />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notizen</Label>
          <textarea 
            className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
            {...register("notes")}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button type="submit" isLoading={isPending}>Speichern</Button>
        </div>
      </form>
    </Dialog>
  );
}
