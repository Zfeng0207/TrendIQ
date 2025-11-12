# Mock AI Services - API Specification

## Overview

This document provides the complete REST API specification for the mock AI services that simulate Databricks functionality.

## Base URL

```
http://localhost:4004/api/ai
```

## Authentication

All API endpoints require authenticated user session. Include session cookies or bearer token in requests.

## Common Response Format

All endpoints return JSON responses with the following structure:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2025-11-12T10:30:00Z"
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  },
  "timestamp": "2025-11-12T10:30:00Z"
}
```

## API Endpoints

### 1. Scoring Services

#### 1.1 Calculate Lead Score

**Endpoint**: `POST /scoring/lead-score`

**Description**: Calculate AI-powered lead quality score (0-100)

**Request Body**:
```json
{
  "lead": {
    "outletName": "Glow Beauty Salon",
    "brandToPitch": "K-Beauty",
    "platform": "TikTok",
    "source": "Social",
    "contactName": "Sarah Lee",
    "contactEmail": "sarah@glowbeauty.com",
    "contactPhone": "+60123456789",
    "address": "123 Main St",
    "city": "Kuala Lumpur",
    "estimatedValue": 50000,
    "notes": "Very interested in K-Beauty products",
    "lastContactDate": "2025-11-10T14:30:00Z"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "score": 87,
    "breakdown": {
      "platform": 20,
      "source": 12,
      "completeness": 18,
      "engagement": 13,
      "trending": 14,
      "behavioral": 10
    },
    "quality": "Hot",
    "confidence": 0.92
  }
}
```

#### 1.2 Calculate Opportunity Score

**Endpoint**: `POST /scoring/opportunity-score`

**Description**: Calculate probability of winning an opportunity (0-100)

**Request Body**:
```json
{
  "opportunity": {
    "ID": "uuid",
    "name": "Glow Beauty Q1 Order",
    "stage": "Proposal",
    "probability": 60,
    "amount": 150000,
    "createdAt": "2025-10-15T09:00:00Z",
    "closeDate": "2025-12-15",
    "discountPercent": 10,
    "account": {
      "healthScore": 85
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "score": 72,
    "factors": {
      "baseProb": 60,
      "amountBonus": 5,
      "velocityScore": 5,
      "accountHealth": 5,
      "discountRisk": -3
    },
    "recommendation": "Strong opportunity - maintain momentum",
    "confidence": 0.85
  }
}
```

#### 1.3 Calculate Account Health

**Endpoint**: `POST /scoring/account-health`

**Description**: Calculate overall account health score (0-100)

**Request Body**:
```json
{
  "account": {
    "ID": "uuid",
    "accountName": "Sephora KL",
    "annualRevenue": 2000000,
    "establishedYear": 2015,
    "opportunities": [
      {"stage": "Proposal", "amount": 100000},
      {"stage": "Negotiation", "amount": 50000}
    ],
    "activities": [
      {"startDateTime": "2025-11-10T10:00:00Z"},
      {"startDateTime": "2025-11-05T14:00:00Z"}
    ]
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "score": 85,
    "riskLevel": "Low",
    "factors": {
      "revenue": 15,
      "age": 10,
      "opportunities": 15,
      "activity": 10,
      "payment": 10,
      "base": 50
    },
    "nextReviewDate": "2025-12-12"
  }
}
```

### 2. Sentiment Analysis Services

#### 2.1 Analyze Sentiment

**Endpoint**: `POST /sentiment/analyze`

**Description**: Analyze sentiment from text input

**Request Body**:
```json
{
  "text": "I love your products! They're amazing and have transformed my skin. Definitely interested in stocking your K-Beauty line.",
  "context": {
    "type": "email",
    "language": "en"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "score": 85,
    "label": "Very Positive",
    "confidence": 0.91,
    "keywords": [
      {"word": "love", "sentiment": "positive"},
      {"word": "amazing", "sentiment": "positive"},
      {"word": "interested", "sentiment": "positive"}
    ],
    "emotions": {
      "joy": 0.8,
      "trust": 0.7,
      "anticipation": 0.7,
      "surprise": 0.2,
      "anger": 0,
      "disgust": 0,
      "sadness": 0,
      "fear": 0
    }
  }
}
```

#### 2.2 Batch Sentiment Analysis

**Endpoint**: `POST /sentiment/batch`

**Description**: Analyze sentiment for multiple texts

**Request Body**:
```json
{
  "texts": [
    "Great products!",
    "Not interested at the moment.",
    "Looking forward to trying your products."
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "results": [
      {"score": 70, "label": "Positive", "confidence": 0.85},
      {"score": -60, "label": "Negative", "confidence": 0.80},
      {"score": 50, "label": "Positive", "confidence": 0.75}
    ],
    "summary": {
      "avgScore": 20,
      "positive": 2,
      "negative": 1,
      "neutral": 0
    }
  }
}
```

### 3. Trend Detection Services

#### 3.1 Get Current Trends

**Endpoint**: `GET /trends/current`

**Query Parameters**:
- `limit` (optional): Number of trends to return (default: 10)
- `category` (optional): Filter by category (Skincare, Makeup, etc.)
- `platform` (optional): Filter by platform (TikTok, Instagram, etc.)

**Response**:
```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "topic": "Glass Skin",
        "category": "Skincare",
        "platform": "TikTok",
        "score": 95,
        "velocity": "rising",
        "mentions": 125000,
        "lastUpdated": "2025-11-12T08:00:00Z"
      },
      {
        "topic": "SPF 50+",
        "category": "Skincare",
        "platform": "Instagram",
        "score": 88,
        "velocity": "stable",
        "mentions": 98000,
        "lastUpdated": "2025-11-12T08:00:00Z"
      }
    ],
    "totalTrends": 10,
    "lastUpdate": "2025-11-12T08:00:00Z"
  }
}
```

#### 3.2 Match Entity to Trends

**Endpoint**: `POST /trends/match`

**Description**: Match a lead, product, or account against current trends

**Request Body**:
```json
{
  "entity": {
    "outletName": "Glass Beauty Studio",
    "brandToPitch": "K-Beauty",
    "notes": "Specializes in glass skin treatments",
    "platform": "TikTok"
  },
  "entityType": "lead"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "trend": "Glass Skin",
        "score": 95,
        "platform": "TikTok",
        "relevance": 98
      },
      {
        "trend": "K-Beauty",
        "score": 82,
        "platform": "TikTok",
        "relevance": 85
      }
    ],
    "trendScore": 95,
    "isTrending": true,
    "recommendation": "High-value lead - aligns with top trending topics"
  }
}
```

#### 3.3 Forecast Trends

**Endpoint**: `GET /trends/forecast`

**Query Parameters**:
- `period` (optional): "week" | "month" | "quarter" (default: "month")

**Response**:
```json
{
  "success": true,
  "data": {
    "period": "month",
    "forecast": [
      {
        "topic": "Glass Skin",
        "currentScore": 95,
        "predictedScore": 98,
        "trend": "up",
        "confidence": 0.89
      },
      {
        "topic": "SPF 50+",
        "currentScore": 88,
        "predictedScore": 85,
        "trend": "down",
        "confidence": 0.75
      }
    ],
    "generatedAt": "2025-11-12T10:00:00Z"
  }
}
```

#### 3.4 Platform Trend Analysis

**Endpoint**: `GET /trends/platforms`

**Response**:
```json
{
  "success": true,
  "data": {
    "platforms": [
      {
        "platform": "TikTok",
        "trendCount": 5,
        "avgScore": 85,
        "topTrend": {
          "topic": "Glass Skin",
          "score": 95
        }
      },
      {
        "platform": "Instagram",
        "trendCount": 4,
        "avgScore": 78,
        "topTrend": {
          "topic": "SPF 50+",
          "score": 88
        }
      }
    ]
  }
}
```

### 4. Content Generation Services

#### 4.1 Generate Email Draft

**Endpoint**: `POST /generation/email-draft`

**Description**: Generate personalized email draft for lead outreach

**Request Body**:
```json
{
  "lead": {
    "contactName": "Sarah Lee",
    "outletName": "Glow Beauty Salon",
    "brandToPitch": "K-Beauty",
    "platform": "TikTok",
    "trendingTopics": "Glass Skin, SPF 50+"
  },
  "user": {
    "fullName": "Alex Chen",
    "email": "alex@beautyco.com",
    "phone": "+60123456789"
  },
  "context": {
    "template": "introduction"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "subject": "K-Beauty - Perfect for Glow Beauty Salon",
    "body": "Dear Sarah Lee,\n\nI noticed Glow Beauty Salon on TikTok and was impressed by your presence in the beauty industry...",
    "tone": "Professional",
    "confidence": 0.85,
    "suggestions": [
      "Mention specific products",
      "Include success story",
      "Add time-limited offer"
    ]
  }
}
```

**Available Templates**:
- `introduction`: Initial outreach
- `follow-up`: Follow-up after no response
- `meeting-request`: Request for meeting

#### 4.2 Generate Proposal

**Endpoint**: `POST /generation/proposal`

**Description**: Generate business proposal document

**Request Body**:
```json
{
  "opportunity": {
    "name": "Q1 2025 Order",
    "account": {
      "accountName": "Sephora KL"
    },
    "amount": 150000,
    "discountPercent": 10
  },
  "products": [
    {
      "productName": "Vitamin C Serum",
      "brand": "GlowLab",
      "listPrice": 89.90,
      "quantity": 100
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "proposal": "# Business Proposal\n\n## For: Sephora KL...",
    "format": "markdown",
    "confidence": 0.85,
    "sections": ["executive_summary", "products", "investment", "terms", "next_steps"]
  }
}
```

#### 4.3 Generate Summary

**Endpoint**: `POST /generation/summary`

**Description**: Generate AI summary of entity

**Request Body**:
```json
{
  "entity": {
    "outletName": "Glow Beauty",
    "leadQuality": "Hot",
    "aiScore": 87,
    "sentimentLabel": "Positive",
    "trendingTopics": "Glass Skin, K-Beauty"
  },
  "type": "lead"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "summary": "Glow Beauty is a Hot lead discovered via TikTok. AI score: 87/100. Sentiment: Positive. Aligned with trending topics: Glass Skin, K-Beauty. Recommendation: High-priority follow-up.",
    "confidence": 0.80,
    "highlights": [
      "High AI score (87)",
      "Positive sentiment",
      "Trending topic alignment"
    ]
  }
}
```

### 5. Recommendation Services

#### 5.1 Product Recommendations

**Endpoint**: `POST /recommendations/products`

**Description**: Recommend products for an account based on trends and history

**Request Body**:
```json
{
  "account": {
    "accountName": "Sephora KL",
    "accountType": "Retailer",
    "city": "Kuala Lumpur"
  },
  "limit": 5
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "topic": "Glass Skin",
        "trendScore": 95,
        "reason": "Trending TikTok topic with 125000 mentions",
        "confidence": 0.92,
        "expectedRevenue": 45000
      },
      {
        "topic": "SPF 50+",
        "trendScore": 88,
        "reason": "Trending Instagram topic with 98000 mentions",
        "confidence": 0.88,
        "expectedRevenue": 38000
      }
    ],
    "totalExpectedRevenue": 83000
  }
}
```

#### 5.2 Action Recommendations

**Endpoint**: `POST /recommendations/actions`

**Description**: Recommend next best actions for a lead or account

**Request Body**:
```json
{
  "entity": {
    "aiScore": 87,
    "lastContactDate": null,
    "sentimentLabel": "Positive"
  },
  "type": "lead"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "actions": [
      {
        "action": "Convert to Account",
        "priority": "High",
        "reason": "High AI score indicates strong potential",
        "confidence": 0.90
      },
      {
        "action": "Schedule meeting",
        "priority": "High",
        "reason": "Positive sentiment detected",
        "confidence": 0.85
      }
    ]
  }
}
```

#### 5.3 Cross-Sell Opportunities

**Endpoint**: `POST /recommendations/cross-sell`

**Description**: Identify cross-sell opportunities for an account

**Request Body**:
```json
{
  "account": {
    "accountName": "Sephora KL"
  },
  "currentProducts": [
    {"productName": "Vitamin C Serum", "category": "Skincare"}
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "opportunities": [
      {
        "category": "Makeup",
        "trend": "Glass Skin Makeup",
        "trendScore": 88,
        "reason": "Customer doesn't currently stock Makeup but it's trending",
        "potential": "High"
      }
    ]
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_INPUT` | Request body validation failed |
| `MISSING_FIELD` | Required field is missing |
| `UNAUTHORIZED` | Authentication required |
| `RATE_LIMIT` | Too many requests |
| `INTERNAL_ERROR` | Server error |
| `SERVICE_UNAVAILABLE` | AI service temporarily unavailable |

## Rate Limiting

- Rate limit: 100 requests per minute per user
- Header: `X-RateLimit-Remaining` shows remaining requests
- Header: `X-RateLimit-Reset` shows reset time (Unix timestamp)

## Webhook Support (Future)

Future implementation will support webhooks for:
- Trend updates
- Score changes
- New recommendations

## API Client Examples

### JavaScript (Node.js)

```javascript
const fetch = require('node-fetch');

async function calculateLeadScore(lead) {
    const response = await fetch('http://localhost:4004/api/ai/scoring/lead-score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lead })
    });

    return await response.json();
}
```

### JavaScript (Browser/UI5)

```javascript
fetch('/api/ai/trends/current')
    .then(res => res.json())
    .then(data => {
        console.log('Current trends:', data.data.trends);
    });
```

### cURL

```bash
curl -X POST http://localhost:4004/api/ai/sentiment/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "I love your products!"}'
```

## Testing

All endpoints can be tested using:
- Postman collection: `/docs/postman/ai-services.json`
- OpenAPI/Swagger: `http://localhost:4004/api/ai/docs`
- Test suite: `npm run test:ai-services`

## Performance Targets

| Endpoint | Target Response Time |
|----------|---------------------|
| Scoring | < 50ms |
| Sentiment | < 100ms |
| Trends (GET) | < 30ms |
| Trends (Match) | < 100ms |
| Generation | < 200ms |
| Recommendations | < 150ms |

## Migration to Real Databricks

When replacing with real Databricks services:

1. Update endpoint URLs in configuration
2. Add Databricks authentication
3. Map request/response formats
4. Update timeout settings (real ML may be slower)
5. Implement caching for expensive operations
6. Add retry logic for reliability

Configuration example:

```javascript
// config/ai-services.js
module.exports = {
    provider: process.env.AI_PROVIDER || 'mock', // 'mock' or 'databricks'
    databricks: {
        host: process.env.DATABRICKS_HOST,
        token: process.env.DATABRICKS_TOKEN,
        endpoints: {
            leadScoring: '/api/2.0/ml/endpoints/lead-score',
            sentiment: '/api/2.0/ml/endpoints/sentiment-analysis'
        }
    }
};
```

## Support

For API support:
- Documentation: `/docs/api/`
- Examples: `/docs/api/examples/`
- Issues: GitHub Issues
