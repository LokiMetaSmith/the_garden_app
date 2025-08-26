// Payment Distribution Service
// This service handles payment distribution to contractors based on engagement scores and performance metrics

export interface PaymentDistribution {
  projectId: string
  totalAmount: number
  platformFee: number
  contractorPayment: number
  holdbackAmount: number
  distributionBreakdown: {
    contractor: {
      id: string
      name: string
      baseAmount: number
      engagementBonus: number
      performanceBonus: number
      finalAmount: number
      engagementScore: number
      performanceMetrics: PerformanceMetrics
    }
    customer: {
      id: string
      name: string
      amount: number
      refundAmount?: number
    }
  }
  status: 'pending' | 'processing' | 'completed' | 'disputed'
  createdAt: Date
  completedAt?: Date
}

export interface PerformanceMetrics {
  responseTime: number
  communicationQuality: number
  projectCompletion: number
  customerSatisfaction: number
  questionResponseRate: number
  imageUploadFrequency: number
  onTimeDelivery: boolean
  withinBudget: boolean
  qualityRating: number
}

export interface ContractorPayment {
  contractorId: string
  projectId: string
  baseAmount: number
  engagementBonus: number
  performanceBonus: number
  totalAmount: number
  engagementScore: number
  performanceScore: number
  paymentDate: Date
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

export interface CustomerPayment {
  customerId: string
  projectId: string
  amount: number
  paymentMethod: string
  paymentDate: Date
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  refundAmount?: number
  refundReason?: string
}

class PaymentService {
  private paymentDistributions: PaymentDistribution[] = []
  private contractorPayments: ContractorPayment[] = []
  private customerPayments: CustomerPayment[] = []

  // Calculate payment distribution for a completed project
  async calculatePaymentDistribution(
    projectId: string,
    totalAmount: number,
    contractorId: string,
    contractorName: string,
    engagementScore: number,
    performanceMetrics: PerformanceMetrics
  ): Promise<PaymentDistribution> {
    const platformFee = this.calculatePlatformFee(totalAmount)
    const holdbackAmount = this.calculateHoldbackAmount(totalAmount, engagementScore)
    const contractorBaseAmount = totalAmount - platformFee - holdbackAmount

    // Calculate bonuses based on engagement and performance
    const engagementBonus = this.calculateEngagementBonus(contractorBaseAmount, engagementScore)
    const performanceBonus = this.calculatePerformanceBonus(contractorBaseAmount, performanceMetrics)
    
    const finalContractorAmount = contractorBaseAmount + engagementBonus + performanceBonus

    const distribution: PaymentDistribution = {
      projectId,
      totalAmount,
      platformFee,
      contractorPayment: finalContractorAmount,
      holdbackAmount,
      distributionBreakdown: {
        contractor: {
          id: contractorId,
          name: contractorName,
          baseAmount: contractorBaseAmount,
          engagementBonus,
          performanceBonus,
          finalAmount: finalContractorAmount,
          engagementScore,
          performanceMetrics
        },
        customer: {
          id: 'customer_id', // Would come from project data
          name: 'Customer Name', // Would come from project data
          amount: totalAmount
        }
      },
      status: 'pending',
      createdAt: new Date()
    }

    this.paymentDistributions.push(distribution)
    return distribution
  }

  // Process payment to contractor
  async processContractorPayment(
    projectId: string,
    contractorId: string,
    amount: number,
    engagementScore: number,
    performanceScore: number
  ): Promise<ContractorPayment> {
    const payment: ContractorPayment = {
      contractorId,
      projectId,
      baseAmount: amount * 0.8, // 80% base payment
      engagementBonus: amount * 0.1, // 10% engagement bonus
      performanceBonus: amount * 0.1, // 10% performance bonus
      totalAmount: amount,
      engagementScore,
      performanceScore,
      paymentDate: new Date(),
      status: 'pending'
    }

    // Simulate payment processing
    setTimeout(() => {
      payment.status = 'processing'
      setTimeout(() => {
        payment.status = 'completed'
      }, 2000)
    }, 1000)

    this.contractorPayments.push(payment)
    return payment
  }

  // Process customer payment
  async processCustomerPayment(
    customerId: string,
    projectId: string,
    amount: number,
    paymentMethod: string
  ): Promise<CustomerPayment> {
    const payment: CustomerPayment = {
      customerId,
      projectId,
      amount,
      paymentMethod,
      paymentDate: new Date(),
      status: 'pending'
    }

    // Simulate payment processing
    setTimeout(() => {
      payment.status = 'processing'
      setTimeout(() => {
        payment.status = 'completed'
      }, 2000)
    }, 1000)

    this.customerPayments.push(payment)
    return payment
  }

