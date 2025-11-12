# Phase 5: AI & Intelligence Layer

## Overview
This phase implements mock AI services that simulate Databricks functionality, providing intelligent features like lead scoring, sentiment analysis, trend detection, and automated email drafting.

## Duration
**Weeks 6-7** (10 working days)

## Objectives
1. Build comprehensive mock AI REST APIs
2. Implement lead scoring algorithm
3. Create sentiment analysis engine
4. Build trend detection service
5. Implement email draft generator
6. Create product recommendation engine
7. Add win probability calculator
8. Integrate AI services with UI

## AI Service Architecture

### Service Design Principles

1. **REST API Interface**: All AI services exposed as REST endpoints
2. **Asynchronous Processing**: Support for batch operations
3. **Deterministic Results**: Consistent outputs for testing
4. **Easy Replacement**: API contracts allow swapping with real Databricks services
5. **Performance**: Fast response times (<100ms for synchronous calls)

### API Endpoint Structure

```
/api/ai/
├── /scoring
│   ├── POST /lead-score           # Calculate lead score
│   ├── POST /opportunity-score    # Calculate opportunity win score
│   └── POST /account-health       # Calculate account health
│
├── /sentiment
│   ├── POST /analyze              # Analyze sentiment from text
│   └── POST /batch                # Batch sentiment analysis
│
├── /trends
│   ├── GET /current               # Get current trending topics
│   ├── POST /match                # Match entity against trends
│   └── GET /forecast              # Forecast trending topics
│
├── /recommendations
│   ├── POST /products             # Recommend products for account
│   ├── POST /actions              # Recommend next actions
│   └── POST /cross-sell           # Identify cross-sell opportunities
│
└── /generation
    ├── POST /email-draft          # Generate email draft
    ├── POST /proposal             # Generate proposal text
    └── POST /summary              # Generate summary
```

## AI Service Implementations

### 1. Lead Scoring Service (Enhanced)

**Location**: `srv/mock-ai/scoring-service.js`

