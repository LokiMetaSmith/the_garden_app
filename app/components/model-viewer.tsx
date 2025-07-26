"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, Grid, Html } from "@react-three/drei"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { RotateCcw, ZoomIn, ZoomOut, Move3D } from "lucide-react"

interface ModelViewerProps {
  scanData: any
  plants: any[]
}

function GardenModel({ plants }: { plants: any[] }) {
  return (
    <>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#4ade80" opacity={0.8} transparent />
      </mesh>

      {/* Garden bed outline */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[5.2, 0.2, 4.9]} />
        <meshStandardMaterial color="#8b5cf6" />
      </mesh>

      {/* Plant representations */}
      {plants.map((plant, index) => (
        <group key={plant.id} position={[plant.location.x - 2.6, 0.5, plant.location.y - 2.45]}>
          {/* Plant model (simplified as colored spheres) */}
          <mesh>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial
              color={
                plant.commonName.includes("Rose")
                  ? "#ef4444"
                  : plant.commonName.includes("Lavender")
                    ? "#8b5cf6"
                    : plant.commonName.includes("Boxwood")
                      ? "#22c55e"
                      : "#06b6d4"
              }
            />
          </mesh>

          {/* Plant label */}
          <Html position={[0, 0.8, 0]} center>
            <div className="bg-white px-2 py-1 rounded shadow-lg text-xs font-medium whitespace-nowrap">
              {plant.commonName}
            </div>
          </Html>
        </group>
      ))}

      {/* Grid for reference */}
      <Grid
        args={[10, 10]}
        position={[0, -0.05, 0]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#94a3b8"
        sectionSize={1}
        sectionThickness={1}
        sectionColor="#64748b"
        fadeDistance={15}
        fadeStrength={1}
      />
    </>
  )
}

export default function ModelViewer({ scanData, plants = [] }: ModelViewerProps) {
  const [viewMode, setViewMode] = useState<"orbit" | "fly">("orbit")

  if (!scanData) {
    return (
      <div className="text-center py-16 text-gray-500">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
          <Move3D className="w-12 h-12" />
        </div>
        <p>Complete a garden scan to view the 3D model</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Badge variant="outline">Points: {scanData.points?.toLocaleString() || "0"}</Badge>
          <Badge variant="outline">Area: {scanData.area || "0"}m²</Badge>
          <Badge variant="outline">Accuracy: {((scanData.accuracy || 0) * 100).toFixed(0)}%</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="h-96 w-full">
            <Canvas camera={{ position: [8, 6, 8], fov: 60 }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <Environment preset="park" />

              <GardenModel plants={plants} />

              <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={3} maxDistance={20} />
            </Canvas>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="font-medium text-blue-900">3D Model Stats</div>
          <div className="text-blue-700 mt-1">
            <div>Vertices: {(scanData.points * 0.3).toFixed(0)}</div>
            <div>Faces: {(scanData.points * 0.6).toFixed(0)}</div>
            <div>Textures: {plants.length + 2}</div>
          </div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="font-medium text-green-900">Scan Quality</div>
          <div className="text-green-700 mt-1">
            <div>Resolution: High</div>
            <div>Coverage: Complete</div>
            <div>Mode: {scanData.mode === "lidar" ? "LiDAR" : "Photogrammetry"}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
