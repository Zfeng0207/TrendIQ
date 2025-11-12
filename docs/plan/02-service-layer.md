# Phase 2: Service Layer Enhancement

## Overview
This phase transforms the read-only OData services into full CRUD-capable services with business logic, draft support, and mock AI integration.

## Duration
**Weeks 2-3** (10 working days)

## Objectives
1. Convert LeadService from read-only to full CRUD
2. Create 5 new OData services for new entities
3. Implement service handlers with business logic
4. Add draft-enabled editing capabilities
5. Build mock AI service endpoints
6. Implement actions and functions
7. Add authorization model

## Service Architecture

### Modular Service Design

Instead of one monolithic service file, split services into logical modules:

```
srv/
├── services/
│   ├── lead-service.cds
│   ├── account-service.cds
│   ├── opportunity-service.cds
│   ├── activity-service.cds
│   ├── product-service.cds
│   └── workflow-service.cds
│
├── handlers/
│   ├── lead-handler.js
│   ├── account-handler.js
│   ├── opportunity-handler.js
│   ├── activity-handler.js
│   ├── product-handler.js
│   └── workflow-handler.js
│
├── mock-ai/
│   ├── scoring-service.js
│   ├── sentiment-service.js
│   ├── trend-service.js
│   └── email-draft-service.js
│
└── utils/
    ├── validation.js
    ├── calculations.js
    └── notifications.js
```

## Service Definitions

### 1. LeadService (Enhanced)

**File**: `srv/services/lead-service.cds`

```cds
using { beauty.leads as leads } from '../../db/schema';
using { beauty.crm as crm } from '../../db/crm-schema';

@path: '/odata/v4/lead'
service LeadService @(requires: 'authenticated-user') {

    // Main entity - enable draft for editing
    @odata.draft.enabled
    entity Leads as projection on leads.Leads {
        *,
        assignedTo.fullName as assignedToName,
        owner.fullName as ownerName,
        convertedTo.accountName as convertedToName
    } actions {
        // Convert lead to account
        action convertToAccount() returns Accounts;

        // Assign lead to user
        action assign(userID: crm.Users:ID) returns Leads;

        // Calculate AI score
        action calculateScore() returns Leads;

        // Change status
        action updateStatus(newStatus: String) returns Leads;
    };

    // Expose related entities
    entity Accounts as projection on crm.Accounts;
    entity Users as projection on crm.Users;

    // Functions
    function getLeadsBySource(source: String) returns array of Leads;
    function getLeadStats() returns {
        total: Integer;
        new: Integer;
        contacted: Integer;
        qualified: Integer;
        converted: Integer;
        conversionRate: Decimal;
    };
}
```

**Handler**: `srv/handlers/lead-handler.js`

