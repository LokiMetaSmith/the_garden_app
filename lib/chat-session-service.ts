// Chat Session Management Service

export interface ChatSessionData {
  id: string
  projectId: string
  participants: ChatParticipant[]
  messages: ChatMessage[]
  bidProposal: BidProposal
  quoteDocument?: QuoteDocument
  status: 'active' | 'completed' | 'disputed' | 'archived'
  createdAt: Date
  lastActivity: Date
  metadata: {
    projectType: string
    location: string
    budget: {
      min: number
      max: number
      currency: string
    }
    tags: string[]
  }
}

export interface ChatParticipant {
  id: string
  type: 'user' | 'contractor' | 'ai_agent'
  name: string
  email?: string
  avatar?: string
  role: string
  permissions: ParticipantPermissions
  joinedAt: Date
  lastSeen: Date
  isActive: boolean
}

export interface ParticipantPermissions {
  canSendMessages: boolean
  canEditBid: boolean
  canApproveChanges: boolean
  canGenerateQuote: boolean
  canInviteOthers: boolean
  canViewHistory: boolean
  canFlagDisputes: boolean
}

export interface ChatMessage {
  id: string
  sessionId: string
  sender: 'user' | 'contractor' | 'ai_agent'
  senderId: string
  senderName: string
  content: string
  timestamp: Date
  messageType: 'text' | 'bid_update' | 'quote_update' | 'agreement' | 'dispute' | 'system'
  metadata?: {
    bidId?: string
    quoteId?: string
    agreementType?: string
    amount?: number
    materials?: string[]
    timeline?: string
    attachments?: string[]
    reactions?: MessageReaction[]
  }
  isEdited: boolean
  editedAt?: Date
  isDeleted: boolean
  deletedAt?: Date
}

export interface MessageReaction {
  userId: string
  reaction: 'like' | 'dislike' | 'heart' | 'thumbs_up' | 'thumbs_down'
  timestamp: Date
}

export interface BidProposal {
  id: string
  projectId: string
  contractorId: string
  customerId: string
  initialAmount: number
  currentAmount: number
  materials: string[]
  timeline: string
  paymentTerms: string
  warranty: string
  status: 'draft' | 'negotiating' | 'agreed' | 'disputed' | 'accepted' | 'rejected'
  lastUpdated: Date
  version: number
  changes: BidChange[]
  approvals: BidApproval[]
  history: BidHistoryEntry[]
}

export interface BidChange {
  id: string
  field: string
  oldValue: any
  newValue: any
  requestedBy: string
  requestedAt: Date
  status: 'pending' | 'approved' | 'rejected'
  reason?: string
  approvedBy?: string
  approvedAt?: Date
  rejectedBy?: string
  rejectedAt?: Date
  rejectionReason?: string
}

export interface BidApproval {
  id: string
  participantId: string
  participantType: 'user' | 'contractor'
  approvalType: 'initial' | 'change' | 'final'
  status: 'pending' | 'approved' | 'rejected'
  timestamp: Date
  comments?: string
}

export interface BidHistoryEntry {
  id: string
  action: string
  field?: string
  oldValue?: any
  newValue?: any
  performedBy: string
  timestamp: Date
  reason?: string
}

export interface QuoteDocument {
  id: string
  bidId: string
  contractorId: string
  customerId: string
  amount: number
  materials: string[]
  timeline: string
  paymentSchedule: PaymentSchedule[]
  warranty: string
  terms: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  createdAt: Date
  expiresAt: Date
  approvals: QuoteApproval[]
  version: number
  changes: QuoteChange[]
}

export interface PaymentSchedule {
  milestone: string
  percentage: number
  amount: number
  dueDate: string
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  paidAt?: Date
  notes?: string
}

export interface QuoteApproval {
  id: string
  participantId: string
  participantType: 'user' | 'contractor'
  status: 'pending' | 'approved' | 'rejected'
  timestamp: Date
  comments?: string
  conditions?: string[]
}

export interface QuoteChange {
  id: string
  field: string
  oldValue: any
  newValue: any
  requestedBy: string
  requestedAt: Date
  status: 'pending' | 'approved' | 'rejected'
  reason?: string
}

export class ChatSessionService {
  private sessions: Map<string, ChatSessionData> = new Map()
  private messageHistory: Map<string, ChatMessage[]> = new Map()

