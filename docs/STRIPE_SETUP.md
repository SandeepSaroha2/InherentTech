# Stripe Billing Integration Setup

This guide walks through the complete Stripe integration for InherentTech's subscription billing system.

## Environment Variables

Add these to your `.env` file (see `.env.example` for reference):

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

- **STRIPE_SECRET_KEY**: Your Stripe secret key (server-only)
- **STRIPE_PUBLISHABLE_KEY**: Your Stripe publishable key
- **STRIPE_WEBHOOK_SECRET**: Webhook signing secret from Stripe Dashboard
- **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**: Client-side publishable key (duplicate of STRIPE_PUBLISHABLE_KEY)

## Setting Up Stripe

### 1. Create Stripe Account

- Go to [stripe.com](https://stripe.com)
- Sign up or log in to your Stripe account
- Use **Test Mode** for development

### 2. Get API Keys

1. Go to **Developers → API Keys**
2. Copy your **Secret Key** (starts with `sk_test_`)
3. Copy your **Publishable Key** (starts with `pk_test_`)
4. Add both to `.env`

### 3. Create Products and Prices

For each plan tier (Free, Starter, Professional, Enterprise), you need to create Stripe Products and Prices.

#### Via Stripe Dashboard:

1. Go to **Products** in the left sidebar
2. Click **Add Product**
3. Create a product for each plan:

   - **Plan Name**: Free
   - **Type**: Service
   - **Pricing Model**: Recurring
   - **Billing Period**: Monthly
   - **Price**: $0 (free tier)

   - **Plan Name**: Starter
   - **Price**: $99/month
   - **Annual Price**: $990/year (optional, for annual billing)

   - **Plan Name**: Professional
   - **Price**: $299/month
   - **Annual Price**: $2,990/year

   - **Plan Name**: Enterprise
   - **Price**: Custom (contact for pricing)
   - **Annual Price**: Custom

4. For each price, note the **Price ID** (starts with `price_`)

#### Via API/Code (Alternative):

Use the Stripe CLI or Node.js SDK to create products programmatically.

### 4. Update Database Plans

Update the `Plan` records in your database to include Stripe Price IDs:

```sql
UPDATE plans SET
  stripePriceId = 'price_xxx',
  stripeAnnualPriceId = 'price_yyy'
WHERE tier = 'STARTER';
```

Or use Prisma:

```typescript
import { prisma } from '@inherenttech/db';

await prisma.plan.update({
  where: { tier: 'STARTER' },
  data: {
    stripePriceId: 'price_xxx',
    stripeAnnualPriceId: 'price_yyy',
  },
});
```

### 5. Set Up Webhooks

Stripe uses webhooks to notify your app of subscription events (charges, cancellations, etc.).

#### Create Webhook Endpoint:

1. Go to **Developers → Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: `https://yourdomain.com/api/billing/webhook`
4. **Events to send**: Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Create endpoint**

#### Get Webhook Secret:

1. Click on the endpoint you just created
2. Scroll to "Signing secret"
3. Click **Reveal** and copy the secret (starts with `whsec_`)
4. Add to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`

#### Testing Webhooks Locally (Development):

Use the **Stripe CLI** to forward webhook events to your local machine:

1. [Install Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run: `stripe listen --forward-to localhost:3000/api/billing/webhook`
3. Copy the webhook secret and add to `.env`
4. Test events with: `stripe trigger checkout.session.completed`

## Project Structure

### New Files Created

```
packages/db/src/stripe.ts
├── getStripe() — Lazy-load Stripe client
└── resetStripe() — Reset instance (testing)

apps/web/src/app/api/billing/
├── checkout/route.ts — Create checkout session
├── portal/route.ts — Create customer portal session
└── webhook/route.ts — Handle Stripe events

apps/web/src/app/(admin)/dashboard/billing/
└── page.tsx — Billing UI dashboard
```

### Modified Files

- `packages/db/src/index.ts` — Export Stripe functions
- `packages/db/package.json` — Add `stripe` dependency
- `apps/web/package.json` — Add `stripe` dependency
- `.env.example` — Add Stripe variables

## API Endpoints

### GET `/api/billing`

Get current subscription and plan details.

**Headers:**
```
x-org-id: <organization-id>
```

**Response:**
```json
{
  "subscription": {
    "id": "sub_123",
    "status": "ACTIVE",
    "currentPeriodStart": "2024-01-01T00:00:00Z",
    "currentPeriodEnd": "2024-02-01T00:00:00Z",
    "cancelAtPeriodEnd": false
  },
  "plan": {
    "id": "plan_123",
    "name": "Professional",
    "price": 299,
    "features": ["AI Agents", "Advanced Analytics"],
    "limits": {
      "maxUsers": 10,
      "maxCandidates": 5000
    }
  },
  "usage": {
    "users": 5,
    "candidates": 1200
  }
}
```

### GET `/api/billing/plans`

List all available plans.

**Response:**
```json
{
  "plans": [
    {
      "id": "plan_123",
      "name": "Starter",
      "tier": "STARTER",
      "price": 99,
      "annualPrice": 990,
      "features": ["Basic Features"],
      "stripePriceId": "price_xxx",
      "stripeAnnualPriceId": "price_yyy"
    }
  ]
}
```

### POST `/api/billing/checkout`

Create a Stripe Checkout session for plan upgrade.

**Headers:**
```
x-org-id: <organization-id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "planId": "plan_123",
  "billingCycle": "monthly" // or "annual"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_123",
  "url": "https://checkout.stripe.com/pay/cs_test_123"
}
```

### POST `/api/billing/portal`

Create a Stripe Customer Portal session for managing subscription.

**Headers:**
```
x-org-id: <organization-id>
```

**Response:**
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

### POST `/api/billing/webhook`

Receive webhook events from Stripe. This endpoint is called by Stripe's servers, not by your frontend.

**Handled Events:**
- `checkout.session.completed` — Creates/updates subscription
- `customer.subscription.updated` — Updates subscription status
- `customer.subscription.deleted` — Cancels subscription
- `invoice.payment_succeeded` — Logs payment
- `invoice.payment_failed` — Updates status to PAST_DUE

## Database Schema

### Plan Model

```prisma
model Plan {
  id String @id @default(uuid())
  name String
  tier PlanTier @unique
  price Float
  annualPrice Float?

  stripePriceId String?           // Monthly price ID
  stripeAnnualPriceId String?    // Annual price ID

  // ... other fields
}
```

### Subscription Model

```prisma
model Subscription {
  id String @id @default(uuid())
  orgId String @unique
  planId String

  status SubscriptionStatus      // TRIALING, ACTIVE, PAST_DUE, CANCELLED, EXPIRED
  currentPeriodStart DateTime
  currentPeriodEnd DateTime
  cancelAtPeriodEnd Boolean @default(false)

  stripeCustomerId String?         // Stripe customer ID
  stripeSubscriptionId String?    // Stripe subscription ID

  // ... other fields
}
```

### Organization Model

```prisma
model Organization {
  // ...
  plan String @default("free")  // free, starter, professional, enterprise
  subscription Subscription?
}
```

## Frontend Usage

### Billing Page

Access the billing dashboard at `/dashboard/billing`

Features:
- Display current plan and subscription status
- Show monthly vs. annual pricing toggle
- Display all available plans with upgrade buttons
- Monthly usage statistics
- "Manage Subscription" button to access Stripe portal

### Checkout Flow

1. User clicks "Upgrade" button on a plan
2. POST to `/api/billing/checkout` with planId
3. Receive Stripe Checkout URL
4. Redirect user to Stripe Checkout
5. User enters payment info and completes payment
6. Stripe calls webhook `/api/billing/webhook`
7. Webhook updates subscription in database
8. User redirected back to `/dashboard/billing?success=true`

### Subscription Management

1. User clicks "Manage Subscription" button
2. POST to `/api/billing/portal`
3. Receive Stripe Portal URL
4. Redirect user to Stripe Customer Portal
5. User can change plan, update payment method, cancel subscription
6. Changes sync back via webhooks

## Testing Checklist

- [ ] Environment variables are set correctly
- [ ] Stripe products and prices are created
- [ ] Plan records have Stripe price IDs
- [ ] Webhook endpoint is configured
- [ ] Webhook secret is in `.env`
- [ ] Run `npm install` to get Stripe package
- [ ] Test checkout flow on staging/dev
- [ ] Test webhook events locally with Stripe CLI
- [ ] Test subscription upgrades/downgrades
- [ ] Test cancellation flow
- [ ] Test payment failure handling

## Troubleshooting

### "STRIPE_SECRET_KEY not set"
- Check `.env` file has `STRIPE_SECRET_KEY`
- Restart your development server after adding env vars

### Webhook not being called
- Verify webhook endpoint URL is publicly accessible
- Check Stripe Dashboard → Webhooks for failed deliveries
- Ensure webhook secret is correct
- Use Stripe CLI to test locally: `stripe trigger checkout.session.completed`

### Checkout redirects to wrong URL
- Verify `success_url` and `cancel_url` in `/api/billing/checkout`
- Check that your app's domain is configured correctly
- In development, use `localhost:3000` or your ngrok URL

### Plan not found error
- Ensure Plan records exist in database with `isActive: true`
- Verify `stripePriceId` is set on the Plan
- Check Stripe product is published and price is active

## Advanced: Metered Billing

For usage-based pricing (e.g., pay per API call), Stripe supports metered billing:

1. Create a product with "Usage" pricing model in Stripe
2. Record usage via `stripe.subscriptionSchedules.create()`
3. Update `UsageRecord` table in database
4. Query usage in `/api/billing` endpoint

See Stripe docs: https://stripe.com/docs/billing/subscriptions/metered-billing

## References

- [Stripe Billing Documentation](https://stripe.com/docs/billing)
- [Stripe Checkout Documentation](https://stripe.com/docs/checkout)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Node.js Stripe SDK](https://github.com/stripe/stripe-node)
