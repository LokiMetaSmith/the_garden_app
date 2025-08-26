# Quick Start Guide - Contractor System API

Get up and running with the AR Garden Planner Contractor System API in minutes!

## 🚀 Quick Setup

### 1. Get Your API Key
1. Sign up at [https://argardenplanner.com/developer](https://argardenplanner.com/developer)
2. Create a new application
3. Copy your API key from the dashboard

### 2. Set Up Your Environment
```bash
# Set your API key as an environment variable
export AR_GARDEN_API_KEY="your_api_key_here"
export AR_GARDEN_BASE_URL="https://api.argardenplanner.com/v1"
```

### 3. Test the Connection
```bash
curl -X GET "https://api.argardenplanner.com/v1/contractors" \
  -H "Authorization: Bearer $AR_GARDEN_API_KEY" \
  -H "Content-Type: application/json"
```

## 💻 SDK Installation

### JavaScript/Node.js
```bash
npm install @argardenplanner/sdk
```

```javascript
import { ContractorAPI } from '@argardenplanner/sdk';

const api = new ContractorAPI({
  apiKey: process.env.AR_GARDEN_API_KEY,
  baseURL: 'https://api.argardenplanner.com/v1'
});

// Test the connection
const contractors = await api.contractors.list();
console.log('Found', contractors.length, 'contractors');
```

### Python
```bash
pip install argardenplanner
```

```python
from argardenplanner import ContractorAPI
import os

api = ContractorAPI(
    api_key=os.getenv('AR_GARDEN_API_KEY'),
    base_url='https://api.argardenplanner.com/v1'
)

# Test the connection
contractors = api.contractors.list()
print(f'Found {len(contractors)} contractors')
```

### PHP
```bash
composer require argardenplanner/sdk
```

```php
<?php
require 'vendor/autoload.php';

use ARGardenPlanner\ContractorAPI;

$api = new ContractorAPI([
    'api_key' => getenv('AR_GARDEN_API_KEY'),
    'base_url' => 'https://api.argardenplanner.com/v1'
]);

// Test the connection
$contractors = $api->contractors->list();
echo "Found " . count($contractors) . " contractors\n";
?>
```

## 🔑 Common Use Cases

### 1. Find Available Contractors
```javascript
// Find contractors in Downtown, CA with high ratings
const contractors = await api.contractors.list({
  location: 'Downtown, CA',
  minRating: 4.5,
  minEngagementScore: 80
});

console.log('Top contractors:', contractors);
```

### 2. Create a New Project
```javascript
const project = await api.projects.create({
  title: "Modern Garden Redesign",
  description: "Complete garden redesign with native plants",
  projectType: "garden-design",
  budget: { min: 5000, max: 10000, currency: "USD" },
  timeline: "3 months",
  location: "Downtown, CA"
});

console.log('Project created:', project.id);
```

### 3. Submit a Bid
```javascript
const bid = await api.projects.submitBid(project.id, {
  contractorId: "contractor_123",
  amount: 8500,
  timeline: "10-12 weeks",
  description: "Professional garden redesign"
});

console.log('Bid submitted:', bid.id);
```

### 4. Get Engagement Scores
```javascript
const engagement = await api.contractors.getEngagement("contractor_123");
console.log('Engagement score:', engagement.overallScore);
console.log('Metrics:', engagement.metrics);
```

## 📊 Sample Data

### Test Project
```json
{
  "id": "test_project_001",
  "title": "Sample Garden Project",
  "description": "A test project for development purposes",
  "projectType": "garden-design",
  "budget": { "min": 3000, "max": 8000, "currency": "USD" },
  "timeline": "2 months",
  "location": "Test City, CA"
}
```

### Test Contractor
```json
{
  "id": "test_contractor_001",
  "name": "Test Garden Services",
  "email": "test@example.com",
  "phone": "+1-555-0123",
  "location": "Test City, CA",
  "specialties": ["garden-design", "maintenance"],
  "rating": 4.8,
  "engagementScore": 92
}
```

## 🧪 Testing

### Use the Postman Collection
1. Download [postman-collection.json](postman-collection.json)
2. Import into Postman
3. Set your API key in the collection variables
4. Start testing endpoints!

### Test Environment
```bash
# Use staging for testing
export AR_GARDEN_BASE_URL="https://staging-api.argardenplanner.com/v1"
export AR_GARDEN_API_KEY="test_key_123456789"
```

## 📱 Webhook Setup

### 1. Create Webhook Endpoint
```javascript
// Your webhook endpoint
app.post('/webhooks', (req, res) => {
  const { event, data } = req.body;
  
  switch (event) {
    case 'bid.submitted':
      console.log('New bid:', data);
      break;
    case 'project.updated':
      console.log('Project updated:', data);
      break;
  }
  
  res.status(200).send('OK');
});
```

### 2. Register Webhook
```javascript
await api.webhooks.create({
  url: 'https://your-app.com/webhooks',
  events: ['bid.submitted', 'project.updated'],
  secret: 'your-webhook-secret'
});
```

## 🔍 Error Handling

### Common Error Responses
```javascript
try {
  const result = await api.contractors.get('invalid_id');
} catch (error) {
  if (error.code === 'RESOURCE_NOT_FOUND') {
    console.log('Contractor not found');
  } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
    console.log('Rate limit exceeded, retry in:', error.retryAfter, 'seconds');
  } else {
    console.log('API Error:', error.message);
  }
}
```

### Rate Limiting
```javascript
// Check rate limit headers
const response = await api.contractors.list();
const remaining = response.headers['x-ratelimit-remaining'];
const reset = response.headers['x-ratelimit-reset'];

console.log(`Requests remaining: ${remaining}`);
console.log(`Rate limit resets at: ${new Date(reset * 1000)}`);
```

## 📚 Next Steps

1. **Read the Full API Documentation**: [API Specification](api-specification.md)
2. **Explore the Postman Collection**: Import and test all endpoints
3. **Join the Developer Community**: [https://community.argardenplanner.com](https://community.argardenplanner.com)
4. **Check SDK Examples**: [https://api.argardenplanner.com/sdks](https://api.argardenplanner.com/sdks)

## 🆘 Need Help?

- **Documentation**: [https://api.argardenplanner.com/docs](https://api.argardenplanner.com/docs)
- **Support**: [support@argardenplanner.com](mailto:support@argardenplanner.com)
- **Community**: [https://community.argardenplanner.com](https://community.argardenplanner.com)
- **GitHub Issues**: [https://github.com/argardenplanner/api-issues](https://github.com/argardenplanner/api-issues)

---

**Happy Coding! 🌱**

*This guide covers the basics. For complete API reference, see the [full API specification](api-specification.md).*

