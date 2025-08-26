# Stripe Integration API Documentation

## Overview

This document describes the Stripe integration API endpoints for the Garden App platform. The API handles customer payments, platform fee collection, and contractor payouts through Stripe's payment processing infrastructure.

## Base URL

```
https://your-domain.com/api/stripe
```

## Authentication

All API endpoints require proper Stripe configuration. The following environment variables must be set:

- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Webhook endpoint secret for event verification
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key (for frontend)

## API Endpoints

### 1. Create Payment Intent

**Endpoint:** `POST /api/stripe/payment-intent`

**Description:** Creates a Stripe payment intent for customer payment processing.

**Request Body:**
```json
{
  "amount": 2500.00,
  "currency": "USD",
  "customerId": "customer_123",
  "projectId": "project_456",
  "metadata": {
    "projectTitle": "Garden Landscaping Project",
    "customerEmail": "customer@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pi_3OqK8t2eZvKYlo2C1gFJQvX",
    "amount": 2500.00,
    "currency": "USD",
    "status": "requires_payment_method",
    "customerId": "customer_123",
    "projectId": "project_456",
    "metadata": {
      "projectTitle": "Garden Landscaping Project",
      "customerEmail": "customer@example.com",
      "stripePaymentIntentId": "pi_3OqK8t2eZvKYlo2C1gFJQvX"
    }
  }
}
```

**Error Response:**
```json
{
  "error": "Failed to create payment intent",
  "details": "Amount must be greater than 0"
}
```

### 2. Retrieve Payment Intent

**Endpoint:** `GET /api/stripe/payment-intent?id={paymentIntentId}`

**Description:** Retrieves details of a specific payment intent.

**Query Parameters:**
- `id` (required): The Stripe payment intent ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pi_3OqK8t2eZvKYlo2C1gFJQvX",
    "object": "payment_intent",
    "amount": 250000,
    "currency": "usd",
    "status": "requires_payment_method",
    "metadata": {
      "customerId": "customer_123",
      "projectId": "project_456"
    }
  }
}
```

### 3. Capture Payment

**Endpoint:** `POST /api/stripe/capture-payment`

**Description:** Captures a customer payment after project approval.

**Request Body:**
```json
{
  "paymentIntentId": "pi_3OqK8t2eZvKYlo2C1gFJQvX"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pi_3OqK8t2eZvKYlo2C1gFJQvX",
    "amount": 2500.00,
    "currency": "USD",
    "status": "succeeded",
    "customerId": "customer_123",
    "projectId": "project_456",
    "metadata": {
      "projectTitle": "Garden Landscaping Project",
      "stripePaymentIntentId": "pi_3OqK8t2eZvKYlo2C1gFJQvX"
    }
  }
}
```

### 4. Process Payment Distribution

**Endpoint:** `POST /api/stripe/payment-distribution`

**Description:** Processes payment distribution including platform fees and contractor payouts.

**Request Body:**
```json
{
  "projectId": "project_456",
  "customerPaymentId": "pi_3OqK8t2eZvKYlo2C1gFJQvX",
  "totalAmount": 2500.00,
  "contractorId": "contractor_456",
  "projectComplexity": "medium"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pd_1703123456789_abc123def",
    "projectId": "project_456",
    "customerPaymentId": "pi_3OqK8t2eZvKYlo2C1gFJQvX",
    "contractorPayoutId": "cp_1703123456789_xyz789ghi",
    "totalAmount": 2500.00,
    "platformFee": 125.00,
    "contractorAmount": 2125.00,
    "holdbackAmount": 250.00,
    "status": "processing",
    "createdAt": "2023-12-21T10:30:56.789Z"
  }
}
```

### 5. Retrieve Payment Distributions

**Endpoint:** `GET /api/stripe/payment-distribution?projectId={projectId}`

**Description:** Retrieves payment distribution data for a specific project.

**Query Parameters:**
- `projectId` (required): The project identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Payment distribution data would be fetched here",
    "projectId": "project_456"
  }
}
```

### 6. Webhook Endpoint

**Endpoint:** `POST /api/stripe/webhook`

**Description:** Receives Stripe webhook events for real-time payment updates.

**Headers:**
- `stripe-signature`: Stripe webhook signature for verification

**Supported Events:**
- `payment_intent.succeeded`: Payment completed successfully
- `payment_intent.payment_failed`: Payment failed
- `transfer.created`: Contractor payout transfer created
- `transfer.paid`: Contractor payout completed
- `transfer.failed`: Contractor payout failed
- `charge.refunded`: Payment refunded

**Response:**
```json
{
  "received": true
}
```

## Data Models

### PaymentIntent

