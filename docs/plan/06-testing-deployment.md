# Phase 6: Testing & Deployment Guide

## Overview
This phase focuses on comprehensive testing, documentation, performance optimization, and production deployment preparation.

## Duration
**Weeks 7-8** (10 working days)

## Objectives
1. Create comprehensive test scenarios
2. Write user documentation
3. Performance testing and optimization
4. Set up deployment configuration
5. Create migration scripts
6. Prepare demo scenarios
7. Production readiness checklist

## Testing Strategy

### Test Pyramid

```
            E2E Tests (10%)
         Integration Tests (30%)
      Unit Tests (60%)
```

### Test Categories

1. **Unit Tests**: Individual functions and modules
2. **Integration Tests**: Service layer and database interactions
3. **UI Tests**: Fiori Elements applications
4. **E2E Tests**: Complete user journeys
5. **Performance Tests**: Load and stress testing
6. **Security Tests**: Authentication and authorization

## Test Scenarios

### 1. Lead Management Flow

**Scenario**: Complete lead lifecycle from creation to conversion

**Steps**:
1. Create new lead via UI
   - Verify all fields saved correctly
   - Check AI score calculated automatically
   - Confirm sentiment analysis ran

2. Update lead information
   - Modify contact details
   - Add notes
   - Recalculate AI score
   - Verify sentiment updates

3. Assign lead to user
   - Select user from dropdown
   - Verify assignment saved
   - Check notification sent (mock)

4. Convert lead to account
   - Click "Convert to Account" action
   - Verify account created
   - Verify primary contact created
   - Check lead marked as converted
   - Navigate to new account

**Expected Results**:
- Lead status: Converted
- Account exists with same details
- Contact created and marked as primary
- Lead has reference to new account

**Test Data**:
```javascript
const testLead = {
    outletName: "Test Salon",
    contactName: "Test Contact",
    contactEmail: "test@example.com",
    contactPhone: "+60123456789",
    platform: "TikTok",
    brandToPitch: "K-Beauty",
    notes: "Very interested in our products"
};
```

### 2. Opportunity Pipeline Flow

**Scenario**: Move deal through pipeline stages to close

**Steps**:
1. Create opportunity from account
   - Select account
   - Add opportunity details
   - Add products to opportunity
   - Verify total calculated

2. Move through pipeline stages
   - Drag card from Prospecting to Qualification
   - Move to Needs Analysis
   - Move to Proposal
   - Request approval (if discount > 15%)

3. Approval workflow
   - Submit approval request
   - Login as manager
   - View pending approval
   - Approve request
   - Verify opportunity updated

4. Close opportunity
   - Move to Closed Won
   - Verify close date set
   - Check probability = 100%
   - Verify account health score updated

**Expected Results**:
- Opportunity stage: Closed Won
- Probability: 100%
- Actual close date set
- Account health score increased
- Approval status: Approved

### 3. Activity Tracking Flow

**Scenario**: Create and complete activities

**Steps**:
1. Create call activity
   - From account detail page
   - Set subject and description
   - Schedule date/time
   - Assign to user

2. Create meeting activity
   - Link to opportunity
   - Add multiple participants (contacts)
   - Set reminder

3. Complete activities
   - Mark call as completed
   - Add outcome notes
   - Update sentiment

4. View activity timeline
   - Open account page
   - Scroll to activities section
   - Verify all activities shown in chronological order

**Expected Results**:
- Activities created and linked correctly
- Timeline shows all activities
- Completed activities marked
- Sentiment updated on contact

### 4. Product Import Flow

**Scenario**: Bulk import products via CSV

**Steps**:
1. Download CSV template
   - Click "Download Template"
   - Verify file downloaded

2. Prepare CSV file
   - Fill in product data
   - Include some invalid rows (for testing)

3. Upload CSV
   - Select file
   - Click upload
   - View validation results

4. Review and import
   - Check valid rows count
   - Review error list
   - Confirm import
   - Wait for completion

5. Verify products
   - Navigate to product list
   - Search for imported products
   - Verify all fields correct

