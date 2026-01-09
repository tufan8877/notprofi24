import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Building2, 
  Briefcase, 
  FileText, 
  Settings, 
  LogOut, 
  Users,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Hausverwaltungen", href: "/property-managers", icon: Building2 },
    { name: "Firmen", href: "/companies", icon: Users },
    { name: "Vermittlungsaufträge", href: "/jobs", icon: Briefcase },
    { name: "Rechnungen", href: "/invoices", icon: FileText },
    { name: "Einstellungen", href: "/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-border">
        <div className="font-display font-bold text-xl text-primary">Notprofi24.at</div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out md:translate-x-0 md:relative md:block shadow-2xl",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-800">
          <h1 className="font-display font-bold text-2xl tracking-tight text-white">
            Notprofi<span className="text-blue-400">24</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Admin Dashboard</p>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group font-medium",
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/25" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}>
                  <item.icon className={clsx("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg">
              {(user?.email?.[0] || "A").toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">Admin</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || ""}</p>
            </div>
          </div>
          <button 
            onClick={() => logout()} 
            className="w-full flex items-center gap-2 justify-center px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto h-[calc(100vh-60px)] md:h-screen w-full">
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
          {children}
        </div>
      </main>
      
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