```javascript
const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
    const { Leads, Accounts, Contacts, Users } = this.entities;
    const scoringService = require('../mock-ai/scoring-service');
    const sentimentService = require('../mock-ai/sentiment-service');

    // Before creating a lead
    this.before('CREATE', 'Leads', async (req) => {
        const lead = req.data;

        // Auto-calculate AI score
        lead.aiScore = await scoringService.calculateLeadScore(lead);

        // Auto-calculate sentiment
        const sentiment = await sentimentService.analyzeSentiment(lead.notes || '');
        lead.sentimentScore = sentiment.score;
        lead.sentimentLabel = sentiment.label;

        // Set default owner to current user
        if (!lead.owner_ID) {
            lead.owner_ID = req.user.id;
        }
    });

    // After reading leads - add computed fields
    this.after('READ', 'Leads', (leads) => {
        if (!Array.isArray(leads)) leads = [leads];
        leads.forEach(lead => {
            // Add quality badge based on score
            if (lead.aiScore >= 80) lead.leadQuality = 'Hot';
            else if (lead.aiScore >= 60) lead.leadQuality = 'Warm';
            else if (lead.aiScore >= 40) lead.leadQuality = 'Medium';
            else lead.leadQuality = 'Cold';
        });
    });

    // Action: Convert lead to account
    this.on('convertToAccount', 'Leads', async (req) => {
        const leadID = req.params[0].ID;

        // Get lead details
        const lead = await SELECT.one.from(Leads).where({ ID: leadID });
        if (!lead) throw new Error('Lead not found');
        if (lead.converted) throw new Error('Lead already converted');

        // Create account
        const account = await INSERT.into(Accounts).entries({
            accountName: lead.outletName,
            email: lead.contactEmail,
            phone: lead.contactPhone,
            address: lead.address,
            city: lead.city,
            country: lead.country,
            accountType: 'Salon', // Default type
            status: 'Prospect',
            accountOwner_ID: lead.owner_ID
        });

        // Create primary contact if we have contact details
        if (lead.contactName || lead.contactEmail) {
            await INSERT.into(Contacts).entries({
                fullName: lead.contactName,
                email: lead.contactEmail,
                phone: lead.contactPhone,
                account_ID: account.ID,
                isPrimary: true,
                owner_ID: lead.owner_ID
            });
        }

        // Update lead as converted
        await UPDATE(Leads).set({
            converted: true,
            convertedDate: new Date().toISOString(),
            convertedTo_ID: account.ID
        }).where({ ID: leadID });

        return account;
    });

    // Action: Assign lead
    this.on('assign', 'Leads', async (req) => {
        const leadID = req.params[0].ID;
        const userID = req.data.userID;

        await UPDATE(Leads).set({
            assignedTo_ID: userID
        }).where({ ID: leadID });

        return SELECT.one.from(Leads).where({ ID: leadID });
    });

    // Action: Calculate score
    this.on('calculateScore', 'Leads', async (req) => {
        const leadID = req.params[0].ID;
        const lead = await SELECT.one.from(Leads).where({ ID: leadID });

        const newScore = await scoringService.calculateLeadScore(lead);
        const sentiment = await sentimentService.analyzeSentiment(lead.notes || '');

        await UPDATE(Leads).set({
            aiScore: newScore,
            sentimentScore: sentiment.score,
            sentimentLabel: sentiment.label
        }).where({ ID: leadID });

        return SELECT.one.from(Leads).where({ ID: leadID });
    });

    // Function: Get leads by source
    this.on('getLeadsBySource', async (req) => {
        const { source } = req.data;
        return SELECT.from(Leads).where({ source: source });
    });

    // Function: Get lead statistics
    this.on('getLeadStats', async () => {
        const total = await SELECT.from(Leads).columns('count(*) as count');
        const byStatus = await SELECT.from(Leads)
            .columns('status', 'count(*) as count')
            .groupBy('status');

        const stats = {
            total: total[0].count,
            new: 0,
            contacted: 0,
            qualified: 0,
            converted: 0,
            conversionRate: 0
        };

        byStatus.forEach(s => {
            stats[s.status.toLowerCase()] = s.count;
        });

        if (stats.total > 0) {
            stats.conversionRate = (stats.converted / stats.total * 100).toFixed(2);
        }

        return stats;
    });
});
```

### 2. AccountService

**File**: `srv/services/account-service.cds`

```cds
using { beauty.crm as crm } from '../../db/crm-schema';

@path: '/odata/v4/account'
service AccountService @(requires: 'authenticated-user') {

    @odata.draft.enabled
    entity Accounts as projection on crm.Accounts {
        *,
        accountOwner.fullName as accountOwnerName,
        accountManager.fullName as accountManagerName,
        parentAccount.accountName as parentAccountName
    } actions {
        action calculateHealthScore() returns Accounts;
        action updateTier(newTier: String) returns Accounts;
    };

    @odata.draft.enabled
    entity Contacts as projection on crm.Contacts {
        *,
        account.accountName as accountName,
        owner.fullName as ownerName
    };

    entity Users as projection on crm.Users;

    function getAccountsByType(accountType: String) returns array of Accounts;
    function getAccountHealth(accountID: UUID) returns {
        healthScore: Integer;
        riskLevel: String;
        openOpportunities: Integer;
        totalRevenue: Decimal;
        lastActivity: DateTime;
    };
}
```

