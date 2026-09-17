# Pulse Pharma

> A modern online pharmacy for discovering medicines, uploading prescriptions, consulting pharmacists, and arranging delivery in Accra, Ghana.

Pulse Pharma is a full-stack e-health and retail pharmacy application built to make access to everyday health products more convenient. Customers can browse a searchable medicine catalogue, filter products by category and availability, add items to a cart, place orders, pay securely, and manage their account from one place.

## Highlights

- **Online medicine catalogue** with search, categories, stock filters, and prescription-only filters
- **Prescription workflow** for submitting a prescription for pharmacist review
- **Shopping cart and checkout** with delivery details and delivery options
- **Flexible payments** through Paystack or Cash on Delivery
- **Secure payment processing** with Paystack verification and signed webhooks
- **Customer accounts** with authentication, profile management, password updates, and order history
- **Order tracking and receipts** with downloadable PDF receipts
- **Refill reminders** based on previously purchased medicines
- **Responsive interface** designed for desktop and mobile devices
- **Row Level Security** policies protecting customer profiles, orders, and payment records

## Tech Stack

- **Framework:** Next.js 16 with the App Router
- **Language:** TypeScript
- **UI:** React 19, Tailwind CSS 4, Framer Motion, Lucide React
- **Authentication and database:** Supabase Auth, PostgreSQL, and Row Level Security
- **Payments:** Paystack, supporting cards, bank transfers, and mobile money
- **PDF generation:** PDFKit
- **Deployment:** Compatible with Node.js hosting platforms such as Vercel

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- A Supabase project
- A Paystack account if you want to enable online payments

### 1. Clone the repository

```bash
git clone https://github.com/tyrisegloves-cmd/pulse-pharma.git
cd pulse-pharma
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local environment file from the provided template:

```bash
cp .env.example .env.local
```

Update `.env.local` with values from your Supabase and Paystack dashboards:

| Variable | Required | Description |
|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable/anon key |
| `PAYSTACK_SECRET_KEY` | For Paystack | Server-only Paystack secret key |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Optional | Public Paystack key for browser-side integrations |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public application URL used for payment callbacks |
| `SUPABASE_SERVICE_ROLE_KEY` | For payments | Server-only key used by payment verification and webhooks |

Never commit `.env.local`, Paystack secret keys, or the Supabase service-role key. Server-only secrets must not use the `NEXT_PUBLIC_` prefix.

### 4. Apply the database migrations

The database schema is versioned in [`supabase/migrations`](supabase/migrations). The migrations create and align the profiles, medicines, categories, orders, order items, and payments functionality, as well as their security policies.

Using the Supabase CLI is recommended:

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Alternatively, run the migration files in order from the Supabase Dashboard's **SQL Editor**. Keep schema changes in versioned migration files rather than editing production policies manually.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Paystack Webhooks

To update payment and order status reliably, configure the following endpoint in the Paystack dashboard:

```text
https://YOUR_DOMAIN/api/payments/webhook
```

The webhook validates Paystack's `x-paystack-signature` header and uses the server-only service-role client to update payment records. Set `NEXT_PUBLIC_SITE_URL` to the same public domain used by the callback flow.

For local development, use a secure tunnel such as ngrok or Cloudflare Tunnel if Paystack needs to reach your local webhook endpoint.

## Application Routes

| Route | Purpose |
|---|---|
| `/` | Pharmacy landing page and featured products |
| `/shop` | Searchable and filterable medicine catalogue |
| `/cart` | Cart, delivery details, and checkout |
| `/upload-prescription` | Prescription submission flow |
| `/ask` | Ask a pharmacist |
| `/account` | Orders, account overview, and customer actions |
| `/account/settings` | Profile and password settings |
| `/account/refill-reminders` | Previously purchased medicines and reorder options |
| `/auth` | Sign in and account registration |

## Project Structure

```text
src/
├── app/                 # Next.js routes, pages, and API handlers
│   ├── api/             # Payment, order, and receipt endpoints
│   ├── auth/            # Sign in, sign up, and password recovery
│   ├── account/         # Customer account pages
│   ├── shop/            # Product catalogue
│   └── cart/            # Cart and checkout
├── components/          # Shared UI, authentication, cart, and layout components
├── lib/                 # Supabase clients, validation, payments, and PDF utilities
└── services/            # Data-access functions for products, orders, profiles, and categories

supabase/
├── config.toml          # Supabase CLI configuration
└── migrations/          # Versioned PostgreSQL migrations and RLS policies
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |

Before opening a pull request, run:

```bash
npm run lint
npm run typecheck
npm run build
```

## Security Notes

- Supabase Row Level Security limits customers to their own profile, order, and payment data.
- Customers cannot promote themselves to an administrator through profile updates.
- Payment status changes are performed by trusted server-side routes after verification.
- Paystack webhook requests are authenticated using HMAC-SHA512 signatures.
- Do not expose `PAYSTACK_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Prescription and medication decisions should be reviewed by qualified, licensed pharmacy professionals. This application does not replace professional medical advice.

## Contributing

1. Create a feature branch.
2. Make focused changes and update migrations when the database schema changes.
3. Run linting, type-checking, and the production build.
4. Open a pull request with a clear description of the change and any required environment or migration steps.

## License

No license has currently been specified for this repository. Contact the repository owner before using, distributing, or adapting the code.

## Contact

For project questions or support, open an issue in the [Pulse Pharma repository](https://github.com/tyrisegloves-cmd/pulse-pharma/issues).
