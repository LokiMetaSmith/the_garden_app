"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Download, Send, Calendar, MapPin, User } from "lucide-react"
import jsPDF from "jspdf"

interface ReportGeneratorProps {
  scanData: any
  plants: any[]
}

export default function ReportGenerator({ scanData, plants = [] }: ReportGeneratorProps) {
  const [reportData, setReportData] = useState({
    clientName: "",
    projectName: "",
    location: "",
    notes: "",
  })

  const generateReport = () => {
    // In a real app, this would generate a PDF or send to an API
    console.log("Generating report with data:", { scanData, plants, reportData })
  }

  const downloadReport = () => {
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      let yPosition = margin

      // Helper function to add text with word wrapping
      const addText = (text: string, x: number, y: number, maxWidth: number, fontSize = 12) => {
        doc.setFontSize(fontSize)
        const lines = doc.splitTextToSize(text, maxWidth)
        doc.text(lines, x, y)
        return y + lines.length * fontSize * 0.5
      }

      // Header
      doc.setFontSize(24)
      doc.setFont(undefined, "bold")
      doc.text("Garden Analysis Report", pageWidth / 2, yPosition, { align: "center" })
      yPosition += 20

      // Date and location
      doc.setFontSize(12)
      doc.setFont(undefined, "normal")
      const currentDate = new Date().toLocaleDateString()
      doc.text(`Date: ${currentDate}`, margin, yPosition)
      doc.text(`Location: ${reportData.location || "Not specified"}`, pageWidth - margin - 60, yPosition)
      yPosition += 15

      // Separator line
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 15

      // Project Details Section
      doc.setFontSize(16)
      doc.setFont(undefined, "bold")
      doc.text("Project Details", margin, yPosition)
      yPosition += 10

      doc.setFontSize(12)
      doc.setFont(undefined, "normal")
      yPosition = addText(
        `Client: ${reportData.clientName || "Not specified"}`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
      )
      yPosition = addText(
        `Project: ${reportData.projectName || "Not specified"}`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
      )
      yPosition = addText(
        `Report ID: RPT-${Date.now().toString().slice(-6)}`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
      )
      yPosition += 10

      // Scan Summary Section
      doc.setFontSize(16)
      doc.setFont(undefined, "bold")
      doc.text("Scan Summary", margin, yPosition)
      yPosition += 10

      // Summary boxes (simplified for PDF)
      doc.setFontSize(12)
      doc.setFont(undefined, "normal")
      yPosition = addText(`Total Area: ${scanData?.area || 0}m²`, margin, yPosition, pageWidth - 2 * margin)
      yPosition = addText(`Plants Identified: ${plants.length}`, margin, yPosition, pageWidth - 2 * margin)
      yPosition = addText(
        `Accuracy: ${((scanData?.accuracy || 0) * 100).toFixed(0)}%`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
      )
      yPosition += 10

      // Plant Inventory Section
      doc.setFontSize(16)
      doc.setFont(undefined, "bold")
      doc.text("Plant Inventory", margin, yPosition)
      yPosition += 10

      doc.setFontSize(12)
      doc.setFont(undefined, "normal")
      plants.forEach((plant, index) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage()
          yPosition = margin
        }

        yPosition = addText(
          `${index + 1}. ${plant.commonName} (${plant.name})`,
          margin,
          yPosition,
          pageWidth - 2 * margin,
        )
        yPosition = addText(
          `   Confidence: ${(plant.confidence * 100).toFixed(0)}% | Health: ${plant.health}`,
          margin + 10,
          yPosition,
          pageWidth - 2 * margin - 10,
        )
        yPosition += 5
      })

      yPosition += 10

      // Technical Details Section
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = margin
      }

      doc.setFontSize(16)
      doc.setFont(undefined, "bold")
      doc.text("Technical Details", margin, yPosition)
      yPosition += 10

      doc.setFontSize(12)
      doc.setFont(undefined, "normal")
      yPosition = addText(
        `Scan Method: ${scanData?.mode === "lidar" ? "LiDAR" : "Photogrammetry"}`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
      )
      yPosition = addText(
        `Point Cloud Size: ${scanData?.points?.toLocaleString() || 0} points`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
      )
      yPosition = addText(
        `Dimensions: ${scanData?.bounds?.width || 0}m × ${scanData?.bounds?.height || 0}m`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
      )
      yPosition = addText(`Resolution: ±2cm accuracy`, margin, yPosition, pageWidth - 2 * margin)
      yPosition += 10

      // Additional Notes Section
      if (reportData.notes) {
        if (yPosition > pageHeight - 40) {
          doc.addPage()
          yPosition = margin
        }

        doc.setFontSize(16)
        doc.setFont(undefined, "bold")
        doc.text("Additional Notes", margin, yPosition)
        yPosition += 10

        doc.setFontSize(12)
        doc.setFont(undefined, "normal")
        yPosition = addText(reportData.notes, margin, yPosition, pageWidth - 2 * margin)
      }

      // Footer
      const footerY = pageHeight - 15
      doc.setFontSize(10)
      doc.setFont(undefined, "italic")
      doc.text("Generated by AR Garden Planner", pageWidth / 2, footerY, { align: "center" })

      // Save the PDF
      const fileName = `garden-report-${reportData.clientName || "client"}-${new Date().toISOString().split("T")[0]}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error("PDF generation failed:", error)
      // Fallback to text file if PDF generation fails
      const element = document.createElement("a")
      element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," +
          encodeURIComponent(
            `Garden Analysis Report\n\nClient: ${reportData.clientName}\nProject: ${reportData.projectName}\nLocation: ${reportData.location}\n\nScan Data:\nArea: ${scanData?.area || 0}m²\nAccuracy: ${((scanData?.accuracy || 0) * 100).toFixed(0)}%\n\nPlants Identified: ${plants.length}\n\nNotes: ${reportData.notes}`,
          ),
      )
      element.setAttribute("download", "garden-report-fallback.txt")
      element.style.display = "none"
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }
  }

  if (!scanData) {
    return (
      <div className="text-center py-16 text-gray-500">
        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>Complete a garden scan to generate reports</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Project Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={reportData.clientName}
                onChange={(e) => setReportData((prev) => ({ ...prev, clientName: e.target.value }))}
                placeholder="Enter client name"
              />
            </div>
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={reportData.projectName}
                onChange={(e) => setReportData((prev) => ({ ...prev, projectName: e.target.value }))}
                placeholder="Enter project name"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={reportData.location}
              onChange={(e) => setReportData((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="Enter project location"
            />
          </div>
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={reportData.notes}
              onChange={(e) => setReportData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any additional notes or requirements"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header */}
          <div className="text-center border-b pb-4">
            <h2 className="text-2xl font-bold">Garden Analysis Report</h2>
            <div className="flex justify-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {reportData.location || "Location not specified"}
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Project Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Client:</span> {reportData.clientName || "Not specified"}
              </div>
              <div>
                <span className="font-medium">Project:</span> {reportData.projectName || "Not specified"}
              </div>
              <div>
                <span className="font-medium">Scan Date:</span> {new Date().toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Report ID:</span> RPT-{Date.now().toString().slice(-6)}
              </div>
            </div>
          </div>

          <Separator />

          {/* Scan Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Scan Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{scanData.area || 0}m²</div>
                <div className="text-sm text-blue-700">Total Area</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{plants.length}</div>
                <div className="text-sm text-green-700">Plants Identified</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{((scanData.accuracy || 0) * 100).toFixed(0)}%</div>
                <div className="text-sm text-purple-700">Accuracy</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Plant Inventory */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Plant Inventory</h3>
            <div className="space-y-2">
              {plants.map((plant, index) => (
                <div key={plant.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{plant.commonName}</span>
                    <span className="text-sm text-gray-600 ml-2">({plant.name})</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {(plant.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${plant.health === "Healthy" ? "text-green-600" : "text-yellow-600"}`}
                    >
                      {plant.health}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Technical Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Technical Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Scan Method:</span>{" "}
                {scanData.mode === "lidar" ? "LiDAR" : "Photogrammetry"}
              </div>
              <div>
                <span className="font-medium">Point Cloud Size:</span> {scanData.points?.toLocaleString() || 0} points
              </div>
              <div>
                <span className="font-medium">Dimensions:</span> {scanData.bounds?.width || 0}m ×{" "}
                {scanData.bounds?.height || 0}m
              </div>
              <div>
                <span className="font-medium">Resolution:</span> ±2cm accuracy
              </div>
            </div>
          </div>

          {reportData.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Additional Notes</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{reportData.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={downloadReport} className="flex-1">
          <Download className="w-4 h-4 mr-2" />
          Download PDF Report
        </Button>
        <Button onClick={generateReport} variant="outline" className="flex-1 bg-transparent">
          <Send className="w-4 h-4 mr-2" />
          Send to Contractors
        </Button>
      </div>
    </div>
  )
}
