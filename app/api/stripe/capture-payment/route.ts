import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/stripe-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId } = body;

    // Validate required fields
    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Capture the payment
    const capturedPayment = await stripeService.captureCustomerPayment(paymentIntentId);

    return NextResponse.json({
      success: true,
      data: capturedPayment,
    });
  } catch (error) {
    console.error('Error capturing payment:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to capture payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