**Expected Results**:
- Valid products imported successfully
- Invalid rows reported with errors
- Products searchable in system
- All fields populated correctly

**Test CSV**:
```csv
productCode,productName,brand,category,listPrice
TEST001,Test Serum,TestBrand,Skincare,99.90
TEST002,Test Cream,TestBrand,Skincare,149.90
INVALID,,TestBrand,Skincare,abc
```

### 5. AI Features Flow

**Scenario**: Test all AI-powered features

**Steps**:
1. Lead scoring
   - Create lead with high-quality indicators
   - Verify score > 80
   - Create lead with low-quality indicators
   - Verify score < 40

2. Sentiment analysis
   - Add positive notes to lead
   - Verify sentiment = Positive
   - Add negative notes
   - Recalculate
   - Verify sentiment = Negative

3. Trend matching
   - Create lead with trending keywords
   - Verify trend score high
   - Check trending topics highlighted

4. Email generation
   - Click "Generate Email"
   - Verify email draft created
   - Check personalization
   - Verify tone appropriate

**Expected Results**:
- Scores reflect input quality
- Sentiment detected accurately
- Trends matched correctly
- Email drafts personalized

### 6. Dashboard Analytics Flow

**Scenario**: View and filter dashboard

**Steps**:
1. Open dashboard
   - Verify all cards load
   - Check KPI values calculated

2. Apply filters
   - Filter by date range
   - Filter by owner
   - Verify all cards update

3. Navigate from cards
   - Click lead from high priority leads card
   - Verify navigation to lead detail

4. Refresh data
   - Click refresh
   - Verify latest data shown

**Expected Results**:
- All cards display data
- Filters work correctly
- Navigation functions
- Data refreshes

## Automated Test Implementation

### Unit Tests Example

**Location**: `tests/unit/scoring-service.test.js`

```javascript
const scoringService = require('../../srv/mock-ai/scoring-service');
const { expect } = require('chai');

describe('Lead Scoring Service', () => {
    describe('calculateLeadScore', () => {
        it('should return high score for quality lead', async () => {
            const lead = {
                platform: 'TikTok',
                source: 'Referral',
                contactName: 'John Doe',
                contactEmail: 'john@example.com',
                contactPhone: '+60123456789',
                estimatedValue: 50000,
                notes: 'Very interested in our products'
            };

            const score = await scoringService.calculateLeadScore(lead);

            expect(score).to.be.above(70);
            expect(score).to.be.below(101);
        });

        it('should return low score for incomplete lead', async () => {
            const lead = {
                platform: 'Other',
                source: 'Cold'
            };

            const score = await scoringService.calculateLeadScore(lead);

            expect(score).to.be.below(50);
        });
    });
});
```

### Integration Test Example

**Location**: `tests/integration/lead-conversion.test.js`

```javascript
const cds = require('@sap/cds');
const { expect } = require('chai');

describe('Lead Conversion', () => {
    let srv, Leads, Accounts, Contacts;

    before(async () => {
        srv = await cds.connect.to('LeadService');
        Leads = srv.entities.Leads;
        const accountSrv = await cds.connect.to('AccountService');
        Accounts = accountSrv.entities.Accounts;
        Contacts = accountSrv.entities.Contacts;
    });

    it('should convert lead to account', async () => {
        // Create test lead
        const lead = await INSERT.into(Leads).entries({
            outletName: 'Test Salon',
            contactName: 'Test Contact',
            contactEmail: 'test@example.com',
            platform: 'TikTok'
        });

        // Convert lead
        const result = await srv.send({
            method: 'POST',
            path: `/Leads(${lead.ID})/convertToAccount`
        });

        // Verify account created
        const account = await SELECT.one.from(Accounts).where({ ID: result.ID });
        expect(account).to.exist;
        expect(account.accountName).to.equal('Test Salon');

        // Verify contact created
        const contacts = await SELECT.from(Contacts).where({ account_ID: account.ID });
        expect(contacts).to.have.lengthOf(1);
        expect(contacts[0].isPrimary).to.be.true;

        // Verify lead marked as converted
        const updatedLead = await SELECT.one.from(Leads).where({ ID: lead.ID });
        expect(updatedLead.converted).to.be.true;
        expect(updatedLead.convertedTo_ID).to.equal(account.ID);
    });
});
```

