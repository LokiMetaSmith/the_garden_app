'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  MessageCircle, 
  Send, 
  User, 
  Building2, 
  Bot, 
  FileText, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Pin,
  Users,
  Plus,
  Edit,
  Save,
  X
} from 'lucide-react'

// Types and Interfaces
interface ChatMessage {
  id: string
  sender: 'user' | 'contractor' | 'ai_agent'
  senderId: string
  senderName: string
  content: string
  timestamp: Date
  messageType: 'text' | 'bid_update' | 'quote_update' | 'agreement' | 'dispute'
  metadata?: {
    bidId?: string
    quoteId?: string
    agreementType?: string
    amount?: number
    materials?: string[]
    timeline?: string
  }
}

interface BidProposal {
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
  status: 'draft' | 'negotiating' | 'agreed' | 'disputed'
  lastUpdated: Date
  version: number
  changes: BidChange[]
}

interface BidChange {
  id: string
  field: string
  oldValue: any
  newValue: any
  requestedBy: string
  requestedAt: Date
  status: 'pending' | 'approved' | 'rejected'
  reason?: string
}

interface QuoteDocument {
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
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  createdAt: Date
  expiresAt: Date
}

interface PaymentSchedule {
  milestone: string
  percentage: number
  amount: number
  dueDate: string
  status: 'pending' | 'paid' | 'overdue'
}

interface ChatParticipant {
  id: string
  type: 'user' | 'contractor'
  name: string
  avatar?: string
  role: string
  joinedAt: Date
}

interface ChatSession {
  id: string
  projectId: string
  participants: ChatParticipant[]
  messages: ChatMessage[]
  bidProposal: BidProposal
  quoteDocument?: QuoteDocument
  status: 'active' | 'completed' | 'disputed'
  createdAt: Date
  lastActivity: Date
}

// Mock Data
const mockBidProposal: BidProposal = {
  id: 'bid_001',
  projectId: 'project_456',
  contractorId: 'contractor_123',
  customerId: 'customer_789',
  initialAmount: 8500,
  currentAmount: 8500,
  materials: [
    'Native plants',
    'Drip irrigation system',
    'Stone pavers',
    'LED landscape lighting'
  ],
  timeline: '10-12 weeks',
  paymentTerms: '50% upfront, 30% at 50% completion, 20% upon completion',
  warranty: '2 years on plants, 5 years on hardscaping',
  status: 'negotiating',
  lastUpdated: new Date(),
  version: 1,
  changes: []
}

const mockQuoteDocument: QuoteDocument = {
  id: 'quote_001',
  bidId: 'bid_001',
  contractorId: 'contractor_123',
  customerId: 'customer_789',
  amount: 8500,
  materials: [
    'Native plants',
    'Drip irrigation system',
    'Stone pavers',
    'LED landscape lighting'
  ],
  timeline: '10-12 weeks',
  paymentSchedule: [
    { milestone: 'Project Start', percentage: 50, amount: 4250, dueDate: '2024-02-01', status: 'pending' },
    { milestone: '50% Completion', percentage: 30, amount: 2550, dueDate: '2024-03-15', status: 'pending' },
    { milestone: 'Project Completion', percentage: 20, amount: 1700, dueDate: '2024-04-15', status: 'pending' }
  ],
  warranty: '2 years on plants, 5 years on hardscaping',
  terms: 'Standard garden design and installation terms',
  status: 'sent',
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
}

const mockParticipants: ChatParticipant[] = [
  {
    id: 'customer_789',
    type: 'user',
    name: 'John Doe',
    avatar: '/placeholder-user.jpg',
    role: 'Project Owner',
    joinedAt: new Date()
  },
  {
    id: 'contractor_123',
    type: 'contractor',
    name: 'Green Thumb Gardens',
    avatar: '/placeholder-logo.png',
    role: 'Landscape Contractor',
    joinedAt: new Date()
  }
]

