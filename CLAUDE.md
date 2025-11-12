# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **SAP Cloud Application Programming (CAP) model** project for managing beauty product leads. The application tracks leads from various outlets (salons, online stores) on different platforms (Instagram, TikTok) for pitching beauty brands.

**Tech Stack:**
- Backend: SAP CAP with CDS (Core Data Services)
- Frontend: SAPUI5 (SAP Fiori Overview Page template)
- Database: SQLite (dev), with CAP abstraction for production databases
- Runtime: Node.js with Express

## Architecture

### Three-Layer CAP Structure

```
db/                  # Data model layer (CDS schema definitions)
├── schema.cds      # Entity definitions (namespace: beauty.leads)
└── data/           # CSV files for initial/test data

srv/                # Service layer (OData service definitions)
└── service.cds     # LeadService exposing Leads entity

app/                # UI layer (SAPUI5 applications)
└── ey-beauty-1/    # Fiori Overview Page dashboard
    ├── webapp/     # UI5 application code
    └── annotations.cds  # UI annotations for Fiori Elements
```

### Data Model (db/schema.cds)

The core entity is `Leads` in namespace `beauty.leads`:
- Primary key: UUID
- Key fields: outletName, brandToPitch, status, platform, contactEmail, aiScore
- Status values: 'New', 'Contacted', etc.

### Service Layer (srv/service.cds)

`LeadService` exposes a readonly projection of the Leads entity via OData V4 at `/odata/v4/lead/`.

### UI Layer (app/ey-beauty-1)

SAPUI5 Overview Page (OVP) application:
- App ID: `beautydashboard.eybeauty1`
- Template: SAP Fiori Overview Page (analytical archetype)
- Model: `mainModel` connected to LeadService
- Uses MacroFilterBar for global filtering

## Development Commands

### Running the Application

```bash
# Start development server with auto-reload (recommended)
cds watch

# Or via VS Code: Terminal > Run Task > cds watch

# Alternative: Start with specific UI5 app open
npm run watch-ey-beauty-1
# Opens at beautydashboard.eybeauty1/index.html with cache disabled
```

### Service Testing

```bash
# Serve with mock data and in-memory database
cds serve --with-mocks --in-memory
```

### UI5 App Development

```bash
# From app/ey-beauty-1/ directory
npx fiori add deploy-config cf   # Add Cloud Foundry deployment config
```

### Linting

```bash
# ESLint is configured with @sap/cds recommended rules
npx eslint .
```

## Key Development Patterns

### Adding New Entities

1. Define entity in `db/schema.cds` under `beauty.leads` namespace
2. Expose in `srv/service.cds` via projection
3. Add CSV data file in `db/data/` named `beauty.leads-<EntityName>.csv`
4. Annotations for UI in `app/ey-beauty-1/annotations.cds`

### CDS Service Annotations

Services use standard CDS annotations:
- `@readonly` - marks service as read-only
- UI annotations go in app-level `.cds` files

### Workspace Structure

This is a monorepo with workspaces:
- Root `package.json` defines workspaces in `app/*`
- UI5 apps (like ey-beauty-1) have independent `package.json`
- Run `npm install` from root to install all dependencies

## Technology-Specific Notes

### CAP CDS Files

- `.cds` files use CDS Definition Language (not TypeScript/JavaScript)
- `using` statements import other CDS definitions
- Service definitions use `projection on` to expose entities
- Namespace: `beauty.leads` used throughout

### SAPUI5 Overview Page

- Manifest.json defines OData V4 datasource and OVP cards
- Cards configuration in `sap.ovp.cards` (currently empty)
- Global filter operates on Leads entity set
- Uses Fiori Elements templates (no custom controllers needed initially)

### SQLite Development Database

- Configured via `@cap-js/sqlite` devDependency
- CAP automatically creates/updates schema on `cds watch`
- Data seeded from CSV files in `db/data/`

## Service Endpoints

When `cds watch` is running:
- OData service: `http://localhost:4004/odata/v4/lead/`
- Fiori Launchpad: `http://localhost:4004/`
- Service metadata: `http://localhost:4004/odata/v4/lead/$metadata`

## Additional Resources

- SAP CAP documentation: https://cap.cloud.sap/docs/
- SAPUI5 SDK: https://sapui5.hana.ondemand.com/
