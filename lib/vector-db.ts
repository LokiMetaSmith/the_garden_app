// Vector Database Service for Contractor System
// This service handles question storage, AI feedback generation, and engagement scoring

export interface VectorDocument {
  id: string
  content: string
  metadata: {
    type: 'question' | 'feedback' | 'project' | 'contractor'
    category: string
    tags: string[]
    timestamp: Date
    userId: string
    projectId?: string
    contractorId?: string
    priority?: 'low' | 'medium' | 'high'
    isPublic: boolean
  }
  embedding?: number[]
}

export interface Question {
  id: string
  text: string
  askedBy: 'customer' | 'contractor'
  askedAt: Date
  answeredAt?: Date
  answer?: string
  answeredBy?: string
  isPublic: boolean
  priority: 'low' | 'medium' | 'high'
  projectId?: string
  contractorId?: string
  tags: string[]
  engagementScore: number
}

export interface AIFeedback {
  id: string
  projectId: string
  contractorId: string
  feedback: string
  recommendations: string[]
  riskAssessment: 'low' | 'medium' | 'high'
  confidence: number
  generatedAt: Date
  metadata: {
    projectType: string
    budget: number
    timeline: string
    contractorRating: number
    engagementScore: number
  }
}

export interface EngagementScore {
  contractorId: string
  overallScore: number
  metrics: {
    responseTime: number
    communicationQuality: number
    projectCompletion: number
    customerSatisfaction: number
    questionResponseRate: number
    imageUploadFrequency: number
  }
  lastUpdated: Date
  trend: 'up' | 'down' | 'stable'
  change: number
}

export interface ProjectContext {
  id: string
  title: string
  description: string
  requirements: string[]
  images: string[]
  budget: number
  timeline: string
  projectType: string
  customerPreferences: string[]
  location: string
  constraints: string[]
}

class VectorDatabaseService {
  private documents: VectorDocument[] = []
  private questions: Question[] = []
  private feedback: AIFeedback[] = []
  private engagementScores: EngagementScore[] = []

  // Add a question to the vector database
  async addQuestion(question: Omit<Question, 'id' | 'engagementScore'>): Promise<Question> {
    const newQuestion: Question = {
      ...question,
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      engagementScore: this.calculateQuestionEngagement(question),
      tags: this.extractTags(question.text)
    }

    this.questions.push(newQuestion)
    
    // Add to vector documents for semantic search
    const vectorDoc: VectorDocument = {
      id: newQuestion.id,
      content: question.text,
      metadata: {
        type: 'question',
        category: 'project_inquiry',
        tags: newQuestion.tags,
        timestamp: question.askedAt,
        userId: question.askedBy === 'customer' ? 'customer' : question.contractorId || 'unknown',
        projectId: question.projectId,
        contractorId: question.contractorId,
        priority: question.priority,
        isPublic: question.isPublic
      }
    }

    this.documents.push(vectorDoc)
    
    // Update engagement score for contractor
    if (question.contractorId) {
      await this.updateContractorEngagement(question.contractorId, 'question_response')
    }

    return newQuestion
  }

  // Answer a question
  async answerQuestion(questionId: string, answer: string, answeredBy: string): Promise<Question> {
    const question = this.questions.find(q => q.id === questionId)
    if (!question) {
      throw new Error('Question not found')
    }

    question.answer = answer
    question.answeredAt = new Date()
    question.answeredBy = answeredBy

    // Update engagement score
    if (question.contractorId) {
      await this.updateContractorEngagement(question.contractorId, 'question_answered')
    }

    return question
  }

  // Generate AI feedback for a bid/project
  async generateAIFeedback(
    projectContext: ProjectContext,
    contractorId: string,
    bidAmount: number,
    bidTimeline: string,
    contractorRating: number,
    engagementScore: number
  ): Promise<AIFeedback> {
    // In a real implementation, this would call an AI service
    // For now, we'll generate structured feedback based on the data
    
    const riskAssessment = this.assessProjectRisk(projectContext, bidAmount, bidTimeline, engagementScore)
    const confidence = this.calculateConfidence(engagementScore, contractorRating)
    
    const feedback = this.generateFeedbackText(projectContext, bidAmount, bidTimeline, engagementScore, riskAssessment)
    const recommendations = this.generateRecommendations(projectContext, engagementScore, riskAssessment)

    const aiFeedback: AIFeedback = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId: projectContext.id,
      contractorId,
      feedback,
      recommendations,
      riskAssessment,
      confidence,
      generatedAt: new Date(),
      metadata: {
        projectType: projectContext.projectType,
        budget: projectContext.budget,
        timeline: projectContext.timeline,
        contractorRating,
        engagementScore
      }
    }