**Handler**: `srv/handlers/account-handler.js`

```javascript
const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
    const { Accounts, Opportunities, Activities } = this.entities;

    // Before creating account
    this.before('CREATE', 'Accounts', async (req) => {
        const account = req.data;

        // Auto-calculate health score
        account.healthScore = 75; // Default for new accounts
        account.riskLevel = 'Low';

        // Set default owner
        if (!account.accountOwner_ID) {
            account.accountOwner_ID = req.user.id;
        }
    });

    // Action: Calculate health score
    this.on('calculateHealthScore', 'Accounts', async (req) => {
        const accountID = req.params[0].ID;

        // Get account with related data
        const opportunities = await SELECT.from(Opportunities)
            .where({ account_ID: accountID, stage: { '!=': 'Closed Lost' } });

        const activities = await SELECT.from(Activities)
            .where({ relatedAccount_ID: accountID })
            .orderBy('startDateTime desc')
            .limit(1);

        // Calculate health score (simplified algorithm)
        let healthScore = 50; // Base score

        // Add points for open opportunities
        healthScore += Math.min(opportunities.length * 10, 30);

        // Add points for recent activity
        if (activities.length > 0) {
            const lastActivity = new Date(activities[0].startDateTime);
            const daysSince = (Date.now() - lastActivity) / (1000 * 60 * 60 * 24);
            if (daysSince < 7) healthScore += 20;
            else if (daysSince < 30) healthScore += 10;
        }

        // Determine risk level
        let riskLevel = 'Low';
        if (healthScore < 40) riskLevel = 'Critical';
        else if (healthScore < 60) riskLevel = 'High';
        else if (healthScore < 75) riskLevel = 'Medium';

        // Update account
        await UPDATE(Accounts).set({
            healthScore: healthScore,
            riskLevel: riskLevel
        }).where({ ID: accountID });

        return SELECT.one.from(Accounts).where({ ID: accountID });
    });

    // Function: Get account health
    this.on('getAccountHealth', async (req) => {
        const { accountID } = req.data;

        const account = await SELECT.one.from(Accounts).where({ ID: accountID });
        const opportunities = await SELECT.from(Opportunities)
            .where({ account_ID: accountID, stage: { 'not in': ['Closed Won', 'Closed Lost'] } });
        const activities = await SELECT.from(Activities)
            .where({ relatedAccount_ID: accountID })
            .orderBy('startDateTime desc')
            .limit(1);

        const closedWon = await SELECT.from(Opportunities)
            .where({ account_ID: accountID, stage: 'Closed Won' });
        const totalRevenue = closedWon.reduce((sum, opp) => sum + (opp.amount || 0), 0);

        return {
            healthScore: account.healthScore || 0,
            riskLevel: account.riskLevel || 'Unknown',
            openOpportunities: opportunities.length,
            totalRevenue: totalRevenue,
            lastActivity: activities.length > 0 ? activities[0].startDateTime : null
        };
    });
});
```

### 3. OpportunityService

**File**: `srv/services/opportunity-service.cds`

```cds
using { beauty.crm as crm } from '../../db/crm-schema';

@path: '/odata/v4/opportunity'
service OpportunityService @(requires: 'authenticated-user') {

    @odata.draft.enabled
    entity Opportunities as projection on crm.Opportunities {
        *,
        account.accountName as accountName,
        primaryContact.fullName as primaryContactName,
        owner.fullName as ownerName,
        approval.status as approvalStatus
    } actions {
        action updateStage(newStage: String) returns Opportunities;
        action calculateWinProbability() returns Opportunities;
        action requestApproval(reason: String) returns Opportunities;
        action closeWon() returns Opportunities;
        action closeLost(reason: String) returns Opportunities;
    };

    @odata.draft.enabled
    entity OpportunityProducts as projection on crm.OpportunityProducts {
        *,
        opportunity.name as opportunityName,
        product.productName as productName,
        product.brand as productBrand
    };

    entity Accounts as projection on crm.Accounts;
    entity Contacts as projection on crm.Contacts;
    entity Products as projection on crm.Products;
    entity Users as projection on crm.Users;

    function getPipelineView() returns array of {
        stage: String;
        count: Integer;
        totalAmount: Decimal;
        averageAge: Integer;
    };

    function getForecast(timeframe: String) returns {
        period: String;
        expectedRevenue: Decimal;
        bestCase: Decimal;
        worstCase: Decimal;
        committed: Decimal;
    };
}
```

