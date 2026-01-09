# Notprofi24 Admin Webapp (Render + Supabase Postgres)

Fullstack Webapp (Express + React/Vite) für Notprofi24.at:

- Hausverwaltungen verwalten
- Firmen/Partner verwalten
- Kooperationen (Firma ↔ Hausverwaltung)
- Vermittlungsaufträge + Einsatzprotokolle
- Monatsrechnungen generieren
- PDF Downloads (Auftrag/Einsatzprotokoll & Rechnung)

## Voraussetzungen

- Node.js 20+
- Supabase Postgres (oder anderes Postgres)

## Environment Variables

Setze diese Variablen (lokal in `.env`, auf Render in "Environment"):

- `DATABASE_URL` – Postgres Connection String (Supabase)
- `ADMIN_EMAIL` – Admin Login E-Mail
- `ADMIN_PASSWORD` – Admin Login Passwort
- `SESSION_SECRET` – zufälliger Secret (z.B. 32+ Zeichen)

Optional:

- `SEED_DATA=true` (nur in DEV) erstellt Demo-Daten bei leerer DB

## Lokales Setup

```bash
npm install
npm run db:push
npm run dev
```

Dann im Browser: `http://localhost:5000`

## Render Deployment (Empfohlen)

1) Repository hochladen (GitHub) oder ZIP entpacken und pushen
2) Render: "Web Service" anlegen
3) Build Command (inkl. Tabellen anlegen):

```bash
npm install && npm run db:push && npm run build
```

4) Start Command:

```bash
npm start
```

5) Environment Variables setzen: `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET`

### Hinweis zu Supabase SSL

Die App aktiviert automatisch SSL, sobald `DATABASE_URL` nicht auf `localhost/127.0.0.1` zeigt.
