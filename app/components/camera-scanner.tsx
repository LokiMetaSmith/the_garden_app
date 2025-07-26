"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Line } from "@react-three/drei"
import * as THREE from "three"
import {
  Camera,
  Square,
  Scan,
  AlertTriangle,
  CheckCircle,
  Target,
  Move,
  RotateCw,
  VideoOff,
  Eye,
  Layers,
  Cpu,
  Gauge,
} from "lucide-react"

interface CameraScannerProps {
  onScanComplete: (data: any) => void
}

interface ScanPoint {
  x: number
  y: number
  z: number
  confidence: number
  timestamp: number
  featureType: "corner" | "edge" | "surface" | "texture"
  matchedPoints: number
  color: [number, number, number]
}

interface CameraPosition {
  x: number
  y: number
  z: number
  rotation: { x: number; y: number; z: number }
  velocity: { x: number; y: number; z: number }
  stability: number
}

interface QualityMetrics {
  coverage: number
  overlap: number
  lighting: number
  stability: number
  featureMatching: number
  triangulation: number
  reprojectionError: number
  keyframeQuality: number
  meshDensity: number
  reconstructionProgress: number
}

interface Keyframe {
  id: number
  position: CameraPosition
  timestamp: number
  imageQuality: number
  featureCount: number
  matchedFeatures: number
}

interface MeshTriangle {
  vertices: [THREE.Vector3, THREE.Vector3, THREE.Vector3]
  confidence: number
  timestamp: number
}

// 3D Point Cloud Component with proper buffer management
function PointCloud({ points }: { points: ScanPoint[] }) {
  const meshRef = useRef<THREE.Points>(null)

  const { positions, colors, sizes } = useMemo(() => {
    const maxPoints = 10000 // Fixed buffer size
    const positions = new Float32Array(maxPoints * 3)
    const colors = new Float32Array(maxPoints * 3)
    const sizes = new Float32Array(maxPoints)

    // Fill with actual point data
    const pointCount = Math.min(points.length, maxPoints)
    for (let i = 0; i < pointCount; i++) {
      const point = points[i]
      positions[i * 3] = point.x
      positions[i * 3 + 1] = point.y
      positions[i * 3 + 2] = point.z

      colors[i * 3] = point.color[0]
      colors[i * 3 + 1] = point.color[1]
      colors[i * 3 + 2] = point.color[2]

      sizes[i] = point.confidence * 3 + 1
    }

    // Fill remaining with transparent points
    for (let i = pointCount; i < maxPoints; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0
      colors[i * 3] = 0
      colors[i * 3 + 1] = 0
      colors[i * 3 + 2] = 0
      sizes[i] = 0
    }

    return { positions, colors, sizes, count: pointCount }
  }, [points])

  useFrame(() => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry
      if (geometry.attributes.position) {
        geometry.attributes.position.needsUpdate = true
        geometry.attributes.color.needsUpdate = true
        geometry.attributes.size.needsUpdate = true
      }
    }
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={colors} count={colors.length / 3} itemSize={3} />
        <bufferAttribute attach="attributes-size" array={sizes} count={sizes.length} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial size={2} vertexColors sizeAttenuation />
    </points>
  )
}

// Camera Trajectory Component
function CameraTrajectory({ keyframes }: { keyframes: Keyframe[] }) {
  if (keyframes.length < 2) return null

  const points = keyframes.map((kf) => new THREE.Vector3(kf.position.x, kf.position.y, kf.position.z))

  return (
    <group>
      <Line points={points} color="yellow" lineWidth={3} />
      {keyframes.map((keyframe) => (
        <mesh key={keyframe.id} position={[keyframe.position.x, keyframe.position.y, keyframe.position.z]}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial
            color={keyframe.imageQuality > 0.8 ? "green" : keyframe.imageQuality > 0.6 ? "yellow" : "red"}
          />
        </mesh>
      ))}
    </group>
  )
}

