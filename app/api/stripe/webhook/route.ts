import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/stripe-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    // Get webhook secret from environment
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET environment variable is not set');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    const event = await stripeService.handleWebhookEvent(body, signature, webhookSecret);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', event.data.object);
        // Handle successful payment
        // You might want to update project status, send notifications, etc.
        break;

      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object);
        // Handle failed payment
        // You might want to send failure notifications, update project status, etc.
        break;

      case 'transfer.created':
        console.log('Transfer created:', event.data.object);
        // Handle contractor payout transfer
        // You might want to update payout status, send notifications, etc.
        break;

      case 'transfer.paid':
        console.log('Transfer paid:', event.data.object);
        // Handle successful contractor payout
        // You might want to update payout status, send confirmation, etc.
        break;

      case 'transfer.failed':
        console.log('Transfer failed:', event.data.object);
        // Handle failed contractor payout
        // You might want to retry, send failure notifications, etc.
        break;

      case 'charge.refunded':
        console.log('Charge refunded:', event.data.object);
        // Handle refund
        // You might want to update project status, send notifications, etc.
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    );
  }
}

