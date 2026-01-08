import { useInvoices, useGenerateInvoices, useMarkInvoicePaid } from "@/hooks/use-invoices";
import { Button, Card, Dialog, Label, Badge } from "@/components/ui-components";
import { FileText, Download, CheckCircle, Plus } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function Invoices() {
  const { data: invoices, isLoading } = useInvoices();
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Rechnungen</h1>
          <p className="text-slate-500">Monatliche Abrechnungen verwalten.</p>
        </div>
        <Button onClick={() => setIsGenerateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Rechnungen generieren
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
         <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-border">
              <tr>
                <th className="px-6 py-3">Rechnungs-Nr.</th>
                <th className="px-6 py-3">Monat</th>
                <th className="px-6 py-3">Firma</th>
                <th className="px-6 py-3 text-right">Betrag</th>
                <th className="px-6 py-3 text-right">Status</th>
                <th className="px-6 py-3 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Laden...</td></tr>
              ) : invoices?.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Keine Rechnungen vorhanden.</td></tr>
              ) : (
                invoices?.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium font-mono text-slate-900">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4">{inv.monthYear}</td>
                    <td className="px-6 py-4">{inv.company?.name}</td>
                    <td className="px-6 py-4 text-right font-bold">€ {parseFloat(inv.totalAmount || "0").toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                       <Badge variant={inv.status === 'paid' ? 'success' : 'warning'}>
                         {inv.status === 'paid' ? 'Bezahlt' : 'Offen'}
                       </Badge>
                       {inv.paidAt && <div className="text-xs text-slate-400 mt-1">{format(new Date(inv.paidAt), "dd.MM.yy", {locale:de})}</div>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {inv.status !== 'paid' && (
                           <PayButton id={inv.id} />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/api/invoices/${inv.id}/pdf`, "_blank")}
                          title="Rechnung als PDF herunterladen"
                        >
                          <Download className="w-4 h-4 text-slate-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <GenerateDialog isOpen={isGenerateOpen} onClose={() => setIsGenerateOpen(false)} />
    </div>
  );
}

function PayButton({ id }: { id: number }) {
  const { mutate, isPending } = useMarkInvoicePaid();
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => mutate({ id, paidAt: new Date().toISOString() })}
      disabled={isPending}
      title="Als bezahlt markieren"
    >
      <CheckCircle className="w-4 h-4 text-emerald-500" />
    </Button>
  );
}

function GenerateDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { mutate, isPending } = useGenerateInvoices();
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));

  const handleGenerate = () => {
    mutate(month, { onSuccess: onClose });
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Rechnungen generieren">
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Wählen Sie den Monat aus, für den alle offenen Provisionen abgerechnet werden sollen.
        </p>
        <div>
          <Label>Monat</Label>
          <input 
            type="month" 
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleGenerate} isLoading={isPending}>Generieren</Button>
        </div>
      </div>
    </Dialog>
  );
}
