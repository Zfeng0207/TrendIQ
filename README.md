# TrendIQ CRM (Beauty Leads)

TrendIQ CRM is a unified, analytics-driven CRM for managing the full commercial lifecycle — **leads → prospects → accounts/contacts → opportunities → activities**, with integrated dashboards and campaign + competitor intelligence.

## Live preview (screenshots)

Below is a guided walkthrough of the core CRM flows, in sequence.

### 1) CRM dashboard — KPIs at a glance

High-level operational visibility across pipeline, accounts, activities, and performance indicators.

![CRM dashboard](TrendIQ%20Live%20Preview/crm-dashboard.png)

### 2) CRM dashboard — analytics overview

Drill into key metrics and trends to prioritize actions and identify opportunities.

![CRM dashboard (analytics)](TrendIQ%20Live%20Preview/crm-dashboard-2.png)

### 3) Lead management

Capture, qualify, and track inbound/outbound leads through the pipeline with structured status and scoring fields.

![Lead management](TrendIQ%20Live%20Preview/lead-management.png)

### 4) Lead conversion

Convert qualified leads into downstream records to continue the sales motion seamlessly.

![Lead conversion](TrendIQ%20Live%20Preview/lead-conversion.png)

### 5) Prospects list

Manage qualified prospects with discovery context and prioritization fields for sales follow-up.

![Prospects](TrendIQ%20Live%20Preview/prospects.png)

### 6) Prospect creation

Create prospects with structured discovery source, business type, and scoring to support consistent qualification.

![Prospect creation](TrendIQ%20Live%20Preview/prospect-creation.png)

### 7) Accounts management

Centralize account data, relationships, and operational signals for ongoing customer management.

![Accounts management](TrendIQ%20Live%20Preview/accounts-management.png)

### 8) Accounts status & health

Track account health/risk indicators and operational status to drive proactive retention and growth.

![Accounts status](TrendIQ%20Live%20Preview/accounts-status.png)

### 9) Opportunity management

Manage deals through stages with ownership, value, probability, and planning fields.

![Opportunity management](TrendIQ%20Live%20Preview/opportunity-management.png)

### 10) Deal outlook

Understand deal trajectory and next steps with a focused opportunity view.

![Opportunity deal outlook](TrendIQ%20Live%20Preview/opportunity-deal-outlook.png)

### 11) Marketing campaigns

Plan and execute campaigns with structured targeting and lifecycle management.

![Marketing campaigns](TrendIQ%20Live%20Preview/marketing-campaigns.png)

### 12) Marketing analytics

Measure campaign performance and effectiveness using analytics views.

![Marketing analytics](TrendIQ%20Live%20Preview/marketing-analytics.png)

### 13) Competitor analytics

Monitor competitive signals and insights to support differentiated positioning.

![Competitor analytics](TrendIQ%20Live%20Preview/competitor-analytics.png)

## Quick start

```bash
npm install
npm run watch
```

- Runs the CAP server at `http://localhost:4004`
- Initializes the local SQLite database (`db.sqlite`) and loads seed data from `db/data/*.csv`

## Applications (UI)

- **CRM Dashboard**: `http://localhost:4004/ey-beauty-1/webapp/index.html`
- **Lead Management**: `http://localhost:4004/leads/webapp/index.html`
- **Prospects**: `http://localhost:4004/prospects/webapp/index.html`
- **Accounts**: `http://localhost:4004/accounts/webapp/index.html`
- **Opportunities**: `http://localhost:4004/opportunities/webapp/index.html`
- **Marketing Campaigns**: `http://localhost:4004/campaigns/webapp/index.html`
- **Competitor Analytics**: `http://localhost:4004/competitor-analytics/webapp/index.html`

## Services (OData V4)

- **Lead Service**: `http://localhost:4004/lead/`
- **Account Service**: `http://localhost:4004/account/`
- **Opportunity Service**: `http://localhost:4004/opportunity/`
- **Activity Service**: `http://localhost:4004/activity/`
- **Product Service**: `http://localhost:4004/product/`
- **Workflow Service**: `http://localhost:4004/workflow/`
- **Prospect Service**: `http://localhost:4004/prospect/`
- **Marketing Service**: `http://localhost:4004/marketing/`
- **Dashboard Service**: `http://localhost:4004/dashboard/`

## Development commands

```bash
# Start the dev server (auto-initializes SQLite in db.sqlite)
npm run watch

# Open specific apps
npm run watch-dashboard
npm run watch-leads
npm run watch-accounts
npm run watch-opportunities

# Database utilities
npm run db:deploy   # deploy schema + load db/data/*.csv into db.sqlite
npm run db:reset    # delete db.sqlite (+ wal/shm), then redeploy + reload
```

## Troubleshooting

- If you see errors like `no such table: <Service>_<Entity>`, run `npm run db:deploy`.

## Project docs

For deeper implementation notes, see `PROJECT_STATUS.md` and `docs/`.