```javascript
const cds = require('@sap/cds');

class LeadScoringService {
    /**
     * Calculate comprehensive lead score (0-100)
     * Based on multiple factors with weighted scoring
     */
    async calculateLeadScore(lead) {
        let score = 0;
        const weights = {
            platform: 0.20,
            source: 0.15,
            completeness: 0.20,
            engagement: 0.15,
            trending: 0.15,
            behavioral: 0.15
        };

        // 1. Platform Score (max 20 points)
        score += this._platformScore(lead) * weights.platform * 100;

        // 2. Source Score (max 15 points)
        score += this._sourceScore(lead) * weights.source * 100;

        // 3. Profile Completeness (max 20 points)
        score += this._completenessScore(lead) * weights.completeness * 100;

        // 4. Engagement Indicators (max 15 points)
        score += this._engagementScore(lead) * weights.engagement * 100;

        // 5. Trending Match (max 15 points)
        score += await this._trendingScore(lead) * weights.trending * 100;

        // 6. Behavioral Signals (max 15 points)
        score += this._behavioralScore(lead) * weights.behavioral * 100;

        return Math.round(Math.max(0, Math.min(100, score)));
    }

    _platformScore(lead) {
        const platformScores = {
            'TikTok': 1.0,      // Highest - trending platform
            'Instagram': 0.9,
            'Referral': 0.95,
            'Web': 0.6,
            'Facebook': 0.5,
            'LinkedIn': 0.7,
            'Other': 0.4
        };

        return platformScores[lead.platform] || 0.4;
    }

    _sourceScore(lead) {
        const sourceScores = {
            'Referral': 1.0,
            'Partner': 0.9,
            'Web': 0.7,
            'Social': 0.8,
            'Import': 0.5,
            'Cold': 0.3
        };

        return sourceScores[lead.source] || 0.5;
    }

    _completenessScore(lead) {
        let completeness = 0;
        const fields = [
            'contactName', 'contactEmail', 'contactPhone',
            'address', 'city', 'outletName', 'brandToPitch'
        ];

        fields.forEach(field => {
            if (lead[field] && lead[field].trim()) {
                completeness += 1 / fields.length;
            }
        });

        return completeness;
    }

    _engagementScore(lead) {
        let engagement = 0;

        // Has notes
        if (lead.notes && lead.notes.length > 50) {
            engagement += 0.3;
        }

        // Recent contact
        if (lead.lastContactDate) {
            const daysSince = (Date.now() - new Date(lead.lastContactDate)) / (1000 * 60 * 60 * 24);
            if (daysSince < 7) engagement += 0.4;
            else if (daysSince < 30) engagement += 0.2;
        }

        // Follow-up scheduled
        if (lead.nextFollowUp) {
            engagement += 0.3;
        }

        return Math.min(1.0, engagement);
    }

    async _trendingScore(lead) {
        const trendService = require('./trend-service');
        const trends = await trendService.getTrendingTopics();

        const leadText = `${lead.outletName} ${lead.brandToPitch} ${lead.notes || ''}`.toLowerCase();
        let matches = 0;

        trends.forEach(trend => {
            if (leadText.includes(trend.topic.toLowerCase())) {
                matches++;
            }
        });

        return Math.min(1.0, matches / 2); // Max 2 trend matches = perfect score
    }

    _behavioralScore(lead) {
        let score = 0;

        // Estimated value
        if (lead.estimatedValue) {
            if (lead.estimatedValue > 100000) score += 0.5;
            else if (lead.estimatedValue > 50000) score += 0.3;
            else if (lead.estimatedValue > 10000) score += 0.1;
        }

        // Positive sentiment
        if (lead.sentimentScore && lead.sentimentScore > 50) {
            score += 0.3;
        }

        // Social media presence
        if (lead.platform === 'TikTok' || lead.platform === 'Instagram') {
            score += 0.2;
        }

        return Math.min(1.0, score);
    }

    /**
     * Calculate opportunity win score
     */
    async calculateOpportunityScore(opportunity) {
        let score = opportunity.probability || 50;

        // Amount factor (higher value = higher score)
        if (opportunity.amount > 500000) score += 15;
        else if (opportunity.amount > 200000) score += 10;
        else if (opportunity.amount > 100000) score += 5;
        else if (opportunity.amount > 50000) score += 2;

        // Stage velocity (how quickly moving through stages)
        if (opportunity.createdAt) {
            const daysOpen = (Date.now() - new Date(opportunity.createdAt)) / (1000 * 60 * 60 * 24);
            const stageValue = this._getStageValue(opportunity.stage);

            // Good velocity if high stage reached quickly
            if (stageValue > 0.6 && daysOpen < 30) score += 10;
            else if (stageValue > 0.4 && daysOpen < 60) score += 5;

            // Poor velocity if stuck
            else if (daysOpen > 90) score -= 20;
            else if (daysOpen > 60) score -= 10;
        }

        // Engagement indicators
        if (opportunity.activities && opportunity.activities.length > 5) {
            score += 5;
        }

        // Account health
        if (opportunity.account && opportunity.account.healthScore > 75) {
            score += 5;
        }

        // Competition factor
        if (opportunity.competitors && opportunity.competitors.length > 2) {
            score -= 5;
        }

        // Discount risk
        if (opportunity.discountPercent > 30) {
            score -= 10;
        } else if (opportunity.discountPercent > 20) {
            score -= 5;
        }

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    _getStageValue(stage) {
        const stageValues = {
            'Prospecting': 0.1,
            'Qualification': 0.25,
            'Needs Analysis': 0.4,
            'Proposal': 0.6,
            'Negotiation': 0.8,
            'Closed Won': 1.0,
            'Closed Lost': 0
        };

        return stageValues[stage] || 0.1;
    }

    /**
     * Calculate account health score
     */
    async calculateAccountHealth(account) {
        let score = 50; // Base score

        // Revenue contribution
        if (account.annualRevenue) {
            if (account.annualRevenue > 1000000) score += 15;
            else if (account.annualRevenue > 500000) score += 10;
            else if (account.annualRevenue > 100000) score += 5;
        }

        // Account age (established customers score higher)
        if (account.establishedYear) {
            const age = new Date().getFullYear() - account.establishedYear;
            if (age > 10) score += 10;
            else if (age > 5) score += 5;
        }

        // Open opportunities
        if (account.opportunities) {
            const openOpps = account.opportunities.filter(o =>
                o.stage !== 'Closed Won' && o.stage !== 'Closed Lost'
            );
            score += Math.min(15, openOpps.length * 3);
        }

        // Recent activity
        if (account.activities) {
            const recentActivities = account.activities.filter(a => {
                const daysSince = (Date.now() - new Date(a.startDateTime)) / (1000 * 60 * 60 * 24);
                return daysSince < 30;
            });

            score += Math.min(10, recentActivities.length * 2);
        }

        // Payment history (mock - in real system, check for late payments)
        score += 10;

        return Math.max(0, Math.min(100, Math.round(score)));
    }
}

module.exports = new LeadScoringService();
```

