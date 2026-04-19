# Stripe Integration Checklist

## Files Created ✓

- [x] `packages/db/src/stripe.ts` - Stripe client
- [x] `apps/web/src/app/api/billing/checkout/route.ts` - Checkout endpoint
- [x] `apps/web/src/app/api/billing/portal/route.ts` - Portal endpoint
- [x] `apps/web/src/app/api/billing/webhook/route.ts` - Webhook handler
- [x] `apps/web/src/app/(admin)/dashboard/billing/page.tsx` - Billing UI
- [x] `docs/STRIPE_SETUP.md` - Setup guide

## Dependencies Added ✓

- [x] `packages/db/package.json` - Added stripe@^15.4.0
- [x] `apps/web/package.json` - Added stripe@^15.4.0

## Configuration Files Updated ✓

- [x] `packages/db/src/index.ts` - Exported getStripe, resetStripe
- [x] `.env.example` - Added Stripe variables

## Configuration Tasks (Manual)

### 1. Stripe Account Setup

- [ ] Create Stripe account at https://stripe.com
- [ ] Go to Developers → API Keys (Test Mode)
- [ ] Copy Secret Key: `sk_test_...`
- [ ] Copy Publishable Key: `pk_test_...`

### 2. Environment Variables

Add to `.env`:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (setup later)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

- [ ] Added STRIPE_SECRET_KEY
- [ ] Added STRIPE_PUBLISHABLE_KEY
- [ ] Added NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- [ ] Added STRIPE_WEBHOOK_SECRET (placeholder for now)

### 3. Create Stripe Products & Prices

For each plan tier (Free, Starter, Professional, Enterprise):

- [ ] Create Product in Stripe Dashboard
  - Name: Plan name (e.g., "Starter")
  - Type: Service
  - Tax code: (optional)

- [ ] Create Monthly Price
  - Amount: Price in cents
  - Billing period: Monthly
  - Currency: USD
  - Copy Price ID (starts with `price_`)

- [ ] Create Annual Price (if applicable)
  - Amount: Annual price in cents
  - Billing period: Yearly
  - Copy Price ID

### 4. Update Database Plans

Run Prisma update or raw SQL to add Stripe Price IDs to Plan records:

```prisma
await prisma.plan.update({
  where: { tier: 'STARTER' },
  data: {
    stripePriceId: 'price_xxx',      // Monthly price ID
    stripeAnnualPriceId: 'price_yyy', // Annual price ID
  },
});
```

- [ ] Updated Free plan stripePriceId
- [ ] Updated Starter plan stripePriceId & stripeAnnualPriceId
- [ ] Updated Professional plan stripePriceId & stripeAnnualPriceId
- [ ] Updated Enterprise plan stripePriceId & stripeAnnualPriceId

### 5. Webhook Setup

- [ ] Go to Stripe Dashboard → Developers → Webhooks
- [ ] Click "Add endpoint"
- [ ] Enter endpoint URL: `https://yourdomain.com/api/billing/webhook`
- [ ] Select events to send:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_succeeded`
  - [ ] `invoice.payment_failed`
- [ ] Create endpoint
- [ ] Copy webhook secret: `whsec_...`
- [ ] Add to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`

### 6. Install Dependencies

```bash
# From root directory
npm install
# or
yarn install
```

- [ ] Ran `npm install` or `yarn install`

### 7. Database Migration

If adding new fields (already in schema), run:

```bash
npx prisma db push
# or
npx prisma migrate dev
```

- [ ] Database schema is up to date

### 8. Testing

#### Local Testing Without Webhooks

- [ ] Access `/dashboard/billing` page
- [ ] View available plans
- [ ] Toggle between monthly/annual pricing
- [ ] Click "Upgrade" button on a plan
- [ ] Verify redirected to Stripe Checkout
- [ ] Use Stripe test card: `4242 4242 4242 4242`
- [ ] Complete checkout

#### Webhook Testing (Local)

Install Stripe CLI: https://stripe.com/docs/stripe-cli