**Handler**: `srv/handlers/opportunity-handler.js`

```javascript
const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
    const { Opportunities, OpportunityProducts, Approvals } = this.entities;
    const scoringService = require('../mock-ai/scoring-service');

    // Before creating opportunity
    this.before('CREATE', 'Opportunities', async (req) => {
        const opp = req.data;

        // Calculate initial probability based on stage
        const stageProbabilities = {
            'Prospecting': 10,
            'Qualification': 25,
            'Needs Analysis': 40,
            'Proposal': 60,
            'Negotiation': 75,
            'Closed Won': 100,
            'Closed Lost': 0
        };
        opp.probability = stageProbabilities[opp.stage] || 10;

        // Calculate expected revenue
        opp.expectedRevenue = (opp.amount || 0) * (opp.probability / 100);

        // Set default owner
        if (!opp.owner_ID) {
            opp.owner_ID = req.user.id;
        }

        // Calculate AI win score
        opp.aiWinScore = await scoringService.calculateOpportunityScore(opp);
    });

    // Before updating - recalculate fields
    this.before('UPDATE', 'Opportunities', async (req) => {
        if (req.data.amount !== undefined || req.data.probability !== undefined) {
            const opp = await SELECT.one.from(Opportunities).where({ ID: req.data.ID });
            const amount = req.data.amount !== undefined ? req.data.amount : opp.amount;
            const probability = req.data.probability !== undefined ? req.data.probability : opp.probability;
            req.data.expectedRevenue = amount * (probability / 100);
        }
    });

    // After creating opportunity products - update total
    this.after(['CREATE', 'UPDATE', 'DELETE'], 'OpportunityProducts', async (_, req) => {
        const oppID = req.data.opportunity_ID;
        if (!oppID) return;

        const products = await SELECT.from(OpportunityProducts).where({ opportunity_ID: oppID });
        const total = products.reduce((sum, p) => sum + (p.totalPrice || 0), 0);

        await UPDATE(Opportunities).set({ amount: total }).where({ ID: oppID });
    });

    // Action: Update stage
    this.on('updateStage', 'Opportunities', async (req) => {
        const oppID = req.params[0].ID;
        const { newStage } = req.data;

        const stageProbabilities = {
            'Prospecting': 10,
            'Qualification': 25,
            'Needs Analysis': 40,
            'Proposal': 60,
            'Negotiation': 75,
            'Closed Won': 100,
            'Closed Lost': 0
        };

        const opp = await SELECT.one.from(Opportunities).where({ ID: oppID });
        const newProbability = stageProbabilities[newStage] || opp.probability;
        const expectedRevenue = (opp.amount || 0) * (newProbability / 100);

        await UPDATE(Opportunities).set({
            stage: newStage,
            probability: newProbability,
            expectedRevenue: expectedRevenue
        }).where({ ID: oppID });

        return SELECT.one.from(Opportunities).where({ ID: oppID });
    });

    // Action: Request approval
    this.on('requestApproval', 'Opportunities', async (req) => {
        const oppID = req.params[0].ID;
        const { reason } = req.data;

        const opp = await SELECT.one.from(Opportunities).where({ ID: oppID });

        // Create approval request
        const approval = await INSERT.into(Approvals).entries({
            opportunityID_ID: oppID,
            approvalType: 'Discount',
            requestedBy_ID: req.user.id,
            approver_ID: opp.owner_ID, // Should be manager
            requestDate: new Date().toISOString(),
            requestReason: reason,
            requestedDiscount: opp.discountPercent,
            requestedAmount: opp.amount,
            status: 'Pending',
            priority: 'Normal'
        });

        await UPDATE(Opportunities).set({
            requiresApproval: true,
            approval_ID: approval.ID
        }).where({ ID: oppID });

        return SELECT.one.from(Opportunities).where({ ID: oppID });
    });

    // Action: Close won
    this.on('closeWon', 'Opportunities', async (req) => {
        const oppID = req.params[0].ID;

        await UPDATE(Opportunities).set({
            stage: 'Closed Won',
            probability: 100,
            actualCloseDate: new Date().toISOString()
        }).where({ ID: oppID });

        return SELECT.one.from(Opportunities).where({ ID: oppID });
    });

    // Function: Get pipeline view
    this.on('getPipelineView', async () => {
        const opportunities = await SELECT.from(Opportunities)
            .where({ stage: { 'not in': ['Closed Won', 'Closed Lost'] } });

        const pipeline = {};
        opportunities.forEach(opp => {
            if (!pipeline[opp.stage]) {
                pipeline[opp.stage] = {
                    stage: opp.stage,
                    count: 0,
                    totalAmount: 0,
                    averageAge: 0
                };
            }
            pipeline[opp.stage].count++;
            pipeline[opp.stage].totalAmount += opp.amount || 0;
        });

        return Object.values(pipeline);
    });
});
```