### E2E Test Example

**Location**: `tests/e2e/lead-to-opportunity.test.js`

```javascript
const { chromium } = require('playwright');
const { expect } = require('chai');

describe('Lead to Opportunity E2E', () => {
    let browser, page;

    before(async () => {
        browser = await chromium.launch();
        page = await browser.newPage();
    });

    after(async () => {
        await browser.close();
    });

    it('should create lead, convert to account, create opportunity', async () => {
        // Navigate to leads app
        await page.goto('http://localhost:4004/leads/index.html');

        // Create lead
        await page.click('button:has-text("Create")');
        await page.fill('input[id*="outletName"]', 'E2E Test Salon');
        await page.fill('input[id*="contactEmail"]', 'e2e@test.com');
        await page.click('button:has-text("Save")');

        // Wait for save
        await page.waitForSelector('text=E2E Test Salon');

        // Convert to account
        await page.click('text=E2E Test Salon');
        await page.click('button:has-text("Convert to Account")');
        await page.click('button:has-text("Confirm")');

        // Verify navigation to account
        await page.waitForURL('**/accounts/**');
        const accountName = await page.textContent('h1');
        expect(accountName).to.include('E2E Test Salon');

        // Create opportunity
        await page.click('button:has-text("Create Opportunity")');
        await page.fill('input[id*="name"]', 'E2E Test Deal');
        await page.fill('input[id*="amount"]', '50000');
        await page.click('button:has-text("Save")');

        // Verify opportunity created
        await page.waitForSelector('text=E2E Test Deal');
    });
});
```

## Performance Testing

### Load Testing Script

**Location**: `tests/performance/load-test.js`

```javascript
const autocannon = require('autocannon');

// Test lead creation endpoint
const instance = autocannon({
    url: 'http://localhost:4004/odata/v4/lead/Leads',
    connections: 10,
    duration: 30,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        outletName: 'Load Test Salon',
        platform: 'TikTok',
        contactEmail: 'loadtest@example.com'
    })
}, (err, result) => {
    console.log('Load test results:');
    console.log(`Requests: ${result.requests.total}`);
    console.log(`Throughput: ${result.throughput.average} req/sec`);
    console.log(`Latency: ${result.latency.mean}ms`);
});

autocannon.track(instance);
```

### Performance Targets

| Operation | Target | Acceptable |
|-----------|--------|-----------|
| Lead creation | < 200ms | < 500ms |
| Account creation | < 300ms | < 800ms |
| Opportunity update | < 250ms | < 600ms |
| AI scoring | < 50ms | < 100ms |
| Dashboard load | < 1s | < 2s |
| List page (50 items) | < 500ms | < 1s |

## User Documentation

### 1. User Guide

**Location**: `docs/user-guide.md`

**Contents**:
- Getting Started
- Lead Management
  - Creating leads
  - Qualifying leads
  - Converting to accounts
- Account Management
  - Managing accounts
  - Adding contacts
  - Tracking activities
- Opportunity Management
  - Creating opportunities
  - Managing pipeline
  - Requesting approvals
- Product Management
  - Browsing catalog
  - Importing products
- Dashboard & Analytics
  - Understanding KPIs
  - Using filters
- Tips & Best Practices

### 2. Administrator Guide

**Location**: `docs/admin-guide.md`

**Contents**:
- Installation & Setup
- User Management
- System Configuration
- Data Import
- Backup & Recovery
- Troubleshooting
- Performance Monitoring

### 3. API Documentation

**Location**: `docs/api-reference.md`

**Contents**:
- OData Services
- AI Services API
- Authentication
- Error Handling
- Code Examples

## Deployment Configuration

### Development Environment

**File**: `.env.development`

