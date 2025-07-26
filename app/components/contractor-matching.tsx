"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, MapPin, Send, Filter, Users, Award } from "lucide-react"

interface ContractorMatchingProps {
  scanData: any
}

const mockContractors = [
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
  },
]

export default function ContractorMatching({ scanData }: ContractorMatchingProps) {
  const [jobDetails, setJobDetails] = useState({
    title: "",
    description: "",
    budget: "",
    timeline: "",
    projectType: "",
  })
  const [selectedContractors, setSelectedContractors] = useState<number[]>([])

  const toggleContractor = (id: number) => {
    setSelectedContractors((prev) => (prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]))
  }

  const sendToContractors = () => {
    console.log("Sending job to contractors:", selectedContractors, jobDetails)
    // In a real app, this would send the job details to selected contractors
  }

  return (
    <div className="space-y-6">
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

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Contractor Matching</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Our platform connects you with pre-screened, licensed contractors in your area. All contractors are
                  verified and have proven track records in garden and landscape projects.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