### 4. ActivityService

**File**: `srv/services/activity-service.cds`

```cds
using { beauty.crm as crm } from '../../db/crm-schema';

@path: '/odata/v4/activity'
service ActivityService @(requires: 'authenticated-user') {

    @odata.draft.enabled
    entity Activities as projection on crm.Activities {
        *,
        assignedTo.fullName as assignedToName,
        owner.fullName as ownerName,
        relatedAccount.accountName as accountName,
        relatedContact.fullName as contactName,
        relatedOpportunity.name as opportunityName
    } actions {
        action complete() returns Activities;
        action reschedule(newDateTime: DateTime) returns Activities;
        action cancel(reason: String) returns Activities;
    };

    entity Accounts as projection on crm.Accounts;
    entity Contacts as projection on crm.Contacts;
    entity Opportunities as projection on crm.Opportunities;
    entity Users as projection on crm.Users;

    function getUpcomingActivities(days: Integer) returns array of Activities;
    function getActivityTimeline(entityType: String, entityID: UUID) returns array of Activities;
}
```

### 5. ProductService

**File**: `srv/services/product-service.cds`

```cds
using { beauty.crm as crm } from '../../db/crm-schema';

@path: '/odata/v4/product'
service ProductService @(requires: 'authenticated-user') {

    @odata.draft.enabled
    entity Products as projection on crm.Products actions {
        action markAsTrending() returns Products;
        action updateStock(quantity: Integer) returns Products;
    };

    function getTrendingProducts(limit: Integer) returns array of Products;
    function getProductsByCategory(category: String) returns array of Products;
    function searchProducts(searchTerm: String) returns array of Products;
}
```

### 6. WorkflowService

**File**: `srv/services/workflow-service.cds`

```cds
using { beauty.crm as crm } from '../../db/crm-schema';

@path: '/odata/v4/workflow'
service WorkflowService @(requires: 'authenticated-user') {

    entity Approvals as projection on crm.Approvals {
        *,
        requestedBy.fullName as requestedByName,
        approver.fullName as approverName,
        opportunityID.name as opportunityName
    } actions {
        action approve(comments: String) returns Approvals;
        action reject(comments: String) returns Approvals;
    };

    entity Opportunities as projection on crm.Opportunities;
    entity Users as projection on crm.Users;

    function getPendingApprovals() returns array of Approvals;
    function getMyApprovals() returns array of Approvals;
}
```

## Mock AI Services

### Scoring Service

**File**: `srv/mock-ai/scoring-service.js`

