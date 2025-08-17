import { StripeService, PaymentIntent, PaymentDistribution, ContractorPayout } from '@/lib/stripe-service'

// Mock Stripe
const mockStripe = {
  paymentIntents: {
    create: jest.fn(),
    capture: jest.fn(),
    retrieve: jest.fn(),
  },
  transfers: {
    create: jest.fn(),
  },
  refunds: {
    create: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
}

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripe)
})

describe('StripeService', () => {
  let stripeService: StripeService
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env }
    
    // Set test environment variables
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
    
    // Clear all mocks
    jest.clearAllMocks()
    
    // Create new service instance
    stripeService = new StripeService()
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('constructor', () => {
    it('should throw error when STRIPE_SECRET_KEY is missing', () => {
      delete process.env.STRIPE_SECRET_KEY
      
      expect(() => new StripeService()).toThrow('STRIPE_SECRET_KEY environment variable is required')
    })

    it('should initialize with valid secret key', () => {
      expect(stripeService).toBeInstanceOf(StripeService)
    })
  })

  describe('createCustomerPaymentIntent', () => {
    const mockPaymentIntentData = {
      amount: 2500,
      currency: 'USD',
      customerId: 'customer_123',
      projectId: 'project_456',
      metadata: { projectTitle: 'Test Project' }
    }

    const mockStripeResponse = {
      id: 'pi_test_123',
      amount: 250000, // Stripe uses cents
      currency: 'usd',
      status: 'requires_payment_method',
      metadata: {
        customerId: 'customer_123',
        projectId: 'project_456',
        type: 'customer_payment',
        projectTitle: 'Test Project'
      }
    }

    it('should create payment intent successfully', async () => {
      mockStripe.paymentIntents.create.mockResolvedValue(mockStripeResponse)

      const result = await stripeService.createCustomerPaymentIntent(
        mockPaymentIntentData.amount,
        mockPaymentIntentData.currency,
        mockPaymentIntentData.customerId,
        mockPaymentIntentData.projectId,
        mockPaymentIntentData.metadata
      )

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 250000, // Should convert to cents
        currency: 'usd',
        metadata: {
          customerId: 'customer_123',
          projectId: 'project_456',
          type: 'customer_payment',
          projectTitle: 'Test Project'
        },
        automatic_payment_methods: {
          enabled: true,
        },
        capture_method: 'manual',
      })

      expect(result).toEqual({
        id: 'pi_test_123',
        amount: 2500,
        currency: 'USD',
        status: 'requires_payment_method',
        customerId: 'customer_123',
        projectId: 'project_456',
        metadata: {
          projectTitle: 'Test Project',
          stripePaymentIntentId: 'pi_test_123'
        }
      })
    })

    it('should handle Stripe errors', async () => {
      const stripeError = new Error('Stripe API error')
      mockStripe.paymentIntents.create.mockRejectedValue(stripeError)

      await expect(
        stripeService.createCustomerPaymentIntent(
          mockPaymentIntentData.amount,
          mockPaymentIntentData.currency,
          mockPaymentIntentData.customerId,
          mockPaymentIntentData.projectId
        )
      ).rejects.toThrow('Failed to create payment intent: Stripe API error')
    })

    it('should convert amount to cents correctly', async () => {
      mockStripe.paymentIntents.create.mockResolvedValue(mockStripeResponse)

      await stripeService.createCustomerPaymentIntent(
        99.99,
        'USD',
        'customer_123',
        'project_456'
      )

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 9999, // 99.99 * 100
        })
      )
    })
  })

  describe('captureCustomerPayment', () => {
    const mockStripeResponse = {
      id: 'pi_test_123',
      amount: 250000,
      currency: 'usd',
      status: 'succeeded',
      metadata: {
        customerId: 'customer_123',
        projectId: 'project_456'
      }
    }

    it('should capture payment successfully', async () => {
      mockStripe.paymentIntents.capture.mockResolvedValue(mockStripeResponse)

      const result = await stripeService.captureCustomerPayment('pi_test_123')

      expect(mockStripe.paymentIntents.capture).toHaveBeenCalledWith('pi_test_123')
      expect(result).toEqual({
        id: 'pi_test_123',
        amount: 2500, // Should convert from cents
        currency: 'USD',
        status: 'succeeded',
        customerId: 'customer_123',
        projectId: 'project_456',
        metadata: {
          customerId: 'customer_123',
          projectId: 'project_456'
        }
      })
    })

    it('should handle capture errors', async () => {
      const stripeError = new Error('Capture failed')
      mockStripe.paymentIntents.capture.mockRejectedValue(stripeError)

      await expect(
        stripeService.captureCustomerPayment('pi_test_123')
      ).rejects.toThrow('Failed to capture payment: Capture failed')
    })
  })

  describe('calculatePaymentDistribution', () => {
    it('should calculate simple project fees correctly', () => {
      const result = stripeService.calculatePaymentDistribution(1000, 'simple')

      expect(result.platformFee).toBe(30) // 3% of 1000
      expect(result.holdbackAmount).toBe(100) // 10% of 1000
      expect(result.contractorAmount).toBe(870) // 1000 - 30 - 100
      expect(result.netContractorAmount).toBe(870)
    })

    it('should calculate medium project fees correctly', () => {
      const result = stripeService.calculatePaymentDistribution(1000, 'medium')

      expect(result.platformFee).toBe(50) // 5% of 1000
      expect(result.holdbackAmount).toBe(100) // 10% of 1000
      expect(result.contractorAmount).toBe(850) // 1000 - 50 - 100
      expect(result.netContractorAmount).toBe(850)
    })

    it('should calculate complex project fees correctly', () => {
      const result = stripeService.calculatePaymentDistribution(1000, 'complex')

      expect(result.platformFee).toBe(70) // 7% of 1000
      expect(result.holdbackAmount).toBe(100) // 10% of 1000
      expect(result.contractorAmount).toBe(830) // 1000 - 70 - 100
      expect(result.netContractorAmount).toBe(830)
    })

    it('should apply minimum platform fee', () => {
      const result = stripeService.calculatePaymentDistribution(50, 'simple')

      expect(result.platformFee).toBe(5) // Minimum fee, not 3% of 50
      expect(result.holdbackAmount).toBe(5) // 10% of 50
      expect(result.contractorAmount).toBe(40) // 50 - 5 - 5
    })

    it('should default to medium complexity', () => {
      const result = stripeService.calculatePaymentDistribution(1000)

      expect(result.platformFee).toBe(50) // 5% default
      expect(result.holdbackAmount).toBe(100) // 10% default
    })
  })

  describe('processPaymentDistribution', () => {
    beforeEach(() => {
      // Mock the createContractorPayout method
      jest.spyOn(stripeService, 'createContractorPayout').mockResolvedValue({
        id: 'cp_test_123',
        contractorId: 'contractor_123',
        projectId: 'project_456',
        amount: 850,
        currency: 'USD',
        status: 'processing',
        metadata: { type: 'initial_payout' },
        createdAt: new Date(),
      } as ContractorPayout)
    })

    it('should process payment distribution successfully', async () => {
      const result = await stripeService.processPaymentDistribution(
        'project_456',
        'pi_test_123',
        1000,
        'contractor_123',
        'medium'
      )

      expect(result).toEqual({
        id: expect.stringMatching(/^pd_\d+_[a-z0-9]+$/),
        projectId: 'project_456',
        customerPaymentId: 'pi_test_123',
        contractorPayoutId: 'cp_test_123',
        totalAmount: 1000,
        platformFee: 50,
        contractorAmount: 850,
        holdbackAmount: 100,
        status: 'processing',
        createdAt: expect.any(Date),
      })

      expect(stripeService.createContractorPayout).toHaveBeenCalledWith(
        'contractor_123',
        'project_456',
        850,
        'usd',
        { type: 'initial_payout', paymentDistributionId: result.id }
      )
    })

    it('should handle contractor payout errors', async () => {
      jest.spyOn(stripeService, 'createContractorPayout').mockRejectedValue(
        new Error('Payout failed')
      )

      await expect(
        stripeService.processPaymentDistribution(
          'project_456',
          'pi_test_123',
          1000,
          'contractor_123'
        )
      ).rejects.toThrow('Failed to process payment distribution: Payout failed')
    })
  })

  describe('createContractorPayout', () => {
    const mockTransferResponse = {
      id: 'tr_test_123',
      amount: 85000,
      currency: 'usd',
      destination: 'acct_contractor_123',
      metadata: {
        contractorId: 'contractor_123',
        projectId: 'project_456',
        type: 'contractor_payout'
      }
    }

    it('should create contractor payout successfully', async () => {
      mockStripe.transfers.create.mockResolvedValue(mockTransferResponse)

      const result = await stripeService.createContractorPayout(
        'contractor_123',
        'project_456',
        850,
        'USD',
        { type: 'initial_payout' }
      )

      expect(mockStripe.transfers.create).toHaveBeenCalledWith({
        amount: 85000,
        currency: 'usd',
        destination: 'acct_contractor_123',
        metadata: {
          contractorId: 'contractor_123',
          projectId: 'project_456',
          type: 'contractor_payout',
          type: 'initial_payout'
        }
      })

      expect(result).toEqual({
        id: expect.stringMatching(/^cp_\d+_[a-z0-9]+$/),
        contractorId: 'contractor_123',
        projectId: 'project_456',
        amount: 850,
        currency: 'USD',
        status: 'processing',
        stripeTransferId: 'tr_test_123',
        metadata: {
          type: 'initial_payout',
          stripeTransferId: 'tr_test_123'
        },
        createdAt: expect.any(Date)
      })
    })

    it('should handle transfer creation errors', async () => {
      const stripeError = new Error('Transfer failed')
      mockStripe.transfers.create.mockRejectedValue(stripeError)

      await expect(
        stripeService.createContractorPayout(
          'contractor_123',
          'project_456',
          850,
          'USD'
        )
      ).rejects.toThrow('Failed to create contractor payout: Transfer failed')
    })
  })

  describe('releaseHoldback', () => {
    it('should throw error when no holdback available', async () => {
      await expect(
        stripeService.releaseHoldback('pd_test_123', 'project_456', 'contractor_123')
      ).rejects.toThrow('No holdback amount available to release')
    })

    // Note: This method currently returns 0 for holdback amount
    // In a real implementation, it would fetch from the payment distribution
  })

  describe('refundCustomerPayment', () => {
    const mockRefundResponse = {
      id: 're_test_123',
      amount: 250000,
      status: 'succeeded'
    }

    it('should create full refund successfully', async () => {
      mockStripe.refunds.create.mockResolvedValue(mockRefundResponse)

      const result = await stripeService.refundCustomerPayment('pi_test_123')

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test_123',
        amount: undefined,
        reason: 'customer_request'
      })

      expect(result).toEqual({
        id: 're_test_123',
        amount: 2500,
        status: 'succeeded'
      })
    })

    it('should create partial refund successfully', async () => {
      mockStripe.refunds.create.mockResolvedValue({
        ...mockRefundResponse,
        amount: 100000
      })

      const result = await stripeService.refundCustomerPayment('pi_test_123', 1000)

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test_123',
        amount: 100000,
        reason: 'customer_request'
      })

      expect(result.amount).toBe(1000)
    })

    it('should handle refund errors', async () => {
      const stripeError = new Error('Refund failed')
      mockStripe.refunds.create.mockRejectedValue(stripeError)

      await expect(
        stripeService.refundCustomerPayment('pi_test_123')
      ).rejects.toThrow('Failed to create refund: Refund failed')
    })
  })

  describe('getPaymentIntent', () => {
    it('should retrieve payment intent successfully', async () => {
      const mockResponse = { id: 'pi_test_123', amount: 250000 }
      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockResponse)

      const result = await stripeService.getPaymentIntent('pi_test_123')

      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_test_123')
      expect(result).toEqual(mockResponse)
    })

    it('should handle retrieval errors', async () => {
      const stripeError = new Error('Retrieval failed')
      mockStripe.paymentIntents.retrieve.mockRejectedValue(stripeError)

      await expect(
        stripeService.getPaymentIntent('pi_test_123')
      ).rejects.toThrow('Failed to retrieve payment intent: Retrieval failed')
    })
  })

  describe('handleWebhookEvent', () => {
    it('should verify webhook signature successfully', async () => {
      const mockEvent = { type: 'payment_intent.succeeded', data: {} }
      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)

      const result = await stripeService.handleWebhookEvent(
        'payload',
        'signature',
        'webhook_secret'
      )

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        'payload',
        'signature',
        'webhook_secret'
      )
      expect(result).toEqual(mockEvent)
    })

    it('should handle webhook verification errors', async () => {
      const stripeError = new Error('Invalid signature')
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw stripeError
      })

      await expect(
        stripeService.handleWebhookEvent('payload', 'signature', 'webhook_secret')
      ).rejects.toThrow('Webhook signature verification failed')
    })
  })

  describe('getPlatformAnalytics', () => {
    it('should return mock analytics data', async () => {
      const result = await stripeService.getPlatformAnalytics(
        new Date('2023-01-01'),
        new Date('2023-12-31')
      )

      expect(result).toEqual({
        totalRevenue: 0,
        totalPayments: 0,
        totalPayouts: 0,
        averagePlatformFee: 0,
      })
    })
  })

  describe('error handling', () => {
    it('should handle unknown errors gracefully', async () => {
      mockStripe.paymentIntents.create.mockRejectedValue('Unknown error')

      await expect(
        stripeService.createCustomerPaymentIntent(100, 'USD', 'customer_123', 'project_456')
      ).rejects.toThrow('Failed to create payment intent: Unknown error')
    })

    it('should handle Stripe errors with message property', async () => {
      const stripeError = { message: 'Stripe error message' }
      mockStripe.paymentIntents.create.mockRejectedValue(stripeError)

      await expect(
        stripeService.createCustomerPaymentIntent(100, 'USD', 'customer_123', 'project_456')
      ).rejects.toThrow('Failed to create payment intent: Stripe error message')
    })
  })
})
