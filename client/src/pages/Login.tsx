import { Button, Card, Input, Label } from "@/components/ui-components";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

export default function Login() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (isLoading) return null;

  const handleLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const msg = (await res.json().catch(() => null))?.message || "Login fehlgeschlagen";
        throw new Error(msg);
      }
      // Refresh auth state
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    } catch (e: any) {
      setError(e?.message || "Login fehlgeschlagen");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-6 shadow-2xl">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Notprofi<span className="text-blue-600">24</span></h1>
          <p className="text-slate-500">Admin Dashboard Login</p>
        </div>
        
        <div className="py-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
             </svg>
          </div>
          <p className="text-sm text-slate-600">Bitte melden Sie sich an, um fortzufahren.</p>
        </div>

        <div className="text-left space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Admin E-Mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="z.B. office@notprofi24.at" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleLogin} className="w-full" size="lg" isLoading={isSubmitting}>
            Anmelden
          </Button>
          <p className="text-xs text-slate-400">
            Zugangsdaten werden über Render-Environment-Variablen <span className="font-mono">ADMIN_EMAIL</span> und <span className="font-mono">ADMIN_PASSWORD</span> gesetzt.
          </p>
        </div>
      </Card>
    </div>
  );
}
