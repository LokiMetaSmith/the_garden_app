# Contractor System API Specification

This document provides comprehensive API documentation for the AR Garden Planner's Contractor System, enabling integration with external web frontends and third-party applications.

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL & Endpoints](#base-url--endpoints)
- [Core Endpoints](#core-endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Webhooks](#webhooks)
- [SDK Examples](#sdk-examples)
- [Testing](#testing)

## 🌟 Overview

The Contractor System API provides RESTful endpoints for managing:
- **Contractor Management**: Profiles, engagement scores, performance metrics
- **Project Management**: Job postings, bids, progress tracking
- **Communication**: Questions, answers, notifications
- **Payment Processing**: Distribution calculations, bonuses, holdbacks
- **Analytics**: Performance insights, engagement trends, reporting

### API Version
- **Current Version**: `v1`
- **Base URL**: `https://api.argardenplanner.com/v1`
- **Content Type**: `application/json`
- **Character Encoding**: `UTF-8`

## 🔐 Authentication

### API Key Authentication
```http
Authorization: Bearer YOUR_API_KEY
```

### JWT Token Authentication
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Authentication Headers
| Header | Description | Required |
|--------|-------------|----------|
| `Authorization` | Bearer token or API key | Yes |
| `X-API-Version` | API version (defaults to v1) | No |
| `X-Client-ID` | Client application identifier | No |

## 🌐 Base URL & Endpoints

### Production
```
https://api.argardenplanner.com/v1
```

### Staging
```
https://staging-api.argardenplanner.com/v1
```

### Development
```
http://localhost:3000/api/v1
```

## 🚀 Core Endpoints

### 1. Contractor Management

#### Get All Contractors
```http
GET /contractors
```

**Query Parameters:**
- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `location` (string): Filter by location/city
- `specialty` (string): Filter by garden specialty
- `minRating` (number): Minimum rating filter
- `minEngagementScore` (number): Minimum engagement score filter
- `available` (boolean): Filter by availability status

**Response:**
```json
{
  "success": true,
  "data": {
    "contractors": [
      {
        "id": "contractor_123",
        "name": "Green Thumb Gardens",
        "email": "contact@greenthumb.com",
        "phone": "+1-555-0123",
        "location": "Downtown, CA",
        "specialties": ["garden-design", "irrigation", "hardscaping"],
        "rating": 4.8,
        "engagementScore": 94,
        "completedProjects": 45,
        "averageResponseTime": 2.1,
        "availability": "available",
        "profileImage": "https://cdn.example.com/profiles/123.jpg",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-20T14:22:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

#### Get Contractor by ID
```http
GET /contractors/{contractorId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contractor": {
      "id": "contractor_123",
      "name": "Green Thumb Gardens",
      "email": "contact@greenthumb.com",
      "phone": "+1-555-0123",
      "location": "Downtown, CA",
      "address": "123 Garden Street, Downtown, CA 90210",
      "specialties": ["garden-design", "irrigation", "hardscaping"],
      "rating": 4.8,
      "engagementScore": 94,
      "completedProjects": 45,
      "averageResponseTime": 2.1,
      "availability": "available",
      "profileImage": "https://cdn.example.com/profiles/123.jpg",
      "description": "Professional garden design and maintenance services",
      "certifications": ["Landscape Architect", "Irrigation Specialist"],
      "insurance": {
        "liability": true,
        "workersComp": true,
        "expiryDate": "2025-12-31"
      },
      "workingHours": {
        "monday": "8:00-17:00",
        "tuesday": "8:00-17:00",
        "wednesday": "8:00-17:00",
        "thursday": "8:00-17:00",
        "friday": "8:00-17:00",
        "saturday": "9:00-15:00",
        "sunday": "closed"
      },
      "serviceAreas": ["Downtown", "Westside", "Midtown"],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:22:00Z"
    }
  }
}
```

#### Update Contractor Profile
```http
PUT /contractors/{contractorId}
```

**Request Body:**
```json
{
  "name": "Green Thumb Gardens",
  "phone": "+1-555-0123",
  "location": "Downtown, CA",
  "description": "Updated description",
  "specialties": ["garden-design", "irrigation", "hardscaping"],
  "workingHours": {
    "monday": "8:00-17:00",
    "tuesday": "8:00-17:00"
  }
}
```

### 2. Project Management

#### Create New Project
```http
POST /projects
```

**Request Body:**
```json
{
  "title": "Modern Garden Redesign",
  "description": "Complete garden redesign with native plants and modern hardscaping",
  "projectType": "garden-design",
  "budget": {
    "min": 5000,
    "max": 10000,
    "currency": "USD"
  },
  "timeline": "3 months",
  "location": "Downtown, CA",
  "requirements": [
    "Native plants",
    "Irrigation system",
    "Modern hardscaping",
    "LED lighting"
  ],
  "images": [
    "https://cdn.example.com/projects/garden1.jpg",
    "https://cdn.example.com/projects/garden2.jpg"
  ],
  "customerPreferences": [
    "Low maintenance",
    "Drought resistant",
    "Year-round color"
  ],
  "constraints": [
    "Limited water usage",
    "HOA restrictions"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "project_456",
      "title": "Modern Garden Redesign",
      "description": "Complete garden redesign with native plants and modern hardscaping",
      "projectType": "garden-design",
      "budget": {
        "min": 5000,
        "max": 10000,
        "currency": "USD"
      },
      "timeline": "3 months",
      "location": "Downtown, CA",
      "status": "open",
      "customerId": "customer_789",
      "createdAt": "2024-01-20T15:00:00Z",
      "updatedAt": "2024-01-20T15:00:00Z"
    }
  }
}
```

#### Get Projects
```http
GET /projects
```

**Query Parameters:**
- `status` (string): Filter by project status
- `projectType` (string): Filter by project type
- `location` (string): Filter by location
- `minBudget` (number): Minimum budget filter
- `maxBudget` (number): Maximum budget filter
- `customerId` (string): Filter by customer ID
- `contractorId` (string): Filter by contractor ID

#### Get Project by ID
```http
GET /projects/{projectId}
```

### 3. Bid Management

#### Submit Bid
```http
POST /projects/{projectId}/bids
```

**Request Body:**
```json
{
  "contractorId": "contractor_123",
  "amount": 8500,
  "timeline": "10-12 weeks",
  "description": "Professional garden redesign with premium materials",
  "materials": [
    "Native plants",
    "Drip irrigation system",
    "Stone pavers",
    "LED landscape lighting"
  ],
  "warranty": "2 years on plants, 5 years on hardscaping",
  "paymentTerms": "50% upfront, 30% at 50% completion, 20% upon completion",
  "startDate": "2024-02-01",
  "completionDate": "2024-04-15"
}
```

#### Get Bids for Project
```http
GET /projects/{projectId}/bids
```

#### Accept/Reject Bid
```http
PUT /projects/{projectId}/bids/{bidId}
```

**Request Body:**
```json
{
  "action": "accept", // or "reject"
  "reason": "Best value and timeline for our needs"
}
```

### 4. Communication & Q&A

#### Ask Question
```http
POST /projects/{projectId}/questions
```

**Request Body:**
```json
{
  "text": "What type of irrigation system do you recommend for this climate?",
  "askedBy": "customer", // or "contractor"
  "priority": "medium", // "low", "medium", "high"
  "isPublic": true,
  "tags": ["irrigation", "climate", "maintenance"]
}
```

#### Answer Question
```http
PUT /projects/{projectId}/questions/{questionId}/answer
```

**Request Body:**
```json
{
  "answer": "I recommend a smart drip irrigation system with moisture sensors...",
  "answeredBy": "contractor_123"
}
```

#### Get Questions
```http
GET /projects/{projectId}/questions
```

### 5. Engagement & Performance

#### Get Contractor Engagement Score
```http
GET /contractors/{contractorId}/engagement
```

**Response:**
```json
{
  "success": true,
  "data": {
    "engagementScore": {
      "contractorId": "contractor_123",
      "overallScore": 94,
      "metrics": {
        "responseTime": 95,
        "communicationQuality": 92,
        "projectCompletion": 98,
        "customerSatisfaction": 96,
        "questionResponseRate": 94,
        "imageUploadFrequency": 91
      },
      "lastUpdated": "2024-01-20T14:22:00Z",
      "trend": "up",
      "change": 2
    }
  }
}
```

#### Update Engagement Metrics
```http
POST /contractors/{contractorId}/engagement/actions
```

**Request Body:**
```json
{
  "action": "question_response",
  "projectId": "project_456",
  "metadata": {
    "responseTime": 1.5,
    "quality": "excellent"
  }
}
```

### 6. Payment & Financial

#### Calculate Payment Distribution
```http
POST /projects/{projectId}/payments/calculate
```

**Request Body:**
```json
{
  "totalAmount": 8500,
  "contractorId": "contractor_123",
  "performanceMetrics": {
    "responseTime": 2.1,
    "communicationQuality": 92,
    "projectCompletion": 98,
    "customerSatisfaction": 96,
    "onTimeDelivery": true,
    "withinBudget": true,
    "qualityRating": 4.8
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentDistribution": {
      "projectId": "project_456",
      "totalAmount": 8500,
      "platformFee": 467.50,
      "contractorPayment": 7227.50,
      "holdbackAmount": 805.00,
      "distributionBreakdown": {
        "contractor": {
          "id": "contractor_123",
          "name": "Green Thumb Gardens",
          "baseAmount": 6800.00,
          "engagementBonus": 680.00,
          "performanceBonus": 747.50,
          "finalAmount": 7227.50,
          "engagementScore": 94,
          "performanceMetrics": {...}
        },
        "customer": {
          "id": "customer_789",
          "name": "John Doe",
          "amount": 8500
        }
      },
      "status": "pending",
      "createdAt": "2024-01-20T15:00:00Z"
    }
  }
}
```

#### Process Payment
```http
POST /projects/{projectId}/payments/process
```

**Request Body:**
```json
{
  "paymentMethod": "credit_card",
  "cardToken": "tok_visa",
  "amount": 8500,
  "currency": "USD"
}
```

### 7. Analytics & Reporting

#### Get Contractor Analytics
```http
GET /contractors/{contractorId}/analytics
```

**Query Parameters:**
- `period` (string): Time period (week, month, quarter, year)
- `startDate` (string): Start date (ISO 8601)
- `endDate` (string): End date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "analytics": {
      "period": "month",
      "startDate": "2024-01-01",
      "endDate": "2024-01-31",
      "metrics": {
        "totalProjects": 8,
        "completedProjects": 6,
        "totalRevenue": 45600,
        "averageProjectValue": 7600,
        "engagementScore": 94,
        "customerSatisfaction": 4.8,
        "responseTime": 2.1
      },
      "trends": {
        "revenue": "+12%",
        "engagement": "+3%",
        "satisfaction": "+0.2"
      },
      "topProjects": [...],
      "performanceInsights": [...]
    }
  }
}
```

