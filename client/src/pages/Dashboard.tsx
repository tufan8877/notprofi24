import { useJobs } from "@/hooks/use-jobs";
import { useInvoices } from "@/hooks/use-invoices";
import { Card } from "@/components/ui-components";
import { Briefcase, CreditCard, TrendingUp, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useMemo } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function Dashboard() {
  const { data: jobs } = useJobs();
  const { data: invoices } = useInvoices();

  const stats = useMemo(() => {
    if (!jobs || !invoices) return null;

    const openJobs = jobs.filter(j => j.status === 'open').length;
    const totalJobs = jobs.length;
    
    // Calculate total fees from jobs (this assumes numeric strings)
    const totalFees = jobs.reduce((acc, job) => acc + parseFloat(job.referralFee || "0"), 0);
    
    const unpaidInvoices = invoices.filter(i => i.status !== 'paid');
    const unpaidAmount = unpaidInvoices.reduce((acc, i) => acc + parseFloat(i.totalAmount || "0"), 0);

    return { openJobs, totalJobs, totalFees, unpaidAmount, unpaidCount: unpaidInvoices.length };
  }, [jobs, invoices]);

  const chartData = useMemo(() => {
    if (!jobs) return [];
    // Group jobs by company for a simple chart
    const groups: Record<string, number> = {};
    jobs.forEach(job => {
      const name = job.company?.name || "Unbekannt";
      groups[name] = (groups[name] || 0) + 1;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value })).slice(0, 5); // Top 5
  }, [jobs]);

  if (!stats) return <div className="p-8 text-center text-muted-foreground">Laden...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-2">Willkommen zurück! Hier ist ein Überblick.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Offene Aufträge" 
          value={stats.openJobs} 
          subtitle="Zu bearbeiten" 
          icon={<Briefcase className="w-6 h-6 text-blue-600" />} 
          trend="neutral"
        />
        <StatCard 
          title="Gesamtprovision" 
          value={`€ ${stats.totalFees.toFixed(2)}`} 
          subtitle="Laufendes Jahr" 
          icon={<TrendingUp className="w-6 h-6 text-emerald-600" />} 
          trend="up"
        />
        <StatCard 
          title="Offene Rechnungen" 
          value={`€ ${stats.unpaidAmount.toFixed(2)}`} 
          subtitle={`${stats.unpaidCount} ausständig`} 
          icon={<CreditCard className="w-6 h-6 text-amber-600" />} 
          trend="down"
        />
        <StatCard 
          title="Gesamtaufträge" 
          value={stats.totalJobs} 
          subtitle="Alle Zeit" 
          icon={<Briefcase className="w-6 h-6 text-purple-600" />} 
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-bold mb-6">Top Partnerfirmen (Aufträge)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(221, 83%, ${53 + (index * 5)}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Aktivitäten</h3>
            <span className="text-xs text-muted-foreground">Heute</span>
          </div>
          <div className="space-y-4">
            {jobs?.slice(0, 5).map(job => (
              <div key={job.id} className="flex items-start gap-3 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Neuer Auftrag: {job.jobNumber}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(job.createdAt || new Date()), "dd. MMM HH:mm", { locale: de })} • {job.company?.name}
                  </p>
                </div>
              </div>
            ))}
            {jobs?.length === 0 && <p className="text-sm text-muted-foreground">Keine Aktivitäten.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, trend }: any) {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
          <p className="text-xs text-muted-foreground mt-1 font-medium">{subtitle}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl">
          {icon}
        </div>
      </div>
    </Card>
  );
}