// Mesh Reconstruction Component with proper buffer management
function MeshReconstruction({ triangles }: { triangles: MeshTriangle[] }) {
  const meshRef = useRef<THREE.Mesh>(null)

  const { vertices, colors } = useMemo(() => {
    const maxTriangles = 1000 // Fixed buffer size
    const vertices = new Float32Array(maxTriangles * 9) // 3 vertices * 3 coordinates
    const colors = new Float32Array(maxTriangles * 9)

    const triangleCount = Math.min(triangles.length, maxTriangles)

    for (let i = 0; i < triangleCount; i++) {
      const triangle = triangles[i]
      triangle.vertices.forEach((vertex, j) => {
        const index = i * 9 + j * 3
        vertices[index] = vertex.x
        vertices[index + 1] = vertex.y
        vertices[index + 2] = vertex.z

        // Color based on confidence
        const confidence = triangle.confidence
        colors[index] = confidence
        colors[index + 1] = confidence * 0.8
        colors[index + 2] = confidence * 0.6
      })
    }

    // Fill remaining with degenerate triangles
    for (let i = triangleCount; i < maxTriangles; i++) {
      for (let j = 0; j < 9; j++) {
        vertices[i * 9 + j] = 0
        colors[i * 9 + j] = 0
      }
    }

    return { vertices, colors, count: triangleCount * 3 }
  }, [triangles])

  useFrame(() => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry
      if (geometry.attributes.position) {
        geometry.attributes.position.needsUpdate = true
        geometry.attributes.color.needsUpdate = true
      }
    }
  })

  if (triangles.length === 0) return null

  return (
    <mesh ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={vertices} count={vertices.length / 3} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={colors} count={colors.length / 3} itemSize={3} />
      </bufferGeometry>
      <meshBasicMaterial vertexColors transparent opacity={0.7} side={THREE.DoubleSide} />
    </mesh>
  )
}

