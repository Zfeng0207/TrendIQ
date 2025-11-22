# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Smart Beauty CRM** - A comprehensive SAP Cloud Application Programming (CAP) model project for managing beauty product leads, customer accounts, sales opportunities, and marketing campaigns. The application tracks leads from various outlets (salons, online stores) across different platforms (Instagram, TikTok) and includes AI-powered insights for lead scoring and trend analysis.

**Tech Stack:**
- Backend: SAP CAP v9 with CDS (Core Data Services)
- Frontend: SAPUI5 v1.120 (Fiori Elements)
- Database: SQLite (dev, in-memory), HANA (production)
- Runtime: Node.js with Express
- OData: V4 protocol

## Architecture Overview

### Three-Layer CAP Structure

```
db/
├── schema.cds          # Leads entity (beauty.leads namespace)
├── crm-schema.cds      # CRM entities (beauty.crm namespace)
├── aspects.cds         # Reusable aspects (Address, AIInsights, etc.)
└── data/               # CSV seed data (beauty.crm-*, beauty.leads-*)

srv/
├── service.cds         # Service aggregator (imports all services)
├── server.js           # Custom server logic
└── services/           # Individual service definitions
    ├── lead-service.cds & .js
    ├── account-service.cds & .js
    ├── opportunity-service.cds & .js
    ├── activity-service.cds & .js
    ├── product-service.cds & .js
    ├── workflow-service.cds & .js
    ├── merchant-service.cds & .js
    ├── marketing-service.cds & .js
    └── *-annotations.cds files (UI annotations for each service)

app/
├── ey-beauty-1/        # Overview Page Dashboard (beautydashboard.eybeauty1)
├── leads/              # Lead Management (beautyleads.leads)
├── accounts/           # Account Management (beautyleads.accounts)
├── opportunities/      # Opportunity Management (beautyleads.opportunities)
├── merchants/          # Merchant Discovery
├── campaigns/          # Marketing Campaigns
└── appconfig/          # Fiori Launchpad configuration
```

### Key Entities

**Core CRM Entities** (namespace: `beauty.crm`):
- `Accounts` - Customer companies, salons, retailers (with health scoring)
- `Contacts` - Individual people associated with accounts
- `Opportunities` - Sales pipeline tracking (with AI win predictions)
- `Activities` - Interactions and tasks (calls, emails, meetings)
- `Products` - Product catalog (with trend scoring)
- `Users` - System users (sales reps, managers)
- `Approvals` - Discount and deal approval workflows
- `MerchantDiscovery` - AI-discovered merchants from web scraping
- `MarketingCampaigns` - Trend-driven marketing automation

**Lead Entity** (namespace: `beauty.leads`):
- `Leads` - Lead tracking with AI scoring and conversion to accounts

### Service Layer Architecture

Each service follows this pattern:
1. **Service Definition** (`*-service.cds`): OData projections and actions
2. **Service Handler** (`*-service.js`): Business logic in Node.js
3. **UI Annotations** (`*-annotations.cds`): Fiori Elements UI metadata

**OData Service Endpoints** (when `cds watch` runs on port 4004):
- `/lead/` - LeadService
- `/account/` - AccountService
- `/opportunity/` - OpportunityService
- `/activity/` - ActivityService
- `/product/` - ProductService
- `/workflow/` - WorkflowService
- `/merchant/` - MerchantService
- `/marketing/` - MarketingService

## Development Commands

```bash
# Start development server with auto-reload (recommended)
npm run watch
# Opens at http://localhost:4004/

# Start with specific UI5 app open
npm run watch-launchpad      # Overview dashboard
npm run watch-leads          # Lead management app
npm run watch-accounts       # Account management app
npm run watch-opportunities  # Opportunity management app
npm run watch-merchants      # Merchant discovery app
npm run watch-campaigns      # Marketing campaigns app
```

### Testing & Deployment

```bash
# Serve with mock data
cds serve --with-mocks --in-memory

# Linting
npx eslint .

# Deploy to Cloud Foundry (requires cf CLI and MTA tools)
npm run build
npm run deploy
```

## Key Development Patterns

### Adding New Entities

1. Define entity in `db/crm-schema.cds` (or create new schema file)
2. Create CSV data file: `db/data/beauty.crm-<EntityName>.csv`
3. Expose via service: Add projection in `srv/services/<service>.cds`
4. Add business logic: Implement handlers in `srv/services/<service>.js`
5. Add UI annotations: Create/update `srv/services/<service>-annotations.cds`
6. Register in UI app: Update `manifest.json` datasource if needed

### Important Schema Constraints

**CRITICAL**: Always verify field names match the actual entity schema before adding annotations. Recent issues:
- Leads entity does **not** have `currency` or `productCategory` fields
- Accounts use `title` not `jobTitle` for contacts
- Opportunities use `name` not `opportunityName`

See `LEAD_SERVICE_FIXES.md` for detailed troubleshooting examples.

