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
  ExternalLink
} from "lucide-react"

interface ContractorMatchingProps {
  scanData: any
}

interface Contractor {
  id: number
  name: string
  rating: number
  reviews: number
  location: string
  specialties: string[]
  price: string
  avatar: string
  verified: boolean
  responseTime: string
  engagementScore: number
  completedProjects: number
  responseRate: number
  avgResponseTime: number
}

interface Bid {
  id: number
  contractorId: number
  contractor: Contractor
  amount: number
  timeline: string
  description: string
  materials: string[]
  warranty: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  submittedAt: Date
  images: string[]
  questions: Question[]
  feedback: string
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
  answeredBy?: number
  isPublic: boolean
}

interface ProjectImage {
  id: number
  url: string
  description: string
  uploadedAt: Date
  uploadedBy: 'customer' | 'contractor'
  tags: string[]
}

const mockContractors: Contractor[] = [
  {
    id: 1,
    name: "Green Thumb Landscaping",
    rating: 4.8,
    reviews: 127,
    location: "2.3 miles away",
    specialties: ["Garden Design", "Plant Installation", "Maintenance"],
    price: "$85-120/hr",
    avatar: "/placeholder.svg?height=50&width=50",
    verified: true,
    responseTime: "Usually responds in 2 hours",
    engagementScore: 92,
    completedProjects: 45,
    responseRate: 98,
    avgResponseTime: 2.1
  },
  {
    id: 2,
    name: "Premier Garden Solutions",
    rating: 4.9,
    reviews: 89,
    location: "1.8 miles away",
    specialties: ["Hardscaping", "Irrigation", "Design"],
    price: "$95-140/hr",
    avatar: "/placeholder.svg?height=50&width=50",
    verified: true,
    responseTime: "Usually responds in 1 hour",
    engagementScore: 95,
    completedProjects: 38,
    responseRate: 100,
    avgResponseTime: 1.8
  },
  {
    id: 3,
    name: "Eco-Friendly Gardens",
    rating: 4.7,
    reviews: 156,
    location: "3.1 miles away",
    specialties: ["Organic Gardening", "Native Plants", "Sustainability"],
    price: "$75-110/hr",
    avatar: "/placeholder.svg?height=50&width=50",
    verified: true,
    responseTime: "Usually responds in 4 hours",
    engagementScore: 88,
    completedProjects: 52,
    responseRate: 94,
    avgResponseTime: 3.2
  },
  {
    id: 4,
    name: "Modern Landscape Co.",
    rating: 4.6,
    reviews: 203,
    location: "4.2 miles away",
    specialties: ["Modern Design", "Lighting", "Water Features"],
    price: "$100-160/hr",
    avatar: "/placeholder.svg?height=50&width=50",
    verified: false,
    responseTime: "Usually responds in 6 hours",
    engagementScore: 76,
    completedProjects: 67,
    responseRate: 87,
    avgResponseTime: 5.1
  },
]

const mockBids: Bid[] = [
  {
    id: 1,
    contractorId: 1,
    contractor: mockContractors[0],
    amount: 8500,
    timeline: "4-6 weeks",
    description: "Complete garden redesign with native plants, irrigation system, and modern hardscaping features.",
    materials: ["Native plants", "Drip irrigation", "Stone pavers", "LED lighting"],
    warranty: "2 years on plants, 5 years on hardscaping",
    status: 'pending',
    submittedAt: new Date('2024-01-15'),
    images: ["/placeholder.jpg", "/placeholder.jpg"],
    questions: [],
    feedback: ""
  },
  {
    id: 2,
    contractorId: 2,
    contractor: mockContractors[1],
    amount: 12000,
    timeline: "6-8 weeks",
    description: "Premium landscape design with custom water features, outdoor kitchen, and smart irrigation.",
    materials: ["Premium stone", "Custom water features", "Outdoor kitchen", "Smart irrigation"],
    warranty: "3 years comprehensive",
    status: 'pending',
    submittedAt: new Date('2024-01-16'),
    images: ["/placeholder.jpg"],
    questions: [],
    feedback: ""
  }
]

const mockProjectImages: ProjectImage[] = [
  {
    id: 1,
    url: "/placeholder.jpg",
    description: "Current garden state - front yard",
    uploadedAt: new Date('2024-01-10'),
    uploadedBy: 'customer',
    tags: ['front-yard', 'current-state', 'before']
  },
  {
    id: 2,
    url: "/placeholder.jpg",
    description: "Backyard area requiring renovation",
    uploadedAt: new Date('2024-01-10'),
    uploadedBy: 'customer',
    tags: ['backyard', 'renovation-needed', 'before']
  }
]

