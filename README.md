# AR Garden Planner - Professional Contractor System

A comprehensive garden planning and contractor management platform that uses AR technology, AI-powered feedback, and engagement scoring to connect customers with qualified contractors.

## 🌟 Features

### Core Garden Planning
- **3D Garden Scanning**: Use device camera/LiDAR for photogrammetry
- **Plant Identification**: AI-powered plant recognition
- **3D Model Viewer**: Interactive garden visualization
- **2D Top-Down View**: Precise measurements and layout planning
- **Professional Reports**: Detailed project documentation

### AI-Moderated Chat System
- **Intelligent Moderation**: AI agent ensures fair negotiations and flags potential disputes
- **Living Bid Proposals**: Dynamic documents that evolve through conversation
- **Change Tracking**: Complete audit trail of all modifications with approval workflows
- **Quote Generation**: Automatic creation of detailed quotes from approved bids
- **Participant Management**: Role-based access control and invitation system

### Stripe Payment Integration
- **Customer Payments**: Secure payment processing with multiple currency support
- **Platform Fee Management**: Dynamic fee structure based on project complexity
- **Contractor Payouts**: Automated payment distribution with holdback system
- **Webhook Support**: Real-time payment status updates and notifications
- **Refund Management**: Comprehensive refund and dispute handling

### Contractor Management System
- **Customer View**: Post jobs, review bids, select contractors
- **Contractor Dashboard**: Comprehensive project and bid management
- **Engagement Scoring**: AI-powered contractor evaluation system
- **Payment Distribution**: Fair payment allocation based on performance

## 🏗️ Contractor System Architecture

### 1. Customer Experience
- **Job Posting**: Detailed project requirements with budget and timeline
- **Bid Review**: Multiple contractor bids with comprehensive analysis
- **Picture Review**: Visual project documentation and progress tracking
- **AI Feedback**: Intelligent insights and recommendations for each bid

### 2. Contractor Dashboard
- **Project Management**: Active projects, timelines, and progress tracking
- **Bid Management**: Submit and manage project bids
- **Communication Hub**: Q&A system with customers
- **Performance Analytics**: Engagement metrics and improvement opportunities

### 3. Engagement Scoring System
The platform uses advanced algorithms to evaluate contractor performance:

#### Scoring Metrics
- **Response Time**: How quickly contractors respond to inquiries
- **Communication Quality**: Clarity and frequency of updates
- **Project Completion**: Success rate and quality of deliverables
- **Customer Satisfaction**: Ratings and feedback scores
- **Question Response Rate**: Engagement in Q&A discussions
- **Image Upload Frequency**: Documentation and transparency

#### Score Ranges
- **90-100**: Excellent - 5% holdback, up to 15% bonus
- **80-89**: Good - 7% holdback, up to 10% bonus
- **70-79**: Fair - 10% holdback, up to 5% bonus
- **Below 70**: Poor - 15% holdback, no bonus

### 4. Vector Database Integration
- **Question Storage**: All Q&A stored with semantic search capabilities
- **AI Feedback Generation**: Intelligent analysis of bids and projects
- **Knowledge Base**: Public questions and trending topics
- **Engagement Tracking**: Real-time performance monitoring

### 5. Payment Distribution System
- **Base Payment**: 80% of project value
- **Engagement Bonus**: Up to 15% based on engagement score
- **Performance Bonus**: Up to 20% based on project metrics
- **Holdback System**: Risk mitigation based on engagement scores
- **Dispute Resolution**: Fair handling of project issues

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Modern browser with camera support

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd the_garden_app

# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev
# or
pnpm dev
```

### Environment Setup
Create a `.env.local` file with your configuration:
```env
NEXT_PUBLIC_APP_NAME="AR Garden Planner"
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Stripe Configuration (Required for payments)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Note**: For Stripe integration setup, see [Stripe Setup Guide](docs/stripe-setup-guide.md)

## 📱 Usage