#### Get Platform Analytics
```http
GET /analytics/platform
```

## 📊 Data Models

### Contractor
```typescript
interface Contractor {
  id: string
  name: string
  email: string
  phone: string
  location: string
  address?: string
  specialties: string[]
  rating: number
  engagementScore: number
  completedProjects: number
  averageResponseTime: number
  availability: 'available' | 'busy' | 'unavailable'
  profileImage?: string
  description?: string
  certifications?: string[]
  insurance?: {
    liability: boolean
    workersComp: boolean
    expiryDate: string
  }
  workingHours?: Record<string, string>
  serviceAreas?: string[]
  createdAt: string
  updatedAt: string
}
```

### Project
```typescript
interface Project {
  id: string
  title: string
  description: string
  projectType: string
  budget: {
    min: number
    max: number
    currency: string
  }
  timeline: string
  location: string
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  customerId: string
  contractorId?: string
  requirements: string[]
  images: string[]
  customerPreferences: string[]
  constraints: string[]
  createdAt: string
  updatedAt: string
}
```

### Bid
```typescript
interface Bid {
  id: string
  projectId: string
  contractorId: string
  amount: number
  timeline: string
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  description: string
  materials: string[]
  warranty: string
  paymentTerms?: string
  startDate?: string
  completionDate?: string
  submittedAt: string
  lastUpdated: string
}
```

