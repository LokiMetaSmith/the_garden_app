export const stripeConfig = {
  // Required environment variables
  required: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  },
  
  // Optional environment variables
  optional: {
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
    STRIPE_API_VERSION: process.env.STRIPE_API_VERSION || '2024-12-18.acacia',
  },
  
  // Platform fee configuration
  fees: {
    platformFeePercentage: 0.05, // 5% default
    minimumPlatformFee: 5.00, // $5.00 minimum
    holdbackPercentage: 0.10, // 10% holdback
  },
  
  // Project complexity fee adjustments
  complexityFees: {
    simple: 0.03, // 3% for simple projects
    medium: 0.05, // 5% for medium projects
    complex: 0.07, // 7% for complex projects
  },
  
  // Currency configuration
  supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
  defaultCurrency: 'USD',
  
  // Webhook events to handle
  webhookEvents: [
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'transfer.created',
    'transfer.paid',
    'transfer.failed',
    'charge.refunded',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
  ],
  
  // Payment method configuration
  paymentMethods: {
    automatic: true,
    captureMethod: 'manual', // Don't capture immediately
    confirmationMethod: 'automatic',
  },
  
  // Transfer configuration for contractor payouts
  transfer: {
    automatic: false, // Manual transfers for better control
    destinationType: 'bank_account', // or 'card'
  },
};

// Validation function to check if all required config is present
export function validateStripeConfig(): { isValid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  Object.entries(stripeConfig.required).forEach(([key, value]) => {
    if (!value) {
      missing.push(key);
    }
  });
  
  return {
    isValid: missing.length === 0,
    missing,
  };
}

// Get Stripe configuration for different environments
export function getStripeConfig(environment: 'development' | 'staging' | 'production') {
  const baseConfig = { ...stripeConfig };
  
  switch (environment) {
    case 'development':
      return {
        ...baseConfig,
        fees: {
          ...baseConfig.fees,
          platformFeePercentage: 0.01, // 1% for development
          minimumPlatformFee: 1.00, // $1.00 minimum for development
        },
      };
    
    case 'staging':
      return {
        ...baseConfig,
        fees: {
          ...baseConfig.fees,
          platformFeePercentage: 0.02, // 2% for staging
          minimumPlatformFee: 2.00, // $2.00 minimum for staging
        },
      };
    
    case 'production':
      return baseConfig; // Use default production settings
    
    default:
      return baseConfig;
  }
}

