import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/stripe/payment-intent/route'
import { stripeService } from '@/lib/stripe-service'

// Mock the stripe service
jest.mock('@/lib/stripe-service')

const mockStripeService = stripeService as jest.Mocked<typeof stripeService>

describe('Stripe Payment Intent API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/stripe/payment-intent', () => {
    const createMockRequest = (body: any): NextRequest => {
      return {
        json: jest.fn().mockResolvedValue(body),
      } as any
    }

    it('should create payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        amount: 2500,
        currency: 'USD',
        status: 'requires_payment_method',
        customerId: 'customer_123',
        projectId: 'project_456',
        metadata: { projectTitle: 'Test Project' }
      }

      mockStripeService.createCustomerPaymentIntent.mockResolvedValue(mockPaymentIntent)

      const request = createMockRequest({
        amount: 2500,
        currency: 'USD',
        customerId: 'customer_123',
        projectId: 'project_456',
        metadata: { projectTitle: 'Test Project' }
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData).toEqual({
        success: true,
        data: mockPaymentIntent
      })

      expect(mockStripeService.createCustomerPaymentIntent).toHaveBeenCalledWith(
        2500,
        'USD',
        'customer_123',
        'project_456',
        { projectTitle: 'Test Project' }
      )
    })

    it('should return 400 when amount is missing', async () => {
      const request = createMockRequest({
        currency: 'USD',
        customerId: 'customer_123',
        projectId: 'project_456'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData).toEqual({
        error: 'Missing required fields: amount, currency, customerId, projectId'
      })
    })

    it('should return 400 when currency is missing', async () => {
      const request = createMockRequest({
        amount: 2500,
        customerId: 'customer_123',
        projectId: 'project_456'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData).toEqual({
        error: 'Missing required fields: amount, currency, customerId, projectId'
      })
    })

    it('should return 400 when customerId is missing', async () => {
      const request = createMockRequest({
        amount: 2500,
        currency: 'USD',
        projectId: 'project_456'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData).toEqual({
        error: 'Missing required fields: amount, currency, customerId, projectId'
      })
    })

    it('should return 400 when projectId is missing', async () => {
      const request = createMockRequest({
        amount: 2500,
        currency: 'USD',
        customerId: 'customer_123'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData).toEqual({
        error: 'Missing required fields: amount, currency, customerId, projectId'
      })
    })

    it('should return 400 when amount is 0', async () => {
      const request = createMockRequest({
        amount: 0,
        currency: 'USD',
        customerId: 'customer_123',
        projectId: 'project_456'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData).toEqual({
        error: 'Amount must be greater than 0'
      })
    })

    it('should return 400 when amount is negative', async () => {
      const request = createMockRequest({
        amount: -100,
        currency: 'USD',
        customerId: 'customer_123',
        projectId: 'project_456'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData).toEqual({
        error: 'Amount must be greater than 0'
      })
    })

    it('should handle service errors gracefully', async () => {
      const serviceError = new Error('Stripe service error')
      mockStripeService.createCustomerPaymentIntent.mockRejectedValue(serviceError)

      const request = createMockRequest({
        amount: 2500,
        currency: 'USD',
        customerId: 'customer_123',
        projectId: 'project_456'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData).toEqual({
        error: 'Failed to create payment intent',
        details: 'Stripe service error'
      })
    })

    it('should handle unknown errors gracefully', async () => {
      mockStripeService.createCustomerPaymentIntent.mockRejectedValue('Unknown error')

      const request = createMockRequest({
        amount: 2500,
        currency: 'USD',
        customerId: 'customer_123',
        projectId: 'project_456'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData).toEqual({
        error: 'Failed to create payment intent',
        details: 'Unknown error'
      })
    })

    it('should handle metadata as optional parameter', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        amount: 2500,
        currency: 'USD',
        status: 'requires_payment_method',
        customerId: 'customer_123',
        projectId: 'project_456',
        metadata: {}
      }

      mockStripeService.createCustomerPaymentIntent.mockResolvedValue(mockPaymentIntent)

      const request = createMockRequest({
        amount: 2500,
        currency: 'USD',
        customerId: 'customer_123',
        projectId: 'project_456'
        // No metadata provided
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      expect(mockStripeService.createCustomerPaymentIntent).toHaveBeenCalledWith(
        2500,
        'USD',
        'customer_123',
        'project_456',
        {} // Empty metadata object
      )
    })
  })

  describe('GET /api/stripe/payment-intent', () => {
    const createMockRequest = (searchParams: Record<string, string>): NextRequest => {
      return {
        url: `https://example.com/api/stripe/payment-intent?${new URLSearchParams(searchParams).toString()}`,
      } as any
    }

    it('should retrieve payment intent successfully', async () => {
      const mockStripePaymentIntent = {
        id: 'pi_test_123',
        amount: 250000,
        currency: 'usd',
        status: 'requires_payment_method',
        metadata: {
          customerId: 'customer_123',
          projectId: 'project_456'
        }
      }

      mockStripeService.getPaymentIntent.mockResolvedValue(mockStripePaymentIntent)

      const request = createMockRequest({ id: 'pi_test_123' })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData).toEqual({
        success: true,
        data: mockStripePaymentIntent
      })

      expect(mockStripeService.getPaymentIntent).toHaveBeenCalledWith('pi_test_123')
    })

    it('should return 400 when payment intent ID is missing', async () => {
      const request = createMockRequest({})

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData).toEqual({
        error: 'Payment intent ID is required'
      })
    })

    it('should return 400 when payment intent ID is empty', async () => {
      const request = createMockRequest({ id: '' })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData).toEqual({
        error: 'Payment intent ID is required'
      })
    })

    it('should handle service errors gracefully', async () => {
      const serviceError = new Error('Payment intent not found')
      mockStripeService.getPaymentIntent.mockRejectedValue(serviceError)

      const request = createMockRequest({ id: 'pi_test_123' })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData).toEqual({
        error: 'Failed to retrieve payment intent',
        details: 'Payment intent not found'
      })
    })

    it('should handle unknown errors gracefully', async () => {
      mockStripeService.getPaymentIntent.mockRejectedValue('Unknown error')

      const request = createMockRequest({ id: 'pi_test_123' })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData).toEqual({
        error: 'Failed to retrieve payment intent',
        details: 'Unknown error'
      })
    })

    it('should handle URL with multiple query parameters', async () => {
      const mockStripePaymentIntent = {
        id: 'pi_test_123',
        amount: 250000,
        currency: 'usd',
        status: 'requires_payment_method'
      }

      mockStripeService.getPaymentIntent.mockResolvedValue(mockStripePaymentIntent)

      const request = createMockRequest({ 
        id: 'pi_test_123',
        otherParam: 'value'
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      expect(mockStripeService.getPaymentIntent).toHaveBeenCalledWith('pi_test_123')
    })
  })
})