```javascript
/**
 * Mock AI Lead Scoring Service
 * Simulates Databricks lead scoring algorithm
 */

module.exports = {
    /**
     * Calculate lead score (0-100)
     */
    calculateLeadScore: async (lead) => {
        let score = 50; // Base score

        // Platform scoring
        const platformScores = {
            'Instagram': 15,
            'TikTok': 20,
            'Facebook': 10,
            'LinkedIn': 12,
            'Web': 8,
            'Referral': 25
        };
        score += platformScores[lead.platform] || 5;

        // Source scoring
        if (lead.source === 'Referral') score += 15;
        if (lead.source === 'Web') score += 10;

        // Contact completeness
        if (lead.contactEmail) score += 5;
        if (lead.contactPhone) score += 5;
        if (lead.contactName) score += 5;
        if (lead.address) score += 5;

        // Engagement indicators
        if (lead.notes && lead.notes.length > 50) score += 10;

        // Add some randomness to simulate AI
        score += Math.floor(Math.random() * 10) - 5;

        return Math.max(0, Math.min(100, score));
    },

    /**
     * Calculate opportunity win score (0-100)
     */
    calculateOpportunityScore: async (opportunity) => {
        let score = opportunity.probability || 50;

        // Amount factor
        if (opportunity.amount > 100000) score += 10;
        else if (opportunity.amount > 50000) score += 5;

        // Time factor - opportunities open too long lose points
        if (opportunity.createdAt) {
            const daysOpen = (Date.now() - new Date(opportunity.createdAt)) / (1000 * 60 * 60 * 24);
            if (daysOpen > 90) score -= 15;
            else if (daysOpen > 60) score -= 10;
            else if (daysOpen > 30) score -= 5;
        }

        // Add randomness
        score += Math.floor(Math.random() * 10) - 5;

        return Math.max(0, Math.min(100, score));
    }
};
```

### Sentiment Service

**File**: `srv/mock-ai/sentiment-service.js`

```javascript
/**
 * Mock AI Sentiment Analysis Service
 * Simulates Databricks NLP sentiment detection
 */

module.exports = {
    /**
     * Analyze sentiment from text
     * Returns score (-100 to +100) and label
     */
    analyzeSentiment: async (text) => {
        if (!text) {
            return { score: 0, label: 'Neutral' };
        }

        const textLower = text.toLowerCase();

        // Positive keywords
        const positiveWords = [
            'excellent', 'great', 'good', 'love', 'interested', 'excited',
            'amazing', 'wonderful', 'fantastic', 'yes', 'definitely',
            'perfect', 'looking forward', 'impressed'
        ];

        // Negative keywords
        const negativeWords = [
            'bad', 'poor', 'terrible', 'not interested', 'cancel',
            'disappointed', 'problem', 'issue', 'no', 'never',
            'expensive', 'overpriced', 'waste'
        ];

        let score = 0;

        // Count positive words
        positiveWords.forEach(word => {
            if (textLower.includes(word)) score += 10;
        });

        // Count negative words
        negativeWords.forEach(word => {
            if (textLower.includes(word)) score -= 10;
        });

        // Normalize to -100 to +100
        score = Math.max(-100, Math.min(100, score));

        // Determine label
        let label = 'Neutral';
        if (score > 20) label = 'Positive';
        else if (score < -20) label = 'Negative';

        return { score, label };
    }
};
```

### Trend Service

**File**: `srv/mock-ai/trend-service.js`

```javascript
/**
 * Mock AI Trend Detection Service
 * Simulates Databricks social media trend analysis
 */

module.exports = {
    /**
     * Get trending topics
     */
    getTrendingTopics: async () => {
        // Mock trending topics in beauty industry
        return [
            { topic: 'Glass Skin', score: 95, platform: 'TikTok' },
            { topic: 'SPF 50+', score: 88, platform: 'Instagram' },
            { topic: 'K-Beauty', score: 82, platform: 'TikTok' },
            { topic: 'Retinol Serum', score: 75, platform: 'Instagram' },
            { topic: 'Clean Beauty', score: 70, platform: 'Facebook' }
        ];
    },

    /**
     * Detect if a lead matches trending topics
     */
    matchTrends: async (lead) => {
        const trends = await module.exports.getTrendingTopics();
        const matches = [];

        const leadText = `${lead.outletName} ${lead.brandToPitch} ${lead.notes || ''}`.toLowerCase();

        trends.forEach(trend => {
            if (leadText.includes(trend.topic.toLowerCase())) {
                matches.push(trend.topic);
            }
        });

        return matches.join(', ');
    }
};
```