### 2. Sentiment Analysis Service (Enhanced)

**Location**: `srv/mock-ai/sentiment-service.js`

```javascript
class SentimentAnalysisService {
    /**
     * Analyze sentiment from text using keyword matching and patterns
     */
    async analyzeSentiment(text, context = {}) {
        if (!text || text.trim().length === 0) {
            return {
                score: 0,
                label: 'Neutral',
                confidence: 1.0,
                keywords: [],
                emotions: {}
            };
        }

        const textLower = text.toLowerCase();

        // Analyze different aspects
        const positiveScore = this._calculatePositiveScore(textLower);
        const negativeScore = this._calculateNegativeScore(textLower);
        const emotions = this._detectEmotions(textLower);
        const keywords = this._extractKeywords(textLower);

        // Calculate overall score (-100 to +100)
        const score = Math.round((positiveScore - negativeScore) * 100);

        // Determine label
        let label = 'Neutral';
        if (score > 30) label = 'Very Positive';
        else if (score > 10) label = 'Positive';
        else if (score < -30) label = 'Very Negative';
        else if (score < -10) label = 'Negative';

        // Calculate confidence based on keyword count
        const totalKeywords = keywords.length;
        const confidence = Math.min(1.0, totalKeywords / 5);

        return {
            score: Math.max(-100, Math.min(100, score)),
            label: label,
            confidence: confidence,
            keywords: keywords,
            emotions: emotions
        };
    }

    _calculatePositiveScore(text) {
        const positiveKeywords = {
            // Enthusiasm
            'excellent': 0.9, 'amazing': 0.9, 'fantastic': 0.9, 'wonderful': 0.9,
            'outstanding': 0.9, 'superb': 0.8, 'great': 0.7, 'good': 0.6,

            // Interest & Intent
            'interested': 0.8, 'excited': 0.8, 'love': 0.8, 'perfect': 0.8,
            'definitely': 0.7, 'looking forward': 0.7, 'keen': 0.7,
            'yes': 0.6, 'sure': 0.5, 'okay': 0.4,

            // Positive outcomes
            'success': 0.7, 'achieve': 0.6, 'win': 0.7, 'growth': 0.6,
            'opportunity': 0.5, 'benefit': 0.6, 'advantage': 0.6,

            // Beauty industry specific
            'beautiful': 0.6, 'glow': 0.6, 'radiant': 0.7, 'stunning': 0.8,
            'transform': 0.7, 'luxurious': 0.7, 'premium': 0.6
        };

        let score = 0;
        let count = 0;

        Object.keys(positiveKeywords).forEach(keyword => {
            if (text.includes(keyword)) {
                score += positiveKeywords[keyword];
                count++;
            }
        });

        return count > 0 ? score / count : 0;
    }

    _calculateNegativeScore(text) {
        const negativeKeywords = {
            // Disinterest & Rejection
            'not interested': 0.9, 'no': 0.6, 'never': 0.8, 'cannot': 0.7,
            'won\'t': 0.7, 'don\'t': 0.6, 'can\'t': 0.7,

            // Dissatisfaction
            'bad': 0.8, 'poor': 0.8, 'terrible': 0.9, 'awful': 0.9,
            'worst': 0.9, 'horrible': 0.9, 'disappointed': 0.8,
            'unsatisfied': 0.8, 'unhappy': 0.7,

            // Problems
            'problem': 0.7, 'issue': 0.7, 'wrong': 0.7, 'error': 0.7,
            'fail': 0.8, 'broken': 0.8, 'concern': 0.6,

            // Price objections
            'expensive': 0.7, 'overpriced': 0.8, 'costly': 0.7,
            'too much': 0.7, 'cannot afford': 0.8,

            // Cancellation
            'cancel': 0.9, 'terminate': 0.9, 'stop': 0.7,
            'discontinue': 0.8, 'end': 0.6
        };

        let score = 0;
        let count = 0;

        Object.keys(negativeKeywords).forEach(keyword => {
            if (text.includes(keyword)) {
                score += negativeKeywords[keyword];
                count++;
            }
        });

        return count > 0 ? score / count : 0;
    }

    _detectEmotions(text) {
        const emotions = {
            joy: 0,
            trust: 0,
            anticipation: 0,
            surprise: 0,
            anger: 0,
            disgust: 0,
            sadness: 0,
            fear: 0
        };

        // Joy indicators
        if (text.match(/love|happy|excited|wonderful|amazing/)) emotions.joy += 0.8;

        // Trust indicators
        if (text.match(/trust|reliable|confident|sure/)) emotions.trust += 0.7;

        // Anticipation indicators
        if (text.match(/looking forward|excited|interested|keen/)) emotions.anticipation += 0.7;

        // Anger indicators
        if (text.match(/angry|furious|outraged|upset/)) emotions.anger += 0.8;

        // Sadness indicators
        if (text.match(/disappointed|sad|unhappy|unfortunate/)) emotions.sadness += 0.7;

        // Fear indicators
        if (text.match(/worried|concerned|afraid|nervous/)) emotions.fear += 0.6;

        return emotions;
    }

    _extractKeywords(text) {
        const keywords = [];

        // Positive keywords
        const positiveWords = ['excellent', 'great', 'good', 'love', 'interested',
            'excited', 'amazing', 'wonderful', 'perfect'];

        // Negative keywords
        const negativeWords = ['bad', 'poor', 'terrible', 'not interested',
            'expensive', 'problem', 'issue', 'disappointed'];

        positiveWords.forEach(word => {
            if (text.includes(word)) keywords.push({ word, sentiment: 'positive' });
        });

        negativeWords.forEach(word => {
            if (text.includes(word)) keywords.push({ word, sentiment: 'negative' });
        });

        return keywords;
    }

    /**
     * Batch sentiment analysis
     */
    async analyzeBatch(textArray) {
        const results = [];

        for (const text of textArray) {
            results.push(await this.analyzeSentiment(text));
        }

        return results;
    }
}

module.exports = new SentimentAnalysisService();
```

