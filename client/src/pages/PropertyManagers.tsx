import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PM = {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
};

export default function PropertyManagers() {
  const { data, isLoading, error, refetch } = useQuery<PM[]>({
    queryKey: ["/api/property-managers"],
    queryFn: async () => {
      const res = await fetch("/api/property-managers", { credentials: "include" });
      if (!res.ok) throw new Error(`API Fehler: ${res.status}`);
      return res.json();
    },
  });

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  async function create() {
    if (!name.trim()) return;

    await apiRequest("POST", "/api/property-managers", {
      name: name.trim(),
      address: address.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
    });

    setName("");
    setAddress("");
    setPhone("");
    setEmail("");
    await refetch();
  }

  if (isLoading) return <div>Laden…</div>;
  if (error) return <div className="text-red-600">Fehler: {(error as any)?.message}</div>;

  const list = data ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Hausverwaltungen</h1>

      <Card>
        <CardHeader>
          <CardTitle>Neu anlegen</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Adresse" value={address} onChange={(e) => setAddress(e.target.value)} />
          <Input placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button onClick={create}>Speichern</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {list.length === 0 ? (
            <div className="text-muted-foreground">Noch keine Hausverwaltungen gespeichert.</div>
          ) : (
            list.map((pm) => (
              <div key={pm.id} className="border rounded p-3">
                <div className="font-medium">{pm.name}</div>
                <div className="text-sm text-muted-foreground">{pm.address || "-"}</div>
                <div className="text-sm">{pm.phone || "-"}</div>
                <div className="text-sm">{pm.email || "-"}</div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
