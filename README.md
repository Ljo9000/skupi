# skupi. — Group Payment Links

> Vlasnik kreira link za termin, podijeli grupi — skupi. automatski prikupi uplate i potvrdi rezervaciju kad se skupi minimalni broj sudionika. Ako se ne popuni, automatski vraća novac.

---

## Preduvjeti

| Alat | Verzija | Zašto |
|------|---------|-------|
| Node.js | 18+ | Next.js runtime |
| npm | 9+ | Dolazi s Node-om |
| [Supabase CLI](https://supabase.com/docs/guides/cli) | latest | `supabase db push` za migracije |
| [Stripe CLI](https://stripe.com/docs/stripe-cli) | latest | Lokalni webhook forwarding |

```bash
# Provjeri verzije
node -v
npm -v
supabase --version
stripe --version
```

---

## Setup (oko 20 minuta)

### Korak 1 — Kloniranje i instalacija

```bash
cd C:\Users\DavorBrid\Desktop\grouppay\skupi
npm install
```

### Korak 2 — Supabase projekt

1. Idi na [supabase.com](https://supabase.com) → **New project**
2. Zapamti **Database Password** koji uneseš (trebat će za Supabase CLI)
3. Pričekaj da se projekt kreira (~1 min)
4. U **Project Settings → API** kopiraj:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
5. Iz URL-a dashboarda izvuci **project ID** (npr. `https://supabase.com/dashboard/project/abcdefghij` → ID je `abcdefghij`)

### Korak 3 — Pokretanje migracija

**Opcija A — Supabase CLI (preporučeno):**

```bash
# Jednom poveži Supabase CLI s projektom
supabase login
supabase link --project-ref TVOJ_PROJECT_ID

# Pokreni sve migracije odjednom
supabase db push
```

**Opcija B — Ručno u SQL Editoru:**

U Supabase dashboardu → **SQL Editor**, izvrši redom:
1. Sadržaj `supabase/migrations/001_init.sql`
2. Sadržaj `supabase/migrations/002_cron_emails.sql`
3. Sadržaj `supabase/migrations/003_fix_payment_status.sql`

**Nakon migracija — postavi app settings za pg_cron:**

```sql
-- Izvrši ovo u SQL Editoru (zamijeni vrijednosti!)
ALTER DATABASE postgres SET "app.base_url" = 'https://tvoja-domena.vercel.app';
ALTER DATABASE postgres SET "app.cron_secret" = 'isti-secret-kao-CRON_SECRET-u-env';
```

> Za lokalni razvoj koristi `http://localhost:3000` kao `app.base_url` i promijeni ga pred deploy.

### Korak 4 — Stripe

1. Idi na [dashboard.stripe.com](https://dashboard.stripe.com)
2. U **Developers → API keys** kopiraj:
   - **Publishable key** (`pk_test_...`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY`
3. U **Connect → Settings** aktiviraj **Express** onboarding (potrebno za vlasnike)

### Korak 5 — Resend (emailovi)

1. Idi na [resend.com](https://resend.com) → **API Keys → Create API Key**
2. Kopiraj ključ (`re_...`) → `RESEND_API_KEY`
3. Opcionally: dodaj i verificiraj vlastitu domenu za `From:` adresu; inače koristi `onboarding@resend.dev` za testiranje

### Korak 6 — Environment varijable

```bash
cp .env.local.example .env.local
```

Otvori `.env.local` i popuni sve vrijednosti:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghij.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # Dobiješ u Koraku 7
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Resend
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Cron secret — generiraj nasumično: openssl rand -hex 32
CRON_SECRET=neki-dugi-nasumicni-string
```

### Korak 7 — Pokretanje i webhook

**Terminal 1 — Next.js dev server:**
```bash
npm run dev
```

**Terminal 2 — Stripe webhook forwarding:**
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Stripe CLI ispiše `whsec_...` ključ — kopiraj ga u `STRIPE_WEBHOOK_SECRET` u `.env.local`, pa **restartaj** dev server.

### Korak 8 — Provjera

Otvori [http://localhost:3000/api/health](http://localhost:3000/api/health) — treba vidjeti `"status": "ok"` za sve servise.

---

## Prva transakcija (test)

1. Idi na [http://localhost:3000/auth/register](http://localhost:3000/auth/register) i registriraj se
2. Na dashboardu klikni **Postavi** → završi Stripe Connect Express onboarding (koristi test mode podatke)
3. Klikni **+ Novi termin**, popuni formu, klikni **Generiraj link**
4. Kopiraj payment link i otvori ga u inkognito prozoru
5. Unesi ime, email i Stripe test karticu `4242 4242 4242 4242`, exp `12/28`, CVC `123`
6. U Terminalu 2 trebao bi se pojaviti `payment_intent.succeeded` event
7. Na dashboardu termina status se ažurira live

---

## Struktura projekta

```
skupi/
├── app/
│   ├── page.tsx                      # Landing stranica
│   ├── auth/
│   │   ├── login/page.tsx            # Prijava
│   │   ├── register/page.tsx         # Registracija
│   │   └── callback/route.ts         # Supabase auth callback
│   ├── dashboard/
│   │   ├── layout.tsx                # Dashboard layout + nav
│   │   ├── page.tsx                  # Pregled termina
│   │   ├── novi/page.tsx             # Forma za novi termin
│   │   ├── stripe-onboarding/page.tsx
│   │   └── termini/[id]/page.tsx     # Detalji termina + uplate
│   ├── t/[slug]/
│   │   ├── page.tsx                  # Javna payment stranica (server)
│   │   ├── PaymentClient.tsx         # Real-time live counter (client)
│   │   └── CheckoutForm.tsx          # Stripe Elements checkout
│   ├── actions/
│   │   └── events.ts                 # Server Action: kreiraj termin
│   └── api/
│       ├── health/route.ts           # Provjera konfiguracije
│       ├── payments/
│       │   ├── create/route.ts       # Kreira Stripe PaymentIntent
│       │   ├── capture/route.ts      # Naplaćuje manual capture (pg_cron)
│       │   └── cancel/route.ts       # Otkazuje / refundira (pg_cron)
│       ├── stripe/
│       │   ├── webhook/route.ts      # Stripe webhook handler
│       │   └── connect/route.ts      # Stripe Connect Express onboarding
│       └── emails/
│           ├── payment-confirmed/route.ts
│           └── event-full/route.ts
├── components/
│   ├── DashboardNav.tsx
│   ├── QRCodeCard.tsx
│   └── CopyButton.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser Supabase client
│   │   └── server.ts                 # Server Supabase client
│   ├── stripe.ts                     # Stripe singleton
│   ├── resend.ts                     # Resend klijent
│   ├── email-templates.ts            # HTML email templati
│   └── utils.ts                      # calculateServiceFee(), formatCurrency()
├── supabase/
│   ├── config.toml                   # Supabase CLI konfiguracija
│   └── migrations/
│       ├── 001_init.sql              # Schema: owners, events, payments + RLS
│       ├── 002_cron_emails.sql       # pg_cron auto-confirm/cancel + email triggeri
│       └── 003_fix_payment_status.sql# Proširuje payments.status constraint
└── middleware.ts                     # Zaštita /dashboard/* ruta
```

---

## Baza podataka

### Tablice

| Tablica | Opis |
|---------|------|
| `owners` | Vlasnici terena — linked na Supabase Auth, Stripe account ID |
| `events` | Termini — slug, cijena u centima, min/max sudionika, rok uplate, status |
| `payments` | Uplate gostiju — Stripe PI ID, capture method, status |

### Payment statusi

| Status | Značenje |
|--------|----------|
| `pending` | Gost unio karticu, PI kreiran, čeka capture |
| `capturing` | pg_cron pokrenuo capture, čeka webhook |
| `confirmed` | `payment_intent.succeeded` primljen |
| `cancelling` | pg_cron pokrenuo cancel |
| `cancelled` | PI otkazan / autorizacija poništena |
| `failed` | Plaćanje odbijeno |
| `refunded` | Refund poslan (automatski capture slučaj) |

### Payment flow

```
Gost plati → PI kreiran (pending)
    │
    ├─ termin ≤6 dana → manual capture → pg_cron capture → confirmed
    └─ termin 7+ dana → automatic capture → succeeded webhook → confirmed

Po isteku roka:
    ├─ count >= min → svi confirmed → transfer vlasniku → email potvrda
    └─ count < min  → svi cancelled/refunded → email otkaz
```

---

## Stripe Connect — kako radi

Svaki vlasnik ima vlastiti Stripe Express račun. Skupi koristi `application_fee_amount` (5% + Stripe naknade) na svakom PaymentIntent-u — novac ide direktno na vlasnikov račun, skupi. uzima fee automatski.

---

## Deploy (Vercel)

```bash
# Push na GitHub, pa poveži repo s Vercel projektom
# Postavi sve env varijable u Vercel dashboard → Settings → Environment Variables
# Nakon deploya ažuriraj u Supabase SQL Editoru:
# ALTER DATABASE postgres SET "app.base_url" = 'https://tvoja-app.vercel.app';
# Postavi Stripe webhook u dashboard.stripe.com → Developers → Webhooks:
# Endpoint: https://tvoja-app.vercel.app/api/stripe/webhook
# Events: payment_intent.succeeded, payment_intent.payment_failed,
#         payment_intent.canceled, account.updated
```