  // Create a new chat session
  async createSession(projectId: string, initialData: Partial<ChatSessionData>): Promise<ChatSessionData> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const session: ChatSessionData = {
      id: sessionId,
      projectId,
      participants: initialData.participants || [],
      messages: initialData.messages || [],
      bidProposal: initialData.bidProposal || this.createDefaultBidProposal(projectId),
      status: 'active',
      createdAt: new Date(),
      lastActivity: new Date(),
      metadata: initialData.metadata || {
        projectType: 'garden-design',
        location: 'Unknown',
        budget: { min: 0, max: 0, currency: 'USD' },
        tags: []
      }
    }

    this.sessions.set(sessionId, session)
    this.messageHistory.set(sessionId, session.messages)

    return session
  }

  // Get session by ID
  async getSession(sessionId: string): Promise<ChatSessionData | null> {
    return this.sessions.get(sessionId) || null
  }

  // Get all sessions for a project
  async getProjectSessions(projectId: string): Promise<ChatSessionData[]> {
    return Array.from(this.sessions.values()).filter(session => session.projectId === projectId)
  }

  // Add message to session
  async addMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'sessionId' | 'timestamp'>): Promise<ChatMessage> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      timestamp: new Date(),
      isEdited: false,
      isDeleted: false
    }

    session.messages.push(newMessage)
    session.lastActivity = new Date()
    
    // Update message history
    const history = this.messageHistory.get(sessionId) || []
    history.push(newMessage)
    this.messageHistory.set(sessionId, history)

    // Update session
    this.sessions.set(sessionId, session)

    return newMessage
  }

  // Edit message
  async editMessage(sessionId: string, messageId: string, newContent: string, editedBy: string): Promise<ChatMessage | null> {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    const messageIndex = session.messages.findIndex(msg => msg.id === messageId)
    if (messageIndex === -1) return null

    const message = session.messages[messageIndex]
    message.content = newContent
    message.isEdited = true
    message.editedAt = new Date()

    // Add edit history to metadata
    if (!message.metadata) message.metadata = {}
    if (!message.metadata.attachments) message.metadata.attachments = []
    message.metadata.attachments.push(`Edited by ${editedBy} at ${message.editedAt.toISOString()}`)

    session.lastActivity = new Date()
    this.sessions.set(sessionId, session)

    return message
  }

  // Delete message
  async deleteMessage(sessionId: string, messageId: string, deletedBy: string): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    const messageIndex = session.messages.findIndex(msg => msg.id === messageId)
    if (messageIndex === -1) return false

    const message = session.messages[messageIndex]
    message.isDeleted = true
    message.deletedAt = new Date()
    message.content = '[Message deleted]'

    session.lastActivity = new Date()
    this.sessions.set(sessionId, session)

    return true
  }

  // Add participant to session
  async addParticipant(sessionId: string, participant: Omit<ChatParticipant, 'joinedAt' | 'lastSeen' | 'isActive'>): Promise<ChatParticipant> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const newParticipant: ChatParticipant = {
      ...participant,
      joinedAt: new Date(),
      lastSeen: new Date(),
      isActive: true
    }

    session.participants.push(newParticipant)
    session.lastActivity = new Date()
    this.sessions.set(sessionId, session)

    // Add system message about new participant
    await this.addMessage(sessionId, {
      sender: 'system',
      senderId: 'system',
      senderName: 'System',
      content: `${participant.name} has joined the conversation`,
      messageType: 'system'
    })

    return newParticipant
  }

  // Remove participant from session
  async removeParticipant(sessionId: string, participantId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    const participantIndex = session.participants.findIndex(p => p.id === participantId)
    if (participantIndex === -1) return false

    const participant = session.participants[participantIndex]
    participant.isActive = false
    participant.lastSeen = new Date()

    session.lastActivity = new Date()
    this.sessions.set(sessionId, session)

    // Add system message about participant leaving
    await this.addMessage(sessionId, {
      sender: 'system',
      senderId: 'system',
      senderName: 'System',
      content: `${participant.name} has left the conversation`,
      messageType: 'system'
    })

    return true
  }

  // Update participant activity
  async updateParticipantActivity(sessionId: string, participantId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const participant = session.participants.find(p => p.id === participantId)
    if (participant) {
      participant.lastSeen = new Date()
      participant.isActive = true
      session.lastActivity = new Date()
      this.sessions.set(sessionId, session)
    }
  }

  // Update bid proposal
  async updateBidProposal(sessionId: string, updates: Partial<BidProposal>, updatedBy: string): Promise<BidProposal> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const oldBid = { ...session.bidProposal }
    const updatedBid = { ...session.bidProposal, ...updates }

    // Track changes
    Object.keys(updates).forEach(field => {
      if (field !== 'changes' && field !== 'approvals' && field !== 'history') {
        const change: BidChange = {
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          field,
          oldValue: oldBid[field as keyof BidProposal],
          newValue: updates[field as keyof BidProposal],
          requestedBy: updatedBy,
          requestedAt: new Date(),
          status: 'pending'
        }

        updatedBid.changes.push(change)
      }
    })

    // Add to history
    const historyEntry: BidHistoryEntry = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action: 'bid_updated',
      performedBy: updatedBy,
      timestamp: new Date(),
      reason: 'Bid proposal updated'
    }

    updatedBid.history.push(historyEntry)
    updatedBid.version += 1
    updatedBid.lastUpdated = new Date()

    session.bidProposal = updatedBid
    session.lastActivity = new Date()
    this.sessions.set(sessionId, session)

    return updatedBid
  }

  // Approve bid change
  async approveBidChange(sessionId: string, changeId: string, approvedBy: string, comments?: string): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    const change = session.bidProposal.changes.find(c => c.id === changeId)
    if (!change || change.status !== 'pending') return false

    change.status = 'approved'
    change.approvedBy = approvedBy
    change.approvedAt = new Date()

    // Add approval record
    const approval: BidApproval = {
      id: `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      participantId: approvedBy,
      participantType: 'user', // This should be determined from the participant
      approvalType: 'change',
      status: 'approved',
      timestamp: new Date(),
      comments
    }

    session.bidProposal.approvals.push(approval)
    session.lastActivity = new Date()
    this.sessions.set(sessionId, session)

    return true
  }

  // Reject bid change
  async rejectBidChange(sessionId: string, changeId: string, rejectedBy: string, reason: string): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    const change = session.bidProposal.changes.find(c => c.id === changeId)
    if (!change || change.status !== 'pending') return false

    change.status = 'rejected'
    change.rejectedBy = rejectedBy
    change.rejectedAt = new Date()
    change.rejectionReason = reason

    session.lastActivity = new Date()
    this.sessions.set(sessionId, session)

    return true
  }

  // Generate quote from bid
  async generateQuote(sessionId: string, generatedBy: string): Promise<QuoteDocument> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const quote: QuoteDocument = {
      id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bidId: session.bidProposal.id,
      contractorId: session.bidProposal.contractorId,
      customerId: session.bidProposal.customerId,
      amount: session.bidProposal.currentAmount,
      materials: session.bidProposal.materials,
      timeline: session.bidProposal.timeline,
      paymentSchedule: this.generatePaymentSchedule(session.bidProposal.currentAmount),
      warranty: session.bidProposal.warranty,
      terms: 'Standard garden design and installation terms',
      status: 'draft',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      approvals: [],
      version: 1,
      changes: []
    }

    session.quoteDocument = quote
    session.lastActivity = new Date()
    this.sessions.set(sessionId, session)

    return quote
  }

  // Get message history
  async getMessageHistory(sessionId: string, limit?: number, offset?: number): Promise<ChatMessage[]> {
    const history = this.messageHistory.get(sessionId) || []
    
    if (limit && offset) {
      return history.slice(offset, offset + limit)
    }
    
    if (limit) {
      return history.slice(-limit)
    }
    
    return history
  }

  // Search messages
  async searchMessages(sessionId: string, query: string): Promise<ChatMessage[]> {
    const history = this.messageHistory.get(sessionId) || []
    const lowerQuery = query.toLowerCase()
    
    return history.filter(message => 
      message.content.toLowerCase().includes(lowerQuery) &&
      !message.isDeleted
    )
  }

  // Archive session
  async archiveSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    session.status = 'archived'
    session.lastActivity = new Date()
    this.sessions.set(sessionId, session)

    return true
  }

  // Private helper methods
  private createDefaultBidProposal(projectId: string): BidProposal {
    return {
      id: `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      contractorId: '',
      customerId: '',
      initialAmount: 0,
      currentAmount: 0,
      materials: [],
      timeline: '',
      paymentTerms: '',
      warranty: '',
      status: 'draft',
      lastUpdated: new Date(),
      version: 1,
      changes: [],
      approvals: [],
      history: []
    }
  }

  private generatePaymentSchedule(totalAmount: number): PaymentSchedule[] {
    return [
      {
        milestone: 'Project Start',
        percentage: 50,
        amount: totalAmount * 0.5,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        status: 'pending'
      },
      {
        milestone: '50% Completion',
        percentage: 30,
        amount: totalAmount * 0.3,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        status: 'pending'
      },
      {
        milestone: 'Project Completion',
        percentage: 20,
        amount: totalAmount * 0.2,
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days from now
        status: 'pending'
      }
    ]
  }
}

// Export singleton instance
export const chatSessionService = new ChatSessionService()
