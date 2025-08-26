import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    elements: jest.fn(() => ({
      create: jest.fn(() => ({
        mount: jest.fn(),
        unmount: jest.fn(),
        on: jest.fn(),
      })),
    })),
    confirmPayment: jest.fn(() => Promise.resolve({ error: null })),
    confirmCardPayment: jest.fn(() => Promise.resolve({ error: null })),
  })),
}))

// Mock Stripe service
jest.mock('@/lib/stripe-service', () => ({
  stripeService: {
    createCustomerPaymentIntent: jest.fn(),
    captureCustomerPayment: jest.fn(),
    processPaymentDistribution: jest.fn(),
    createContractorPayout: jest.fn(),
    releaseHoldback: jest.fn(),
    refundCustomerPayment: jest.fn(),
    getPaymentIntent: jest.fn(),
    handleWebhookEvent: jest.fn(),
    getPlatformAnalytics: jest.fn(),
    calculatePaymentDistribution: jest.fn(),
  },
}))

// Mock vector database service
jest.mock('@/lib/vector-db', () => ({
  vectorDB: {
    addQuestion: jest.fn(),
    answerQuestion: jest.fn(),
    generateAIFeedback: jest.fn(),
    semanticSearch: jest.fn(),
    getContractorEngagement: jest.fn(),
  },
}))

// Mock payment service
jest.mock('@/lib/payment-service', () => ({
  paymentService: {
    calculatePaymentDistribution: jest.fn(),
    processContractorPayment: jest.fn(),
    processCustomerPayment: jest.fn(),
    getPaymentHistory: jest.fn(),
    getContractorPayments: jest.fn(),
  },
}))

// Mock AI agent service
jest.mock('@/lib/ai-agent-service', () => ({
  aiAgentService: {
    generateResponse: jest.fn(),
    analyzeMessage: jest.fn(),
    flagDispute: jest.fn(),
    getContext: jest.fn(),
    updateContext: jest.fn(),
  },
}))

// Mock chat session service
jest.mock('@/lib/chat-session-service', () => ({
  chatSessionService: {
    createSession: jest.fn(),
    getSession: jest.fn(),
    addMessage: jest.fn(),
    editMessage: jest.fn(),
    deleteMessage: jest.fn(),
    addParticipant: jest.fn(),
    removeParticipant: jest.fn(),
    updateBidProposal: jest.fn(),
    approveBidChange: jest.fn(),
    rejectBidChange: jest.fn(),
    generateQuote: jest.fn(),
    getMessageHistory: jest.fn(),
    searchMessages: jest.fn(),
    archiveSession: jest.fn(),
  },
}))

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render }

// Common test data
export const mockProject = {
  id: 'project_123',
  title: 'Test Garden Project',
  description: 'A test garden landscaping project',
  complexity: 'medium' as const,
  estimatedCost: 2500,
  status: 'pending' as const,
}

export const mockContractor = {
  id: 'contractor_123',
  name: 'Test Contractor',
  email: 'test@contractor.com',
  phone: '+1234567890',
  specialties: ['landscaping', 'garden-design'],
  rating: 4.5,
  completedProjects: 25,
  engagementScore: 85,
}

export const mockBid = {
  id: 'bid_123',
  projectId: 'project_123',
  contractorId: 'contractor_123',
  amount: 2500,
  timeline: '2-3 weeks',
  description: 'Complete garden redesign with new plants and irrigation',
  materials: ['plants', 'soil', 'irrigation-system'],
  status: 'pending' as const,
  createdAt: new Date('2023-12-21'),
}

export const mockCustomer = {
  id: 'customer_123',
  name: 'Test Customer',
  email: 'test@customer.com',
  phone: '+1234567890',
}

export const mockPaymentIntent = {
  id: 'pi_test_123',
  amount: 2500,
  currency: 'USD',
  status: 'requires_payment_method',
  customerId: 'customer_123',
  projectId: 'project_123',
  metadata: {
    projectTitle: 'Test Garden Project',
  },
}

export const mockPaymentDistribution = {
  id: 'pd_test_123',
  projectId: 'project_123',
  customerPaymentId: 'pi_test_123',
  totalAmount: 2500,
  platformFee: 125,
  contractorAmount: 2125,
  holdbackAmount: 250,
  status: 'processing' as const,
  createdAt: new Date('2023-12-21'),
}

export const mockContractorPayout = {
  id: 'cp_test_123',
  contractorId: 'contractor_123',
  projectId: 'project_123',
  amount: 2125,
  currency: 'USD',
  status: 'processing' as const,
  stripeTransferId: 'tr_test_123',
  metadata: {
    type: 'initial_payout',
  },
  createdAt: new Date('2023-12-21'),
}

export const mockChatMessage = {
  id: 'msg_123',
  sessionId: 'session_123',
  senderId: 'customer_123',
  senderType: 'customer' as const,
  content: 'Hello, I have a garden project I need help with.',
  timestamp: new Date('2023-12-21T10:00:00Z'),
  type: 'text' as const,
  metadata: {},
}

export const mockBidProposal = {
  id: 'bp_123',
  projectId: 'project_123',
  title: 'Garden Landscaping Proposal',
  description: 'Complete garden redesign with new plants and irrigation system',
  estimatedCost: 2500,
  timeline: '2-3 weeks',
  materials: ['plants', 'soil', 'irrigation-system'],
  status: 'draft' as const,
  createdAt: new Date('2023-12-21'),
  updatedAt: new Date('2023-12-21'),
  createdBy: 'contractor_123',
}

export const mockQuoteDocument = {
  id: 'quote_123',
  sessionId: 'session_123',
  bidProposalId: 'bp_123',
  totalAmount: 2500,
  materialsCost: 800,
  laborCost: 1200,
  overheadCost: 300,
  profitMargin: 200,
  paymentSchedule: [
    {
      stage: 'Initial Payment',
      amount: 1250,
      dueDate: 'Before work begins',
      percentage: 50,
    },
    {
      stage: 'Progress Payment',
      amount: 750,
      dueDate: 'After 50% completion',
      percentage: 30,
    },
    {
      stage: 'Final Payment',
      amount: 500,
      dueDate: 'Upon completion',
      percentage: 20,
    },
  ],
  status: 'pending' as const,
  createdAt: new Date('2023-12-21'),
  createdBy: 'contractor_123',
}

// Helper functions
export const createMockStripeError = (message: string) => ({
  message,
  type: 'StripeError',
  code: 'test_error',
})

export const createMockApiResponse = (data: any, success = true) => ({
  success,
  data,
  error: success ? undefined : 'Test error',
})

export const waitForAsync = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))

export const mockConsoleError = () => {
  const originalError = console.error
  const mockError = jest.fn()
  
  beforeAll(() => {
    console.error = mockError
  })
  
  afterAll(() => {
    console.error = originalError
  })
  
  return mockError
}

export const mockConsoleWarn = () => {
  const originalWarn = console.warn
  const mockWarn = jest.fn()
  
  beforeAll(() => {
    console.warn = mockWarn
  })
  
  afterAll(() => {
    console.warn = originalWarn
  })
  
  return mockWarn
}