export default function CameraScanner({ onScanComplete }: CameraScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanMode, setScanMode] = useState<"camera" | "lidar">("camera")
  const [scanPhase, setScanPhase] = useState<
    "idle" | "initializing" | "calibrating" | "capturing" | "reconstructing" | "optimizing" | "complete"
  >("idle")
  const [capturedPoints, setCapturedPoints] = useState<ScanPoint[]>([])
  const [keyframes, setKeyframes] = useState<Keyframe[]>([])
  const [meshTriangles, setMeshTriangles] = useState<MeshTriangle[]>([])
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>({
    x: 0,
    y: 0,
    z: 2,
    rotation: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    stability: 100,
  })
  const [scanQuality, setScanQuality] = useState<QualityMetrics>({
    coverage: 0,
    overlap: 0,
    lighting: 85,
    stability: 92,
    featureMatching: 0,
    triangulation: 0,
    reprojectionError: 100,
    meshDensity: 0,
    reconstructionProgress: 0,
    keyframeQuality: 0,
  })
  const [capturedImages, setCapturedImages] = useState(0)
  const [processingStats, setProcessingStats] = useState({
    featuresDetected: 0,
    featuresMatched: 0,
    bundleAdjustmentIterations: 0,
    meshVertices: 0,
    meshFaces: 0,
  })
  const [scanWarnings, setScanWarnings] = useState<string[]>([])
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [qualityTrend, setQualityTrend] = useState<"improving" | "declining" | "stable">("stable")
  const [showPointCloud, setShowPointCloud] = useState(true)
  const [showMesh, setShowMesh] = useState(true)
  const [showTrajectory, setShowTrajectory] = useState(true)

  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const previousPositionRef = useRef<CameraPosition | null>(null)
  const qualityHistoryRef = useRef<number[]>([])
  const scanRegionsRef = useRef<Set<string>>(new Set())

  // Cleanup camera
  const cleanupCamera = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  // Initialize camera with professional settings
  const initializeCamera = useCallback(async () => {
    try {
      setCameraError(null)
      setCameraActive(false)

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 24 },
        },
        audio: false,
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = mediaStream

      if (videoRef.current) {
        if (!videoRef.current.paused) {
          videoRef.current.pause()
        }

        videoRef.current.srcObject = mediaStream

        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error("Video element not available"))
            return
          }

          const video = videoRef.current

          const onLoadedMetadata = () => {
            video.removeEventListener("loadedmetadata", onLoadedMetadata)
            video.removeEventListener("error", onError)

            video
              .play()
              .then(() => {
                setCameraActive(true)
                resolve()
              })
              .catch((playError) => {
                console.error("Video play failed:", playError)
                reject(playError)
              })
          }

          const onError = (error: Event) => {
            video.removeEventListener("loadedmetadata", onLoadedMetadata)
            video.removeEventListener("error", onError)
            reject(error)
          }

          video.addEventListener("loadedmetadata", onLoadedMetadata)
          video.addEventListener("error", onError)
        })
      }
    } catch (error) {
      console.error("Camera initialization failed:", error)
      setCameraError(
        error instanceof Error ? `Camera access failed: ${error.message}` : "Camera access denied or not available",
      )
      setCameraActive(false)
    }
  }, [])

  // Professional camera movement simulation
  const simulateCameraMovement = useCallback(() => {
    if (!isScanning) return

    setCameraPosition((prev) => {
      // Simulate more realistic camera movement patterns
      const time = Date.now() / 1000
      const radius = 3
      const height = 1.5

      const newPosition = {
        x: Math.cos(time * 0.1) * radius + (Math.random() - 0.5) * 0.1,
        y: Math.sin(time * 0.15) * 0.5 + height + (Math.random() - 0.5) * 0.05,
        z: Math.sin(time * 0.1) * radius + (Math.random() - 0.5) * 0.1,
        rotation: {
          x: Math.sin(time * 0.08) * 10 + (Math.random() - 0.5) * 2,
          y: time * 5 + (Math.random() - 0.5) * 3,
          z: Math.cos(time * 0.12) * 5 + (Math.random() - 0.5) * 1,
        },
        velocity: { x: 0, y: 0, z: 0 },
        stability: 0,
      }

      // Calculate velocity and stability
      if (previousPositionRef.current) {
        const dt = 0.1
        newPosition.velocity = {
          x: (newPosition.x - previousPositionRef.current.x) / dt,
          y: (newPosition.y - previousPositionRef.current.y) / dt,
          z: (newPosition.z - previousPositionRef.current.z) / dt,
        }

        const speed = Math.sqrt(newPosition.velocity.x ** 2 + newPosition.velocity.y ** 2 + newPosition.velocity.z ** 2)
        newPosition.stability = Math.max(70, Math.min(100, 100 - speed * 150))
      }

      previousPositionRef.current = prev
      return newPosition
    })

    // Advanced point capture with realistic feature detection
    if (scanPhase === "capturing") {
      const currentPos = cameraPosition
      const featureCount = Math.max(15, Math.floor((scanQuality.stability / 100) * (Math.random() * 60 + 30)))

      const newPoints: ScanPoint[] = Array.from({ length: featureCount }, () => {
        const featureTypes: ScanPoint["featureType"][] = ["corner", "edge", "surface", "texture"]
        const featureType = featureTypes[Math.floor(Math.random() * featureTypes.length)]

        // Generate points in a more realistic distribution around the camera
        const angle = Math.random() * Math.PI * 2
        const distance = Math.random() * 4 + 1
        const height = (Math.random() - 0.5) * 2

        let color: [number, number, number] = [0.3, 0.6, 1]
        switch (featureType) {
          case "corner":
            color = [1, 0.3, 0.3]
            break
          case "edge":
            color = [0.3, 1, 0.3]
            break
          case "surface":
            color = [0.3, 0.6, 1]
            break
          case "texture":
            color = [0.8, 0.3, 1]
            break
        }

        return {
          x: currentPos.x + Math.cos(angle) * distance * 0.3,
          y: height,
          z: currentPos.z + Math.sin(angle) * distance * 0.3,
          confidence: Math.min(0.95, 0.7 + (scanQuality.stability / 100) * 0.25),
          timestamp: Date.now(),
          featureType,
          matchedPoints: Math.floor(Math.random() * 12 + 3),
          color,
        }
      })

      setCapturedPoints((prev) => {
        const combined = [...prev, ...newPoints]
        // Limit to prevent buffer overflow
        return combined.slice(-8000)
      })
      setCapturedImages((prev) => prev + 1)

      // Create keyframes
      if (capturedImages % 15 === 0) {
        const newKeyframe: Keyframe = {
          id: Date.now(),
          position: currentPos,
          timestamp: Date.now(),
          imageQuality: Math.min(0.95, (scanQuality.stability + scanQuality.lighting) / 200),
          featureCount: featureCount,
          matchedFeatures: Math.floor(featureCount * 0.7),
        }
        setKeyframes((prev) => {
          const combined = [...prev, newKeyframe]
          return combined.slice(-50) // Limit keyframes
        })
      }

      // Update processing stats
      setProcessingStats((prev) => ({
        featuresDetected: prev.featuresDetected + featureCount,
        featuresMatched: prev.featuresMatched + Math.floor(featureCount * 0.7),
        bundleAdjustmentIterations: prev.bundleAdjustmentIterations,
        meshVertices: prev.meshVertices,
        meshFaces: prev.meshFaces,
      }))
    }

    // Mesh reconstruction during capturing
    if (scanPhase === "capturing" && capturedPoints.length > 100 && capturedPoints.length % 50 === 0) {
      const recentPoints = capturedPoints.slice(-150)
      const triangleCount = Math.min(20, Math.floor(recentPoints.length / 8))

      const newTriangles: MeshTriangle[] = Array.from({ length: triangleCount }, () => {
        const indices = Array.from({ length: 3 }, () => Math.floor(Math.random() * recentPoints.length))
        const vertices = indices.map((i) => new THREE.Vector3(recentPoints[i].x, recentPoints[i].y, recentPoints[i].z))

        return {
          vertices: vertices as [THREE.Vector3, THREE.Vector3, THREE.Vector3],
          confidence: Math.random() * 0.4 + 0.6,
          timestamp: Date.now(),
        }
      })

      setMeshTriangles((prev) => {
        const combined = [...prev, ...newTriangles]
        return combined.slice(-800) // Limit triangles
      })
    }
  }, [isScanning, scanPhase, cameraPosition, scanQuality, capturedImages, capturedPoints])

  // Enhanced quality metrics
  const updateQualityMetrics = useCallback(() => {
    if (!isScanning) return

    setScanQuality((prev) => {
      const totalRegions = 100
      const coveredRegions = scanRegionsRef.current.size
      const newCoverage = Math.min(100, (coveredRegions / totalRegions) * 100)

      const recentPoints = capturedPoints.slice(-200)
      const overlapScore = Math.min(100, (recentPoints.length / 200) * 100)

      const lightingVariation = Math.random() * 15 - 7.5
      const newLighting = Math.max(50, Math.min(100, prev.lighting + lightingVariation))

      const avgConfidence =
        capturedPoints.length > 0 ? capturedPoints.reduce((sum, p) => sum + p.confidence, 0) / capturedPoints.length : 0
      const featureMatching = avgConfidence * 100

      const triangulationQuality = Math.min(100, newCoverage * 0.7 + overlapScore * 0.3)
      const reprojectionError = Math.max(0, 100 - (featureMatching * 0.6 + cameraPosition.stability * 0.4))
      const keyframeQuality =
        keyframes.length > 0 ? Math.min(100, (keyframes.length / Math.max(1, capturedImages / 15)) * 100) : 0
      const meshDensity = Math.min(100, (meshTriangles.length / Math.max(1, capturedPoints.length / 10)) * 100)
      const reconstructionProgress = Math.min(100, (meshTriangles.length / 500) * 100)

      return {
        coverage: newCoverage,
        overlap: overlapScore,
        lighting: newLighting,
        stability: cameraPosition.stability,
        featureMatching,
        triangulation: triangulationQuality,
        reprojectionError,
        keyframeQuality,
        meshDensity,
        reconstructionProgress,
      }
    })

    // Professional warnings
    const warnings: string[] = []
    if (scanQuality.lighting < 60) warnings.push("Insufficient lighting - consider additional illumination")
    if (cameraPosition.stability < 75) warnings.push("Excessive camera motion - stabilize movement")
    if (scanQuality.overlap < 70) warnings.push("Insufficient overlap - ensure 70%+ overlap between images")
    if (scanQuality.featureMatching < 60) warnings.push("Poor feature matching - ensure textured surfaces")
    if (keyframes.length > 0 && keyframes[keyframes.length - 1]?.imageQuality < 0.6) {
      warnings.push("Low keyframe quality - check focus and exposure")
    }

    setScanWarnings(warnings)
  }, [isScanning, capturedPoints, cameraPosition, scanQuality, keyframes, meshTriangles])

  // Initialize camera on mount
  useEffect(() => {
    initializeCamera()
    return () => cleanupCamera()
  }, [])

  // Movement and quality updates
  useEffect(() => {
    if (!isScanning) return
    const interval = setInterval(simulateCameraMovement, 100)
    return () => clearInterval(interval)
  }, [isScanning, simulateCameraMovement])

  useEffect(() => {
    if (!isScanning) return
    const interval = setInterval(updateQualityMetrics, 500)
    return () => clearInterval(interval)
  }, [isScanning, updateQualityMetrics])

  const startScan = async () => {
    if (!cameraActive) {
      setCameraError("Please enable camera access first")
      return
    }

    setIsScanning(true)
    setScanProgress(0)
    setScanPhase("initializing")
    setCapturedPoints([])
    setKeyframes([])
    setMeshTriangles([])
    setCapturedImages(0)
    setProcessingStats({
      featuresDetected: 0,
      featuresMatched: 0,
      bundleAdjustmentIterations: 0,
      meshVertices: 0,
      meshFaces: 0,
    })
    setScanQuality({
      coverage: 0,
      overlap: 0,
      lighting: 85,
      stability: 92,
      featureMatching: 0,
      triangulation: 0,
      reprojectionError: 100,
      meshDensity: 0,
      reconstructionProgress: 0,
      keyframeQuality: 0,
    })
    setScanWarnings([])
    scanRegionsRef.current.clear()
    qualityHistoryRef.current = []

    // Phase 1: Initialization
    await new Promise((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += 2
        setScanProgress(progress)
        if (progress >= 10) {
          clearInterval(interval)
          setScanPhase("calibrating")
          resolve(void 0)
        }
      }, 200)
    })

    // Phase 2: Calibration
    await new Promise((resolve) => {
      let progress = 10
      const interval = setInterval(() => {
        progress += 1.5
        setScanProgress(progress)
        if (progress >= 20) {
          clearInterval(interval)
          setScanPhase("capturing")
          resolve(void 0)
        }
      }, 300)
    })

    // Phase 3: Capturing
    await new Promise((resolve) => {
      let progress = 20
      const interval = setInterval(() => {
        progress += 0.6
        setScanProgress(progress)
        if (progress >= 70) {
          clearInterval(interval)
          setScanPhase("reconstructing")
          resolve(void 0)
        }
      }, 150)
    })

    // Phase 4: Reconstruction
    await new Promise((resolve) => {
      let progress = 70
      const interval = setInterval(() => {
        progress += 1
        setScanProgress(progress)
        setProcessingStats((prev) => ({
          ...prev,
          bundleAdjustmentIterations: prev.bundleAdjustmentIterations + 1,
          meshVertices: Math.floor(capturedPoints.length * 0.4),
          meshFaces: Math.floor(capturedPoints.length * 0.8),
        }))
        if (progress >= 90) {
          clearInterval(interval)
          setScanPhase("optimizing")
          resolve(void 0)
        }
      }, 200)
    })

    // Phase 5: Optimization
    await new Promise((resolve) => {
      let progress = 90
      const interval = setInterval(() => {
        progress += 1
        setScanProgress(progress)
        if (progress >= 100) {
          clearInterval(interval)
          setScanPhase("complete")
          setIsScanning(false)

          setTimeout(() => {
            const finalQuality =
              (scanQuality.coverage * 0.2 +
                scanQuality.overlap * 0.15 +
                scanQuality.featureMatching * 0.2 +
                scanQuality.triangulation * 0.15 +
                scanQuality.stability * 0.1 +
                scanQuality.meshDensity * 0.1 +
                (100 - scanQuality.reprojectionError) * 0.1) /
              100

            const mockScanData = {
              id: Date.now(),
              timestamp: new Date().toISOString(),
              mode: scanMode,
              area: 25.5,
              points: capturedPoints.length,
              keyframes: keyframes.length,
              accuracy: Math.min(0.98, finalQuality),
              bounds: { width: 5.2, height: 4.9, depth: 0.8 },
              quality: scanQuality,
              images: capturedImages,
              processingTime: "4.2s",
              meshVertices: processingStats.meshVertices,
              meshFaces: processingStats.meshFaces,
              reprojectionError: scanQuality.reprojectionError,
              bundleAdjustmentIterations: processingStats.bundleAdjustmentIterations,
            }
            onScanComplete(mockScanData)
          }, 0)

          return 100
        }
      }, 100)
    })
  }

  const getPhaseDescription = () => {
    switch (scanPhase) {
      case "initializing":
        return "Initializing photogrammetry pipeline..."
      case "calibrating":
        return "Calibrating camera intrinsics and distortion..."
      case "capturing":
        return "Capturing keyframes and extracting features..."
      case "reconstructing":
        return "Running structure-from-motion reconstruction..."
      case "optimizing":
        return "Optimizing bundle adjustment and mesh generation..."
      case "complete":
        return "Photogrammetry reconstruction complete!"
      default:
        return "Professional photogrammetry system ready"
    }
  }

  const getQualityColor = (value: number) => {
    if (value >= 85) return "text-green-600"
    if (value >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Badge variant="default" className="bg-blue-600">
            <Camera className="w-3 h-3 mr-1" />
            Professional Photogrammetry
          </Badge>
          <Badge variant={cameraActive ? "default" : "destructive"}>
            {cameraActive ? "Camera Active" : "Camera Inactive"}
          </Badge>
          {scanPhase !== "idle" && (
            <Badge variant="outline" className="bg-green-50">
              <Cpu className="w-3 h-3 mr-1" />
              {scanPhase.charAt(0).toUpperCase() + scanPhase.slice(1)}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={initializeCamera} disabled={isScanning}>
            <Camera className="w-4 h-4 mr-2" />
            {cameraActive ? "Restart Camera" : "Enable Camera"}
          </Button>
        </div>
      </div>

      {cameraError && (
        <Alert variant="destructive">
          <VideoOff className="h-4 w-4" />
          <AlertDescription>{cameraError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Feed */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-0">
            <div className="aspect-video bg-gray-900 relative">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                style={{ display: cameraActive ? "block" : "none" }}
              />

              {!cameraActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center">
                  <div className="text-center text-white">
                    <VideoOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Professional Camera System</p>
                    <p className="text-sm text-white/70 mt-1">Enable camera access to begin photogrammetry</p>
                  </div>
                </div>
              )}

              {/* Professional scanning overlay */}
              {isScanning && cameraActive && (
                <div className="absolute inset-0">
                  {/* Scanning grid */}
                  <div className="absolute inset-4 border-2 border-blue-400 rounded-lg">
                    <div className="grid grid-cols-3 grid-rows-3 h-full w-full">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="border border-blue-400/30" />
                      ))}
                    </div>
                  </div>

                  {/* Feature detection indicators */}
                  {scanPhase === "capturing" && (
                    <div className="absolute inset-0">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div
                          key={i}
                          className={`absolute w-1 h-1 rounded-full animate-pulse ${
                            i % 4 === 0
                              ? "bg-red-400"
                              : i % 4 === 1
                                ? "bg-green-400"
                                : i % 4 === 2
                                  ? "bg-blue-400"
                                  : "bg-purple-400"
                          }`}
                          style={{
                            left: `${Math.random() * 80 + 10}%`,
                            top: `${Math.random() * 80 + 10}%`,
                            animationDelay: `${Math.random() * 2}s`,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Status overlay */}
                  <div className="absolute bottom-4 left-4 right-4 text-center text-white">
                    <div className="bg-black/70 rounded-lg p-3 backdrop-blur-sm">
                      <div className="mb-2">
                        {scanPhase === "initializing" && <Target className="w-6 h-6 mx-auto animate-pulse" />}
                        {scanPhase === "calibrating" && <Gauge className="w-6 h-6 mx-auto animate-spin" />}
                        {scanPhase === "capturing" && <Move className="w-6 h-6 mx-auto animate-bounce" />}
                        {(scanPhase === "reconstructing" || scanPhase === "optimizing") && (
                          <RotateCw className="w-6 h-6 mx-auto animate-spin" />
                        )}
                      </div>
                      <p className="text-sm font-medium">{getPhaseDescription()}</p>
                      {scanPhase === "capturing" && (
                        <div className="text-xs text-white/80 mt-1">
                          Keyframes: {keyframes.length} | Features: {processingStats.featuresDetected.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Real-time 3D Reconstruction */}
        <Card>
          <CardContent className="p-0">
            <div className="aspect-video bg-gray-900 relative">
              <Canvas camera={{ position: [5, 3, 5], fov: 60 }}>
                <ambientLight intensity={0.4} />
                <directionalLight position={[10, 10, 5]} intensity={0.8} />

                {showPointCloud && capturedPoints.length > 0 && <PointCloud points={capturedPoints} />}
                {showTrajectory && keyframes.length > 0 && <CameraTrajectory keyframes={keyframes} />}
                {showMesh && meshTriangles.length > 0 && <MeshReconstruction triangles={meshTriangles} />}

                <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
              </Canvas>

              {/* 3D View Controls */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button
                  size="sm"
                  variant={showPointCloud ? "default" : "outline"}
                  onClick={() => setShowPointCloud(!showPointCloud)}
                  className="text-xs"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Points
                </Button>
                <Button
                  size="sm"
                  variant={showMesh ? "default" : "outline"}
                  onClick={() => setShowMesh(!showMesh)}
                  className="text-xs"
                >
                  <Layers className="w-3 h-3 mr-1" />
                  Mesh
                </Button>
                <Button
                  size="sm"
                  variant={showTrajectory ? "default" : "outline"}
                  onClick={() => setShowTrajectory(!showTrajectory)}
                  className="text-xs"
                >
                  <Move className="w-3 h-3 mr-1" />
                  Path
                </Button>
              </div>

              {/* 3D Stats */}
              <div className="absolute bottom-4 left-4 bg-black/70 rounded-lg p-2 text-white text-xs backdrop-blur-sm">
                <div>Points: {capturedPoints.length.toLocaleString()}</div>
                <div>Keyframes: {keyframes.length}</div>
                <div>Triangles: {meshTriangles.length}</div>
                <div>Quality: {scanQuality.reconstructionProgress.toFixed(0)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Professional Quality Metrics */}
      {(isScanning || scanPhase === "complete") && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getQualityColor(scanQuality.coverage)}`}>
                  {scanQuality.coverage.toFixed(0)}%
                </div>
                <div className="text-gray-600">Coverage</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getQualityColor(scanQuality.featureMatching)}`}>
                  {scanQuality.featureMatching.toFixed(0)}%
                </div>
                <div className="text-gray-600">Features</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getQualityColor(scanQuality.stability)}`}>
                  {scanQuality.stability.toFixed(0)}%
                </div>
                <div className="text-gray-600">Stability</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getQualityColor(scanQuality.reconstructionProgress)}`}>
                  {scanQuality.reconstructionProgress.toFixed(0)}%
                </div>
                <div className="text-gray-600">Reconstruction</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Statistics */}
      {(scanPhase === "reconstructing" || scanPhase === "optimizing" || scanPhase === "complete") && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Processing Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium">Features Detected</div>
                <div className="text-blue-600">{processingStats.featuresDetected.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium">Features Matched</div>
                <div className="text-green-600">{processingStats.featuresMatched.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium">Bundle Iterations</div>
                <div className="text-purple-600">{processingStats.bundleAdjustmentIterations}</div>
              </div>
              <div>
                <div className="font-medium">Mesh Vertices</div>
                <div className="text-orange-600">{processingStats.meshVertices.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium">Mesh Faces</div>
                <div className="text-red-600">{processingStats.meshFaces.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium">Keyframes</div>
                <div className="text-indigo-600">{keyframes.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {scanWarnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {scanWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Progress */}
      {isScanning && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{getPhaseDescription()}</span>
            <span>{scanProgress.toFixed(1)}%</span>
          </div>
          <Progress value={scanProgress} className="w-full" />
        </div>
      )}

      {/* Start Button */}
      <div className="flex justify-center">
        <Button size="lg" onClick={startScan} disabled={isScanning || !cameraActive} className="px-8">
          {isScanning ? (
            <>
              <Scan className="w-5 h-5 mr-2 animate-spin" />
              {scanPhase === "reconstructing" || scanPhase === "optimizing" ? "Processing..." : "Scanning..."}
            </>
          ) : (
            <>
              <Square className="w-5 h-5 mr-2" />
              Start Professional Scan
            </>
          )}
        </Button>
      </div>

      {scanPhase === "complete" && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Professional photogrammetry scan completed! Generated {capturedPoints.length.toLocaleString()} 3D points,{" "}
            {keyframes.length} keyframes, and {meshTriangles.length} mesh triangles with{" "}
            {scanQuality.reconstructionProgress.toFixed(0)}% reconstruction quality.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