export default function ContractorMatching({ scanData }: ContractorMatchingProps) {
  const [activeTab, setActiveTab] = useState("customer")
  const [jobDetails, setJobDetails] = useState({
    title: "",
    description: "",
    budget: "",
    timeline: "",
    projectType: "",
  })
  const [selectedContractors, setSelectedContractors] = useState<number[]>([])
  const [bids, setBids] = useState<Bid[]>(mockBids)
  const [projectImages, setProjectImages] = useState<ProjectImage[]>(mockProjectImages)
  const [questions, setQuestions] = useState<Question[]>([])
  const [newQuestion, setNewQuestion] = useState("")
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null)
  const [feedback, setFeedback] = useState("")

  const toggleContractor = (id: number) => {
    setSelectedContractors((prev) => (prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]))
  }

  const sendToContractors = () => {
    console.log("Sending job to contractors:", selectedContractors, jobDetails)
    // In a real app, this would send the job details to selected contractors
  }

  const addQuestion = () => {
    if (newQuestion.trim()) {
      const question: Question = {
        id: Date.now(),
        text: newQuestion,
        askedBy: 'customer',
        askedAt: new Date(),
        isPublic: true
      }
      setQuestions([...questions, question])
      setNewQuestion("")
      // In a real app, this would be sent to the vector database
      console.log("Question added to vector database:", question)
    }
  }

  const generateFeedback = (bid: Bid) => {
    // In a real app, this would use AI to generate feedback
    const feedback = `Based on the bid analysis, this contractor offers:
- Competitive pricing within your budget range
- Strong timeline commitment (${bid.timeline})
- Comprehensive warranty coverage (${bid.warranty})
- Relevant experience in ${bid.contractor.specialties.join(', ')}
- High engagement score (${bid.contractor.engagementScore}/100)

Recommendation: Consider this bid as it aligns well with your project requirements and budget.`
    
    setFeedback(feedback)
    return feedback
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

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="customer">Customer View</TabsTrigger>
          <TabsTrigger value="contractor">Contractor Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="customer" className="space-y-6">
          {!scanData && (
            <div className="text-center py-16 text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Complete a garden scan to find contractors</p>
            </div>
          )}

          {scanData && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Job Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Job Title</Label>
                      <Input
                        id="title"
                        value={jobDetails.title}
                        onChange={(e) => setJobDetails((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Garden Redesign Project"
                      />
                    </div>
                    <div>
                      <Label htmlFor="projectType">Project Type</Label>
                      <Select
                        value={jobDetails.projectType}
                        onValueChange={(value) => setJobDetails((prev) => ({ ...prev, projectType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="design">Garden Design</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="installation">Plant Installation</SelectItem>
                          <SelectItem value="hardscape">Hardscaping</SelectItem>
                          <SelectItem value="renovation">Garden Renovation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budget">Budget Range</Label>
                      <Select
                        value={jobDetails.budget}
                        onValueChange={(value) => setJobDetails((prev) => ({ ...prev, budget: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="under-1000">Under $1,000</SelectItem>
                          <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
                          <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
                          <SelectItem value="10000-25000">$10,000 - $25,000</SelectItem>
                          <SelectItem value="over-25000">Over $25,000</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="timeline">Timeline</Label>
                      <Select
                        value={jobDetails.timeline}
                        onValueChange={(value) => setJobDetails((prev) => ({ ...prev, timeline: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select timeline" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asap">ASAP</SelectItem>
                          <SelectItem value="1-month">Within 1 month</SelectItem>
                          <SelectItem value="3-months">Within 3 months</SelectItem>
                          <SelectItem value="6-months">Within 6 months</SelectItem>
                          <SelectItem value="flexible">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Project Description</Label>
                    <Textarea
                      id="description"
                      value={jobDetails.description}
                      onChange={(e) => setJobDetails((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your project requirements, preferences, and any specific needs..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Available Contractors</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-1" />
                    Filter
                  </Button>
                  <Badge variant="outline">{selectedContractors.length} selected</Badge>
                </div>
              </div>

              <div className="grid gap-4">
                {mockContractors.map((contractor) => (
                  <Card
                    key={contractor.id}
                    className={`cursor-pointer transition-all ${
                      selectedContractors.includes(contractor.id) ? "ring-2 ring-blue-500 bg-blue-50" : "hover:shadow-md"
                    }`}
                    onClick={() => toggleContractor(contractor.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={contractor.avatar || "/placeholder.svg"} alt={contractor.name} />
                          <AvatarFallback>
                            {contractor.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-lg flex items-center gap-2">
                                {contractor.name}
                                {contractor.verified && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Award className="w-3 h-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  {contractor.rating} ({contractor.reviews} reviews)
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {contractor.location}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-lg">{contractor.price}</div>
                              <div className="text-sm text-gray-600">{contractor.responseTime}</div>
                            </div>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            {contractor.specialties.map((specialty) => (
                              <Badge key={specialty} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              <span className={getEngagementColor(contractor.engagementScore)}>
                                {getEngagementBadge(contractor.engagementScore)} Engagement
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {contractor.engagementScore}/100
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span>{contractor.completedProjects} projects</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <span>{contractor.avgResponseTime}h avg response</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedContractors.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">Ready to send job request</h4>
                        <p className="text-sm text-gray-600">
                          Selected {selectedContractors.length} contractor{selectedContractors.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <Button onClick={sendToContractors} size="lg">
                        <Send className="w-4 h-4 mr-2" />
                        Send Job Request
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="contractor" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Bids</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bids.length}</div>
                <p className="text-xs text-gray-600 mt-1">Active bids</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Engagement Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">92</div>
                <p className="text-xs text-gray-600 mt-1">Excellent rating</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Response Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">98%</div>
                <p className="text-xs text-gray-600 mt-1">Within 24h</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Project Images & Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {projectImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url}
                      alt={image.description}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-500 transition-colors"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      <p className="font-medium">{image.description}</p>
                      <p className="text-gray-500">{image.uploadedBy}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Project Requirements</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    {jobDetails.description || "Complete garden redesign with focus on sustainability and modern aesthetics. Include native plants, irrigation system, and outdoor living spaces."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Questions & Answers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Ask a question about the project..."
                  className="flex-1"
                />
                <Button onClick={addQuestion} size="sm">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Ask
                </Button>
              </div>

              <div className="space-y-3">
                {questions.map((question) => (
                  <div key={question.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{question.text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Asked by {question.askedBy} on {question.askedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {question.isPublic ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                    {question.answer && (
                      <div className="mt-2 ml-4 p-2 bg-gray-50 rounded">
                        <p className="text-sm">{question.answer}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Answered on {question.answeredAt?.toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Bid Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bids.map((bid) => (
                  <div key={bid.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={bid.contractor.avatar} alt={bid.contractor.name} />
                            <AvatarFallback>{bid.contractor.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{bid.contractor.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              {bid.contractor.rating}
                              <Badge variant="outline" className="text-xs">
                                {bid.contractor.verified ? 'Verified' : 'Unverified'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Bid Amount</p>
                            <p className="text-lg font-bold text-green-600">${bid.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Timeline</p>
                            <p className="text-sm">{bid.timeline}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Engagement</p>
                            <p className={`text-sm font-medium ${getEngagementColor(bid.contractor.engagementScore)}`}>
                              {bid.contractor.engagementScore}/100
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Status</p>
                            <Badge 
                              variant={bid.status === 'accepted' ? 'default' : bid.status === 'rejected' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                            </Badge>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-2">Description:</p>
                          <p className="text-sm">{bid.description}</p>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-2">Materials:</p>
                          <div className="flex gap-2 flex-wrap">
                            {bid.materials.map((material) => (
                              <Badge key={material} variant="outline" className="text-xs">
                                {material}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-2">Warranty:</p>
                          <p className="text-sm">{bid.warranty}</p>
                        </div>

                        {bid.images.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 mb-2">Supporting Images:</p>
                            <div className="flex gap-2">
                              {bid.images.map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`Bid support ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded border"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedBid(bid)
                          generateFeedback(bid)
                        }}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Generate Feedback
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Ask Question
                      </Button>
                      <Button variant="outline" size="sm">
                        <ImageIcon className="w-4 h-4 mr-1" />
                        Add Images
                      </Button>
                      <div className="ml-auto flex gap-2">
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedBid && (
            <Dialog open={!!selectedBid} onOpenChange={() => setSelectedBid(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>AI-Generated Feedback for {selectedBid.contractor.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Contractor Analysis</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div className="flex justify-between">
                        <span>Engagement Score:</span>
                        <span className="font-medium">{selectedBid.contractor.engagementScore}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Response Rate:</span>
                        <span className="font-medium">{selectedBid.contractor.responseRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed Projects:</span>
                        <span className="font-medium">{selectedBid.contractor.completedProjects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Response Time:</span>
                        <span className="font-medium">{selectedBid.contractor.avgResponseTime} hours</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">AI Feedback & Recommendations</h4>
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={8}
                      placeholder="AI-generated feedback will appear here..."
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setSelectedBid(null)}>
                      Close
                    </Button>
                    <Button onClick={() => {
                      // In a real app, this would save the feedback
                      console.log("Feedback saved:", feedback)
                      setSelectedBid(null)
                    }}>
                      Save Feedback
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>
      </Tabs>

      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-gray-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900">Contractor Matching & Engagement System</h4>
            <p className="text-sm text-gray-600 mt-1">
              Our platform uses advanced engagement scoring to match you with the best contractors. 
              Engagement scores are calculated based on response times, communication quality, project completion rates, 
              and customer satisfaction. This system ensures fair payment distribution and high-quality service delivery.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
