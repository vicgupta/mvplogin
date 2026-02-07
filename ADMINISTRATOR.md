# mvplogin Administrator Guide

## Architecture Overview

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Browser     │────▶│  Next.js (Vercel) │────▶│  PocketBase   │
│               │     │                  │     │  (VPS/Fly.io) │
│  React 19     │     │  API Routes:     │     │               │
│  Tailwind v4  │     │  /api/ai         │     │  Auth + DB    │
│  shadcn/ui    │     │  /api/email      │     │  SQLite       │
│               │     │  /api/stripe/*   │     │  Admin UI     │
└──────────────┘     └───────┬──────────┘     └──────────────┘
                             │
                    ┌────────┼────────┐
                    ▼        ▼        ▼
              ┌─────────┐ ┌──────┐ ┌────────┐
              │  Stripe  │ │Resend│ │ Claude │
              │Payments  │ │Email │ │   AI   │
              └─────────┘ └──────┘ └────────┘
```

**Tech Stack:**

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React + Tailwind CSS + shadcn/ui | 19.2.3 / 4.x / 3.8.4 |
| Database & Auth | PocketBase | 0.25.9 |
| ORM/SDK | PocketBase JS SDK | 0.26.8 |
| Payments | Stripe | 20.3.1 |
| Email | Resend | 6.9.1 |
| AI | Anthropic Claude SDK | 0.73.0 |
| Hosting | Vercel (Next.js) + VPS (PocketBase) | — |

---

## Project Structure

```
mvplogin/
├── scripts/
│   └── setup-pocketbase.sh        # Downloads PocketBase binary
├── pb/                             # PocketBase directory
│   ├── pocketbase                  # Binary (gitignored)
│   ├── pb_data/                    # SQLite data (gitignored)
│   └── pb_migrations/              # Schema migrations
├── src/
│   ├── middleware.ts                # Route protection (cookie check)
│   ├── app/
│   │   ├── layout.tsx              # Root layout (AuthProvider)
│   │   ├── page.tsx                # Landing page
│   │   ├── globals.css             # Tailwind + shadcn theme
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx      # Login page
│   │   │   └── signup/page.tsx     # Signup page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          # Dashboard layout (nav, auth gate)
│   │   │   └── dashboard/
│   │   │       ├── page.tsx        # Dashboard home
│   │   │       ├── ai/page.tsx     # AI content generator
│   │   │       └── settings/page.tsx # Profile + subscription
│   │   └── api/
│   │       ├── ai/route.ts         # Claude streaming proxy
│   │       ├── email/route.ts      # Resend email sender
│   │       └── stripe/
│   │           ├── checkout/route.ts # Create Checkout session
│   │           ├── portal/route.ts   # Create Portal session
│   │           └── webhook/route.ts  # Handle Stripe events
│   ├── components/
│   │   ├── auth-provider.tsx       # Auth context + cookie sync
│   │   ├── auth-form.tsx           # Shared login/signup form
│   │   ├── nav.tsx                 # Landing page nav
│   │   ├── pricing-card.tsx        # Pricing card with checkout
│   │   ├── footer.tsx              # Landing page footer
│   │   └── ui/                     # shadcn/ui components
│   └── lib/
│       ├── pocketbase.ts           # PB client + admin auth
│       ├── stripe.ts               # Stripe client + plan config
│       ├── resend.ts               # Resend client
│       ├── ai.ts                   # Anthropic client
│       └── utils.ts                # shadcn/ui utility (cn)
├── .env.local.example              # Environment variable template
├── components.json                 # shadcn/ui config
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── eslint.config.mjs
```

---

## Initial Setup

### Prerequisites

- Node.js 18+ (22.x recommended)
- npm
- A Stripe account
- A Resend account
- An Anthropic API key

### 1. Install Dependencies

```bash
npm install
```

### 2. Download PocketBase

```bash
npm run setup:pb
```

This runs `scripts/setup-pocketbase.sh`, which detects your OS and architecture (macOS/Linux, amd64/arm64), downloads PocketBase v0.25.9, and places the binary at `pb/pocketbase`.

### 3. Start PocketBase

```bash
npm run dev:pb
```

PocketBase starts at `http://127.0.0.1:8090`. On first run, navigate to `http://127.0.0.1:8090/_/` to create your admin account.

### 4. Configure PocketBase Collections

In the PocketBase admin UI (`/_/`), create the following collection:

#### `profiles` Collection

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `user` | Relation (users) | Yes | Single relation to the built-in users collection |
| `plan` | Text | No | Values: `free`, `pro`, `enterprise`. Default: `free` |
| `subscription_status` | Text | No | Values: `none`, `active`, `canceled`, `past_due`. Default: `none` |
| `stripe_customer_id` | Text | No | Stripe customer ID (cus_...) |
| `stripe_subscription_id` | Text | No | Stripe subscription ID (sub_...) |

**API Rules** — Set these so the profile data is accessible:

- **List/Search rule:** `user = @request.auth.id` (users can only see their own profile)
- **View rule:** `user = @request.auth.id`
- **Create rule:** `user = @request.auth.id`
- **Update rule:** `user = @request.auth.id`
- **Delete rule:** (leave empty — don't allow deletion)

Note: The Stripe webhook and checkout routes use admin authentication (`authenticateAdmin()`) to bypass these rules when syncing subscription data.

#### OAuth2 Providers (Optional)

In PocketBase admin, go to **Settings > Auth providers** and configure:

- **Google** — Add your Google OAuth2 Client ID and Client Secret
- **GitHub** — Add your GitHub OAuth App Client ID and Client Secret

Set the redirect URL in each provider's console to: `http://127.0.0.1:8090/api/oauth2-redirect`

### 5. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

#### Full Variable Reference

| Variable | Where Used | Description |
|----------|-----------|-------------|
| `NEXT_PUBLIC_POCKETBASE_URL` | Client-side PB SDK | Public PocketBase URL. Default: `http://127.0.0.1:8090` |
| `PB_URL` | Server-side fallback | PocketBase URL for API routes. Falls back from `NEXT_PUBLIC_POCKETBASE_URL` |
| `PB_USEREMAIL` | `lib/pocketbase.ts` | PocketBase admin (superuser) email for server-side operations |
| `PB_USERPASSWORD` | `lib/pocketbase.ts` | PocketBase admin password |
| `STRIPE_SECRET_KEY` | `lib/stripe.ts` | Stripe secret key (`sk_test_...` or `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | `api/stripe/webhook` | Stripe webhook signing secret (`whsec_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side (future use) | Stripe publishable key (`pk_test_...` or `pk_live_...`) |
| `STRIPE_PRO_PRICE_ID` | `lib/stripe.ts` | Stripe Price ID for the Pro plan |
| `STRIPE_ENTERPRISE_PRICE_ID` | `lib/stripe.ts` | Stripe Price ID for the Enterprise plan |
| `RESEND_API_KEY` | `lib/resend.ts` | Resend API key (`re_...`) |
| `EMAIL_FROM` | `lib/resend.ts` | Sender address for emails. Default: `mvplogin <onboarding@resend.dev>` |
| `ANTHROPIC_API_KEY` | `lib/ai.ts` | Anthropic API key (`sk-ant-...`) |
| `NEXT_PUBLIC_APP_URL` | API routes | Base URL of the application. Default: `http://localhost:3000` |

**Security notes:**
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never put secrets in them.
- `PB_USEREMAIL` and `PB_USERPASSWORD` are only used server-side in API routes.
- Never commit `.env.local` to git. The `.gitignore` already excludes it.

### 6. Start Development

```bash
# Start both Next.js and PocketBase
npm run dev:all

# Or start them separately:
npm run dev      # Next.js at http://localhost:3000
npm run dev:pb   # PocketBase at http://127.0.0.1:8090
```

---

## Stripe Configuration

### 1. Create Products and Prices

In the [Stripe Dashboard](https://dashboard.stripe.com):

1. Go to **Products** and create two products:
   - **Pro** — $29/month recurring
   - **Enterprise** — $99/month recurring
2. Copy each product's **Price ID** (starts with `price_`).
3. Set them in `.env.local`:
   ```
   STRIPE_PRO_PRICE_ID=price_xxxxx
   STRIPE_ENTERPRISE_PRICE_ID=price_xxxxx
   ```

### 2. Configure Customer Portal

In Stripe Dashboard, go to **Settings > Billing > Customer portal**:

1. Enable the portal.
2. Allow customers to update payment methods.
3. Allow customers to cancel subscriptions.
4. Allow customers to switch between your Pro and Enterprise plans.
5. Save changes.

### 3. Set Up Webhooks

#### Local Development

Use the Stripe CLI to forward webhooks to your local server:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI will print a webhook signing secret (`whsec_...`). Set it in `.env.local`:

```
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

#### Production

In Stripe Dashboard, go to **Developers > Webhooks**:

1. Add an endpoint: `https://yourdomain.com/api/stripe/webhook`
2. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
3. Copy the signing secret and set it as `STRIPE_WEBHOOK_SECRET` in your production environment.

### Stripe Flow Summary

```
User clicks Subscribe
        │
        ▼
POST /api/stripe/checkout
        │
        ├─▶ Authenticate as PB admin
        ├─▶ Get/create PB profile
        ├─▶ Get/create Stripe customer
        ├─▶ Create Checkout Session
        │
        ▼
User completes payment on Stripe
        │
        ▼
Stripe sends webhook to /api/stripe/webhook
        │
        ├─▶ Verify signature
        ├─▶ Authenticate as PB admin
        ├─▶ Update profile: plan, status, subscription ID
        │
        ▼
Dashboard reflects new plan
```

---

## Email Configuration (Resend)

### Setup

1. Sign up at [resend.com](https://resend.com).
2. Create an API key and set it as `RESEND_API_KEY`.
3. Verify your sending domain or use the sandbox domain (`onboarding@resend.dev`).
4. Set `EMAIL_FROM` to your verified sender address.

### Available Templates

The email API at `/api/email` supports two templates:

| Template | Variables | Description |
|----------|-----------|-------------|
| `welcome` | `name` (optional) | Welcome email with dashboard link |
| `payment_receipt` | `plan`, `amount` | Payment confirmation with settings link |

### Sending Emails Programmatically

```typescript
await fetch("/api/email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    to: "user@example.com",
    template: "welcome",
    data: { name: "John" },
  }),
});
```

### Adding New Templates

Edit `src/app/api/email/route.ts`. Add a new entry to the `templates` object:

```typescript
const templates = {
  // ... existing templates
  my_template: (data) => ({
    subject: "My Subject",
    html: `<h1>Hello ${data?.name}</h1>`,
  }),
};
```

Then update the `EmailTemplate` type to include the new template name.

---

## AI Configuration (Claude)

### Setup

1. Get an API key from [console.anthropic.com](https://console.anthropic.com).
2. Set it as `ANTHROPIC_API_KEY` in `.env.local`.

### How It Works

The AI route (`/api/ai`) proxies requests to the Anthropic API using Server-Sent Events for streaming:

1. Client sends a POST with `prompt` and optional `systemPrompt`.
2. Server creates an Anthropic message stream using `claude-sonnet-4-5`.
3. Text chunks are forwarded to the client as SSE events: `data: {"text": "..."}\n\n`.
4. Stream ends with `data: [DONE]\n\n`.

### Changing the Model

Edit `src/lib/ai.ts`:

```typescript
export const AI_MODEL = "claude-sonnet-4-5-20250929"; // Change this
```

### Adjusting Max Tokens

Edit `src/app/api/ai/route.ts`, line 17:

```typescript
max_tokens: 1024, // Increase for longer outputs
```

### Adding New AI Features

The `/api/ai` route is a generic proxy. To add specialized features:

1. Create a new route (e.g., `/api/ai/analyze/route.ts`).
2. Import the `anthropic` client from `@/lib/ai`.
3. Set a specific system prompt for the use case.
4. Use the same streaming pattern or return JSON for non-streaming responses.

---

## Authentication System

### How Auth Works

```
                    ┌─────────────────────┐
                    │   AuthProvider       │
                    │   (React Context)    │
                    │                     │
                    │   Wraps PB authStore │
                    │   Syncs pb_auth      │
                    │   cookie on change   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
     ┌────────▼──────┐ ┌──────▼───────┐ ┌──────▼──────┐
     │  Login/Signup  │ │  Dashboard   │ │ Middleware   │
     │  Pages         │ │  Pages       │ │             │
     │                │ │              │ │ Reads       │
     │  Call login()  │ │  Read user   │ │ pb_auth     │
     │  or signup()   │ │  from context│ │ cookie      │
     └───────────────┘ └──────────────┘ └─────────────┘
```

1. **AuthProvider** (`src/components/auth-provider.tsx`) wraps the entire app in the root layout.
2. It initializes PocketBase's `authStore` and listens for changes.
3. On every auth state change, it syncs the token to a `pb_auth` cookie (30-day expiry, `SameSite=Lax`).
4. **Middleware** (`src/middleware.ts`) reads the `pb_auth` cookie on each request to `/dashboard/*`, `/login`, or `/signup`.
5. Unauthenticated requests to `/dashboard/*` redirect to `/login?redirect=/dashboard/...`.
6. Authenticated requests to `/login` or `/signup` redirect to `/dashboard`.

### Admin Authentication (Server-Side)

API routes that need to read/write data across users use the `authenticateAdmin()` function from `src/lib/pocketbase.ts`. This authenticates as a PocketBase superuser using `PB_USEREMAIL` and `PB_USERPASSWORD` environment variables.

Used by:
- `/api/stripe/checkout` — to read user records and create/update profiles
- `/api/stripe/webhook` — to update profiles when subscriptions change
- `/api/stripe/portal` — to look up Stripe customer IDs

---

## Deployment

### Next.js on Vercel

1. Push your repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Set all environment variables in the Vercel dashboard (Settings > Environment Variables).
4. Set `NEXT_PUBLIC_APP_URL` to your production domain (e.g., `https://yourdomain.com`).
5. Set `NEXT_PUBLIC_POCKETBASE_URL` and `PB_URL` to your production PocketBase URL.
6. Deploy.

### PocketBase on a Server

PocketBase is a single binary with an embedded SQLite database. It needs a persistent server (it cannot run on serverless platforms).

**Option A: Fly.io**

```bash
# In the pb/ directory
fly launch
fly deploy
```

**Option B: Any VPS (DigitalOcean, Hetzner, Railway, etc.)**

1. Upload the PocketBase binary to your server.
2. Run it:
   ```bash
   ./pocketbase serve --http 0.0.0.0:8090
   ```
3. Set up a reverse proxy (Nginx/Caddy) with HTTPS.
4. Set up a systemd service for automatic restarts.

**Option C: Docker**

```dockerfile
FROM alpine:latest
COPY pocketbase /usr/local/bin/pocketbase
EXPOSE 8090
CMD ["pocketbase", "serve", "--http", "0.0.0.0:8090"]
```

### Production Checklist

- [ ] PocketBase running on a persistent server with HTTPS
- [ ] PocketBase admin account created
- [ ] `profiles` collection created with correct schema and API rules
- [ ] OAuth providers configured in PocketBase (if using Google/GitHub login)
- [ ] Stripe products and prices created
- [ ] Stripe webhook endpoint configured for production URL
- [ ] Stripe Customer Portal enabled and configured
- [ ] Resend domain verified
- [ ] All environment variables set in Vercel
- [ ] `NEXT_PUBLIC_APP_URL` points to production domain
- [ ] `NEXT_PUBLIC_POCKETBASE_URL` and `PB_URL` point to production PocketBase
- [ ] Stripe keys switched from test to live mode
- [ ] PocketBase `pb_data/` directory is backed up regularly

---

## NPM Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev --turbopack` | Start Next.js dev server with Turbopack at `localhost:3000` |
| `dev:pb` | `cd pb && ./pocketbase serve` | Start PocketBase at `127.0.0.1:8090` |
| `dev:all` | `npm run dev & npm run dev:pb` | Start both Next.js and PocketBase concurrently |
| `build` | `next build` | Build Next.js for production |
| `start` | `next start` | Start production Next.js server |
| `lint` | `eslint` | Run ESLint |
| `setup:pb` | `bash scripts/setup-pocketbase.sh` | Download PocketBase binary for your platform |

---

## API Routes Reference

### POST `/api/ai`

Streams a Claude AI response.

**Request:**
```json
{
  "prompt": "Write a blog post about...",
  "systemPrompt": "You are an expert blog writer."
}
```

**Response:** Server-Sent Events stream.
```
data: {"text":"Here"}

data: {"text":" is"}

data: {"text":" your content..."}

data: [DONE]
```

---

### POST `/api/email`

Sends a transactional email via Resend.

**Request:**
```json
{
  "to": "user@example.com",
  "template": "welcome",
  "data": { "name": "John" }
}
```

**Response:**
```json
{ "success": true, "id": "email_id" }
```

---

### POST `/api/stripe/checkout`

Creates a Stripe Checkout session for a subscription.

**Request:**
```json
{
  "planKey": "pro",
  "userId": "pocketbase_user_id"
}
```

**Response:**
```json
{ "url": "https://checkout.stripe.com/..." }
```

---

### POST `/api/stripe/portal`

Creates a Stripe Customer Portal session.

**Request:**
```json
{
  "userId": "pocketbase_user_id"
}
```

**Response:**
```json
{ "url": "https://billing.stripe.com/..." }
```

---

### POST `/api/stripe/webhook`

Receives Stripe webhook events. Do not call this directly.

**Events handled:**
- `checkout.session.completed` — Activates the subscription in PocketBase
- `customer.subscription.updated` — Syncs subscription status
- `customer.subscription.deleted` — Downgrades user to free plan

---

## Troubleshooting

### PocketBase won't start

- Make sure the binary is downloaded: `npm run setup:pb`
- Make sure the binary is executable: `chmod +x pb/pocketbase`
- Check if port 8090 is already in use: `lsof -i :8090`

### Stripe webhooks aren't being received

- **Local:** Make sure `stripe listen --forward-to localhost:3000/api/stripe/webhook` is running.
- **Production:** Verify the webhook URL in Stripe Dashboard matches your domain exactly.
- Check that `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe.
- In Stripe Dashboard, go to Developers > Webhooks and check for failed deliveries.

### Auth cookie not being set

- Check browser DevTools > Application > Cookies for `pb_auth`.
- Make sure PocketBase is running and reachable at the configured URL.
- Check the browser console for PocketBase SDK errors.

### Hydration errors in development

- These occur when server-rendered HTML doesn't match client-rendered HTML.
- The `Nav` component uses a `mounted` flag to prevent this. If you add new auth-dependent UI to server-rendered pages, follow the same pattern:
  ```typescript
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Use `mounted && user` instead of just `user`
  ```

### Build fails with "Missing environment variable"

- `lib/stripe.ts`, `lib/resend.ts`, and `lib/ai.ts` throw on startup if their API keys are missing.
- Make sure all required variables are set in `.env.local` (development) or in your hosting provider's environment settings (production).
- For build-time, you may need to set these variables in your CI/CD pipeline even if they're only used at runtime.

### PocketBase "profiles" collection not found

- You need to manually create the `profiles` collection in PocketBase admin UI.
- See the "Configure PocketBase Collections" section above for the exact schema.