### Using Aspects for Reusability

Common patterns are defined in `db/aspects.cds`:
- `Address` - address, city, state, country, postalCode
- `AIInsights` - aiScore, sentimentScore, sentimentLabel, trendScore
- `ContactInfo` - email, phone, mobile
- `SocialMedia` - instagram, tiktok, facebook, linkedin handles
- `Financial` - amount, currency, discountPercent, discountAmount

Example usage:
```cds
entity MyEntity : managed, cuid, aspects.Address, aspects.AIInsights {
    // Your custom fields here
}
```

### Service Actions

Services can expose custom actions on entities:

```cds
entity Leads as projection on leads.Leads actions {
    action convertToAccount();
    action updateAIScore();
};
```

Implement in corresponding `.js` handler:
```javascript
this.on('convertToAccount', 'Leads', async (req) => {
    const leadID = req.params[0].ID;
    // Implementation...
});
```

## Technology-Specific Notes

### CAP CDS Files

- `.cds` files use CDS Definition Language (not TypeScript/JavaScript)
- `using` statements import other CDS definitions or external vocabularies
- Services use `projection on` to expose entity views
- Annotations prefix: `@title`, `@readonly`, `@assert.enum`, `@Measures.ISOCurrency`
- Use `managed` for automatic createdAt/modifiedAt, `cuid` for UUID keys

### SAPUI5 Applications

**Overview Page (ey-beauty-1)**:
- Template: SAP Fiori Overview Page (OVP)
- Connects to multiple services for dashboard cards
- No custom controllers needed (annotation-driven)

**List Report / Object Page Apps**:
- Template: SAP Fiori Elements List Report
- Manifest defines OData V4 datasources
- UI behavior controlled via annotations (FieldGroups, SelectionFields, LineItems)
- Custom logic via extensions (see `app/merchants/webapp/ext/`)

### Database & Data Seeding

- **Development**: In-memory SQLite (configured in `package.json` cds.requires)
- **Production**: HANA database
- CSV files in `db/data/` auto-seed on `cds watch`
- File naming: `<namespace>-<EntityName>.csv` (e.g., `beauty.crm-Accounts.csv`)
- CAP auto-creates/updates schema on startup

### Workspace Structure

This is an npm workspace monorepo:
- Root `package.json` defines `workspaces: ["app/*"]`
- Each UI5 app has independent `package.json`
- Run `npm install` from root to install all dependencies
- UI5 apps defined in `sapux` array for Fiori tools

## Service Implementation Details

### Lead Service

**Path**: `/lead/`
**Key Features**:
- Lead CRUD operations
- `convertToAccount()` action - Creates Account + Contact from qualified lead
- `updateAIScore()` action - Recalculates AI scoring
- Analytical views: `LeadsByStatus`, `LeadsBySource`, `HotLeads`

### Account Service

**Path**: `/account/`
**Key Features**:
- Account and Contact management
- Health scoring and risk assessment
- Associated opportunities and activities
- Account hierarchy (parent/child accounts)

### Opportunity Service

**Path**: `/opportunity/`
**Key Features**:
- Sales pipeline stages (Prospecting → Closed Won/Lost)
- Win probability calculation
- Approval workflow integration
- Multi-product opportunities via OpportunityProducts junction table

## Common Issues & Troubleshooting

### Annotation Errors

**Symptom**: "Failed to drill-down" or "invalid segment" errors in browser console

**Cause**: Annotations reference fields that don't exist in entity schema

**Fix**:
1. Check entity definition in `db/schema.cds` or `db/crm-schema.cds`
2. Remove references to non-existent fields in `srv/services/*-annotations.cds`
3. For currency fields, either add to schema or use simple title (e.g., "Amount (MYR)")

### Server Won't Start

**Symptom**: Port 4004 already in use

**Fix**:
```bash
lsof -ti:4004 | xargs kill -9
npm run watch
```

### UI5 App Not Loading

**Check**:
1. Service endpoint accessible: `http://localhost:4004/<service>/`
2. Metadata loads: `http://localhost:4004/<service>/$metadata`
3. Browser console for OData errors
4. Manifest.json datasource URI matches service path

## AI Features

The CRM includes mock AI algorithms for:
- **Lead Scoring** (`aiScore`): Sentiment + trend analysis (0-100)
- **Account Health** (`healthScore`): Risk assessment (0-100)
- **Opportunity Win Probability** (`probability`, `aiWinScore`): Stage-based predictions
- **Sentiment Analysis** (`sentimentScore`, `sentimentLabel`): -100 to +100 scale
- **Product Trend Scoring** (`trendScore`, `isTrending`): Market trend detection

Implement real AI by replacing mock logic in `srv/services/*-service.js` handlers.

## Additional Resources

- **SAP CAP Documentation**: https://cap.cloud.sap/docs/
- **SAPUI5 SDK**: https://sapui5.hana.ondemand.com/
- **Project Status**: See `README.md` for current system status and quick start guide
