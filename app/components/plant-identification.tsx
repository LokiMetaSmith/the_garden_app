"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Leaf, Search, CheckCircle, AlertCircle } from "lucide-react"
import Image from "next/image"

interface PlantIdentificationProps {
  scanData: any;
  onPlantsIdentified: (plants: any[]) => void;
}

export default function PlantIdentification({ scanData, onPlantsIdentified }: PlantIdentificationProps) {
  const [isIdentifying, setIsIdentifying] = useState(false)
  const [identificationProgress, setIdentificationProgress] = useState(0)
  const [identifiedPlants, setIdentifiedPlants] = useState<any[]>([])

  const mockPlants = [
    {
      id: 1,
      name: "Rosa gallica",
      commonName: "French Rose",
      confidence: 0.94,
      location: { x: 2.3, y: 1.8 },
      health: "Healthy",
      size: "Medium",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 2,
      name: "Lavandula angustifolia",
      commonName: "English Lavender",
      confidence: 0.89,
      location: { x: 1.2, y: 3.1 },
      health: "Healthy",
      size: "Small",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 3,
      name: "Buxus sempervirens",
      commonName: "Common Boxwood",
      confidence: 0.92,
      location: { x: 4.1, y: 2.5 },
      health: "Needs attention",
      size: "Large",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 4,
      name: "Hosta plantaginea",
      commonName: "Fragrant Plantain Lily",
      confidence: 0.87,
      location: { x: 0.8, y: 4.2 },
      health: "Healthy",
      size: "Medium",
      image: "/placeholder.svg?height=100&width=100",
    },
  ]

  const startIdentification = async () => {
    if (!scanData) return

    setIsIdentifying(true)
    setIdentificationProgress(0)

    // Simulate Plant.id API calls
    const interval = setInterval(() => {
      setIdentificationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsIdentifying(false)

          // Use setTimeout to avoid calling onPlantsIdentified during render
          setTimeout(() => {
            setIdentifiedPlants(mockPlants)
            onPlantsIdentified(mockPlants)
          }, 0)

          return 100
        }
        return prev + 3
      })
    }, 150)
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case "Healthy":
        return "text-green-600 bg-green-50"
      case "Needs attention":
        return "text-yellow-600 bg-yellow-50"
      case "Poor":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-600"
    if (confidence >= 0.8) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      {!scanData && (
        <div className="text-center py-8 text-gray-500">
          <Leaf className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Please complete a garden scan first</p>
        </div>
      )}

      {scanData && !identifiedPlants.length && (
        <div className="text-center space-y-4">
          <div className="p-6 bg-green-50 rounded-lg">
            <Leaf className="w-12 h-12 mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-medium text-green-900 mb-2">Ready for Plant Identification</h3>
            <p className="text-green-700 mb-4">Using Plant.id API to identify plants in your scanned garden</p>
            <Button onClick={startIdentification} disabled={isIdentifying}>
              {isIdentifying ? (
                <>
                  <Search className="w-4 h-4 mr-2 animate-spin" />
                  Identifying Plants...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Start Plant Identification
                </>
              )}
            </Button>
          </div>

          {isIdentifying && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Analyzing plant images...</span>
                <span>{identificationProgress}%</span>
              </div>
              <Progress value={identificationProgress} className="w-full" />
            </div>
          )}
        </div>
      )}

      {identifiedPlants.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Identified Plants ({identifiedPlants.length})</h3>
            <Badge variant="outline" className="text-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              Identification Complete
            </Badge>
          </div>

          <div className="grid gap-4">
            {identifiedPlants.map((plant) => (
              <Card key={plant.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Image
                      src={plant.image || "/placeholder.svg"}
                      alt={plant.commonName}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                    <div className="flex-1 space-y-2">
                      <div>
                        <h4 className="font-medium text-lg">{plant.commonName}</h4>
                        <p className="text-sm text-gray-600 italic">{plant.name}</p>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className={getConfidenceColor(plant.confidence)}>
                          {(plant.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                        <Badge variant="outline" className={getHealthColor(plant.health)}>
                          {plant.health}
                        </Badge>
                        <Badge variant="outline">Size: {plant.size}</Badge>
                      </div>

                      <div className="text-sm text-gray-600">
                        Location: {plant.location.x}m × {plant.location.y}m
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Plant.id API Integration</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Plant identification powered by advanced AI models trained on millions of plant images. Confidence
                  scores indicate identification accuracy.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