### 3. Trend Detection Service (Enhanced)

**Location**: `srv/mock-ai/trend-service.js`

```javascript
class TrendDetectionService {
    /**
     * Get current trending topics in beauty industry
     * In real implementation, scrape TikTok, Instagram, etc.
     */
    async getTrendingTopics() {
        // Simulated trending topics with decay
        const baseTrends = [
            { topic: 'Glass Skin', category: 'Skincare', platform: 'TikTok', baseScore: 95 },
            { topic: 'SPF 50+', category: 'Skincare', platform: 'Instagram', baseScore: 88 },
            { topic: 'K-Beauty', category: 'General', platform: 'TikTok', baseScore: 82 },
            { topic: 'Retinol', category: 'Skincare', platform: 'Instagram', baseScore: 78 },
            { topic: 'Clean Beauty', category: 'General', platform: 'Facebook', baseScore: 75 },
            { topic: 'Vitamin C', category: 'Skincare', platform: 'Instagram', baseScore: 72 },
            { topic: 'Niacinamide', category: 'Skincare', platform: 'TikTok', baseScore: 70 },
            { topic: 'Lash Serum', category: 'Makeup', platform: 'Instagram', baseScore: 68 },
            { topic: 'Sunscreen', category: 'Skincare', platform: 'Instagram', baseScore: 85 },
            { topic: 'Hyaluronic Acid', category: 'Skincare', platform: 'TikTok', baseScore: 65 }
        ];

        // Add time-based variation to simulate real trends
        const trends = baseTrends.map(trend => {
            const variation = (Math.random() - 0.5) * 10;
            return {
                ...trend,
                score: Math.round(trend.baseScore + variation),
                velocity: Math.random() > 0.5 ? 'rising' : 'stable',
                mentions: Math.floor(Math.random() * 100000) + 10000
            };
        });

        // Sort by score
        trends.sort((a, b) => b.score - a.score);

        return trends;
    }

    /**
     * Match entity (lead, product) against trends
     */
    async matchTrends(entity) {
        const trends = await this.getTrendingTopics();
        const matches = [];

        // Combine entity text fields
        const entityText = this._getEntityText(entity).toLowerCase();

        trends.forEach(trend => {
            const topicLower = trend.topic.toLowerCase();

            if (entityText.includes(topicLower)) {
                matches.push({
                    trend: trend.topic,
                    score: trend.score,
                    platform: trend.platform,
                    relevance: this._calculateRelevance(entityText, topicLower)
                });
            }
        });

        // Sort by relevance
        matches.sort((a, b) => b.relevance - a.relevance);

        return {
            matches: matches,
            trendScore: matches.length > 0 ? matches[0].score : 0,
            isTrending: matches.length > 0 && matches[0].score > 70
        };
    }

    _getEntityText(entity) {
        const fields = ['name', 'outletName', 'brandToPitch', 'description',
            'notes', 'productName', 'brand', 'category'];

        let text = '';
        fields.forEach(field => {
            if (entity[field]) text += ` ${entity[field]}`;
        });

        return text;
    }

    _calculateRelevance(text, topic) {
        // Count occurrences
        const regex = new RegExp(topic, 'gi');
        const matches = text.match(regex);
        const count = matches ? matches.length : 0;

        // Position weight (earlier mentions = higher relevance)
        const firstIndex = text.indexOf(topic);
        const positionWeight = firstIndex >= 0 ? 1 - (firstIndex / text.length) : 0;

        return Math.min(100, (count * 30) + (positionWeight * 70));
    }

    /**
     * Forecast trending topics for next period
     */
    async forecastTrends() {
        const currentTrends = await this.getTrendingTopics();

        // Simulate trend forecast
        const forecast = currentTrends.map(trend => {
            let predictedScore = trend.score;

            if (trend.velocity === 'rising') {
                predictedScore += Math.floor(Math.random() * 10) + 5;
            } else {
                predictedScore -= Math.floor(Math.random() * 5);
            }

            return {
                topic: trend.topic,
                currentScore: trend.score,
                predictedScore: Math.max(40, Math.min(100, predictedScore)),
                trend: predictedScore > trend.score ? 'up' : 'down',
                confidence: Math.random() * 0.3 + 0.7 // 70-100%
            };
        });

        return forecast;
    }

    /**
     * Analyze platform performance
     */
    async analyzePlatformTrends() {
        const trends = await this.getTrendingTopics();

        const platforms = {};

        trends.forEach(trend => {
            if (!platforms[trend.platform]) {
                platforms[trend.platform] = {
                    platform: trend.platform,
                    trendCount: 0,
                    avgScore: 0,
                    topTrend: null
                };
            }

            platforms[trend.platform].trendCount++;
            platforms[trend.platform].avgScore += trend.score;

            if (!platforms[trend.platform].topTrend ||
                trend.score > platforms[trend.platform].topTrend.score) {
                platforms[trend.platform].topTrend = trend;
            }
        });

        // Calculate averages
        Object.values(platforms).forEach(platform => {
            platform.avgScore = Math.round(platform.avgScore / platform.trendCount);
        });

        return Object.values(platforms);
    }
}

module.exports = new TrendDetectionService();
```