```env
NODE_ENV=development
PORT=4004
DB_TYPE=sqlite
DB_FILE=beauty-crm.db
LOG_LEVEL=debug
AI_PROVIDER=mock
ENABLE_MOCK_DATA=true
```

### Production Environment

**File**: `.env.production`

```env
NODE_ENV=production
PORT=8080
DB_TYPE=hana
DB_HOST=your-hana-instance.hanacloud.ondemand.com
DB_PORT=443
DB_USER=your-db-user
DB_PASSWORD=your-db-password
LOG_LEVEL=info
AI_PROVIDER=databricks
DATABRICKS_HOST=your-databricks-instance.cloud.databricks.com
DATABRICKS_TOKEN=your-token
ENABLE_MOCK_DATA=false
```

### Cloud Foundry Deployment

**File**: `manifest.yml`

```yaml
---
applications:
- name: beauty-crm
  memory: 512M
  instances: 2
  buildpack: nodejs_buildpack
  command: npm start
  services:
    - beauty-crm-hana
    - beauty-crm-xsuaa
  env:
    NODE_ENV: production
    LOG_LEVEL: info
```

### Docker Deployment

**File**: `Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Build (if needed)
# RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]
```

**File**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "4004:4004"
    environment:
      - NODE_ENV=production
      - DB_TYPE=postgres
      - DB_HOST=db
      - DB_PORT=5432
      - DB_USER=crm
      - DB_PASSWORD=password
      - DB_NAME=beautycrm
    depends_on:
      - db

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=crm
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=beautycrm
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

## Migration Scripts

### SQLite to HANA Migration

**File**: `scripts/migrate-to-hana.js`

```javascript
const cds = require('@sap/cds');
const fs = require('fs');

async function migrate() {
    console.log('Starting migration from SQLite to HANA...');

    // Connect to SQLite source
    const sqliteDb = await cds.connect.to({
        kind: 'sqlite',
        credentials: { database: 'beauty-crm.db' }
    });

    // Connect to HANA target
    const hanaDb = await cds.connect.to({
        kind: 'hana',
        credentials: {
            host: process.env.HANA_HOST,
            port: process.env.HANA_PORT,
            user: process.env.HANA_USER,
            password: process.env.HANA_PASSWORD
        }
    });

    // Migrate each entity
    const entities = [
        'beauty.leads.Leads',
        'beauty.crm.Accounts',
        'beauty.crm.Contacts',
        'beauty.crm.Opportunities',
        'beauty.crm.Activities',
        'beauty.crm.Products',
        'beauty.crm.Users'
    ];

    for (const entity of entities) {
        console.log(`Migrating ${entity}...`);

        const data = await sqliteDb.run(SELECT.from(entity));
        console.log(`Found ${data.length} records`);

        if (data.length > 0) {
            await hanaDb.run(INSERT.into(entity).entries(data));
            console.log(`Migrated ${data.length} records`);
        }
    }

    console.log('Migration completed successfully');
}

migrate().catch(console.error);
```

## Demo Scenarios

### Demo 1: Sales Manager Daily Workflow

**Persona**: Alex, Regional Sales Manager

**Scenario**: Morning routine checking pipeline and taking action

1. **Open Dashboard**
   - Review KPIs (leads, opportunities, revenue)
   - Check pending approvals
   - Identify high-priority leads

2. **Review High-Priority Leads**
   - Click on top lead (AI score 92)
   - Review details and AI insights
   - Assign to sales rep
   - Generate and send intro email

3. **Approve Discount Request**
   - Navigate to approvals inbox
   - Review discount request (20%)
   - Check opportunity details
   - Approve with comment

4. **Check Pipeline**
   - Open deals Kanban board
   - Review all stages
   - Identify stuck deal
   - Add follow-up task

5. **Generate Reports**
   - View monthly forecast
   - Check conversion rates
   - Export data for presentation

### Demo 2: Sales Rep Lead Qualification

**Persona**: Sarah, Sales Representative

**Scenario**: Qualifying and converting a new lead