    this.feedback.push(aiFeedback)
    return aiFeedback
  }

  // Search for similar questions or content
  async semanticSearch(query: string, filters?: {
    type?: string
    category?: string
    tags?: string[]
    isPublic?: boolean
  }): Promise<VectorDocument[]> {
    // In a real implementation, this would use vector similarity search
    // For now, we'll do basic text matching
    
    let results = this.documents.filter(doc => {
      if (filters?.type && doc.metadata.type !== filters.type) return false
      if (filters?.category && doc.metadata.category !== filters.category) return false
      if (filters?.isPublic !== undefined && doc.metadata.isPublic !== filters.isPublic) return false
      if (filters?.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => doc.metadata.tags.includes(tag))
        if (!hasMatchingTag) return false
      }
      return true
    })

    // Basic relevance scoring (in real implementation, this would use vector similarity)
    results = results.map(doc => ({
      ...doc,
      relevanceScore: this.calculateRelevanceScore(query, doc.content)
    }))

    // Sort by relevance score
    results.sort((a, b) => (b as any).relevanceScore - (a as any).relevanceScore)
    
    return results.slice(0, 10) // Return top 10 results
  }

  // Get engagement score for a contractor
  async getContractorEngagement(contractorId: string): Promise<EngagementScore | null> {
    return this.engagementScores.find(score => score.contractorId === contractorId) || null
  }

  // Update contractor engagement based on actions
  private async updateContractorEngagement(contractorId: string, action: string): Promise<void> {
    let score = this.engagementScores.find(s => s.contractorId === contractorId)
    
    if (!score) {
      score = {
        contractorId,
        overallScore: 75, // Default starting score
        metrics: {
          responseTime: 75,
          communicationQuality: 75,
          projectCompletion: 75,
          customerSatisfaction: 75,
          questionResponseRate: 75,
          imageUploadFrequency: 75
        },
        lastUpdated: new Date(),
        trend: 'stable',
        change: 0
      }
      this.engagementScores.push(score)
    }

    // Update specific metrics based on action
    switch (action) {
      case 'question_response':
        score.metrics.communicationQuality = Math.min(100, score.metrics.communicationQuality + 2)
        break
      case 'question_answered':
        score.metrics.communicationQuality = Math.min(100, score.metrics.communicationQuality + 3)
        score.metrics.questionResponseRate = Math.min(100, score.metrics.questionResponseRate + 5)
        break
      case 'image_upload':
        score.metrics.imageUploadFrequency = Math.min(100, score.metrics.imageUploadFrequency + 2)
        break
      case 'project_completed':
        score.metrics.projectCompletion = Math.min(100, score.metrics.projectCompletion + 5)
        break
      case 'customer_satisfaction':
        score.metrics.customerSatisfaction = Math.min(100, score.metrics.customerSatisfaction + 3)
        break
    }

    // Recalculate overall score
    const oldScore = score.overallScore
    score.overallScore = Math.round(
      Object.values(score.metrics).reduce((sum, metric) => sum + metric, 0) / 6
    )
    
    // Update trend
    score.change = score.overallScore - oldScore
    if (score.change > 2) score.trend = 'up'
    else if (score.change < -2) score.trend = 'down'
    else score.trend = 'stable'
    
    score.lastUpdated = new Date()
  }

  // Calculate engagement score for a question
  private calculateQuestionEngagement(question: Omit<Question, 'id' | 'engagementScore'>): number {
    let score = 50 // Base score
    
    // Priority bonus
    switch (question.priority) {
      case 'high': score += 20; break
      case 'medium': score += 10; break
      case 'low': score += 5; break
    }
    
    // Public questions get engagement bonus
    if (question.isPublic) score += 15
    
    // Question length/complexity bonus
    if (question.text.length > 100) score += 10
    if (question.text.includes('?')) score += 5
    
    return Math.min(100, score)
  }

  // Extract tags from question text
  private extractTags(text: string): string[] {
    const tags: string[] = []
    const commonTags = [
      'timeline', 'budget', 'materials', 'design', 'maintenance', 'installation',
      'hardscaping', 'irrigation', 'lighting', 'plants', 'soil', 'drainage'
    ]
    
    commonTags.forEach(tag => {
      if (text.toLowerCase().includes(tag.toLowerCase())) {
        tags.push(tag)
      }
    })
    
    return tags
  }

  // Assess project risk
  private assessProjectRisk(
    project: ProjectContext,
    bidAmount: number,
    bidTimeline: string,
    engagementScore: number
  ): 'low' | 'medium' | 'high' {
    let riskScore = 0
    
    // Budget risk
    if (bidAmount > project.budget * 1.2) riskScore += 3
    else if (bidAmount < project.budget * 0.8) riskScore += 1
    
    // Timeline risk
    if (bidTimeline.includes('week') && parseInt(bidTimeline) > 8) riskScore += 2
    
    // Engagement risk
    if (engagementScore < 70) riskScore += 3
    else if (engagementScore < 80) riskScore += 1
    
    if (riskScore >= 6) return 'high'
    if (riskScore >= 3) return 'medium'
    return 'low'
  }

  // Calculate confidence in AI feedback
  private calculateConfidence(engagementScore: number, contractorRating: number): number {
    const engagementWeight = 0.6
    const ratingWeight = 0.4
    
    return Math.round(
      (engagementScore * engagementWeight) + (contractorRating * 20 * ratingWeight)
    )
  }

  // Generate feedback text
  private generateFeedbackText(
    project: ProjectContext,
    bidAmount: number,
    bidTimeline: string,
    engagementScore: number,
    riskAssessment: string
  ): string {
    return `Based on the bid analysis for "${project.title}", this contractor offers:

- Bid Amount: $${bidAmount.toLocaleString()} (${bidAmount > project.budget ? 'Above' : 'Within'} budget range)
- Timeline: ${bidTimeline}
- Engagement Score: ${engagementScore}/100 (${this.getEngagementLabel(engagementScore)})
- Risk Assessment: ${riskAssessment.charAt(0).toUpperCase() + riskAssessment.slice(1)}

The contractor demonstrates ${engagementScore >= 80 ? 'strong' : engagementScore >= 70 ? 'moderate' : 'limited'} engagement 
and communication skills, which are crucial for project success.`
  }

  // Generate recommendations
  private generateRecommendations(
    project: ProjectContext,
    engagementScore: number,
    riskAssessment: string
  ): string[] {
    const recommendations: string[] = []
    
    if (engagementScore < 80) {
      recommendations.push('Request more frequent communication updates')
      recommendations.push('Set clear milestones and check-in points')
    }
    
    if (riskAssessment === 'high') {
      recommendations.push('Consider requesting additional references')
      recommendations.push('Implement more detailed project monitoring')
      recommendations.push('Request detailed breakdown of materials and timeline')
    }
    
    if (project.projectType === 'design') {
      recommendations.push('Request portfolio of similar projects')
      recommendations.push('Schedule design consultation meeting')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Proceed with standard project monitoring')
      recommendations.push('Maintain regular communication schedule')
    }
    
    return recommendations
  }

  // Get engagement label
  private getEngagementLabel(score: number): string {
    if (score >= 90) return 'excellent'
    if (score >= 80) return 'good'
    if (score >= 70) return 'fair'
    return 'poor'
  }

  // Calculate relevance score for search
  private calculateRelevanceScore(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(' ')
    const contentWords = content.toLowerCase().split(' ')
    
    let matches = 0
    queryWords.forEach(word => {
      if (contentWords.includes(word)) matches++
    })
    
    return (matches / queryWords.length) * 100
  }

  // Get questions by project
  async getQuestionsByProject(projectId: string): Promise<Question[]> {
    return this.questions.filter(q => q.projectId === projectId)
  }

  // Get questions by contractor
  async getQuestionsByContractor(contractorId: string): Promise<Question[]> {
    return this.questions.filter(q => q.contractorId === contractorId)
  }

  // Get AI feedback by project
  async getFeedbackByProject(projectId: string): Promise<AIFeedback[]> {
    return this.feedback.filter(f => f.projectId === projectId)
  }

  // Get AI feedback by contractor
  async getFeedbackByContractor(contractorId: string): Promise<AIFeedback[]> {
    return this.feedback.filter(f => f.contractorId === contractorId)
  }

  // Get all public questions for knowledge base
  async getPublicQuestions(): Promise<Question[]> {
    return this.questions.filter(q => q.isPublic)
  }

  // Get trending questions/topics
  async getTrendingTopics(): Promise<{ topic: string; count: number }[]> {
    const tagCounts: { [key: string]: number } = {}
    
    this.questions.forEach(q => {
      q.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    
    return Object.entries(tagCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }
}

// Export singleton instance
export const vectorDB = new VectorDatabaseService()

// Export types for use in components
export type { VectorDocument, Question, AIFeedback, EngagementScore, ProjectContext }
