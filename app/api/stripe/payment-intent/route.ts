import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/stripe-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency, customerId, projectId, metadata } = body;

    // Validate required fields
    if (!amount || !currency || !customerId || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, currency, customerId, projectId' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Create payment intent
    const paymentIntent = await stripeService.createCustomerPaymentIntent(
      amount,
      currency,
      customerId,
      projectId,
      metadata || {}
    );

    return NextResponse.json({
      success: true,
      data: paymentIntent,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create payment intent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('id');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Get payment intent details
    const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);

    return NextResponse.json({
      success: true,
      data: paymentIntent,
    });
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve payment intent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