  // Calculate platform fee (percentage-based)
  private calculatePlatformFee(totalAmount: number): number {
    const baseFee = totalAmount * 0.05 // 5% base fee
    const transactionFee = totalAmount * 0.029 + 0.30 // Stripe-like fees
    return Math.round((baseFee + transactionFee) * 100) / 100
  }

  // Calculate holdback amount based on engagement score
  private calculateHoldbackAmount(totalAmount: number, engagementScore: number): number {
    let holdbackPercentage = 0.10 // Default 10% holdback
    
    if (engagementScore >= 90) {
      holdbackPercentage = 0.05 // 5% holdback for excellent engagement
    } else if (engagementScore >= 80) {
      holdbackPercentage = 0.07 // 7% holdback for good engagement
    } else if (engagementScore < 70) {
      holdbackPercentage = 0.15 // 15% holdback for poor engagement
    }

    return Math.round(totalAmount * holdbackPercentage * 100) / 100
  }

  // Calculate engagement bonus
  private calculateEngagementBonus(baseAmount: number, engagementScore: number): number {
    let bonusPercentage = 0
    
    if (engagementScore >= 95) {
      bonusPercentage = 0.15 // 15% bonus for exceptional engagement
    } else if (engagementScore >= 90) {
      bonusPercentage = 0.10 // 10% bonus for excellent engagement
    } else if (engagementScore >= 80) {
      bonusPercentage = 0.05 // 5% bonus for good engagement
    }

    return Math.round(baseAmount * bonusPercentage * 100) / 100
  }

  // Calculate performance bonus based on various metrics
  private calculatePerformanceBonus(baseAmount: number, metrics: PerformanceMetrics): number {
    let bonusPercentage = 0
    
    // Response time bonus
    if (metrics.responseTime <= 2) bonusPercentage += 0.02 // 2% for fast response
    else if (metrics.responseTime <= 4) bonusPercentage += 0.01 // 1% for good response
    
    // Communication quality bonus
    if (metrics.communicationQuality >= 90) bonusPercentage += 0.03 // 3% for excellent communication
    else if (metrics.communicationQuality >= 80) bonusPercentage += 0.02 // 2% for good communication
    
    // Project completion bonus
    if (metrics.projectCompletion >= 95) bonusPercentage += 0.05 // 5% for excellent completion
    else if (metrics.projectCompletion >= 85) bonusPercentage += 0.03 // 3% for good completion
    
    // Customer satisfaction bonus
    if (metrics.customerSatisfaction >= 95) bonusPercentage += 0.05 // 5% for excellent satisfaction
    else if (metrics.customerSatisfaction >= 85) bonusPercentage += 0.03 // 3% for good satisfaction
    
    // On-time delivery bonus
    if (metrics.onTimeDelivery) bonusPercentage += 0.03 // 3% for on-time delivery
    
    // Within budget bonus
    if (metrics.withinBudget) bonusPercentage += 0.02 // 2% for staying within budget
    
    // Quality rating bonus
    if (metrics.qualityRating >= 4.8) bonusPercentage += 0.04 // 4% for excellent quality
    else if (metrics.qualityRating >= 4.5) bonusPercentage += 0.02 // 2% for good quality

    return Math.round(baseAmount * bonusPercentage * 100) / 100
  }

  // Get payment distribution by project
  async getPaymentDistribution(projectId: string): Promise<PaymentDistribution | null> {
    return this.paymentDistributions.find(d => d.projectId === projectId) || null
  }

  // Get contractor payment history
  async getContractorPaymentHistory(contractorId: string): Promise<ContractorPayment[]> {
    return this.contractorPayments.filter(p => p.contractorId === contractorId)
  }

  // Get customer payment history
  async getCustomerPaymentHistory(customerId: string): Promise<CustomerPayment[]> {
    return this.customerPayments.filter(p => p.customerId === customerId)
  }

  // Calculate total earnings for contractor
  async getContractorTotalEarnings(contractorId: string): Promise<{
    totalEarnings: number
    engagementBonuses: number
    performanceBonuses: number
    averageEngagementScore: number
    paymentCount: number
  }> {
    const payments = this.contractorPayments.filter(p => 
      p.contractorId === contractorId && p.status === 'completed'
    )

    if (payments.length === 0) {
      return {
        totalEarnings: 0,
        engagementBonuses: 0,
        performanceBonuses: 0,
        averageEngagementScore: 0,
        paymentCount: 0
      }
    }

    const totalEarnings = payments.reduce((sum, p) => sum + p.totalAmount, 0)
    const engagementBonuses = payments.reduce((sum, p) => sum + p.engagementBonus, 0)
    const performanceBonuses = payments.reduce((sum, p) => sum + p.performanceBonus, 0)
    const averageEngagementScore = payments.reduce((sum, p) => sum + p.engagementScore, 0) / payments.length

    return {
      totalEarnings,
      engagementBonuses,
      performanceBonuses,
      averageEngagementScore: Math.round(averageEngagementScore * 100) / 100,
      paymentCount: payments.length
    }
  }

