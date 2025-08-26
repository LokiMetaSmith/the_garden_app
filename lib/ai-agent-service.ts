// AI Agent Service for Chat Moderation and Bid Management

export interface AIAgentContext {
  projectId: string
  bidProposal: any
  quoteDocument?: any
  participants: any[]
  conversationHistory: any[]
  projectRequirements: any
  marketData?: any
}

export interface AIAgentResponse {
  message: string
  actions: AIAgentAction[]
  recommendations: string[]
  warnings?: string[]
  bidUpdates?: any
  quoteUpdates?: any
}

export interface AIAgentAction {
  type: 'approve_change' | 'reject_change' | 'request_clarification' | 'flag_dispute' | 'update_bid' | 'generate_quote' | 'escalate_issue'
  target: string
  reason: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: any
}

export interface DisputeFlag {
  id: string
  type: 'price_gouging' | 'scope_creep' | 'unreasonable_demands' | 'quality_concerns' | 'timeline_issues'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  evidence: string[]
  recommendedAction: string
  timestamp: Date
}

export class AIAgentService {
  private context: AIAgentContext
  private disputeHistory: DisputeFlag[] = []
  private fairnessThresholds = {
    priceIncrease: 0.15, // 15% max increase
    timelineExtension: 0.25, // 25% max extension
    scopeAddition: 0.20, // 20% max scope increase
    qualityReduction: 0.10 // 10% max quality reduction
  }

  constructor(context: AIAgentContext) {
    this.context = context
  }

  // Main AI Agent Response Generator
  async generateResponse(userMessage: string, senderType: 'user' | 'contractor'): Promise<AIAgentResponse> {
    const analysis = await this.analyzeMessage(userMessage, senderType)
    const response = await this.formulateResponse(analysis)
    
    return response
  }

  // Analyze incoming message for intent and potential issues
  private async analyzeMessage(message: string, senderType: 'user' | 'contractor'): Promise<any> {
    const analysis = {
      intent: this.detectIntent(message),
      sentiment: this.analyzeSentiment(message),
      potentialIssues: this.identifyPotentialIssues(message, senderType),
      bidImplications: this.analyzeBidImplications(message),
      fairnessScore: this.calculateFairnessScore(message, senderType)
    }

    return analysis
  }