### 4. Email Draft Generator (Enhanced)

**Location**: `srv/mock-ai/email-draft-service.js`

```javascript
class EmailDraftService {
    /**
     * Generate personalized email draft for lead
     */
    async generateLeadEmail(lead, user, context = {}) {
        const template = context.template || 'introduction';

        switch (template) {
            case 'introduction':
                return this._generateIntroduction(lead, user);
            case 'follow-up':
                return this._generateFollowUp(lead, user);
            case 'meeting-request':
                return this._generateMeetingRequest(lead, user);
            default:
                return this._generateIntroduction(lead, user);
        }
    }

    _generateIntroduction(lead, user) {
        const greeting = lead.contactName ? `Dear ${lead.contactName}` : 'Hello';

        let body = `${greeting},\n\n`;

        body += `I noticed ${lead.outletName} on ${lead.platform} and was impressed by your presence in the beauty industry. `;

        if (lead.brandToPitch) {
            body += `I believe our ${lead.brandToPitch} products would be a perfect match for your customers.\n\n`;
        }

        // Add trending context
        if (lead.trendingTopics) {
            body += `Our products align perfectly with the current trending topics like ${lead.trendingTopics}, which I see resonates with your audience.\n\n`;
        }

        body += `Would you be available for a brief call this week to explore how we can support ${lead.outletName}?\n\n`;

        body += `Best regards,\n${user.fullName || 'Sales Team'}\n`;
        body += user.phone ? `${user.phone}\n` : '';
        body += user.email ? `${user.email}` : '';

        return {
            subject: `${lead.brandToPitch || 'Beauty Products'} - Perfect for ${lead.outletName}`,
            body: body,
            tone: 'Professional',
            confidence: 85,
            suggestions: [
                'Mention specific products',
                'Include success story',
                'Add time-limited offer'
            ]
        };
    }

    _generateFollowUp(lead, user) {
        const greeting = lead.contactName ? `Hi ${lead.contactName}` : 'Hello';

        let body = `${greeting},\n\n`;

        body += `I wanted to follow up on my previous message regarding our ${lead.brandToPitch || 'beauty'} products for ${lead.outletName}.\n\n`;

        body += `I understand you're busy, so I'll keep this brief. We have some exciting developments:\n\n`;
        body += `• New product launches aligned with current trends\n`;
        body += `• Special introductory pricing for new partners\n`;
        body += `• Flexible minimum order quantities\n\n`;

        body += `Would next week work for a quick 15-minute call?\n\n`;

        body += `Best regards,\n${user.fullName}\n`;

        return {
            subject: `Re: ${lead.brandToPitch} Partnership Opportunity`,
            body: body,
            tone: 'Friendly but Professional',
            confidence: 80,
            suggestions: [
                'Reference previous interaction',
                'Add urgency',
                'Provide specific times'
            ]
        };
    }

    _generateMeetingRequest(lead, user) {
        const greeting = lead.contactName ? `Dear ${lead.contactName}` : 'Hello';

        let body = `${greeting},\n\n`;

        body += `Thank you for your interest in our ${lead.brandToPitch || 'beauty'} products!\n\n`;

        body += `I'd love to schedule a meeting to:\n`;
        body += `• Show you our latest product catalog\n`;
        body += `• Discuss pricing and terms tailored for ${lead.outletName}\n`;
        body += `• Share success stories from similar partners\n`;
        body += `• Answer any questions you may have\n\n`;

        body += `Would you prefer:\n`;
        body += `• Virtual meeting (Zoom/Teams)\n`;
        body += `• In-person visit to ${lead.outletName}\n`;
        body += `• Phone call\n\n`;

        body += `I have availability this week on Tuesday and Thursday afternoons. What works best for you?\n\n`;

        body += `Looking forward to connecting!\n\n`;

        body += `Best regards,\n${user.fullName}\n`;

        return {
            subject: `Meeting Request - ${lead.brandToPitch} Product Showcase`,
            body: body,
            tone: 'Professional & Enthusiastic',
            confidence: 90,
            suggestions: [
                'Include calendar invite',
                'Provide agenda',
                'Add meeting preparation notes'
            ]
        };
    }

    /**
     * Generate proposal text
     */
    async generateProposal(opportunity, products) {
        let proposal = `# Business Proposal\n\n`;
        proposal += `## For: ${opportunity.account.accountName}\n`;
        proposal += `## Date: ${new Date().toLocaleDateString()}\n\n`;

        proposal += `### Executive Summary\n\n`;
        proposal += `We are pleased to present this proposal for supplying premium beauty products to ${opportunity.account.accountName}. `;
        proposal += `This partnership will provide your customers with access to trending, high-quality products while offering attractive margins.\n\n`;

        proposal += `### Products Included\n\n`;

        if (products && products.length > 0) {
            products.forEach(product => {
                proposal += `**${product.productName}** (${product.brand})\n`;
                proposal += `- Category: ${product.category}\n`;
                proposal += `- Price: RM ${product.listPrice}\n`;
                proposal += `- Quantity: ${product.quantity}\n\n`;
            });
        }

        proposal += `### Investment\n\n`;
        proposal += `Total Investment: RM ${opportunity.amount}\n`;

        if (opportunity.discountPercent) {
            proposal += `Special Discount: ${opportunity.discountPercent}%\n`;
        }

        proposal += `\n### Terms & Conditions\n\n`;
        proposal += `- Payment Terms: Net 30\n`;
        proposal += `- Delivery: Within 7-10 business days\n`;
        proposal += `- Minimum Order: As per product quantities above\n`;
        proposal += `- Returns: 30-day return policy on unopened items\n\n`;

        proposal += `### Next Steps\n\n`;
        proposal += `1. Review and approve this proposal\n`;
        proposal += `2. Sign partnership agreement\n`;
        proposal += `3. Place initial order\n`;
        proposal += `4. Receive delivery and begin selling\n\n`;

        proposal += `We look forward to partnering with ${opportunity.account.accountName}!\n`;

        return {
            proposal: proposal,
            format: 'markdown',
            confidence: 85
        };
    }

    /**
     * Generate summary
     */
    async generateSummary(entity, type) {
        if (type === 'lead') {
            return this._generateLeadSummary(entity);
        } else if (type === 'account') {
            return this._generateAccountSummary(entity);
        } else if (type === 'opportunity') {
            return this._generateOpportunitySummary(entity);
        }

        return { summary: '', confidence: 0 };
    }

    _generateLeadSummary(lead) {
        let summary = `${lead.outletName} is a ${lead.leadQuality || 'potential'} lead `;
        summary += `discovered via ${lead.platform}. `;

        if (lead.aiScore) {
            summary += `AI score: ${lead.aiScore}/100. `;
        }

        if (lead.sentimentLabel) {
            summary += `Sentiment: ${lead.sentimentLabel}. `;
        }

        if (lead.trendingTopics) {
            summary += `Aligned with trending topics: ${lead.trendingTopics}. `;
        }

        if (lead.recommendedAction) {
            summary += `Recommendation: ${lead.recommendedAction}`;
        }

        return {
            summary: summary,
            confidence: 80
        };
    }

    _generateAccountSummary(account) {
        let summary = `${account.accountName} is a ${account.accountType} `;
        summary += `in ${account.city || 'the region'}. `;

        if (account.accountTier) {
            summary += `Account tier: ${account.accountTier}. `;
        }

        if (account.healthScore) {
            summary += `Health score: ${account.healthScore}/100. `;
        }

        if (account.annualRevenue) {
            summary += `Annual revenue: RM ${account.annualRevenue}. `;
        }

        return {
            summary: summary,
            confidence: 85
        };
    }

    _generateOpportunitySummary(opportunity) {
        let summary = `${opportunity.name} is currently in ${opportunity.stage} stage `;
        summary += `with a value of RM ${opportunity.amount}. `;

        if (opportunity.probability) {
            summary += `Win probability: ${opportunity.probability}%. `;
        }

        if (opportunity.closeDate) {
            const closeDate = new Date(opportunity.closeDate);
            summary += `Expected close: ${closeDate.toLocaleDateString()}. `;
        }

        if (opportunity.aiWinScore) {
            summary += `AI win score: ${opportunity.aiWinScore}/100. `;
        }

        return {
            summary: summary,
            confidence: 85
        };
    }
}

