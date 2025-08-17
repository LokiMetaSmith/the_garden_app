import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/stripe-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, customerPaymentId, totalAmount, contractorId, projectComplexity } = body;

    // Validate required fields
    if (!projectId || !customerPaymentId || !totalAmount || !contractorId) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, customerPaymentId, totalAmount, contractorId' },
        { status: 400 }
      );
    }

    // Validate amount
    if (totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Total amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Process payment distribution
    const paymentDistribution = await stripeService.processPaymentDistribution(
      projectId,
      customerPaymentId,
      totalAmount,
      contractorId,
      projectComplexity || 'medium'
    );

    return NextResponse.json({
      success: true,
      data: paymentDistribution,
    });
  } catch (error) {
    console.error('Error processing payment distribution:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process payment distribution',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // In a real implementation, you'd fetch payment distributions from a database
    // For now, return a mock response
    return NextResponse.json({
      success: true,
      data: {
        message: 'Payment distribution data would be fetched here',
        projectId,
      },
    });
  } catch (error) {
    console.error('Error retrieving payment distributions:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve payment distributions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