  // Process refund for customer
  async processCustomerRefund(
    customerId: string,
    projectId: string,
    amount: number,
    reason: string
  ): Promise<CustomerPayment> {
    const payment = this.customerPayments.find(p => 
      p.customerId === customerId && p.projectId === projectId
    )

    if (!payment) {
      throw new Error('Payment not found')
    }

    payment.status = 'refunded'
    payment.refundAmount = amount
    payment.refundReason = reason

    return payment
  }

  // Get payment analytics
  async getPaymentAnalytics(): Promise<{
    totalRevenue: number
    totalPlatformFees: number
    totalContractorPayments: number
    averageEngagementScore: number
    topPerformingContractors: Array<{
      contractorId: string
      totalEarnings: number
      averageEngagementScore: number
      paymentCount: number
    }>
  }> {
    const completedDistributions = this.paymentDistributions.filter(d => d.status === 'completed')
    
    const totalRevenue = completedDistributions.reduce((sum, d) => sum + d.totalAmount, 0)
    const totalPlatformFees = completedDistributions.reduce((sum, d) => sum + d.platformFee, 0)
    const totalContractorPayments = completedDistributions.reduce((sum, d) => sum + d.contractorPayment, 0)
    
    const allEngagementScores = completedDistributions.map(d => d.distributionBreakdown.contractor.engagementScore)
    const averageEngagementScore = allEngagementScores.length > 0 
      ? allEngagementScores.reduce((sum, score) => sum + score, 0) / allEngagementScores.length
      : 0

    // Get top performing contractors
    const contractorEarnings: { [key: string]: {
      totalEarnings: number
      totalEngagementScore: number
      paymentCount: number
    }} = {}

    completedDistributions.forEach(d => {
      const contractor = d.distributionBreakdown.contractor
      if (!contractorEarnings[contractor.id]) {
        contractorEarnings[contractor.id] = {
          totalEarnings: 0,
          totalEngagementScore: 0,
          paymentCount: 0
        }
      }
      
      contractorEarnings[contractor.id].totalEarnings += contractor.finalAmount
      contractorEarnings[contractor.id].totalEngagementScore += contractor.engagementScore
      contractorEarnings[contractor.id].paymentCount += 1
    })

    const topPerformingContractors = Object.entries(contractorEarnings)
      .map(([contractorId, data]) => ({
        contractorId,
        totalEarnings: data.totalEarnings,
        averageEngagementScore: Math.round((data.totalEngagementScore / data.paymentCount) * 100) / 100,
        paymentCount: data.paymentCount
      }))
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, 10)

    return {
      totalRevenue,
      totalPlatformFees,
      totalContractorPayments,
      averageEngagementScore: Math.round(averageEngagementScore * 100) / 100,
      topPerformingContractors
    }
  }

  // Release holdback amount
  async releaseHoldback(projectId: string, amount: number): Promise<PaymentDistribution> {
    const distribution = this.paymentDistributions.find(d => d.projectId === projectId)
    
    if (!distribution) {
      throw new Error('Payment distribution not found')
    }

    if (amount > distribution.holdbackAmount) {
      throw new Error('Release amount cannot exceed holdback amount')
    }

    distribution.holdbackAmount -= amount
    distribution.contractorPayment += amount

    return distribution
  }

  // Get dispute resolution
  async resolveDispute(
    projectId: string,
    resolution: 'contractor_wins' | 'customer_wins' | 'partial_refund',
    amount?: number
  ): Promise<PaymentDistribution> {
    const distribution = this.paymentDistributions.find(d => d.projectId === projectId)
    
    if (!distribution) {
      throw new Error('Payment distribution not found')
    }

    switch (resolution) {
      case 'contractor_wins':
        // Release full holdback to contractor
        distribution.contractorPayment += distribution.holdbackAmount
        distribution.holdbackAmount = 0
        break
        
      case 'customer_wins':
        // Refund customer from holdback
        if (amount && amount <= distribution.holdbackAmount) {
          distribution.holdbackAmount -= amount
          // In real implementation, this would trigger customer refund
        }
        break
        
      case 'partial_refund':
        // Split holdback between contractor and customer
        if (amount && amount <= distribution.holdbackAmount) {
          const contractorShare = distribution.holdbackAmount - amount
          distribution.contractorPayment += contractorShare
          distribution.holdbackAmount = 0
        }
        break
    }

    distribution.status = 'completed'
    distribution.completedAt = new Date()

    return distribution
  }
}

// Export singleton instance
export const paymentService = new PaymentService()

// Export types for use in components
export type { 
  PaymentDistribution, 
  ContractorPayment, 
  CustomerPayment, 
  PerformanceMetrics 
}

