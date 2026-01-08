import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { Button, Card, Input, Label } from "@/components/ui-components";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSettingsSchema } from "@shared/schema";
import { z } from "zod";
import { useEffect } from "react";

type FormData = z.infer<typeof insertSettingsSchema>;

export default function Settings() {
  const { data: settings, isLoading } = useSettings();
  const { mutate, isPending } = useUpdateSettings();

  const { register, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(insertSettingsSchema),
  });

  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const onSubmit = (data: FormData) => {
    mutate(data);
  };

  if (isLoading) return <div className="p-8">Laden...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Einstellungen</h1>
        <p className="text-slate-500">Firmeninformationen verwalten.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="companyName">Firmenname</Label>
            <Input id="companyName" {...register("companyName")} />
          </div>
          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input id="address" {...register("address")} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" {...register("email")} />
          </div>
          <div>
            <Label htmlFor="website">Webseite</Label>
            <Input id="website" {...register("website")} />
          </div>
          <div>
            <Label htmlFor="nextInvoiceNumber">Nächste Rechnungsnummer</Label>
            <Input id="nextInvoiceNumber" type="number" {...register("nextInvoiceNumber", { valueAsNumber: true })} />
            <p className="text-xs text-muted-foreground mt-1">Wird automatisch hochgezählt.</p>
          </div>
          <div className="pt-4 flex justify-end">
            <Button type="submit" isLoading={isPending}>Speichern</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
