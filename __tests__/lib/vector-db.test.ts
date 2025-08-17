import { VectorDatabaseService, VectorDocument, Question, AIFeedback, EngagementScore } from '@/lib/vector-db'

describe('VectorDatabaseService', () => {
  let vectorDB: VectorDatabaseService

  beforeEach(() => {
    vectorDB = new VectorDatabaseService()
  })

  describe('addQuestion', () => {
    it('should add a new question successfully', async () => {
      const questionData = {
        content: 'What is the best time to plant roses?',
        category: 'gardening',
        tags: ['roses', 'planting', 'timing'],
        userId: 'user_123',
        projectId: 'project_456'
      }

      const result = await vectorDB.addQuestion(questionData)

      expect(result).toEqual({
        id: expect.stringMatching(/^q_\d+_[a-z0-9]+$/),
        content: questionData.content,
        category: questionData.category,
        tags: questionData.tags,
        userId: questionData.userId,
        projectId: questionData.projectId,
        status: 'pending',
        createdAt: expect.any(Date),
        answeredAt: undefined,
        answer: undefined,
        engagementScore: 0
      })
    })

    it('should generate unique IDs for each question', async () => {
      const question1 = await vectorDB.addQuestion({
        content: 'Question 1',
        category: 'test',
        tags: [],
        userId: 'user_1',
        projectId: 'project_1'
      })

      const question2 = await vectorDB.addQuestion({
        content: 'Question 2',
        category: 'test',
        tags: [],
        userId: 'user_2',
        projectId: 'project_2'
      })

      expect(question1.id).not.toBe(question2.id)
    })

    it('should set default values correctly', async () => {
      const result = await vectorDB.addQuestion({
        content: 'Test question',
        category: 'test',
        tags: [],
        userId: 'user_123',
        projectId: 'project_456'
      })

      expect(result.status).toBe('pending')
      expect(result.engagementScore).toBe(0)
      expect(result.createdAt).toBeInstanceOf(Date)
    })
  })

  describe('answerQuestion', () => {
    it('should answer a question successfully', async () => {
      // First add a question
      const question = await vectorDB.addQuestion({
        content: 'What is the best time to plant roses?',
        category: 'gardening',
        tags: ['roses', 'planting'],
        userId: 'user_123',
        projectId: 'project_456'
      })

      const answerData = {
        questionId: question.id,
        answer: 'The best time to plant roses is in early spring or fall.',
        answeredBy: 'expert_123',
        confidence: 0.9
      }

      const result = await vectorDB.answerQuestion(answerData)

      expect(result).toEqual({
        ...question,
        answer: answerData.answer,
        answeredBy: answerData.answeredBy,
        answeredAt: expect.any(Date),
        status: 'answered',
        engagementScore: expect.any(Number)
      })
    })

    it('should throw error for non-existent question', async () => {
      const answerData = {
        questionId: 'non_existent_id',
        answer: 'Test answer',
        answeredBy: 'expert_123',
        confidence: 0.9
      }

      await expect(vectorDB.answerQuestion(answerData)).rejects.toThrow(
        'Question not found'
      )
    })

    it('should update engagement score when answering', async () => {
      const question = await vectorDB.addQuestion({
        content: 'Test question',
        category: 'test',
        tags: [],
        userId: 'user_123',
        projectId: 'project_456'
      })

      const result = await vectorDB.answerQuestion({
        questionId: question.id,
        answer: 'Test answer',
        answeredBy: 'expert_123',
        confidence: 0.9
      })

      expect(result.engagementScore).toBeGreaterThan(0)
      expect(result.status).toBe('answered')
    })
  })

  describe('generateAIFeedback', () => {
    it('should generate AI feedback for a project', async () => {
      const feedbackData = {
        projectId: 'project_123',
        questionIds: ['q_1', 'q_2'],
        analysis: 'This project shows good planning and attention to detail.',
        recommendations: ['Consider adding more native plants', 'Plan for seasonal maintenance'],
        riskAssessment: 'low',
        estimatedTimeline: '2-3 weeks',
        confidence: 0.85
      }

      const result = await vectorDB.generateAIFeedback(feedbackData)

      expect(result).toEqual({
        id: expect.stringMatching(/^ai_\d+_[a-z0-9]+$/),
        projectId: feedbackData.projectId,
        questionIds: feedbackData.questionIds,
        analysis: feedbackData.analysis,
        recommendations: feedbackData.recommendations,
        riskAssessment: feedbackData.riskAssessment,
        estimatedTimeline: feedbackData.estimatedTimeline,
        confidence: feedbackData.confidence,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      })
    })

    it('should generate unique IDs for each feedback', async () => {
      const feedback1 = await vectorDB.generateAIFeedback({
        projectId: 'project_1',
        questionIds: ['q_1'],
        analysis: 'Analysis 1',
        recommendations: ['Rec 1'],
        riskAssessment: 'low',
        estimatedTimeline: '1 week',
        confidence: 0.8
      })

      const feedback2 = await vectorDB.generateAIFeedback({
        projectId: 'project_2',
        questionIds: ['q_2'],
        analysis: 'Analysis 2',
        recommendations: ['Rec 2'],
        riskAssessment: 'medium',
        estimatedTimeline: '2 weeks',
        confidence: 0.7
      })

      expect(feedback1.id).not.toBe(feedback2.id)
    })
  })

  describe('semanticSearch', () => {
    beforeEach(async () => {
      // Add some test questions
      await vectorDB.addQuestion({
        content: 'What is the best time to plant roses?',
        category: 'gardening',
        tags: ['roses', 'planting', 'timing'],
        userId: 'user_1',
        projectId: 'project_1'
      })

      await vectorDB.addQuestion({
        content: 'How often should I water my garden?',
        category: 'gardening',
        tags: ['watering', 'maintenance', 'frequency'],
        userId: 'user_2',
        projectId: 'project_2'
      })

      await vectorDB.addQuestion({
        content: 'What are the best plants for shade?',
        category: 'gardening',
        tags: ['shade', 'plants', 'selection'],
        userId: 'user_3',
        projectId: 'project_3'
      })
    })

    it('should find questions by content similarity', async () => {
      const results = await vectorDB.semanticSearch('planting roses', 2)

      expect(results).toHaveLength(1)
      expect(results[0].content).toContain('roses')
    })

    it('should find questions by tag similarity', async () => {
      const results = await vectorDB.semanticSearch('garden maintenance', 2)

      expect(results).toHaveLength(1)
      expect(results[0].content).toContain('water')
    })

    it('should respect the limit parameter', async () => {
      const results = await vectorDB.semanticSearch('gardening', 1)

      expect(results).toHaveLength(1)
    })

    it('should return empty array for no matches', async () => {
      const results = await vectorDB.semanticSearch('completely unrelated topic', 5)

      expect(results).toHaveLength(0)
    })

    it('should handle empty search query', async () => {
      const results = await vectorDB.semanticSearch('', 5)

      expect(results).toHaveLength(0)
    })
  })

  describe('getContractorEngagement', () => {
    beforeEach(async () => {
      // Add some test questions with different engagement levels
      await vectorDB.addQuestion({
        content: 'Question 1',
        category: 'test',
        tags: [],
        userId: 'user_1',
        projectId: 'project_1'
      })

      await vectorDB.addQuestion({
        content: 'Question 2',
        category: 'test',
        tags: [],
        userId: 'user_1',
        projectId: 'project_2'
      })

      // Answer one question to increase engagement
      const question = await vectorDB.addQuestion({
        content: 'Question 3',
        category: 'test',
        tags: [],
        userId: 'user_1',
        projectId: 'project_3'
      })

      await vectorDB.answerQuestion({
        questionId: question.id,
        answer: 'Test answer',
        answeredBy: 'expert_123',
        confidence: 0.9
      })
    })

    it('should calculate engagement score for a contractor', async () => {
      const engagement = await vectorDB.getContractorEngagement('user_1')

      expect(engagement).toEqual({
        contractorId: 'user_1',
        totalQuestions: 3,
        answeredQuestions: 1,
        averageResponseTime: expect.any(Number),
        engagementScore: expect.any(Number),
        categoryBreakdown: expect.any(Object),
        recentActivity: expect.any(Array),
        recommendations: expect.any(Array)
      })
    })

    it('should return null for non-existent contractor', async () => {
      const engagement = await vectorDB.getContractorEngagement('non_existent_user')

      expect(engagement).toBeNull()
    })

    it('should calculate engagement metrics correctly', async () => {
      const engagement = await vectorDB.getContractorEngagement('user_1')

      expect(engagement?.totalQuestions).toBe(3)
      expect(engagement?.answeredQuestions).toBe(1)
      expect(engagement?.engagementScore).toBeGreaterThan(0)
    })
  })

  describe('private helper methods', () => {
    describe('calculateEngagementScore', () => {
      it('should calculate score based on question count and answers', () => {
        const score = (vectorDB as any).calculateEngagementScore(5, 3, 1000)

        expect(score).toBeGreaterThan(0)
        expect(score).toBeLessThanOrEqual(100)
      })

      it('should handle edge cases', () => {
        const score1 = (vectorDB as any).calculateEngagementScore(0, 0, 0)
        const score2 = (vectorDB as any).calculateEngagementScore(100, 100, 1000000)

        expect(score1).toBe(0)
        expect(score2).toBeLessThanOrEqual(100)
      })
    })

    describe('generateTags', () => {
      it('should extract relevant tags from content', () => {
        const content = 'What is the best time to plant roses in a sunny garden?'
        const tags = (vectorDB as any).generateTags(content)

        expect(tags).toContain('roses')
        expect(tags).toContain('planting')
        expect(tags).toContain('garden')
        expect(tags.length).toBeGreaterThan(0)
      })

      it('should handle empty content', () => {
        const tags = (vectorDB as any).generateTags('')

        expect(tags).toEqual([])
      })
    })

    describe('assessRisk', () => {
      it('should assess risk based on project complexity', () => {
        const risk1 = (vectorDB as any).assessRisk('simple', 1000)
        const risk2 = (vectorDB as any).assessRisk('complex', 10000)

        expect(risk1).toBe('low')
        expect(risk2).toBe('high')
      })

      it('should handle medium complexity', () => {
        const risk = (vectorDB as any).assessRisk('medium', 5000)

        expect(risk).toBe('medium')
      })
    })

    describe('generateRecommendations', () => {
      it('should generate recommendations based on project data', () => {
        const recommendations = (vectorDB as any).generateRecommendations(
          'landscaping',
          'medium',
          5000
        )

        expect(recommendations).toBeInstanceOf(Array)
        expect(recommendations.length).toBeGreaterThan(0)
      })

      it('should handle different project types', () => {
        const rec1 = (vectorDB as any).generateRecommendations('gardening', 'simple', 1000)
        const rec2 = (vectorDB as any).generateRecommendations('construction', 'complex', 50000)

        expect(rec1).not.toEqual(rec2)
      })
    })
  })

  describe('data persistence', () => {
    it('should maintain data between method calls', async () => {
      const question = await vectorDB.addQuestion({
        content: 'Test question',
        category: 'test',
        tags: [],
        userId: 'user_123',
        projectId: 'project_456'
      })

      // Verify question exists
      expect(question.id).toBeDefined()

      // Answer the question
      await vectorDB.answerQuestion({
        questionId: question.id,
        answer: 'Test answer',
        answeredBy: 'expert_123',
        confidence: 0.9
      })

      // Verify engagement score is updated
      const engagement = await vectorDB.getContractorEngagement('user_123')
      expect(engagement?.totalQuestions).toBe(1)
      expect(engagement?.answeredQuestions).toBe(1)
    })
  })

  describe('error handling', () => {
    it('should handle invalid question data gracefully', async () => {
      const invalidQuestion = {
        content: '',
        category: '',
        tags: [],
        userId: '',
        projectId: ''
      }

      const result = await vectorDB.addQuestion(invalidQuestion)

      expect(result.content).toBe('')
      expect(result.id).toBeDefined()
    })

    it('should handle missing data in search', async () => {
      const results = await vectorDB.semanticSearch('', 5)

      expect(results).toEqual([])
    })
  })

  describe('performance considerations', () => {
    it('should handle large numbers of questions efficiently', async () => {
      const promises = []
      
      // Add 100 questions
      for (let i = 0; i < 100; i++) {
        promises.push(vectorDB.addQuestion({
          content: `Question ${i}`,
          category: 'test',
          tags: [`tag${i}`],
          userId: `user_${i}`,
          projectId: `project_${i}`
        }))
      }

      const questions = await Promise.all(promises)
      expect(questions).toHaveLength(100)

      // Search should still work efficiently
      const results = await vectorDB.semanticSearch('Question', 10)
      expect(results.length).toBeLessThanOrEqual(10)
    })
  })
})