### Email Draft Service

**File**: `srv/mock-ai/email-draft-service.js`

```javascript
/**
 * Mock AI Email Draft Generator
 * Simulates GenAI for personalized outreach
 */

module.exports = {
    /**
     * Generate email draft for lead
     */
    generateLeadEmail: async (lead, user) => {
        return {
            subject: `${lead.brandToPitch} - Perfect for ${lead.outletName}`,
            body: `Dear ${lead.contactName || 'there'},

I came across ${lead.outletName} on ${lead.platform} and was impressed by your presence in the beauty space.

I believe our ${lead.brandToPitch} line would be a perfect fit for your customers. Our products are currently trending and have been featured extensively on social media.

Would you be available for a quick call this week to discuss how we can support your business?

Best regards,
${user.fullName || 'Sales Team'}`,
            tone: 'Professional',
            confidence: 85
        };
    }
};
```

## Authorization Model

**File**: `srv/services/auth.cds` (new)

```cds
using { LeadService, AccountService, OpportunityService, ActivityService, ProductService, WorkflowService } from './services';

// Roles
annotate LeadService with @(requires: 'authenticated-user');
annotate AccountService with @(requires: 'authenticated-user');
annotate OpportunityService with @(requires: 'authenticated-user');
annotate ActivityService with @(requires: 'authenticated-user');
annotate ProductService with @(requires: 'authenticated-user');

// Workflow requires special permissions
annotate WorkflowService with @(requires: 'SalesManager');

// Restrictions on sensitive actions
annotate OpportunityService.Opportunities with @(restrict: [
    { grant: 'READ', to: 'SalesRep' },
    { grant: ['READ', 'WRITE'], to: 'SalesManager', where: 'owner_ID = $user.id' },
    { grant: '*', to: 'Admin' }
]);
```

## Implementation Checklist

### Week 2: Service Creation
- [ ] Create `srv/services/` directory structure
- [ ] Write all 6 CDS service definitions
- [ ] Remove @readonly from LeadService
- [ ] Add draft annotations to entities
- [ ] Define all actions and functions
- [ ] Test compilation (`cds compile srv/`)

### Week 2-3: Handler Implementation
- [ ] Create `srv/handlers/` directory
- [ ] Implement LeadHandler with conversion logic
- [ ] Implement AccountHandler with health scoring
- [ ] Implement OpportunityHandler with pipeline logic
- [ ] Implement ActivityHandler
- [ ] Implement ProductHandler
- [ ] Implement WorkflowHandler with approval logic

### Week 3: Mock AI Services
- [ ] Create `srv/mock-ai/` directory
- [ ] Implement scoring-service.js
- [ ] Implement sentiment-service.js
- [ ] Implement trend-service.js
- [ ] Implement email-draft-service.js
- [ ] Test all mock services independently

### Week 3: Integration & Testing
- [ ] Test all services with `cds watch`
- [ ] Verify CRUD operations work
- [ ] Test all actions and functions
- [ ] Test draft mode
- [ ] Verify associations load correctly
- [ ] Test mock AI integration
- [ ] Perform OData query tests

## Testing Commands

```bash
# Test service endpoints
curl http://localhost:4004/odata/v4/lead/Leads
curl http://localhost:4004/odata/v4/account/Accounts
curl http://localhost:4004/odata/v4/opportunity/Opportunities

# Test actions (requires authentication)
curl -X POST http://localhost:4004/odata/v4/lead/Leads(ID)/convertToAccount

# Test functions
curl http://localhost:4004/odata/v4/lead/getLeadStats()
curl http://localhost:4004/odata/v4/opportunity/getPipelineView()
```

## Next Phase
After completing the service layer, proceed to **Phase 3: UI Development** to create Fiori applications that consume these services.