  // Detect user intent from message
  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('amount')) {
      return 'price_negotiation'
    }
    if (lowerMessage.includes('timeline') || lowerMessage.includes('schedule') || lowerMessage.includes('when')) {
      return 'timeline_negotiation'
    }
    if (lowerMessage.includes('material') || lowerMessage.includes('quality') || lowerMessage.includes('specification')) {
      return 'specification_change'
    }
    if (lowerMessage.includes('payment') || lowerMessage.includes('terms') || lowerMessage.includes('deposit')) {
      return 'payment_negotiation'
    }
    if (lowerMessage.includes('warranty') || lowerMessage.includes('guarantee')) {
      return 'warranty_discussion'
    }
    if (lowerMessage.includes('question') || lowerMessage.includes('clarify') || lowerMessage.includes('understand')) {
      return 'information_request'
    }
    
    return 'general_discussion'
  }

  // Analyze message sentiment
  private analyzeSentiment(message: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['good', 'great', 'excellent', 'perfect', 'agree', 'accept', 'happy', 'satisfied']
    const negativeWords = ['bad', 'terrible', 'unacceptable', 'reject', 'unhappy', 'dissatisfied', 'angry', 'frustrated']
    
    const lowerMessage = message.toLowerCase()
    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length
    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  // Identify potential issues in the message
  private identifyPotentialIssues(message: string, senderType: 'user' | 'contractor'): string[] {
    const issues: string[] = []
    const lowerMessage = message.toLowerCase()
    
    // Price gouging detection
    if (senderType === 'contractor' && 
        (lowerMessage.includes('increase') || lowerMessage.includes('additional cost')) &&
        lowerMessage.includes('price')) {
      issues.push('potential_price_increase')
    }
    
    // Scope creep detection
    if (lowerMessage.includes('additional') && lowerMessage.includes('work')) {
      issues.push('potential_scope_creep')
    }
    
    // Quality reduction detection
    if (lowerMessage.includes('cheaper') || lowerMessage.includes('alternative') || lowerMessage.includes('substitute')) {
      issues.push('potential_quality_reduction')
    }
    
    // Timeline extension detection
    if (lowerMessage.includes('delay') || lowerMessage.includes('extend') || lowerMessage.includes('more time')) {
      issues.push('potential_timeline_extension')
    }
    
    return issues
  }

  // Analyze how message affects the bid
  private analyzeBidImplications(message: string): any {
    const implications = {
      priceChange: 0,
      timelineChange: 0,
      scopeChange: 0,
      qualityChange: 0
    }
    
    const lowerMessage = message.toLowerCase()
    
    // Extract numerical values and changes
    const priceMatch = lowerMessage.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/g)
    const timelineMatch = lowerMessage.match(/(\d+)\s*(weeks?|months?|days?)/gi)
    
    if (priceMatch) {
      implications.priceChange = this.extractPriceChange(priceMatch)
    }
    
    if (timelineMatch) {
      implications.timelineChange = this.extractTimelineChange(timelineMatch)
    }
    
    return implications
  }

  // Calculate fairness score of the message
  private calculateFairnessScore(message: string, senderType: 'user' | 'contractor'): number {
    let score = 100 // Start with perfect score
    
    const issues = this.identifyPotentialIssues(message, senderType)
    const implications = this.analyzeBidImplications(message)
    
    // Deduct points for each issue
    issues.forEach(issue => {
      switch (issue) {
        case 'potential_price_increase':
          score -= 20
          break
        case 'potential_scope_creep':
          score -= 15
          break
        case 'potential_quality_reduction':
          score -= 25
          break
        case 'potential_timeline_extension':
          score -= 10
          break
      }
    })
    
    // Deduct points for extreme changes
    if (Math.abs(implications.priceChange) > this.fairnessThresholds.priceIncrease * 100) {
      score -= 30
    }
    
    if (Math.abs(implications.timelineChange) > this.fairnessThresholds.timelineExtension * 100) {
      score -= 20
    }
    
    return Math.max(0, score)
  }

  // Extract price change from message
  private extractPriceChange(priceMatches: string[]): number {
    // This is a simplified version - in production, you'd use more sophisticated NLP
    const currentPrice = this.context.bidProposal?.currentAmount || 0
    
    if (priceMatches.length >= 2) {
      const oldPrice = parseFloat(priceMatches[0].replace(/[$,]/g, ''))
      const newPrice = parseFloat(priceMatches[1].replace(/[$,]/g, ''))
      return ((newPrice - oldPrice) / oldPrice) * 100
    }
    
    return 0
  }

  // Extract timeline change from message
  private extractTimelineChange(timelineMatches: string[]): number {
    // Simplified timeline change detection
    const currentTimeline = this.context.bidProposal?.timeline || '10-12 weeks'
    const currentWeeks = this.extractWeeksFromTimeline(currentTimeline)
    
    if (timelineMatches.length > 0) {
      const newWeeks = parseInt(timelineMatches[0].match(/\d+/)?.[0] || '0')
      if (newWeeks > 0) {
        return ((newWeeks - currentWeeks) / currentWeeks) * 100
      }
    }
    
    return 0
  }

  // Extract weeks from timeline string
  private extractWeeksFromTimeline(timeline: string): number {
    const match = timeline.match(/(\d+)/)
    return match ? parseInt(match[1]) : 12
  }

  // Formulate AI response based on analysis
  private async formulateResponse(analysis: any): Promise<AIAgentResponse> {
    const response: AIAgentResponse = {
      message: '',
      actions: [],
      recommendations: [],
      warnings: []
    }

    // Generate appropriate response based on intent and issues
    if (analysis.potentialIssues.length > 0) {
      response.message = this.generateIssueResponse(analysis)
      response.warnings = this.generateWarnings(analysis.potentialIssues)
      response.actions = this.generateActions(analysis)
    } else {
      response.message = this.generateStandardResponse(analysis)
    }

    // Add recommendations
    response.recommendations = this.generateRecommendations(analysis)
    
    // Add bid updates if needed
    if (analysis.bidImplications.priceChange !== 0 || analysis.bidImplications.timelineChange !== 0) {
      response.bidUpdates = this.calculateBidUpdates(analysis.bidImplications)
    }

    return response
  }

  // Generate response for messages with potential issues
  private generateIssueResponse(analysis: any): string {
    let response = "I've analyzed your message and identified some areas that may need attention. "
    
    if (analysis.potentialIssues.includes('potential_price_increase')) {
      response += "The proposed price change appears to be outside typical market ranges. "
    }
    
    if (analysis.potentialIssues.includes('potential_scope_creep')) {
      response += "Adding work scope may require re-evaluating the project timeline and budget. "
    }
    
    if (analysis.potentialIssues.includes('potential_quality_reduction')) {
      response += "Quality changes could affect the long-term value and warranty of the project. "
    }
    
    response += "I recommend we discuss these changes to ensure they're fair and reasonable for both parties."
    
    return response
  }

  // Generate warnings for potential issues
  private generateWarnings(issues: string[]): string[] {
    const warnings: string[] = []
    
    issues.forEach(issue => {
      switch (issue) {
        case 'potential_price_increase':
          warnings.push('Price increase exceeds recommended threshold')
          break
        case 'potential_scope_creep':
          warnings.push('Scope change may require contract amendment')
          break
        case 'potential_quality_reduction':
          warnings.push('Quality reduction may void warranty terms')
          break
        case 'potential_timeline_extension':
          warnings.push('Timeline extension may affect project costs')
          break
      }
    })
    
    return warnings
  }

  // Generate actions for the AI agent to take
  private generateActions(analysis: any): AIAgentAction[] {
    const actions: AIAgentAction[] = []
    
    if (analysis.fairnessScore < 50) {
      actions.push({
        type: 'flag_dispute',
        target: 'bid_proposal',
        reason: 'Fairness score below threshold',
        priority: 'high',
        metadata: { fairnessScore: analysis.fairnessScore }
      })
    }
    
    if (analysis.potentialIssues.includes('potential_price_increase')) {
      actions.push({
        type: 'request_clarification',
        target: 'price_justification',
        reason: 'Price increase needs justification',
        priority: 'medium'
      })
    }
    
    return actions
  }

  // Generate standard response for normal messages
  private generateStandardResponse(analysis: any): string {
    const responses = {
      price_negotiation: "I understand you'd like to discuss pricing. Let me help facilitate a fair negotiation that works for both parties.",
      timeline_negotiation: "Timeline adjustments can be made, but we need to ensure they don't significantly impact project costs or quality.",
      specification_change: "Specification changes are possible. Let's evaluate how they affect the project scope and pricing.",
      payment_negotiation: "Payment terms can be flexible within reasonable bounds. What specific terms are you looking for?",
      warranty_discussion: "Warranty terms are important for project quality assurance. Let's discuss what coverage makes sense.",
      information_request: "I'm here to help clarify any questions about the project, bid, or process.",
      general_discussion: "I'm monitoring this conversation to ensure fair and productive discussion. How can I help?"
    }
    
    return responses[analysis.intent] || responses.general_discussion
  }

  // Generate recommendations based on analysis
  private generateRecommendations(analysis: any): string[] {
    const recommendations: string[] = []
    
    if (analysis.fairnessScore < 70) {
      recommendations.push('Consider adjusting your proposal to be more in line with market standards')
      recommendations.push('Provide justification for any significant changes to the original bid')
    }
    
    if (analysis.potentialIssues.includes('potential_scope_creep')) {
      recommendations.push('Document all scope changes and their impact on timeline and budget')
      recommendations.push('Consider creating a change order for significant scope additions')
    }
    
    if (analysis.potentialIssues.includes('potential_quality_reduction')) {
      recommendations.push('Ensure quality changes don\'t compromise project integrity')
      recommendations.push('Update warranty terms if quality specifications change')
    }
    
    return recommendations
  }

  // Calculate bid updates based on implications
  private calculateBidUpdates(implications: any): any {
    const updates: any = {}
    
    if (implications.priceChange !== 0) {
      const currentAmount = this.context.bidProposal?.currentAmount || 0
      const newAmount = currentAmount * (1 + implications.priceChange / 100)
      
      // Check if change is within acceptable limits
      if (Math.abs(implications.priceChange) <= this.fairnessThresholds.priceIncrease * 100) {
        updates.currentAmount = newAmount
        updates.status = 'negotiating'
      } else {
        updates.status = 'disputed'
        updates.disputeReason = 'Price change exceeds acceptable threshold'
      }
    }
    
    return updates
  }

  // Flag a dispute for manual review
  async flagDispute(type: string, description: string, evidence: string[]): Promise<DisputeFlag> {
    const dispute: DisputeFlag = {
      id: `dispute_${Date.now()}`,
      type: type as any,
      severity: this.calculateDisputeSeverity(type, description),
      description,
      evidence,
      recommendedAction: this.generateDisputeRecommendation(type),
      timestamp: new Date()
    }
    
    this.disputeHistory.push(dispute)
    
    // In production, this would trigger notifications to human moderators
    console.log('Dispute flagged:', dispute)
    
    return dispute
  }

  // Calculate dispute severity
  private calculateDisputeSeverity(type: string, description: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalKeywords = ['fraud', 'illegal', 'safety', 'dangerous']
    const highKeywords = ['unreasonable', 'excessive', 'unacceptable']
    const mediumKeywords = ['concerning', 'questionable', 'unusual']
    
    const lowerDescription = description.toLowerCase()
    
    if (criticalKeywords.some(keyword => lowerDescription.includes(keyword))) {
      return 'critical'
    }
    
    if (highKeywords.some(keyword => lowerDescription.includes(keyword))) {
      return 'high'
    }
    
    if (mediumKeywords.some(keyword => lowerDescription.includes(keyword))) {
      return 'medium'
    }
    
    return 'low'
  }

  // Generate dispute resolution recommendation
  private generateDisputeRecommendation(type: string): string {
    const recommendations: Record<string, string> = {
      'price_gouging': 'Review pricing against market standards and request justification',
      'scope_creep': 'Document scope changes and adjust timeline/budget accordingly',
      'unreasonable_demands': 'Request clarification and negotiate reasonable terms',
      'quality_concerns': 'Review quality specifications and ensure compliance with standards',
      'timeline_issues': 'Assess impact on project costs and quality, adjust as needed'
    }
    
    return recommendations[type] || 'Review the issue and determine appropriate resolution'
  }

  // Get dispute history
  getDisputeHistory(): DisputeFlag[] {
    return this.disputeHistory
  }

  // Update context
  updateContext(newContext: Partial<AIAgentContext>): void {
    this.context = { ...this.context, ...newContext }
  }

  // Get current context
  getContext(): AIAgentContext {
    return this.context
  }
}

// Export singleton instance
export const aiAgentService = new AIAgentService({
  projectId: '',
  bidProposal: {},
  participants: [],
  conversationHistory: [],
  projectRequirements: {}
})