const mockMessages: ChatMessage[] = [
  {
    id: 'msg_1',
    sender: 'ai_agent',
    senderId: 'ai_agent',
    senderName: 'AI Moderator',
    content: 'Welcome to the project chat! I\'m here to help facilitate communication and maintain the bid proposal. The initial bid has been set at $8,500 with a 10-12 week timeline.',
    timestamp: new Date(Date.now() - 3600000),
    messageType: 'text'
  },
  {
    id: 'msg_2',
    sender: 'user',
    senderId: 'customer_789',
    senderName: 'John Doe',
    content: 'Thanks! I have a few questions about the materials. Can we discuss the irrigation system options?',
    timestamp: new Date(Date.now() - 1800000),
    messageType: 'text'
  },
  {
    id: 'msg_3',
    sender: 'contractor',
    senderId: 'contractor_123',
    senderName: 'Green Thumb Gardens',
    content: 'Absolutely! I recommend a smart drip irrigation system with moisture sensors. This will save water and ensure optimal plant health. The cost is included in the current bid.',
    timestamp: new Date(Date.now() - 900000),
    messageType: 'text'
  }
]

export default function ChatInterface({ 
  projectId, 
  initialBid 
}: { 
  projectId: string
  initialBid?: BidProposal 
}) {
  const [activeTab, setActiveTab] = useState('chat')
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages)
  const [newMessage, setNewMessage] = useState('')
  const [bidProposal, setBidProposal] = useState<BidProposal>(initialBid || mockBidProposal)
  const [quoteDocument, setQuoteDocument] = useState<QuoteDocument | undefined>(mockQuoteDocument)
  const [participants, setParticipants] = useState<ChatParticipant[]>(mockParticipants)
  const [isInvitingContractor, setIsInvitingContractor] = useState(false)
  const [isEditingBid, setIsEditingBid] = useState(false)
  const [editingBidData, setEditingBidData] = useState<Partial<BidProposal>>({})
  const [isInvitingUser, setIsInvitingUser] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // AI Agent Response Handler
  const handleAIResponse = async (message: string, context: any) => {
    // Simulate AI processing
    const aiResponse: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'ai_agent',
      senderId: 'ai_agent',
      senderName: 'AI Moderator',
      content: `I've processed your message: "${message}". Based on the current bid proposal and conversation context, I can help facilitate this discussion.`,
      timestamp: new Date(),
      messageType: 'text'
    }
    
    setMessages(prev => [...prev, aiResponse])
    
    // Update bid proposal if needed
    if (context.bidUpdate) {
      const updatedBid = { ...bidProposal, ...context.bidUpdate }
      setBidProposal(updatedBid)
    }
  }

  // Send Message
  const sendMessage = async () => {
    if (!newMessage.trim()) return

    const currentUser = participants.find(p => p.type === 'user') // In real app, get from auth
    if (!currentUser) return

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: newMessage,
      timestamp: new Date(),
      messageType: 'text'
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')

    // Trigger AI response
    await handleAIResponse(newMessage, {})
  }

  // Update Bid Proposal
  const updateBidProposal = (updates: Partial<BidProposal>) => {
    const change: BidChange = {
      id: `change_${Date.now()}`,
      field: Object.keys(updates)[0],
      oldValue: bidProposal[Object.keys(updates)[0] as keyof BidProposal],
      newValue: Object.values(updates)[0],
      requestedBy: 'customer_789', // In real app, get from auth
      requestedAt: new Date(),
      status: 'pending'
    }

    const updatedBid: BidProposal = {
      ...bidProposal,
      ...updates,
      changes: [...bidProposal.changes, change],
      version: bidProposal.version + 1,
      lastUpdated: new Date()
    }

    setBidProposal(updatedBid)
    setIsEditingBid(false)
    setEditingBidData({})

    // Add AI message about the change
    const aiMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'ai_agent',
      senderId: 'ai_agent',
      senderName: 'AI Moderator',
      content: `I've updated the bid proposal based on your request. The ${change.field} has been changed from "${change.oldValue}" to "${change.newValue}". This change requires approval from both parties.`,
      timestamp: new Date(),
      messageType: 'bid_update',
      metadata: { bidId: bidProposal.id }
    }

    setMessages(prev => [...prev, aiMessage])
  }

  // Approve/Reject Change
  const handleChangeApproval = (changeId: string, approved: boolean, reason?: string) => {
    const updatedBid = {
      ...bidProposal,
      changes: bidProposal.changes.map(change => 
        change.id === changeId 
          ? { ...change, status: approved ? 'approved' : 'rejected', reason }
          : change
      )
    }

    setBidProposal(updatedBid)

    // Add AI message about the decision
    const aiMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'ai_agent',
      senderId: 'ai_agent',
      senderName: 'AI Moderator',
      content: `The change to ${updatedBid.changes.find(c => c.id === changeId)?.field} has been ${approved ? 'approved' : 'rejected'}${reason ? `: ${reason}` : ''}.`,
      timestamp: new Date(),
      messageType: 'agreement'
    }

    setMessages(prev => [...prev, aiMessage])
  }

  // Invite Contractor
  const inviteContractor = async () => {
    if (!inviteEmail.trim()) return

    const newContractor: ChatParticipant = {
      id: `contractor_${Date.now()}`,
      type: 'contractor',
      name: inviteEmail.split('@')[0], // In real app, get actual name
      role: inviteRole || 'Contractor',
      joinedAt: new Date()
    }

    setParticipants(prev => [...prev, newContractor])
    setIsInvitingContractor(false)
    setInviteEmail('')
    setInviteRole('')

    // Add AI message about the invitation
    const aiMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'ai_agent',
      senderId: 'ai_agent',
      senderName: 'AI Moderator',
      content: `I've invited ${newContractor.name} to join this chat as a ${newContractor.role}. They will be able to view the bid proposal and participate in the discussion.`,
      timestamp: new Date(),
      messageType: 'text'
    }

    setMessages(prev => [...prev, aiMessage])
  }

  // Generate Quote from Bid
  const generateQuote = () => {
    if (!quoteDocument) {
      const newQuote: QuoteDocument = {
        id: `quote_${Date.now()}`,
        bidId: bidProposal.id,
        contractorId: bidProposal.contractorId,
        customerId: bidProposal.customerId,
        amount: bidProposal.currentAmount,
        materials: bidProposal.materials,
        timeline: bidProposal.timeline,
        paymentSchedule: [
          { milestone: 'Project Start', percentage: 50, amount: bidProposal.currentAmount * 0.5, dueDate: '2024-02-01', status: 'pending' },
          { milestone: '50% Completion', percentage: 30, amount: bidProposal.currentAmount * 0.3, dueDate: '2024-03-15', status: 'pending' },
          { milestone: 'Project Completion', percentage: 20, amount: bidProposal.currentAmount * 0.2, dueDate: '2024-04-15', status: 'pending' }
        ],
        warranty: bidProposal.warranty,
        terms: 'Standard garden design and installation terms',
        status: 'draft',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }

      setQuoteDocument(newQuote)

      // Add AI message about quote generation
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        sender: 'ai_agent',
        senderId: 'ai_agent',
        senderName: 'AI Moderator',
        content: `I've generated a quote document based on the current bid proposal. The quote includes detailed payment schedules and terms. Both parties can review and approve this quote.`,
        timestamp: new Date(),
        messageType: 'quote_update'
      }

      setMessages(prev => [...prev, aiMessage])
    }
  }

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Project Chat
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={bidProposal.status === 'agreed' ? 'default' : 'secondary'}>
                {bidProposal.status}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsInvitingContractor(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Invite Contractor
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="bid">Bid Proposal</TabsTrigger>
              <TabsTrigger value="quote">Quote</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 flex flex-col mt-4">
              {/* Participants */}
              <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded-lg">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Participants:</span>
                {participants.map(participant => (
                  <Badge key={participant.id} variant="outline" className="flex items-center gap-1">
                    <Avatar className="w-4 h-4">
                      <AvatarImage src={participant.avatar} />
                      <AvatarFallback>{participant.name[0]}</AvatarFallback>
                    </Avatar>
                    {participant.name}
                  </Badge>
                ))}
              </div>

              {/* Messages */}
              <ScrollArea ref={scrollAreaRef} className="flex-1 border rounded-lg p-4 mb-4">
                <div className="space-y-4">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.sender === 'ai_agent' ? 'justify-center' : 
                        message.sender === 'user' ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      {message.sender !== 'ai_agent' && (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={
                            participants.find(p => p.id === message.senderId)?.avatar
                          } />
                          <AvatarFallback>
                            {message.sender === 'user' ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`max-w-[70%] ${
                        message.sender === 'ai_agent' 
                          ? 'bg-blue-50 border border-blue-200 rounded-lg p-3 text-center'
                          : message.sender === 'user'
                          ? 'bg-gray-100 rounded-lg p-3'
                          : 'bg-green-100 rounded-lg p-3'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {message.sender === 'ai_agent' && <Bot className="w-4 h-4 inline mr-1" />}
                            {message.senderName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        {message.metadata && (
                          <div className="mt-2 text-xs text-gray-600">
                            {message.metadata.bidId && <span>Bid: {message.metadata.bidId}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                />
                <Button onClick={sendMessage} size="sm">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="bid" className="flex-1 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Bid Proposal</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingBid(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateQuote}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Quote
                    </Button>
                  </div>
                </div>

                {/* Bid Details */}
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Amount</label>
                        <p className="text-lg font-semibold">${bidProposal.currentAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Timeline</label>
                        <p className="text-lg">{bidProposal.timeline}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-600">Materials</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {bidProposal.materials.map((material, index) => (
                            <Badge key={index} variant="secondary">{material}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-600">Payment Terms</label>
                        <p className="text-sm">{bidProposal.paymentTerms}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-600">Warranty</label>
                        <p className="text-sm">{bidProposal.warranty}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Changes */}
                {bidProposal.changes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Pending Changes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {bidProposal.changes
                          .filter(change => change.status === 'pending')
                          .map(change => (
                            <div key={change.id} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{change.field}</span>
                                <span className="text-sm text-gray-500">
                                  Requested by {change.requestedBy}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">From:</span>
                                  <p>{String(change.oldValue)}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">To:</span>
                                  <p>{String(change.newValue)}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  onClick={() => handleChangeApproval(change.id, true)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleChangeApproval(change.id, false, 'Rejected')}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="quote" className="flex-1 mt-4">
              {quoteDocument ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Quote Document</h3>
                    <Badge variant={quoteDocument.status === 'accepted' ? 'default' : 'secondary'}>
                      {quoteDocument.status}
                    </Badge>
                  </div>

                  <Card>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Total Amount</label>
                          <p className="text-2xl font-bold text-green-600">
                            ${quoteDocument.amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Timeline</label>
                          <p className="text-lg">{quoteDocument.timeline}</p>
                        </div>
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-gray-600">Payment Schedule</label>
                          <div className="space-y-2 mt-2">
                            {quoteDocument.paymentSchedule.map((payment, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm">{payment.milestone}</span>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-gray-600">{payment.percentage}%</span>
                                  <span className="font-medium">${payment.amount.toLocaleString()}</span>
                                  <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                                    {payment.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-gray-600">Terms & Conditions</label>
                          <p className="text-sm mt-1">{quoteDocument.terms}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-2">
                    <Button className="flex-1">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept Quote
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Request Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No Quote Generated</h3>
                  <p className="text-gray-500 mb-4">
                    Generate a quote from the current bid proposal to proceed with the project.
                  </p>
                  <Button onClick={generateQuote}>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Quote
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Invite Contractor Dialog */}
      <Dialog open={isInvitingContractor} onOpenChange={setIsInvitingContractor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Contractor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="contractor@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <Input
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                placeholder="Landscape Contractor"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={inviteContractor} className="flex-1">
                Send Invitation
              </Button>
              <Button variant="outline" onClick={() => setIsInvitingContractor(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Bid Dialog */}
      <Dialog open={isEditingBid} onOpenChange={setIsEditingBid}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Bid Proposal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  value={editingBidData.currentAmount || bidProposal.currentAmount}
                  onChange={(e) => setEditingBidData(prev => ({ ...prev, currentAmount: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Timeline</label>
                <Input
                  value={editingBidData.timeline || bidProposal.timeline}
                  onChange={(e) => setEditingBidData(prev => ({ ...prev, timeline: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Materials</label>
              <Textarea
                value={editingBidData.materials?.join(', ') || bidProposal.materials.join(', ')}
                onChange={(e) => setEditingBidData(prev => ({ 
                  ...prev, 
                  materials: e.target.value.split(',').map(s => s.trim()) 
                }))}
                placeholder="Enter materials separated by commas"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Payment Terms</label>
              <Textarea
                value={editingBidData.paymentTerms || bidProposal.paymentTerms}
                onChange={(e) => setEditingBidData(prev => ({ ...prev, paymentTerms: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => updateBidProposal(editingBidData)} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setIsEditingBid(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