```typescript
interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  customerId: string;
  projectId: string;
  contractorId?: string;
  metadata: Record<string, string>;
}
```

### PaymentDistribution

```typescript
interface PaymentDistribution {
  id: string;
  projectId: string;
  customerPaymentId: string;
  contractorPayoutId?: string;
  totalAmount: number;
  platformFee: number;
  contractorAmount: number;
  holdbackAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}
```

### ContractorPayout

```typescript
interface ContractorPayout {
  id: string;
  contractorId: string;
  projectId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stripeTransferId?: string;
  metadata: Record<string, string>;
  createdAt: Date;
  completedAt?: Date;
}
```

## Fee Structure

### Platform Fees

The platform applies different fee percentages based on project complexity:

- **Simple Projects**: 3% platform fee
- **Medium Projects**: 5% platform fee  
- **Complex Projects**: 7% platform fee

### Holdback System

A 10% holdback is applied to all projects and released upon completion:

- **Immediate Payout**: 90% of net amount (after platform fee)
- **Holdback**: 10% held until project completion
- **Release**: Automatic or manual release based on completion verification

### Minimum Fees

- **Development**: $1.00 minimum platform fee
- **Staging**: $2.00 minimum platform fee
- **Production**: $5.00 minimum platform fee

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message description",
  "details": "Additional error details or technical information"
}
```

### Common HTTP Status Codes

- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

### Error Types

1. **Validation Errors**: Missing required fields, invalid amounts
2. **Stripe API Errors**: Payment processing failures, network issues
3. **Configuration Errors**: Missing environment variables, invalid keys
4. **Webhook Errors**: Invalid signatures, unsupported events

## Security Considerations

### Webhook Verification

All webhook events are verified using Stripe's signature verification:

```typescript
const event = stripe.webhooks.constructEvent(
  payload,
  signature,
  webhookSecret
);
```

### Environment Variables

Never expose Stripe secret keys in client-side code. Only use publishable keys for frontend Stripe.js integration.

### Rate Limiting

Consider implementing rate limiting for production use to prevent abuse.

## Integration Examples

### Frontend Integration (React)

```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const handlePayment = async (amount: number) => {
  try {
    // Create payment intent
    const response = await fetch('/api/stripe/payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency: 'USD',
        customerId: 'customer_123',
        projectId: 'project_456'
      })
    });
    
    const { data: paymentIntent } = await response.json();
    
    // Redirect to Stripe Checkout or use Stripe Elements
    const stripe = await stripePromise;
    // ... Stripe payment flow
  } catch (error) {
    console.error('Payment error:', error);
  }
};
```

### Backend Integration (Node.js)

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (amount: number, currency: string) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      capture_method: 'manual'
    });
    
    return paymentIntent;
  } catch (error) {
    throw new Error(`Stripe error: ${error.message}`);
  }
};
```

## Testing

### Test Mode

Use Stripe test keys for development and testing:

- **Test Secret Key**: `sk_test_...`
- **Test Publishable Key**: `pk_test_...`
- **Test Webhook Secret**: `whsec_test_...`

### Test Cards

Use Stripe's test card numbers for testing:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

### Webhook Testing

Use Stripe CLI for local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Monitoring and Analytics

### Key Metrics

- Payment success/failure rates
- Platform fee revenue
- Contractor payout volumes
- Holdback release timing
- Webhook delivery success rates

### Logging

All API endpoints include comprehensive logging for debugging and monitoring:

```typescript
console.error('Error creating payment intent:', error);
console.log('Payment succeeded:', event.data.object);
```

## Support and Troubleshooting

### Common Issues

1. **Missing Environment Variables**: Ensure all required Stripe keys are set
2. **Webhook Failures**: Verify webhook endpoint URL and secret
3. **Payment Declines**: Check customer payment method and limits
4. **Transfer Failures**: Verify contractor account setup

### Getting Help

- Check Stripe Dashboard for detailed error logs
- Review webhook event history
- Consult Stripe documentation for API-specific issues
- Contact platform support for integration questions

## Version History

- **v1.0.0**: Initial Stripe integration with payment intents and distributions
- **v1.1.0**: Added webhook support and contractor payouts
- **v1.2.0**: Enhanced fee structure and holdback system

## Changelog

### v1.2.0 (Current)
- Added project complexity-based fee adjustments
- Implemented holdback system for contractor payouts
- Enhanced webhook event handling
- Added comprehensive error handling and logging

### v1.1.0
- Added webhook endpoint for real-time updates
- Implemented contractor payout system
- Added payment distribution processing

### v1.0.0
- Basic payment intent creation and retrieval
- Payment capture functionality
- Initial API structure and documentation