### Question
```typescript
interface Question {
  id: string
  projectId: string
  text: string
  askedBy: 'customer' | 'contractor'
  askedAt: string
  answeredAt?: string
  answer?: string
  answeredBy?: string
  isPublic: boolean
  priority: 'low' | 'medium' | 'high'
  tags: string[]
  engagementScore: number
}
```

### EngagementScore
```typescript
interface EngagementScore {
  contractorId: string
  overallScore: number
  metrics: {
    responseTime: number
    communicationQuality: number
    projectCompletion: number
    customerSatisfaction: number
    questionResponseRate: number
    imageUploadFrequency: number
  }
  lastUpdated: string
  trend: 'up' | 'down' | 'stable'
  change: number
}
```

### PaymentDistribution
```typescript
interface PaymentDistribution {
  projectId: string
  totalAmount: number
  platformFee: number
  contractorPayment: number
  holdbackAmount: number
  distributionBreakdown: {
    contractor: {
      id: string
      name: string
      baseAmount: number
      engagementBonus: number
      performanceBonus: number
      finalAmount: number
      engagementScore: number
      performanceMetrics: PerformanceMetrics
    }
    customer: {
      id: string
      name: string
      amount: number
      refundAmount?: number
    }
  }
  status: 'pending' | 'processing' | 'completed' | 'disputed'
  createdAt: string
  completedAt?: string
}
```

