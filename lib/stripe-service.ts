import Stripe from 'stripe';

// Types for our payment system
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  customerId: string;
  projectId: string;
  contractorId?: string;
  metadata: Record<string, string>;
}

export interface PaymentDistribution {
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

export interface ContractorPayout {
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

export class StripeService {
  private stripe: Stripe;
  private platformFeePercentage: number = 0.05; // 5% platform fee
  private holdbackPercentage: number = 0.10; // 10% holdback until completion
  private minimumPlatformFee: number = 500; // $5.00 minimum fee

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia',
    });
  }

  /**
   * Create a payment intent for customer payment
   */
  async createCustomerPaymentIntent(
    amount: number,
    currency: string,
    customerId: string,
    projectId: string,
    metadata: Record<string, string> = {}
  ): Promise<PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          customerId,
          projectId,
          type: 'customer_payment',
          ...metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
        capture_method: 'manual', // Don't capture immediately
      });

      return {
        id: paymentIntent.id,
        amount: amount,
        currency: currency,
        status: paymentIntent.status,
        customerId,
        projectId,
        metadata: {
          ...metadata,
          stripePaymentIntentId: paymentIntent.id,
        },
      };
    } catch (error) {
      console.error('Error creating customer payment intent:', error);
      throw new Error(`Failed to create payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Capture customer payment after project approval
   */
  async captureCustomerPayment(paymentIntentId: string): Promise<PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.capture(paymentIntentId);
      
      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        customerId: paymentIntent.metadata.customerId,
        projectId: paymentIntent.metadata.projectId,
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      console.error('Error capturing customer payment:', error);
      throw new Error(`Failed to capture payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate payment distribution including platform fees and holdback
   */
  calculatePaymentDistribution(
    totalAmount: number,
    projectComplexity: 'simple' | 'medium' | 'complex' = 'medium'
  ): {
    platformFee: number;
    contractorAmount: number;
    holdbackAmount: number;
    netContractorAmount: number;
  } {
    // Adjust platform fee based on project complexity
    let adjustedPlatformFeePercentage = this.platformFeePercentage;
    switch (projectComplexity) {
      case 'simple':
        adjustedPlatformFeePercentage = 0.03; // 3% for simple projects
        break;
      case 'complex':
        adjustedPlatformFeePercentage = 0.07; // 7% for complex projects
        break;
    }

    const platformFee = Math.max(
      totalAmount * adjustedPlatformFeePercentage,
      this.minimumPlatformFee / 100 // Convert minimum fee to dollars
    );
    
    const holdbackAmount = totalAmount * this.holdbackPercentage;
    const contractorAmount = totalAmount - platformFee - holdbackAmount;
    const netContractorAmount = contractorAmount; // Amount available immediately

    return {
      platformFee,
      contractorAmount,
      holdbackAmount,
      netContractorAmount,
    };
  }

  /**
   * Process payment distribution and create contractor payout
   */
  async processPaymentDistribution(
    projectId: string,
    customerPaymentId: string,
    totalAmount: number,
    contractorId: string,
    projectComplexity: 'simple' | 'medium' | 'complex' = 'medium'
  ): Promise<PaymentDistribution> {
    try {
      const distribution = this.calculatePaymentDistribution(totalAmount, projectComplexity);
      
      // Create the payment distribution record
      const paymentDistribution: PaymentDistribution = {
        id: `pd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectId,
        customerPaymentId,
        totalAmount,
        platformFee: distribution.platformFee,
        contractorAmount: distribution.contractorAmount,
        holdbackAmount: distribution.holdbackAmount,
        status: 'pending',
        createdAt: new Date(),
      };

      // Create contractor payout (immediate portion)
      const contractorPayout = await this.createContractorPayout(
        contractorId,
        projectId,
        distribution.netContractorAmount,
        'usd',
        { type: 'initial_payout', paymentDistributionId: paymentDistribution.id }
      );

      paymentDistribution.contractorPayoutId = contractorPayout.id;
      paymentDistribution.status = 'processing';

      return paymentDistribution;
    } catch (error) {
      console.error('Error processing payment distribution:', error);
      throw new Error(`Failed to process payment distribution: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create contractor payout via Stripe Connect
   */
  async createContractorPayout(
    contractorId: string,
    projectId: string,
    amount: number,
    currency: string,
    metadata: Record<string, string> = {}
  ): Promise<ContractorPayout> {
    try {
      // In a real implementation, you'd use Stripe Connect to transfer to contractor accounts
      // For now, we'll simulate the transfer creation
      const transfer = await this.stripe.transfers.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        destination: `acct_${contractorId}`, // This would be the contractor's Stripe account
        metadata: {
          contractorId,
          projectId,
          type: 'contractor_payout',
          ...metadata,
        },
      });

      const contractorPayout: ContractorPayout = {
        id: `cp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contractorId,
        projectId,
        amount,
        currency,
        status: 'processing',
        stripeTransferId: transfer.id,
        metadata: {
          ...metadata,
          stripeTransferId: transfer.id,
        },
        createdAt: new Date(),
      };

      return contractorPayout;
    } catch (error) {
      console.error('Error creating contractor payout:', error);
      throw new Error(`Failed to create contractor payout: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Release holdback amount to contractor upon project completion
   */
  async releaseHoldback(
    paymentDistributionId: string,
    projectId: string,
    contractorId: string
  ): Promise<ContractorPayout> {
    try {
      // In a real implementation, you'd fetch the payment distribution
      // and calculate the holdback amount
      const holdbackAmount = 0; // This would be fetched from the payment distribution
      
      if (holdbackAmount <= 0) {
        throw new Error('No holdback amount available to release');
      }

      const holdbackPayout = await this.createContractorPayout(
        contractorId,
        projectId,
        holdbackAmount,
        'usd',
        { type: 'holdback_release', paymentDistributionId }
      );

      return holdbackPayout;
    } catch (error) {
      console.error('Error releasing holdback:', error);
      throw new Error(`Failed to release holdback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refund customer payment (partial or full)
   */
  async refundCustomerPayment(
    paymentIntentId: string,
    amount?: number,
    reason: string = 'customer_request'
  ): Promise<{ id: string; amount: number; status: string }> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents
        reason: reason as any,
      });

      return {
        id: refund.id,
        amount: refund.amount / 100, // Convert from cents
        status: refund.status,
      };
    } catch (error) {
      console.error('Error refunding customer payment:', error);
      throw new Error(`Failed to create refund: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get payment intent details
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      throw new Error(`Failed to retrieve payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhookEvent(
    payload: string,
    signature: string,
    webhookSecret: string
  ): Promise<Stripe.Event> {
    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      return event;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw new Error('Webhook signature verification failed');
    }
  }

  /**
   * Get platform analytics
   */
  async getPlatformAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRevenue: number;
    totalPayments: number;
    totalPayouts: number;
    averagePlatformFee: number;
  }> {
    try {
      // In a real implementation, you'd query Stripe for actual data
      // For now, return mock data
      return {
        totalRevenue: 0,
        totalPayments: 0,
        totalPayouts: 0,
        averagePlatformFee: 0,
      };
    } catch (error) {
      console.error('Error getting platform analytics:', error);
      throw new Error(`Failed to get platform analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService();
