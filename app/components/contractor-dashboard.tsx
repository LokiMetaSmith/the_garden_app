"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { 
  Star, 
  MapPin, 
  Send, 
  Filter, 
  Users, 
  Award, 
  MessageSquare, 
  Image as ImageIcon,
  FileText,
  Clock,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Eye,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Phone,
  Mail,
  ExternalLink,
  BarChart3,
  Target,
  Zap,
  Shield,
  Heart,
  Activity,
  PieChart,
  LineChart
} from "lucide-react"

interface ContractorDashboardProps {
  contractorId?: number
}

interface Project {
  id: number
  title: string
  customer: {
    name: string
    avatar: string
    location: string
    rating: number
  }
  status: 'active' | 'completed' | 'pending' | 'cancelled'
  budget: number
  timeline: string
  startDate: Date
  endDate?: Date
  progress: number
  engagementScore: number
  lastActivity: Date
  images: string[]
  description: string
  materials: string[]
  warranty: string
}

interface Bid {
  id: number
  projectTitle: string
  customer: {
    name: string
    avatar: string
    location: string
  }
  amount: number
  timeline: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  submittedAt: Date
  lastUpdated: Date
  description: string
  materials: string[]
  warranty: string
  questions: Question[]
  customerRating?: number
  customerReview?: string
}

interface Question {
  id: number
  text: string
  askedBy: 'customer' | 'contractor'
  askedAt: Date
  answeredAt?: Date
  answer?: string
  isPublic: boolean
  priority: 'low' | 'medium' | 'high'
}

interface EngagementMetric {
  category: string
  score: number
  trend: 'up' | 'down' | 'stable'
  change: number
  target: number
}

const mockProjects: Project[] = [
  {
    id: 1,
    title: "Modern Garden Redesign - Downtown Condo",
    customer: {
      name: "Sarah Johnson",
      avatar: "/placeholder-user.jpg",
      location: "Downtown, 2.1 miles away",
      rating: 4.8
    },
    status: 'active',
    budget: 8500,
    timeline: "4-6 weeks",
    startDate: new Date('2024-01-15'),
    progress: 65,
    engagementScore: 94,
    lastActivity: new Date('2024-01-20'),
    images: ["/placeholder.jpg", "/placeholder.jpg"],
    description: "Complete garden redesign with native plants, irrigation system, and modern hardscaping features.",
    materials: ["Native plants", "Drip irrigation", "Stone pavers", "LED lighting"],
    warranty: "2 years on plants, 5 years on hardscaping"
  },
  {
    id: 2,
    title: "Sustainable Backyard Transformation",
    customer: {
      name: "Mike Chen",
      avatar: "/placeholder-user.jpg",
      location: "Westside, 3.2 miles away",
      rating: 4.9
    },
    status: 'pending',
    budget: 12000,
    timeline: "6-8 weeks",
    startDate: new Date('2024-02-01'),
    progress: 0,
    engagementScore: 88,
    lastActivity: new Date('2024-01-22'),
    images: ["/placeholder.jpg"],
    description: "Eco-friendly backyard transformation with native plants, rainwater harvesting, and organic soil.",
    materials: ["Native plants", "Rainwater system", "Organic soil", "Compost bins"],
    warranty: "3 years comprehensive"
  }
]

const mockBids: Bid[] = [
  {
    id: 1,
    projectTitle: "Luxury Poolside Garden",
    customer: {
      name: "Emily Rodriguez",
      avatar: "/placeholder-user.jpg",
      location: "Beverly Hills, 5.1 miles away"
    },
    amount: 25000,
    timeline: "8-10 weeks",
    status: 'pending',
    submittedAt: new Date('2024-01-18'),
    lastUpdated: new Date('2024-01-22'),
    description: "Premium poolside garden with exotic plants, custom lighting, and automated irrigation.",
    materials: ["Exotic plants", "LED lighting", "Smart irrigation", "Premium stone"],
    warranty: "5 years comprehensive",
    questions: []
  },
  {
    id: 2,
    projectTitle: "Small Urban Balcony Garden",
    customer: {
      name: "David Kim",
      avatar: "/placeholder-user.jpg",
      location: "Midtown, 1.8 miles away"
    },
    amount: 3500,
    timeline: "2-3 weeks",
    status: 'accepted',
    submittedAt: new Date('2024-01-15'),
    lastUpdated: new Date('2024-01-20'),
    description: "Compact balcony garden with herbs, succulents, and vertical growing systems.",
    materials: ["Herbs", "Succulents", "Vertical planters", "Self-watering system"],
    warranty: "1 year on plants",
    questions: []
  }
]