### For Customers
1. **Scan Your Garden**: Use the camera scanner to create a 3D model
2. **Post a Job**: Describe your project requirements and budget
3. **Review Bids**: Compare contractor proposals with AI-generated insights
4. **Select Contractor**: Choose based on engagement scores and feedback
5. **Track Progress**: Monitor project completion and communication

### For Contractors
1. **Access Dashboard**: View available projects and active bids
2. **Submit Bids**: Provide detailed proposals with supporting materials
3. **Manage Projects**: Track progress, upload photos, communicate with customers
4. **Monitor Performance**: View engagement scores and improvement areas
5. **Receive Payments**: Get paid based on performance and engagement

## 🏗️ Technical Architecture

### Frontend Components
- **React 19**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Shadcn/ui**: High-quality UI components
- **Lucide Icons**: Beautiful icon library

### Backend Services
- **Vector Database**: Question storage and semantic search
- **Payment Service**: Engagement-based payment distribution
- **AI Feedback Engine**: Intelligent project analysis
- **Engagement Scoring**: Real-time performance evaluation

### Data Flow
```
Customer Job Post → Contractor Bids → AI Analysis → 
Engagement Scoring → Payment Distribution → Performance Tracking
```

## 🔧 Customization

### Adding New Engagement Metrics
```typescript
// In lib/vector-db.ts
interface EngagementMetric {
  category: string
  score: number
  trend: 'up' | 'down' | 'stable'
  change: number
  target: number
}

// Add new metrics to the scoring system
const newMetrics: EngagementMetric[] = [
  {
    category: "Innovation",
    score: 85,
    trend: 'up',
    change: 5,
    target: 90
  }
]
```

### Customizing Payment Calculations
```typescript
// In lib/payment-service.ts
private calculateEngagementBonus(baseAmount: number, engagementScore: number): number {
  // Customize bonus percentages based on your business model
  if (engagementScore >= 95) return baseAmount * 0.20 // 20% bonus
  if (engagementScore >= 90) return baseAmount * 0.15 // 15% bonus
  if (engagementScore >= 80) return baseAmount * 0.10 // 10% bonus
  return 0
}
```

## 📊 Performance Monitoring

### Key Metrics
- **Contractor Response Time**: Target < 4 hours
- **Project Completion Rate**: Target > 95%
- **Customer Satisfaction**: Target > 4.5/5
- **Engagement Score**: Target > 80/100

### Analytics Dashboard
- Real-time engagement tracking
- Payment distribution analytics
- Top-performing contractors
- Project success rates

## 🔒 Security & Privacy

- **Data Sanitization**: All user inputs are sanitized before storage
- **Vector Database**: Secure question storage with access controls
- **Payment Security**: Encrypted payment processing with Stripe
- **User Privacy**: GDPR-compliant data handling

## 📚 Documentation

- [Contractor System Demo](demo/contractor-system-demo.md)
- [API Specification](docs/api-specification.md)
- [Quick Start Guide](docs/quick-start-guide.md)
- [Chat System Documentation](docs/chat-system-documentation.md)
- [Stripe API Documentation](docs/stripe-api-documentation.md)
- [Stripe Setup Guide](docs/stripe-setup-guide.md)

## 🚧 Roadmap

### Phase 1 (Current)
- ✅ Basic contractor matching
- ✅ Engagement scoring system
- ✅ Payment distribution
- ✅ Vector database integration
- ✅ AI-moderated chat system
- ✅ Stripe payment integration

### Phase 2 (Next)
- 🔄 Real-time messaging system
- 🔄 Advanced AI feedback generation
- 🔄 Mobile app development
- 🔄 Enhanced payment analytics and reporting

### Phase 3 (Future)
- 📋 Blockchain-based smart contracts
- 📋 Advanced analytics and reporting
- 📋 Multi-language support
- 📋 API for third-party integrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)
- **Discussions**: [GitHub Discussions](link-to-discussions)
- **Email**: support@gardenplanner.com

## 🙏 Acknowledgments

- **Shadcn/ui** for the beautiful component library
- **Lucide** for the icon set
- **Tailwind CSS** for the utility-first styling
- **React Team** for the amazing framework

---

**Built with ❤️ for the gardening community**