```bash
# Terminal 1: Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/billing/webhook

# Copy the webhook secret and add to .env
# STRIPE_WEBHOOK_SECRET=whsec_...

# Terminal 2: Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

- [ ] Installed Stripe CLI
- [ ] Ran `stripe listen` and got webhook secret
- [ ] Updated .env with webhook secret
- [ ] Tested checkout.session.completed event
- [ ] Verified subscription created in database
- [ ] Tested customer.subscription.updated event
- [ ] Tested customer.subscription.deleted event

#### Staging/Production Testing

- [ ] Updated endpoint URL to production domain
- [ ] Created new webhook endpoint in Stripe Dashboard (live mode)
- [ ] Got live webhook secret (starts with `whsec_...`)
- [ ] Updated .env with live credentials
- [ ] Tested complete checkout flow with test card
- [ ] Verified subscription in database
- [ ] Tested portal access
- [ ] Tested subscription updates
- [ ] Tested cancellation flow

## API Endpoints

All endpoints expect `x-org-id` header for multi-tenancy:

```javascript
fetch('/api/billing', {
  headers: { 'x-org-id': organizationId }
})
```

### Current Endpoints

- [ ] **GET `/api/billing`** - Get subscription & usage
- [ ] **GET `/api/billing/plans`** - List available plans
- [ ] **POST `/api/billing/checkout`** - Create checkout session
- [ ] **POST `/api/billing/portal`** - Create portal session
- [ ] **POST `/api/billing/webhook`** - Handle Stripe events

## Database Records

### Plans Table

Verify all plans have Stripe price IDs:

```sql
SELECT id, name, tier, stripePriceId, stripeAnnualPriceId FROM plans;
```

- [ ] Free: stripePriceId set
- [ ] Starter: stripePriceId and stripeAnnualPriceId set
- [ ] Professional: stripePriceId and stripeAnnualPriceId set
- [ ] Enterprise: stripePriceId set

### Subscription Records

After first checkout, verify subscription created:

```sql
SELECT * FROM subscriptions WHERE orgId = '...';
```

- [ ] stripeCustomerId populated
- [ ] stripeSubscriptionId populated
- [ ] status set to ACTIVE
- [ ] currentPeriodStart and currentPeriodEnd set

## Middleware Configuration

Ensure your middleware or auth layer sets the `x-org-id` header:

```typescript
// middleware.ts or auth middleware
const orgId = getUserOrganizationId(); // From JWT or session
headers.set('x-org-id', orgId);
```

- [ ] Middleware sets x-org-id header
- [ ] x-org-id is available in all billing endpoints

## Frontend Integration

The billing page is located at: `/dashboard/billing`

Features:
- [ ] Displays current plan
- [ ] Shows subscription status
- [ ] Monthly vs. annual toggle works
- [ ] Plan cards render correctly
- [ ] Upgrade buttons trigger checkout
- [ ] Success message displays after upgrade
- [ ] "Manage Subscription" button opens portal
- [ ] Usage statistics display

## Monitoring

### Stripe Dashboard Checks

- [ ] Check Developers → Webhooks for delivery logs
- [ ] Verify no failed webhook deliveries
- [ ] Monitor revenue in Billing section
- [ ] Check customers for active subscriptions

### Application Logs

Check logs for:

- [ ] No STRIPE_SECRET_KEY errors
- [ ] Checkout sessions created successfully
- [ ] Webhook events processed
- [ ] Subscription records updated

## Documentation

- [ ] Read `docs/STRIPE_SETUP.md`
- [ ] Review API endpoint docs
- [ ] Understand webhook flow
- [ ] Know how to test locally with Stripe CLI

## Deployment Considerations

- [ ] Use separate Stripe account for staging/prod
- [ ] Keep STRIPE_WEBHOOK_SECRET secure in CI/CD
- [ ] Set up monitoring/alerting for failed webhooks
- [ ] Plan for webhook retry logic
- [ ] Document payment troubleshooting process
- [ ] Set up customer support process for billing issues

## Support & Debugging

### Common Issues

- [ ] Webhook secret invalid - use `stripe listen` to get correct secret
- [ ] Checkout redirects wrong - check domain in success_url/cancel_url
- [ ] Plan not found - verify stripePriceId is set in database
- [ ] Subscription not created - check webhook logs in Stripe Dashboard

### Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- [Stripe CLI Reference](https://stripe.com/docs/stripe-cli)
- `docs/STRIPE_SETUP.md` in this project

## Completion Status

- [ ] All files created
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Stripe products and prices created
- [ ] Database updated with price IDs
- [ ] Webhooks configured
- [ ] Local testing completed
- [ ] Staging/production testing completed
- [ ] Documentation reviewed
- [ ] Ready for production deployment

**Date Completed:** _____________
