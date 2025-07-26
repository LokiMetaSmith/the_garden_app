"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Ruler, Grid3X3, Download } from "lucide-react"

interface TopDownViewProps {
  scanData: any
  plants: any[]
}

export default function TopDownView({ scanData, plants = [] }: TopDownViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showGrid, setShowGrid] = useState(true)
  const [showRuler, setShowRuler] = useState(true)
  const [scale, setScale] = useState(50) // pixels per meter

  useEffect(() => {
    if (!canvasRef.current || !scanData) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set up coordinate system
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const gardenWidth = scanData.bounds?.width || 5.2
    const gardenHeight = scanData.bounds?.height || 4.9

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = "#e2e8f0"
      ctx.lineWidth = 1

      // Vertical lines
      for (let i = -10; i <= 10; i++) {
        const x = centerX + i * scale * 0.5
        if (x >= 0 && x <= canvas.width) {
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, canvas.height)
          ctx.stroke()
        }
      }

      // Horizontal lines
      for (let i = -10; i <= 10; i++) {
        const y = centerY + i * scale * 0.5
        if (y >= 0 && y <= canvas.height) {
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(canvas.width, y)
          ctx.stroke()
        }
      }
    }

    // Draw garden bed outline
    ctx.strokeStyle = "#8b5cf6"
    ctx.lineWidth = 3
    ctx.fillStyle = "#f3f4f6"
    const bedX = centerX - (gardenWidth * scale) / 2
    const bedY = centerY - (gardenHeight * scale) / 2
    const bedWidth = gardenWidth * scale
    const bedHeight = gardenHeight * scale

    ctx.fillRect(bedX, bedY, bedWidth, bedHeight)
    ctx.strokeRect(bedX, bedY, bedWidth, bedHeight)

    // Draw plants
    plants.forEach((plant) => {
      const plantX = centerX + (plant.location.x - gardenWidth / 2) * scale
      const plantY = centerY + (plant.location.y - gardenHeight / 2) * scale

      // Plant circle
      ctx.beginPath()
      ctx.arc(plantX, plantY, 15, 0, 2 * Math.PI)

      // Color based on plant type
      if (plant.commonName.includes("Rose")) {
        ctx.fillStyle = "#ef4444"
      } else if (plant.commonName.includes("Lavender")) {
        ctx.fillStyle = "#8b5cf6"
      } else if (plant.commonName.includes("Boxwood")) {
        ctx.fillStyle = "#22c55e"
      } else {
        ctx.fillStyle = "#06b6d4"
      }

      ctx.fill()
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.stroke()

      // Plant label
      ctx.fillStyle = "#000000"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(plant.commonName, plantX, plantY + 30)
    })

    // Draw ruler if enabled
    if (showRuler) {
      // Horizontal ruler
      ctx.strokeStyle = "#374151"
      ctx.lineWidth = 2
      ctx.fillStyle = "#374151"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "center"

      const rulerY = canvas.height - 40
      ctx.beginPath()
      ctx.moveTo(50, rulerY)
      ctx.lineTo(canvas.width - 50, rulerY)
      ctx.stroke()

      // Ruler ticks
      for (let i = 0; i <= 10; i++) {
        const x = 50 + (i * (canvas.width - 100)) / 10
        const tickHeight = i % 5 === 0 ? 10 : 5

        ctx.beginPath()
        ctx.moveTo(x, rulerY - tickHeight)
        ctx.lineTo(x, rulerY + tickHeight)
        ctx.stroke()

        if (i % 5 === 0) {
          ctx.fillText(`${i * 0.5}m`, x, rulerY + 25)
        }
      }

      // Vertical ruler
      const rulerX = 30
      ctx.beginPath()
      ctx.moveTo(rulerX, 50)
      ctx.lineTo(rulerX, canvas.height - 50)
      ctx.stroke()

      // Vertical ruler ticks
      for (let i = 0; i <= 8; i++) {
        const y = 50 + (i * (canvas.height - 100)) / 8
        const tickWidth = i % 4 === 0 ? 10 : 5

        ctx.beginPath()
        ctx.moveTo(rulerX - tickWidth, y)
        ctx.lineTo(rulerX + tickWidth, y)
        ctx.stroke()

        if (i % 4 === 0) {
          ctx.save()
          ctx.translate(rulerX - 20, y)
          ctx.rotate(-Math.PI / 2)
          ctx.fillText(`${i * 0.5}m`, 0, 0)
          ctx.restore()
        }
      }
    }
  }, [scanData, plants, showGrid, showRuler, scale])

  const downloadImage = () => {
    if (!canvasRef.current) return

    const link = document.createElement("a")
    link.download = "garden-layout.png"
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  if (!scanData) {
    return (
      <div className="text-center py-16 text-gray-500">
        <Grid3X3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>Complete a garden scan to view the 2D layout</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Badge variant="outline">
            {scanData.bounds?.width || 5.2}m × {scanData.bounds?.height || 4.9}m
          </Badge>
          <Badge variant="outline">Scale: 1:{Math.round(100 / scale)}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant={showGrid ? "default" : "outline"} size="sm" onClick={() => setShowGrid(!showGrid)}>
            <Grid3X3 className="w-4 h-4 mr-1" />
            Grid
          </Button>
          <Button variant={showRuler ? "default" : "outline"} size="sm" onClick={() => setShowRuler(!showRuler)}>
            <Ruler className="w-4 h-4 mr-1" />
            Ruler
          </Button>
          <Button variant="outline" size="sm" onClick={downloadImage}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full border rounded-lg bg-white"
            style={{ maxHeight: "600px" }}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="font-medium text-blue-900">Measurements</div>
          <div className="text-blue-700 mt-1">
            <div>Width: {scanData.bounds?.width || 5.2}m</div>
            <div>Height: {scanData.bounds?.height || 4.9}m</div>
            <div>Area: {scanData.area || 25.5}m²</div>
          </div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="font-medium text-green-900">Plants</div>
          <div className="text-green-700 mt-1">
            <div>Total: {plants.length}</div>
            <div>Identified: {plants.length}</div>
            <div>Healthy: {plants.filter((p) => p.health === "Healthy").length}</div>
          </div>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg">
          <div className="font-medium text-purple-900">Precision</div>
          <div className="text-purple-700 mt-1">
            <div>Accuracy: {((scanData.accuracy || 0) * 100).toFixed(0)}%</div>
            <div>Resolution: ±2cm</div>
            <div>Scale: 1:{Math.round(100 / scale)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