const mockEngagementMetrics: EngagementMetric[] = [
  {
    category: "Response Time",
    score: 95,
    trend: 'up',
    change: 3,
    target: 90
  },
  {
    category: "Communication Quality",
    score: 92,
    trend: 'stable',
    change: 0,
    target: 90
  },
  {
    category: "Project Completion",
    score: 98,
    trend: 'up',
    change: 2,
    target: 95
  },
  {
    category: "Customer Satisfaction",
    score: 96,
    trend: 'up',
    change: 1,
    target: 95
  }
]

export default function ContractorDashboard({ contractorId }: ContractorDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [bids, setBids] = useState<Bid[]>(mockBids)
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetric[]>(mockEngagementMetrics)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null)
  const [newQuestion, setNewQuestion] = useState("")
  const [questionPriority, setQuestionPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [isQuestionPublic, setIsQuestionPublic] = useState(true)

  const addQuestion = () => {
    if (newQuestion.trim() && selectedBid) {
      const question: Question = {
        id: Date.now(),
        text: newQuestion,
        askedBy: 'contractor',
        askedAt: new Date(),
        isPublic: isQuestionPublic,
        priority: questionPriority
      }
      
      // In a real app, this would be sent to the vector database
      console.log("Question added to vector database:", question)
      
      setNewQuestion("")
      setQuestionPriority('medium')
      setIsQuestionPublic(true)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEngagementColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getEngagementBadge = (score: number) => {
    if (score >= 90) return "Excellent"
    if (score >= 80) return "Good"
    if (score >= 70) return "Fair"
    return "Poor"
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down': return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
      default: return <Activity className="w-4 h-4 text-blue-600" />
    }
  }

  const overallEngagementScore = Math.round(
    engagementMetrics.reduce((sum, metric) => sum + metric.score, 0) / engagementMetrics.length
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contractor Dashboard</h1>
          <p className="text-gray-600">Manage your projects, bids, and engagement metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule
          </Button>
          <Button>
            <MessageSquare className="w-4 h-4 mr-2" />
            New Message
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.filter(p => p.status === 'active').length}</div>
            <p className="text-xs text-gray-600 mt-1">Currently working</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Bids</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bids.filter(b => b.status === 'pending').length}</div>
            <p className="text-xs text-gray-600 mt-1">Awaiting response</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Engagement Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overallEngagementScore}</div>
            <p className="text-xs text-gray-600 mt-1">Overall rating</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">$12,450</div>
            <p className="text-xs text-gray-600 mt-1">+8% from last month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="bids">Bids</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Engagement Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {engagementMetrics.map((metric) => (
                  <div key={metric.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{metric.category}</span>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(metric.trend)}
                        <span className={`text-sm font-bold ${getEngagementColor(metric.score)}`}>
                          {metric.score}/100
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Target: {metric.target}</span>
                        <span>{metric.change > 0 ? '+' : ''}{metric.change}%</span>
                      </div>
                      <Progress value={metric.score} className="h-2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {projects.slice(0, 3).map((project) => (
                    <div key={project.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{project.title}</p>
                        <p className="text-xs text-gray-500">
                          {project.lastActivity.toLocaleDateString()} - {project.customer.name}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {project.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <MessageSquare className="w-6 h-6" />
                  <span className="text-sm">Send Update</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-sm">Upload Photos</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <FileText className="w-6 h-6" />
                  <span className="text-sm">Generate Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Calendar className="w-6 h-6" />
                  <span className="text-sm">Schedule Meeting</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Your Projects</h3>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1" />
              Filter
            </Button>
          </div>

          <div className="grid gap-4">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={project.customer.avatar} alt={project.customer.name} />
                          <AvatarFallback>{project.customer.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-lg">{project.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{project.customer.name}</span>
                            <span>{project.customer.location}</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              {project.customer.rating}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(project.status)}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </Badge>
                      <div className="text-2xl font-bold text-green-600 mt-1">
                        ${project.budget.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Timeline</p>
                      <p className="text-sm">{project.timeline}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Progress</p>
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress} className="flex-1 h-2" />
                        <span className="text-sm font-medium">{project.progress}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Engagement</p>
                      <p className={`text-sm font-medium ${getEngagementColor(project.engagementScore)}`}>
                        {getEngagementBadge(project.engagementScore)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Last Activity</p>
                      <p className="text-sm">{project.lastActivity.toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Description:</p>
                    <p className="text-sm">{project.description}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Message Customer
                    </Button>
                    <Button variant="outline" size="sm">
                      <ImageIcon className="w-4 h-4 mr-1" />
                      Upload Progress
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    <Button size="sm" className="ml-auto">
                      <Eye className="w-4 h-4 mr-1" />
                      View Project
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bids" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Your Bids</h3>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1" />
              Filter
            </Button>
          </div>

          <div className="grid gap-4">
            {bids.map((bid) => (
              <Card key={bid.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={bid.customer.avatar} alt={bid.customer.name} />
                          <AvatarFallback>{bid.customer.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-lg">{bid.projectTitle}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{bid.customer.name}</span>
                            <span>{bid.customer.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={bid.status === 'accepted' ? 'default' : bid.status === 'rejected' ? 'destructive' : 'secondary'}
                      >
                        {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                      </Badge>
                      <div className="text-2xl font-bold text-green-600 mt-1">
                        ${bid.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Timeline</p>
                      <p className="text-sm">{bid.timeline}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Submitted</p>
                      <p className="text-sm">{bid.submittedAt.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Last Updated</p>
                      <p className="text-sm">{bid.lastUpdated.toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Description:</p>
                    <p className="text-sm">{bid.description}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Ask Question
                    </Button>
                    <Button variant="outline" size="sm">
                      <ImageIcon className="w-4 h-4 mr-1" />
                      Add Images
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-1" />
                      Update Bid
                    </Button>
                    <Button size="sm" className="ml-auto">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Project Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['active', 'pending', 'completed', 'cancelled'].map((status) => {
                    const count = projects.filter(p => p.status === status).length
                    const percentage = projects.length > 0 ? Math.round((count / projects.length) * 100) : 0
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(status).replace('bg-', 'bg-').replace('text-', '')}`}></div>
                          <span className="text-sm font-medium capitalize">{status}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold">{count}</span>
                          <span className="text-xs text-gray-500 ml-1">({percentage}%)</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Engagement Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {engagementMetrics.map((metric) => (
                    <div key={metric.category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{metric.category}</span>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(metric.trend)}
                          <span className="text-sm font-bold">{metric.score}/100</span>
                        </div>
                      </div>
                      <Progress value={metric.score} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-lg mb-1">Customer Satisfaction</h4>
                  <p className="text-3xl font-bold text-green-600">96%</p>
                  <p className="text-sm text-gray-600">Based on 45 reviews</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-lg mb-1">Avg Response Time</h4>
                  <p className="text-3xl font-bold text-blue-600">2.1h</p>
                  <p className="text-sm text-gray-600">Target: Under 4 hours</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-8 h-8 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-lg mb-1">Project Success Rate</h4>
                  <p className="text-3xl font-bold text-purple-600">98%</p>
                  <p className="text-sm text-gray-600">Completed on time & budget</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