module.exports = new EmailDraftService();
```

### 5. Product Recommendation Engine

**Location**: `srv/mock-ai/recommendation-service.js`

```javascript
class RecommendationService {
    /**
     * Recommend products for account based on trends and history
     */
    async recommendProducts(account, limit = 5) {
        const trendService = require('./trend-service');
        const trends = await trendService.getTrendingTopics();

        // Mock product recommendations based on trends and account type
        const recommendations = [];

        trends.slice(0, limit).forEach(trend => {
            recommendations.push({
                topic: trend.topic,
                trendScore: trend.score,
                reason: `Trending ${trend.platform} topic with ${trend.mentions} mentions`,
                confidence: 0.8 + (Math.random() * 0.2),
                expectedRevenue: Math.floor(Math.random() * 50000) + 10000
            });
        });

        return recommendations;
    }

    /**
     * Recommend next actions for lead/account
     */
    async recommendActions(entity, type) {
        const actions = [];

        if (type === 'lead') {
            if (entity.aiScore > 80) {
                actions.push({
                    action: 'Convert to Account',
                    priority: 'High',
                    reason: 'High AI score indicates strong potential',
                    confidence: 0.9
                });
            }

            if (!entity.lastContactDate || this._daysSince(entity.lastContactDate) > 7) {
                actions.push({
                    action: 'Follow up',
                    priority: 'Medium',
                    reason: 'No recent contact',
                    confidence: 0.8
                });
            }

            if (entity.sentimentLabel === 'Positive') {
                actions.push({
                    action: 'Schedule meeting',
                    priority: 'High',
                    reason: 'Positive sentiment detected',
                    confidence: 0.85
                });
            }
        }

        return actions;
    }

