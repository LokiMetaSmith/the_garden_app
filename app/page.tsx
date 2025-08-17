"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, Scan, Map, FileText, Users, Smartphone, Building2, MessageCircle, CreditCard } from "lucide-react"
import CameraScanner from "./components/camera-scanner"
import ModelViewer from "./components/model-viewer"
import TopDownView from "./components/top-down-view"
import ReportGenerator from "./components/report-generator"
import ContractorMatching from "./components/contractor-matching"
import ContractorDashboard from "./components/contractor-dashboard"
import PlantIdentification from "./components/plant-identification"
import ChatInterface from "./components/chat-interface"
import PaymentInterface from "./components/payment-interface"

export default function ARGardenPlanner() {
  const [activeTab, setActiveTab] = useState("scan")
  const [scanData, setScanData] = useState(null)
  const [identifiedPlants, setIdentifiedPlants] = useState([])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto p-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AR Garden Planner</h1>
          <p className="text-lg text-gray-600">Professional garden scanning and planning solution</p>
          <div className="flex justify-center gap-2 mt-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              iOS Compatible
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              Android Compatible
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Scan
            </TabsTrigger>
            <TabsTrigger value="identify" className="flex items-center gap-2">
              <Scan className="w-4 h-4" />
              Identify
            </TabsTrigger>
            <TabsTrigger value="3d-model" className="flex items-center gap-2">
              <div className="w-4 h-4 bg-current rounded" />
              3D Model
            </TabsTrigger>
            <TabsTrigger value="2d-view" className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              2D View
            </TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Report
            </TabsTrigger>
            <TabsTrigger value="contractors" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Contractors
            </TabsTrigger>
            <TabsTrigger value="contractor-dashboard" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Garden Scanning</CardTitle>
                <CardDescription>
                  Use your device's camera or LiDAR sensor to create a 3D model of your garden
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CameraScanner onScanComplete={setScanData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="identify" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Plant Identification</CardTitle>
                <CardDescription>AI-powered plant identification using Plant.id API</CardDescription>
              </CardHeader>
              <CardContent>
                <PlantIdentification scanData={scanData} onPlantsIdentified={setIdentifiedPlants} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="3d-model" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>3D Garden Model</CardTitle>
                <CardDescription>Interactive 3D photogrammetry model of your garden</CardDescription>
              </CardHeader>
              <CardContent>
                <ModelViewer scanData={scanData} plants={identifiedPlants} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="2d-view" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>2D Top-Down View</CardTitle>
                <CardDescription>Precise measurements and layout planning</CardDescription>
              </CardHeader>
              <CardContent>
                <TopDownView scanData={scanData} plants={identifiedPlants} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Professional Report</CardTitle>
                <CardDescription>Generate detailed reports for contractor quotes</CardDescription>
              </CardHeader>
              <CardContent>
                <ReportGenerator scanData={scanData} plants={identifiedPlants} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contractors" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Find Contractors</CardTitle>
                <CardDescription>Connect with qualified landscapers and contractors</CardDescription>
              </CardHeader>
              <CardContent>
                <ContractorMatching scanData={scanData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contractor-dashboard" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Contractor Dashboard</CardTitle>
                <CardDescription>Professional contractor management and project tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <ContractorDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Chat</CardTitle>
                <CardDescription>AI-moderated conversation with contractors and bid proposal management</CardDescription>
              </CardHeader>
              <CardContent>
                <ChatInterface projectId="project_456" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Management</CardTitle>
                <CardDescription>Stripe-powered payment processing, distribution, and contractor payouts</CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentInterface 
                  projectId="project_456" 
                  customerId="customer_123" 
                  contractorId="contractor_456"
                  initialAmount={2500}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