1. **Receive Lead Assignment**
   - Check notifications
   - Open assigned lead
   - Review AI score and insights

2. **Research Lead**
   - Check social media links
   - Review trending topics match
   - Read AI-generated summary

3. **First Contact**
   - Use AI-generated email template
   - Customize and send
   - Log activity

4. **Follow-up Call**
   - Schedule call activity
   - Make call
   - Complete activity with notes
   - Update sentiment

5. **Convert to Account**
   - Click convert action
   - Review generated account
   - Add additional contacts
   - Create first opportunity

## Production Readiness Checklist

### Security
- [ ] Authentication configured
- [ ] Authorization rules tested
- [ ] HTTPS enabled
- [ ] Sensitive data encrypted
- [ ] Input validation implemented
- [ ] SQL injection prevented
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented

### Performance
- [ ] Database indexes created
- [ ] Query optimization done
- [ ] Caching implemented
- [ ] CDN configured for static assets
- [ ] Lazy loading enabled
- [ ] Bundle size optimized
- [ ] Load testing passed

### Reliability
- [ ] Error handling comprehensive
- [ ] Logging configured
- [ ] Health check endpoint created
- [ ] Backup strategy defined
- [ ] Disaster recovery plan documented
- [ ] Monitoring alerts configured

### Compliance
- [ ] Data privacy compliant (GDPR/PDPA)
- [ ] Terms of service created
- [ ] Privacy policy published
- [ ] Cookie consent implemented
- [ ] Data retention policy defined

### Documentation
- [ ] User guide complete
- [ ] Admin guide complete
- [ ] API documentation complete
- [ ] Deployment guide complete
- [ ] Troubleshooting guide complete
- [ ] Release notes prepared

### Operations
- [ ] CI/CD pipeline configured
- [ ] Automated tests passing
- [ ] Deployment scripts tested
- [ ] Rollback procedure documented
- [ ] Support process defined
- [ ] Escalation path clear

## Monitoring & Observability

### Health Check Endpoint

**File**: `srv/health.js`

```javascript
module.exports = (app) => {
    app.get('/health', async (req, res) => {
        const health = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            services: {
                database: 'ok',
                ai: 'ok'
            }
        };

        try {
            // Check database
            await cds.run('SELECT 1');
        } catch (error) {
            health.status = 'error';
            health.services.database = 'error';
        }

        res.status(health.status === 'ok' ? 200 : 503).json(health);
    });
};
```

### Logging Configuration

**File**: `srv/logger.js`

```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

module.exports = logger;
```

## Post-Deployment Tasks

1. **Week 1**
   - Monitor error logs
   - Track performance metrics
   - Gather user feedback
   - Fix critical issues

2. **Week 2-4**
   - Analyze usage patterns
   - Optimize slow queries
   - Enhance documentation
   - Implement quick wins

3. **Month 2-3**
   - Plan enhancements
   - Gather feature requests
   - Assess AI accuracy
   - Plan Databricks migration

## Success Metrics

### Technical Metrics
- Uptime: > 99.5%
- Response time: < 500ms (p95)
- Error rate: < 0.1%
- Test coverage: > 80%

### Business Metrics
- User adoption: > 80% of sales team
- Lead conversion rate: Track improvement
- Time to close deals: Track reduction
- User satisfaction: > 4/5 rating

## Next Steps After Deployment

1. **User Training**
   - Conduct training sessions
   - Create video tutorials
   - Establish support channel

2. **Continuous Improvement**
   - Regular feedback sessions
   - Monthly enhancement releases
   - Quarterly feature reviews

3. **AI Enhancement**
   - Collect real data for training
   - Tune scoring algorithms
   - Plan Databricks integration

4. **Integration Expansion**
   - SAP S/4HANA integration
   - Email service integration
   - Calendar integration
   - SAP Work Zone integration

This completes the implementation plan for the Smart Beauty CRM. The system is designed to be deployed incrementally, tested thoroughly, and enhanced continuously based on user feedback and business needs.
