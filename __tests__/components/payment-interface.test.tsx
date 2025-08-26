import React from 'react'
import { render, screen, fireEvent, waitFor } from '@tests__/utils/test-utils'
import PaymentInterface from '@/app/components/payment-interface'
import { stripeService } from '@/lib/stripe-service'
import { mockProject, mockPaymentIntent, mockPaymentDistribution, mockContractorPayout } from '@tests__/utils/test-utils'

// Mock the stripe service
jest.mock('@/lib/stripe-service')

const mockStripeService = stripeService as jest.Mocked<typeof stripeService>

describe('PaymentInterface', () => {
  const defaultProps = {
    projectId: 'project_123',
    customerId: 'customer_123',
    contractorId: 'contractor_123',
    initialAmount: 2500,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render all three tabs', () => {
      render(<PaymentInterface {...defaultProps} />)

      expect(screen.getByText('Customer Payment')).toBeInTheDocument()
      expect(screen.getByText('Payment Distribution')).toBeInTheDocument()
      expect(screen.getByText('Contractor Payout')).toBeInTheDocument()
    })

    it('should display project details correctly', () => {
      render(<PaymentInterface {...defaultProps} />)

      expect(screen.getByText('Garden Landscaping Project')).toBeInTheDocument()
      expect(screen.getByText('Complete garden redesign with new plants, irrigation system, and stone pathways')).toBeInTheDocument()
      expect(screen.getByText('$2500')).toBeInTheDocument()
    })

    it('should show initial amount in input field', () => {
      render(<PaymentInterface {...defaultProps} />)

      const amountInput = screen.getByDisplayValue('2500')
      expect(amountInput).toBeInTheDocument()
    })

    it('should default to USD currency', () => {
      render(<PaymentInterface {...defaultProps} />)

      expect(screen.getByDisplayValue('USD ($)')).toBeInTheDocument()
    })

    it('should default to medium complexity', () => {
      render(<PaymentInterface {...defaultProps} />)

      expect(screen.getByDisplayValue('Medium (5% fee)')).toBeInTheDocument()
    })
  })

  describe('payment distribution calculation', () => {
    it('should calculate and display distribution breakdown for medium complexity', () => {
      render(<PaymentInterface {...defaultProps} />)

      // Distribution should be calculated automatically
      expect(screen.getByText('$125.00')).toBeInTheDocument() // Platform fee (5%)
      expect(screen.getByText('$2125.00')).toBeInTheDocument() // Contractor amount
      expect(screen.getByText('$250.00')).toBeInTheDocument() // Holdback (10%)
      expect(screen.getByText('$2125.00')).toBeInTheDocument() // Net to contractor
    })

    it('should update distribution when amount changes', () => {
      render(<PaymentInterface {...defaultProps} />)

      const amountInput = screen.getByDisplayValue('2500')
      fireEvent.change(amountInput, { target: { value: '1000' } })

      // Should recalculate for $1000
      expect(screen.getByText('$50.00')).toBeInTheDocument() // Platform fee (5%)
      expect(screen.getByText('$850.00')).toBeInTheDocument() // Contractor amount
      expect(screen.getByText('$100.00')).toBeInTheDocument() // Holdback (10%)
      expect(screen.getByText('$850.00')).toBeInTheDocument() // Net to contractor
    })

    it('should update distribution when complexity changes', () => {
      render(<PaymentInterface {...defaultProps} />)

      // Change to simple complexity
      const complexitySelect = screen.getByDisplayValue('Medium (5% fee)')
      fireEvent.click(complexitySelect)
      
      const simpleOption = screen.getByText('Simple (3% fee)')
      fireEvent.click(simpleOption)

      // Should recalculate for simple (3% fee)
      expect(screen.getByText('$75.00')).toBeInTheDocument() // Platform fee (3%)
      expect(screen.getByText('$2175.00')).toBeInTheDocument() // Contractor amount
      expect(screen.getByText('$250.00')).toBeInTheDocument() // Holdback (10%)
      expect(screen.getByText('$2175.00')).toBeInTheDocument() // Net to contractor
    })
  })

  describe('payment intent creation', () => {
    it('should create payment intent successfully', async () => {
      mockStripeService.createCustomerPaymentIntent.mockResolvedValue(mockPaymentIntent)

      render(<PaymentInterface {...defaultProps} />)

      const createButton = screen.getByText('Create Payment Intent')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Payment intent created successfully! Customer can now complete payment.')).toBeInTheDocument()
      })

      expect(mockStripeService.createCustomerPaymentIntent).toHaveBeenCalledWith(
        2500,
        'USD',
        'customer_123',
        'project_123',
        { projectTitle: 'Garden Landscaping Project' }
      )
    })

    it('should show error for invalid amount', async () => {
      render(<PaymentInterface {...defaultProps} />)

      const amountInput = screen.getByDisplayValue('2500')
      fireEvent.change(amountInput, { target: { value: '0' } })

      const createButton = screen.getByText('Create Payment Intent')
      fireEvent.click(createButton)

      expect(screen.getByText('Please enter a valid amount')).toBeInTheDocument()
    })

    it('should show error when payment intent creation fails', async () => {
      mockStripeService.createCustomerPaymentIntent.mockRejectedValue(
        new Error('Stripe API error')
      )

      render(<PaymentInterface {...defaultProps} />)

      const createButton = screen.getByText('Create Payment Intent')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Error: Stripe API error')).toBeInTheDocument()
      })
    })

    it('should disable create button while processing', async () => {
      mockStripeService.createCustomerPaymentIntent.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockPaymentIntent), 100))
      )

      render(<PaymentInterface {...defaultProps} />)

      const createButton = screen.getByText('Create Payment Intent')
      fireEvent.click(createButton)

      expect(screen.getByText('Creating...')).toBeInTheDocument()
      expect(screen.getByText('Creating...')).toBeDisabled()
    })
  })

  describe('payment capture', () => {
    beforeEach(() => {
      mockStripeService.createCustomerPaymentIntent.mockResolvedValue(mockPaymentIntent)
      mockStripeService.captureCustomerPayment.mockResolvedValue({
        ...mockPaymentIntent,
        status: 'succeeded'
      })
      mockStripeService.processPaymentDistribution.mockResolvedValue(mockPaymentDistribution)
    })

    it('should capture payment and process distribution', async () => {
      render(<PaymentInterface {...defaultProps} />)

      // First create payment intent
      const createButton = screen.getByText('Create Payment Intent')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Create Payment Intent')).toBeInTheDocument()
      })

      // Then capture payment
      const captureButton = screen.getByText('Capture Payment')
      fireEvent.click(captureButton)

      await waitFor(() => {
        expect(screen.getByText('Payment captured and distributed successfully!')).toBeInTheDocument()
      })

      expect(mockStripeService.captureCustomerPayment).toHaveBeenCalledWith(mockPaymentIntent.id)
      expect(mockStripeService.processPaymentDistribution).toHaveBeenCalledWith(
        'project_123',
        mockPaymentIntent.id,
        2500,
        'contractor_123',
        'medium'
      )
    })

    it('should disable capture button for succeeded payments', async () => {
      render(<PaymentInterface {...defaultProps} />)

      // Create payment intent
      const createButton = screen.getByText('Create Payment Intent')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Create Payment Intent')).toBeInTheDocument()
      })

      // Capture payment
      const captureButton = screen.getByText('Capture Payment')
      fireEvent.click(captureButton)

      await waitFor(() => {
        expect(screen.getByText('Payment captured and distributed successfully!')).toBeInTheDocument()
      })

      // Button should be disabled after success
      expect(screen.getByText('Capture Payment')).toBeDisabled()
    })
  })

  describe('payment distribution display', () => {
    beforeEach(() => {
      mockStripeService.createCustomerPaymentIntent.mockResolvedValue(mockPaymentIntent)
      mockStripeService.captureCustomerPayment.mockResolvedValue({
        ...mockPaymentIntent,
        status: 'succeeded'
      })
      mockStripeService.processPaymentDistribution.mockResolvedValue(mockPaymentDistribution)
    })

    it('should show payment distribution after capture', async () => {
      render(<PaymentInterface {...defaultProps} />)

      // Create and capture payment
      const createButton = screen.getByText('Create Payment Intent')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Create Payment Intent')).toBeInTheDocument()
      })

      const captureButton = screen.getByText('Capture Payment')
      fireEvent.click(captureButton)

      await waitFor(() => {
        expect(screen.getByText('Payment captured and distributed successfully!')).toBeInTheDocument()
      })

      // Switch to payment distribution tab
      const distributionTab = screen.getByText('Payment Distribution')
      fireEvent.click(distributionTab)

      expect(screen.getByText('$2500')).toBeInTheDocument() // Total amount
      expect(screen.getByText('$125')).toBeInTheDocument() // Platform fee
      expect(screen.getByText('$2125')).toBeInTheDocument() // Contractor amount
      expect(screen.getByText('$250')).toBeInTheDocument() // Holdback
    })

    it('should show empty state when no distribution exists', () => {
      render(<PaymentInterface {...defaultProps} />)

      const distributionTab = screen.getByText('Payment Distribution')
      fireEvent.click(distributionTab)

      expect(screen.getByText('No payment distribution yet. Complete a customer payment first.')).toBeInTheDocument()
    })
  })

  describe('contractor payout', () => {
    beforeEach(() => {
      mockStripeService.createCustomerPaymentIntent.mockResolvedValue(mockPaymentIntent)
      mockStripeService.captureCustomerPayment.mockResolvedValue({
        ...mockPaymentIntent,
        status: 'succeeded'
      })
      mockStripeService.processPaymentDistribution.mockResolvedValue(mockPaymentDistribution)
      mockStripeService.releaseHoldback.mockResolvedValue(mockContractorPayout)
    })

    it('should show holdback release button when available', async () => {
      render(<PaymentInterface {...defaultProps} />)

      // Create and capture payment
      const createButton = screen.getByText('Create Payment Intent')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Create Payment Intent')).toBeInTheDocument()
      })

      const captureButton = screen.getByText('Capture Payment')
      fireEvent.click(captureButton)

      await waitFor(() => {
        expect(screen.getByText('Payment captured and distributed successfully!')).toBeInTheDocument()
      })

      // Switch to contractor payout tab
      const payoutTab = screen.getByText('Contractor Payout')
      fireEvent.click(payoutTab)

      expect(screen.getByText('$250 is held back until project completion.')).toBeInTheDocument()
      expect(screen.getByText('Release Holdback')).toBeInTheDocument()
    })

    it('should release holdback successfully', async () => {
      render(<PaymentInterface {...defaultProps} />)

      // Create and capture payment
      const createButton = screen.getByText('Create Payment Intent')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Create Payment Intent')).toBeInTheDocument()
      })

      const captureButton = screen.getByText('Capture Payment')
      fireEvent.click(captureButton)

      await waitFor(() => {
        expect(screen.getByText('Payment captured and distributed successfully!')).toBeInTheDocument()
      })

      // Switch to contractor payout tab
      const payoutTab = screen.getByText('Contractor Payout')
      fireEvent.click(payoutTab)

      const releaseButton = screen.getByText('Release Holdback')
      fireEvent.click(releaseButton)

      await waitFor(() => {
        expect(screen.getByText('Holdback released successfully!')).toBeInTheDocument()
      })

      expect(mockStripeService.releaseHoldback).toHaveBeenCalledWith(
        mockPaymentDistribution.id,
        'project_123',
        'contractor_123'
      )
    })

    it('should show empty state when no payout exists', () => {
      render(<PaymentInterface {...defaultProps} />)

      const payoutTab = screen.getByText('Contractor Payout')
      fireEvent.click(payoutTab)

      expect(screen.getByText('No contractor payout yet. Complete payment distribution first.')).toBeInTheDocument()
    })
  })

  describe('currency and complexity selection', () => {
    it('should change currency when selected', () => {
      render(<PaymentInterface {...defaultProps} />)

      const currencySelect = screen.getByDisplayValue('USD ($)')
      fireEvent.click(currencySelect)

      const eurOption = screen.getByText('EUR (€)')
      fireEvent.click(eurOption)

      expect(screen.getByDisplayValue('EUR (€)')).toBeInTheDocument()
    })

    it('should change complexity when selected', () => {
      render(<PaymentInterface {...defaultProps} />)

      const complexitySelect = screen.getByDisplayValue('Medium (5% fee)')
      fireEvent.click(complexitySelect)

      const complexOption = screen.getByText('Complex (7% fee)')
      fireEvent.click(complexOption)

      expect(screen.getByDisplayValue('Complex (7% fee)')).toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('should clear error when new action is performed', async () => {
      mockStripeService.createCustomerPaymentIntent.mockRejectedValue(
        new Error('Initial error')
      )

      render(<PaymentInterface {...defaultProps} />)

      // Create error
      const createButton = screen.getByText('Create Payment Intent')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Error: Initial error')).toBeInTheDocument()
      })

      // Clear error by changing amount
      const amountInput = screen.getByDisplayValue('2500')
      fireEvent.change(amountInput, { target: { value: '3000' } })

      expect(screen.queryByText('Error: Initial error')).not.toBeInTheDocument()
    })

    it('should clear success message when new action is performed', async () => {
      mockStripeService.createCustomerPaymentIntent.mockResolvedValue(mockPaymentIntent)

      render(<PaymentInterface {...defaultProps} />)

      // Create success
      const createButton = screen.getByText('Create Payment Intent')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Payment intent created successfully! Customer can now complete payment.')).toBeInTheDocument()
      })

      // Clear success by changing amount
      const amountInput = screen.getByDisplayValue('2500')
      fireEvent.change(amountInput, { target: { value: '3000' } })

      expect(screen.queryByText('Payment intent created successfully! Customer can now complete payment.')).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have proper labels for form inputs', () => {
      render(<PaymentInterface {...defaultProps} />)

      expect(screen.getByLabelText('Project Amount ($)')).toBeInTheDocument()
      expect(screen.getByLabelText('Currency')).toBeInTheDocument()
      expect(screen.getByLabelText('Project Complexity')).toBeInTheDocument()
    })

    it('should have proper button text for actions', () => {
      render(<PaymentInterface {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Create Payment Intent' })).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle zero initial amount', () => {
      render(<PaymentInterface {...defaultProps} initialAmount={0} />)

      const amountInput = screen.getByDisplayValue('')
      expect(amountInput).toBeInTheDocument()
    })

    it('should handle very large amounts', () => {
      render(<PaymentInterface {...defaultProps} initialAmount={999999} />)

      expect(screen.getByText('$999999')).toBeInTheDocument()
      expect(screen.getByText('$49999.95')).toBeInTheDocument() // Platform fee (5%)
      expect(screen.getByText('$899999.05')).toBeInTheDocument() // Contractor amount
      expect(screen.getByText('$99999.90')).toBeInTheDocument() // Holdback (10%)
    })

    it('should handle decimal amounts', () => {
      render(<PaymentInterface {...defaultProps} initialAmount={1234.56} />)

      const amountInput = screen.getByDisplayValue('1234.56')
      expect(amountInput).toBeInTheDocument()
    })
  })
})