    _daysSince(date) {
        return (Date.now() - new Date(date)) / (1000 * 60 * 60 * 24);
    }

    /**
     * Identify cross-sell opportunities
     */
    async identifyCrossSell(account, currentProducts) {
        const trendService = require('./trend-service');
        const trends = await trendService.getTrendingTopics();

        const opportunities = [];

        // Find trending categories not currently purchased
        const currentCategories = currentProducts.map(p => p.category);

        trends.forEach(trend => {
            if (!currentCategories.includes(trend.category)) {
                opportunities.push({
                    category: trend.category,
                    trend: trend.topic,
                    trendScore: trend.score,
                    reason: `Customer doesn't currently stock ${trend.category} but it's trending`,
                    potential: 'High'
                });
            }
        });

        return opportunities;
    }
}

module.exports = new RecommendationService();
```

## REST API Endpoints

**Location**: `srv/api-router.js` (new)

```javascript
const express = require('express');
const router = express.Router();

const scoringService = require('./mock-ai/scoring-service');
const sentimentService = require('./mock-ai/sentiment-service');
const trendService = require('./mock-ai/trend-service');
const emailService = require('./mock-ai/email-draft-service');
const recommendationService = require('./mock-ai/recommendation-service');

// Scoring endpoints
router.post('/api/ai/scoring/lead-score', async (req, res) => {
    try {
        const score = await scoringService.calculateLeadScore(req.body);
        res.json({ score });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/api/ai/scoring/opportunity-score', async (req, res) => {
    try {
        const score = await scoringService.calculateOpportunityScore(req.body);
        res.json({ score });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Sentiment endpoints
router.post('/api/ai/sentiment/analyze', async (req, res) => {
    try {
        const result = await sentimentService.analyzeSentiment(req.body.text, req.body.context);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Trend endpoints
router.get('/api/ai/trends/current', async (req, res) => {
    try {
        const trends = await trendService.getTrendingTopics();
        res.json({ trends });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/api/ai/trends/match', async (req, res) => {
    try {
        const result = await trendService.matchTrends(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Email generation endpoints
router.post('/api/ai/generation/email-draft', async (req, res) => {
    try {
        const { lead, user, context } = req.body;
        const draft = await emailService.generateLeadEmail(lead, user, context);
        res.json(draft);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Recommendation endpoints
router.post('/api/ai/recommendations/products', async (req, res) => {
    try {
        const recommendations = await recommendationService.recommendProducts(req.body.account, req.body.limit);
        res.json({ recommendations });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
```

## UI Integration Examples

### Calling AI Services from UI

**Example**: Lead Detail Page

```javascript
// In Lead controller
onCalculateAIScore: function() {
    const oModel = this.getView().getModel();
    const lead = this.getView().getBindingContext().getObject();

    // Call AI service via bound action
    oModel.callFunction("/Leads/calculateScore", {
        method: "POST",
        urlParameters: { ID: lead.ID },
        success: (result) => {
            sap.m.MessageToast.show(`AI Score updated: ${result.aiScore}`);
            oModel.refresh();
        }
    });
},

onGenerateEmail: function() {
    const lead = this.getView().getBindingContext().getObject();

    // Call REST API directly
    fetch('/api/ai/generation/email-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            lead: lead,
            user: { fullName: "Alex", email: "alex@example.com" },
            context: { template: 'introduction' }
        })
    })
    .then(res => res.json())
    .then(draft => {
        // Open dialog with email draft
        this._showEmailDialog(draft);
    });
}
```

## Implementation Checklist

### Week 6: Enhanced AI Services
- [ ] Complete scoring service with all algorithms
- [ ] Enhance sentiment analysis with emotion detection
- [ ] Build comprehensive trend detection
- [ ] Create email draft generator with templates
- [ ] Implement recommendation engine
- [ ] Test all AI services independently

### Week 7: REST API & Integration
- [ ] Create REST API router
- [ ] Expose all AI endpoints
- [ ] Add API documentation
- [ ] Integrate AI calls in service handlers
- [ ] Add AI features to UI controllers
- [ ] Test end-to-end AI flows
- [ ] Performance optimization

## Testing Scenarios

1. **Lead Scoring**
   - Create leads with different characteristics
   - Verify scores reflect quality accurately
   - Test score recalculation

2. **Sentiment Analysis**
   - Test with positive, negative, neutral text
   - Verify emotion detection
   - Test batch analysis

3. **Trend Matching**
   - Create leads matching trends
   - Verify trend scores
   - Test platform analysis

4. **Email Generation**
   - Generate different email types
   - Verify personalization
   - Test template variations

5. **Recommendations**
   - Test product recommendations
   - Verify cross-sell identification
   - Test action recommendations

## Next Phase
Proceed to **Phase 6: Testing & Deployment** to create comprehensive test scenarios, user documentation, and deployment configuration.