## ❌ Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ],
    "timestamp": "2024-01-20T15:00:00Z",
    "requestId": "req_123456789"
  }
}
```

### HTTP Status Codes
| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Internal Server Error |

### Error Codes
| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTHENTICATION_ERROR` | Invalid or expired token |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

## 🚦 Rate Limiting

### Rate Limits
- **Standard Plan**: 1000 requests/hour
- **Professional Plan**: 5000 requests/hour
- **Enterprise Plan**: 50000 requests/hour

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642694400
```

### Rate Limit Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 3600 seconds.",
    "retryAfter": 3600
  }
}
```

## 🔔 Webhooks

### Webhook Events
- `project.created`
- `project.updated`
- `bid.submitted`
- `bid.accepted`
- `bid.rejected`
- `question.asked`
- `question.answered`
- `payment.processed`
- `engagement.updated`

### Webhook Payload
```json
{
  "event": "bid.submitted",
  "timestamp": "2024-01-20T15:00:00Z",
  "data": {
    "bidId": "bid_789",
    "projectId": "project_456",
    "contractorId": "contractor_123",
    "amount": 8500
  }
}
```

### Webhook Configuration
```http
POST /webhooks
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhooks",
  "events": ["bid.submitted", "project.updated"],
  "secret": "your-webhook-secret"
}
```

## 💻 SDK Examples

### JavaScript/Node.js
```javascript
import { ContractorAPI } from '@argardenplanner/sdk';

const api = new ContractorAPI({
  apiKey: 'your-api-key',
  baseURL: 'https://api.argardenplanner.com/v1'
});

// Get contractors
const contractors = await api.contractors.list({
  location: 'Downtown, CA',
  minRating: 4.5
});

// Submit bid
const bid = await api.projects.submitBid('project_456', {
  contractorId: 'contractor_123',
  amount: 8500,
  timeline: '10-12 weeks',
  description: 'Professional garden redesign'
});
```

### Python
```python
from argardenplanner import ContractorAPI

api = ContractorAPI(
    api_key='your-api-key',
    base_url='https://api.argardenplanner.com/v1'
)

# Get contractors
contractors = api.contractors.list(
    location='Downtown, CA',
    min_rating=4.5
)

# Submit bid
bid = api.projects.submit_bid('project_456', {
    'contractor_id': 'contractor_123',
    'amount': 8500,
    'timeline': '10-12 weeks',
    'description': 'Professional garden redesign'
})
```

### PHP
```php
use ARGardenPlanner\ContractorAPI;

$api = new ContractorAPI([
    'api_key' => 'your-api-key',
    'base_url' => 'https://api.argardenplanner.com/v1'
]);

// Get contractors
$contractors = $api->contractors->list([
    'location' => 'Downtown, CA',
    'min_rating' => 4.5
]);

// Submit bid
$bid = $api->projects->submitBid('project_456', [
    'contractor_id' => 'contractor_123',
    'amount' => 8500,
    'timeline' => '10-12 weeks',
    'description' => 'Professional garden redesign'
]);
```

## 🧪 Testing

### Test Environment
```
https://staging-api.argardenplanner.com/v1
```

### Test Data
- **Test API Key**: `test_key_123456789`
- **Test Project ID**: `test_project_001`
- **Test Contractor ID**: `test_contractor_001`
- **Test Customer ID**: `test_customer_001`

### Postman Collection
Download the complete Postman collection: [Contractor System API.postman_collection.json](https://api.argardenplanner.com/docs/postman-collection)

### cURL Examples

#### Get Contractors
```bash
curl -X GET "https://api.argardenplanner.com/v1/contractors" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

#### Submit Bid
```bash
curl -X POST "https://api.argardenplanner.com/v1/projects/PROJECT_ID/bids" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contractorId": "contractor_123",
    "amount": 8500,
    "timeline": "10-12 weeks",
    "description": "Professional garden redesign"
  }'
```

## 📚 Additional Resources

- **Interactive API Docs**: [https://api.argardenplanner.com/docs](https://api.argardenplanner.com/docs)
- **SDK Downloads**: [https://api.argardenplanner.com/sdks](https://api.argardenplanner.com/sdks)
- **Support**: [support@argardenplanner.com](mailto:support@argardenplanner.com)
- **Developer Community**: [https://community.argardenplanner.com](https://community.argardenplanner.com)

---

**Last Updated**: January 20, 2024  
**API Version**: v1  
**Documentation Version**: 1.0.0

