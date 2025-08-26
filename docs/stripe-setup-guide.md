# Stripe Integration Setup Guide

## Quick Start

This guide will walk you through setting up the Stripe integration for the Garden App platform in under 10 minutes.

## Prerequisites

- Node.js 18+ installed
- A Stripe account (free to create)
- Access to your Stripe Dashboard

## Step 1: Install Dependencies

The Stripe packages are already installed, but verify they're in your `package.json`:

```bash
npm list stripe @stripe/stripe-js
```

If not installed, run:
```bash
npm install stripe @stripe/stripe-js
```

## Step 2: Get Your Stripe Keys

1. **Log into your Stripe Dashboard**: https://dashboard.stripe.com/
2. **Navigate to Developers → API keys**
3. **Copy your keys**:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

## Step 3: Set Up Environment Variables

Create a `.env.local` file in your project root:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Important**: Never commit your `.env.local` file to version control!

## Step 4: Set Up Webhook Endpoint

1. **In Stripe Dashboard**: Go to Developers → Webhooks
2. **Click "Add endpoint"**
3. **Set endpoint URL**: `https://your-domain.com/api/stripe/webhook`
4. **Select events to listen for**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `transfer.created`
   - `transfer.paid`
   - `transfer.failed`
   - `charge.refunded`
5. **Copy the webhook signing secret** and add it to your `.env.local`

## Step 5: Test the Integration

### Start Your Development Server

```bash
npm run dev
```

### Navigate to the Payments Tab

1. Open your app at `http://localhost:3000`
2. Click on the "Payments" tab
3. You should see the payment interface

### Test Payment Flow

1. **Enter an amount** (e.g., 2500.00)
2. **Select currency** (USD)
3. **Choose project complexity** (Medium)
4. **Click "Create Payment Intent"**

You should see a success message with a payment intent ID.

## Step 6: Test API Endpoints

### Test Payment Intent Creation

```bash
curl -X POST http://localhost:3000/api/stripe/payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000.00,
    "currency": "USD",
    "customerId": "customer_123",
    "projectId": "project_456"
  }'
```

### Test Payment Intent Retrieval

```bash
curl "http://localhost:3000/api/stripe/payment-intent?id=pi_your_payment_intent_id"
```

## Step 7: Test Webhooks (Local Development)

### Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
# Download from: https://github.com/stripe/stripe-cli/releases

# Linux
# Download from: https://github.com/stripe/stripe-cli/releases
```

### Login to Stripe

```bash
stripe login
```

### Forward Webhooks to Local Server

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will give you a webhook secret. Update your `.env.local` with this secret for local testing.

## Configuration Options

### Fee Structure

You can customize the fee structure in `config/stripe.config.ts`:

```typescript
export const stripeConfig = {
  fees: {
    platformFeePercentage: 0.05, // 5% default
    minimumPlatformFee: 5.00, // $5.00 minimum
    holdbackPercentage: 0.10, // 10% holdback
  },
  
  complexityFees: {
    simple: 0.03, // 3% for simple projects
    medium: 0.05, // 5% for medium projects
    complex: 0.07, // 7% for complex projects
  },
};
```

### Environment-Specific Settings

The configuration automatically adjusts for different environments:

```typescript
// Development: 1% fee, $1.00 minimum
// Staging: 2% fee, $2.00 minimum  
// Production: 5% fee, $5.00 minimum
```

## Troubleshooting

### Common Issues

#### 1. "STRIPE_SECRET_KEY environment variable is required"

**Solution**: Check your `.env.local` file and ensure the variable is set correctly.

#### 2. "Webhook signature verification failed"

**Solution**: Verify your webhook secret in `.env.local` matches the one from Stripe Dashboard.

#### 3. Payment Intent Creation Fails

**Solution**: Check your Stripe secret key is valid and has the correct permissions.

#### 4. Webhook Events Not Received

**Solution**: 
- Verify webhook endpoint URL is correct
- Check webhook secret is properly set
- Ensure your server is accessible from the internet (for production)

### Debug Mode

Enable detailed logging by setting:

```bash
NODE_ENV=development
DEBUG=stripe:*
```

### Check Stripe Dashboard

- **Logs**: Developers → Logs
- **Webhooks**: Developers → Webhooks → Select endpoint → Events
- **Payments**: Payments → Payment intents

## Production Deployment

### Environment Variables

Ensure these are set in your production environment:

```bash
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
NODE_ENV=production
```

### Webhook Endpoint

Update your webhook endpoint URL to your production domain:

```
https://yourdomain.com/api/stripe/webhook
```

### SSL Certificate

Ensure your production server has a valid SSL certificate (Stripe requires HTTPS).

### Rate Limiting

Consider implementing rate limiting for production use:

```typescript
// Example with express-rate-limit
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/stripe', limiter);
```

## Security Best Practices

### 1. Never Expose Secret Keys

- Keep `STRIPE_SECRET_KEY` server-side only
- Use `STRIPE_PUBLISHABLE_KEY` for frontend only
- Never log or expose secret keys

### 2. Webhook Verification

Always verify webhook signatures:

```typescript
const event = stripe.webhooks.constructEvent(
  payload,
  signature,
  webhookSecret
);
```

### 3. Input Validation

Validate all input data:

```typescript
if (!amount || amount <= 0) {
  return NextResponse.json(
    { error: 'Amount must be greater than 0' },
    { status: 400 }
  );
}
```

### 4. Error Handling

Don't expose internal errors to clients:

```typescript
catch (error) {
  console.error('Internal error:', error);
  return NextResponse.json(
    { error: 'Payment processing failed' },
    { status: 500 }
  );
}
```

## Testing with Real Cards

### Test Card Numbers

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

### Test Expiry and CVC

- **Expiry**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)

## Next Steps

### 1. Customize the UI

Modify `app/components/payment-interface.tsx` to match your design requirements.

### 2. Add User Authentication

Integrate with your existing user system to get real `customerId` and `contractorId` values.

### 3. Implement Database Storage

Store payment records in your database for reporting and analytics.

### 4. Add Email Notifications

Send confirmation emails when payments are processed.

### 5. Implement Refund System

Add refund functionality for disputed or cancelled projects.

## Support

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Support**: Available in your Stripe Dashboard
- **Platform Issues**: Check the project's issue tracker

## Changelog

- **v1.0.0**: Initial setup guide
- Added quick start instructions
- Included troubleshooting section
- Added security best practices

