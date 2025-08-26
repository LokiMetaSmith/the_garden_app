import React from 'react'
import { render, screen, fireEvent, waitFor } from '@tests__/utils/test-utils'
import ChatInterface from '@/app/components/chat-interface'
import { chatSessionService } from '@/lib/chat-session-service'
import { aiAgentService } from '@/lib/ai-agent-service'
import { mockChatMessage, mockBidProposal, mockQuoteDocument } from '@tests__/utils/test-utils'

// Mock the services
jest.mock('@/lib/chat-session-service')
jest.mock('@/lib/ai-agent-service')

const mockChatSessionService = chatSessionService as jest.Mocked<typeof chatSessionService>
const mockAIAgentService = aiAgentService as jest.Mocked<typeof aiAgentService>

describe('ChatInterface', () => {
  const defaultProps = {
    projectId: 'project_123',
    initialBid: mockBidProposal
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock default service responses
    mockChatSessionService.getSession.mockResolvedValue({
      id: 'session_123',
      projectId: 'project_123',
      participants: [],
      bidProposal: mockBidProposal,
      quoteDocument: mockQuoteDocument,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    mockChatSessionService.getMessageHistory.mockResolvedValue([mockChatMessage])
    
    mockAIAgentService.generateResponse.mockResolvedValue({
      content: 'AI response message',
      type: 'ai_moderation',
      actions: [],
      flags: []
    })
  })

  describe('rendering', () => {
    it('should render all three tabs', () => {
      render(<ChatInterface {...defaultProps} />)

      expect(screen.getByText('Chat')).toBeInTheDocument()
      expect(screen.getByText('Bid Proposal')).toBeInTheDocument()
      expect(screen.getByText('Quote')).toBeInTheDocument()
    })

    it('should display project information', () => {
      render(<ChatInterface {...defaultProps} />)

      expect(screen.getByText('Project Chat')).toBeInTheDocument()
      expect(screen.getByText('AI-moderated conversation')).toBeInTheDocument()
    })

    it('should show invite contractor button', () => {
      render(<ChatInterface {...defaultProps} />)

      expect(screen.getByText('Invite Contractor')).toBeInTheDocument()
    })
  })

  describe('chat functionality', () => {
    it('should display existing messages', async () => {
      render(<ChatInterface {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Hello, I have a garden project I need help with.')).toBeInTheDocument()
      })
    })

    it('should allow sending new messages', async () => {
      mockChatSessionService.addMessage.mockResolvedValue({
        ...mockChatMessage,
        id: 'msg_new',
        content: 'New message'
      })

      render(<ChatInterface {...defaultProps} />)

      const messageInput = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByText('Send')

      fireEvent.change(messageInput, { target: { value: 'New message' } })
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(mockChatSessionService.addMessage).toHaveBeenCalledWith(
          'session_123',
          expect.objectContaining({
            content: 'New message',
            senderType: 'user'
          })
        )
      })
    })

    it('should handle AI response generation', async () => {
      mockChatSessionService.addMessage.mockResolvedValue({
        ...mockChatMessage,
        id: 'msg_ai',
        content: 'AI response message',
        senderType: 'ai'
      })

      render(<ChatInterface {...defaultProps} />)

      const messageInput = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByText('Send')

      fireEvent.change(messageInput, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(mockAIAgentService.generateResponse).toHaveBeenCalled()
      })
    })

    it('should clear input after sending message', async () => {
      mockChatSessionService.addMessage.mockResolvedValue(mockChatMessage)

      render(<ChatInterface {...defaultProps} />)

      const messageInput = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByText('Send')

      fireEvent.change(messageInput, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(messageInput).toHaveValue('')
      })
    })
  })

  describe('bid proposal management', () => {
    it('should display bid proposal details', () => {
      render(<ChatInterface {...defaultProps} />)

      const bidTab = screen.getByText('Bid Proposal')
      fireEvent.click(bidTab)

      expect(screen.getByText('Garden Landscaping Proposal')).toBeInTheDocument()
      expect(screen.getByText('Complete garden redesign with new plants and irrigation system')).toBeInTheDocument()
      expect(screen.getByText('$2500')).toBeInTheDocument()
      expect(screen.getByText('2-3 weeks')).toBeInTheDocument()
    })

    it('should show edit bid button', () => {
      render(<ChatInterface {...defaultProps} />)

      const bidTab = screen.getByText('Bid Proposal')
      fireEvent.click(bidTab)

      expect(screen.getByText('Edit Bid')).toBeInTheDocument()
    })

    it('should open edit bid dialog', () => {
      render(<ChatInterface {...defaultProps} />)

      const bidTab = screen.getByText('Bid Proposal')
      fireEvent.click(bidTab)

      const editButton = screen.getByText('Edit Bid')
      fireEvent.click(editButton)

      expect(screen.getByText('Edit Bid Proposal')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Garden Landscaping Proposal')).toBeInTheDocument()
    })

    it('should save bid changes', async () => {
      mockChatSessionService.updateBidProposal.mockResolvedValue({
        ...mockBidProposal,
        title: 'Updated Proposal Title'
      })

      render(<ChatInterface {...defaultProps} />)

      const bidTab = screen.getByText('Bid Proposal')
      fireEvent.click(bidTab)

      const editButton = screen.getByText('Edit Bid')
      fireEvent.click(editButton)

      const titleInput = screen.getByDisplayValue('Garden Landscaping Proposal')
      fireEvent.change(titleInput, { target: { value: 'Updated Proposal Title' } })

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockChatSessionService.updateBidProposal).toHaveBeenCalledWith(
          'session_123',
          expect.objectContaining({
            title: 'Updated Proposal Title'
          }),
          'user'
        )
      })
    })

    it('should show pending changes section', () => {
      render(<ChatInterface {...defaultProps} />)

      const bidTab = screen.getByText('Bid Proposal')
      fireEvent.click(bidTab)

      expect(screen.getByText('Pending Changes')).toBeInTheDocument()
    })
  })

  describe('quote management', () => {
    it('should display quote details', () => {
      render(<ChatInterface {...defaultProps} />)

      const quoteTab = screen.getByText('Quote')
      fireEvent.click(quoteTab)

      expect(screen.getByText('$2500')).toBeInTheDocument() // Total amount
      expect(screen.getByText('$800')).toBeInTheDocument() // Materials cost
      expect(screen.getByText('$1200')).toBeInTheDocument() // Labor cost
      expect(screen.getByText('$300')).toBeInTheDocument() // Overhead cost
      expect(screen.getByText('$200')).toBeInTheDocument() // Profit margin
    })

    it('should display payment schedule', () => {
      render(<ChatInterface {...defaultProps} />)

      const quoteTab = screen.getByText('Quote')
      fireEvent.click(quoteTab)

      expect(screen.getByText('Initial Payment')).toBeInTheDocument()
      expect(screen.getByText('Progress Payment')).toBeInTheDocument()
      expect(screen.getByText('Final Payment')).toBeInTheDocument()
      expect(screen.getByText('$1250')).toBeInTheDocument() // Initial payment
      expect(screen.getByText('50%')).toBeInTheDocument() // Initial percentage
    })

    it('should show quote approval status', () => {
      render(<ChatInterface {...defaultProps} />)

      const quoteTab = screen.getByText('Quote')
      fireEvent.click(quoteTab)

      expect(screen.getByText('Quote Status')).toBeInTheDocument()
      expect(screen.getByText('pending')).toBeInTheDocument()
    })
  })

  describe('contractor invitation', () => {
    it('should open invite contractor dialog', () => {
      render(<ChatInterface {...defaultProps} />)

      const inviteButton = screen.getByText('Invite Contractor')
      fireEvent.click(inviteButton)

      expect(screen.getByText('Invite Contractor to Chat')).toBeInTheDocument()
      expect(screen.getByText('Contractor Email')).toBeInTheDocument()
      expect(screen.getByText('Message (Optional)')).toBeInTheDocument()
    })

    it('should send contractor invitation', async () => {
      mockChatSessionService.addParticipant.mockResolvedValue({
        id: 'participant_123',
        userId: 'contractor_456',
        userType: 'contractor',
        permissions: {
          canSendMessages: true,
          canEditBid: false,
          canApproveChanges: false
        },
        joinedAt: new Date()
      })

      render(<ChatInterface {...defaultProps} />)

      const inviteButton = screen.getByText('Invite Contractor')
      fireEvent.click(inviteButton)

      const emailInput = screen.getByLabelText('Contractor Email')
      const messageInput = screen.getByLabelText('Message (Optional)')
      const sendButton = screen.getByText('Send Invitation')

      fireEvent.change(emailInput, { target: { value: 'contractor@example.com' } })
      fireEvent.change(messageInput, { target: { value: 'Please join our project discussion' } })
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(mockChatSessionService.addParticipant).toHaveBeenCalledWith(
          'session_123',
          expect.objectContaining({
            userId: 'contractor_456',
            userType: 'contractor'
          })
        )
      })
    })

    it('should validate required fields', () => {
      render(<ChatInterface {...defaultProps} />)

      const inviteButton = screen.getByText('Invite Contractor')
      fireEvent.click(inviteButton)

      const sendButton = screen.getByText('Send Invitation')
      fireEvent.click(sendButton)

      // Should show validation error or not proceed
      expect(screen.getByText('Invite Contractor to Chat')).toBeInTheDocument()
    })
  })

  describe('AI agent integration', () => {
    it('should generate AI responses for user messages', async () => {
      mockChatSessionService.addMessage.mockResolvedValue(mockChatMessage)

      render(<ChatInterface {...defaultProps} />)

      const messageInput = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByText('Send')

      fireEvent.change(messageInput, { target: { value: 'What do you think about this project?' } })
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(mockAIAgentService.generateResponse).toHaveBeenCalledWith(
          'What do you think about this project?',
          'user'
        )
      })
    })

    it('should handle AI agent errors gracefully', async () => {
      mockAIAgentService.generateResponse.mockRejectedValue(new Error('AI service error'))
      mockChatSessionService.addMessage.mockResolvedValue(mockChatMessage)

      render(<ChatInterface {...defaultProps} />)

      const messageInput = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByText('Send')

      fireEvent.change(messageInput, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)

      // Should still add the user message even if AI fails
      await waitFor(() => {
        expect(mockChatSessionService.addMessage).toHaveBeenCalled()
      })
    })
  })

  describe('session management', () => {
    it('should load existing session on mount', async () => {
      render(<ChatInterface {...defaultProps} />)

      await waitFor(() => {
        expect(mockChatSessionService.getSession).toHaveBeenCalledWith('project_123')
      })
    })

    it('should create new session if none exists', async () => {
      mockChatSessionService.getSession.mockResolvedValue(null)
      mockChatSessionService.createSession.mockResolvedValue({
        id: 'session_new',
        projectId: 'project_123',
        participants: [],
        bidProposal: mockBidProposal,
        quoteDocument: null,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      render(<ChatInterface {...defaultProps} />)

      await waitFor(() => {
        expect(mockChatSessionService.createSession).toHaveBeenCalledWith(
          'project_123',
          expect.objectContaining({
            bidProposal: mockBidProposal
          })
        )
      })
    })

    it('should handle session loading errors', async () => {
      mockChatSessionService.getSession.mockRejectedValue(new Error('Session loading failed'))

      render(<ChatInterface {...defaultProps} />)

      // Should handle error gracefully without crashing
      expect(screen.getByText('Project Chat')).toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('should handle message sending errors', async () => {
      mockChatSessionService.addMessage.mockRejectedValue(new Error('Failed to send message'))

      render(<ChatInterface {...defaultProps} />)

      const messageInput = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByText('Send')

      fireEvent.change(messageInput, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)

      // Should handle error gracefully
      expect(screen.getByText('Send')).toBeInTheDocument()
    })

    it('should handle bid update errors', async () => {
      mockChatSessionService.updateBidProposal.mockRejectedValue(new Error('Failed to update bid'))

      render(<ChatInterface {...defaultProps} />)

      const bidTab = screen.getByText('Bid Proposal')
      fireEvent.click(bidTab)

      const editButton = screen.getByText('Edit Bid')
      fireEvent.click(editButton)

      const titleInput = screen.getByDisplayValue('Garden Landscaping Proposal')
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } })

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      // Should handle error gracefully
      expect(screen.getByText('Save Changes')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have proper labels for form inputs', () => {
      render(<ChatInterface {...defaultProps} />)

      expect(screen.getByLabelText('Type your message...')).toBeInTheDocument()
    })

    it('should have proper button text for actions', () => {
      render(<ChatInterface {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Invite Contractor' })).toBeInTheDocument()
    })

    it('should have proper tab labels', () => {
      render(<ChatInterface {...defaultProps} />)

      expect(screen.getByRole('tab', { name: 'Chat' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Bid Proposal' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Quote' })).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle empty message history', async () => {
      mockChatSessionService.getMessageHistory.mockResolvedValue([])

      render(<ChatInterface {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('No messages yet. Start the conversation!')).toBeInTheDocument()
      })
    })

    it('should handle missing bid proposal', () => {
      render(<ChatInterface projectId="project_123" />)

      const bidTab = screen.getByText('Bid Proposal')
      fireEvent.click(bidTab)

      expect(screen.getByText('No bid proposal available')).toBeInTheDocument()
    })

    it('should handle missing quote document', () => {
      render(<ChatInterface projectId="project_123" />)

      const quoteTab = screen.getByText('Quote')
      fireEvent.click(quoteTab)

      expect(screen.getByText('No quote available yet')).toBeInTheDocument()
    })

    it('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(1000)
      mockChatSessionService.addMessage.mockResolvedValue({
        ...mockChatMessage,
        content: longMessage
      })

      render(<ChatInterface {...defaultProps} />)

      const messageInput = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByText('Send')

      fireEvent.change(messageInput, { target: { value: longMessage } })
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(mockChatSessionService.addMessage).toHaveBeenCalled()
      })
    })
  })
})

