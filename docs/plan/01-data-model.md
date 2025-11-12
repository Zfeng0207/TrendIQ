# Phase 1: Data Model Foundation

## Overview
This phase establishes the complete data model for the Smart Beauty CRM by expanding the existing `Leads` entity and creating 7 new core entities with proper relationships, associations, and managed aspects.

## Duration
**Weeks 1-2** (10 working days)

## Objectives
1. Enhance existing Leads entity with additional fields
2. Create new entities for Accounts, Contacts, Opportunities, Activities, Products, Users, and Approvals
3. Define relationships and associations between entities
4. Implement managed aspects for audit trails
5. Create comprehensive sample data (CSV files)
6. Add reusable CDS aspects

## Namespace Strategy

**Current**: `beauty.leads`
**New Primary**: `beauty.crm`

**Rationale**:
- Keep `beauty.leads.Leads` for backward compatibility
- Move new entities to `beauty.crm` namespace
- Create associations across namespaces

## Entity Specifications

### 1. Enhanced Leads Entity (beauty.leads)

**Purpose**: Capture and qualify potential customers from external sources (social media, web forms, etc.)

**File**: `db/schema.cds`

```cds
namespace beauty.leads;

using { beauty.crm as crm } from './crm-schema';
using { managed, cuid } from '@sap/cds/common';

entity Leads : managed, cuid {
    // Existing fields (enhanced)
    outletName     : String(200) @title: 'Outlet Name';
    brandToPitch   : String(100) @title: 'Brand to Pitch';
    status         : String(20) @title: 'Status' default 'New';
    platform       : String(50) @title: 'Platform';
    contactEmail   : String(200) @title: 'Contact Email';
    aiScore        : Integer @title: 'AI Score';

    // New fields
    contactName    : String(200) @title: 'Contact Name';
    contactPhone   : String(50) @title: 'Contact Phone';
    address        : String(500) @title: 'Address';
    city           : String(100) @title: 'City';
    country        : String(100) @title: 'Country' default 'Malaysia';

    // Lead qualification
    source         : String(100) @title: 'Lead Source';  // Web, Social, Referral, Import
    sourceDetail   : String(500) @title: 'Source Details';
    leadQuality    : String(20) @title: 'Quality' default 'Medium';  // Hot, Warm, Cold, Medium
    estimatedValue : Decimal(15,2) @title: 'Estimated Value (RM)';

    // Assignment & ownership
    assignedTo     : Association to crm.Users @title: 'Assigned To';
    owner          : Association to crm.Users @title: 'Owner';

    // Conversion tracking
    converted      : Boolean default false @title: 'Converted';
    convertedDate  : DateTime @title: 'Conversion Date';
    convertedTo    : Association to crm.Accounts @title: 'Converted to Account';

    // Notes and engagement
    notes          : LargeString @title: 'Notes';
    lastContactDate: DateTime @title: 'Last Contact';
    nextFollowUp   : DateTime @title: 'Next Follow-up';

    // AI-enhanced fields
    sentimentScore : Integer @title: 'Sentiment Score';  // -100 to +100
    sentimentLabel : String(20) @title: 'Sentiment';     // Positive, Neutral, Negative
    trendingTopics : String(500) @title: 'Trending Topics';
    recommendedAction: String(1000) @title: 'AI Recommendation';
}
```

**Status Values**: New, Contacted, Qualified, Nurturing, Converted, Lost, Archived

### 2. Accounts Entity (beauty.crm)

**Purpose**: Master data for customer companies, salons, retailers, distributors

**File**: `db/crm-schema.cds` (new file)

```cds
namespace beauty.crm;

using { managed, cuid } from '@sap/cds/common';

entity Accounts : managed, cuid {
    // Basic information
    accountName    : String(200) not null @title: 'Account Name';
    accountType    : String(50) @title: 'Account Type';  // Salon, Retailer, Distributor, E-commerce
    industry       : String(100) @title: 'Industry';
    website        : String(300) @title: 'Website';

    // Contact information
    phone          : String(50) @title: 'Phone';
    email          : String(200) @title: 'Email';
    address        : String(500) @title: 'Address';
    city           : String(100) @title: 'City';
    state          : String(100) @title: 'State';
    country        : String(100) @title: 'Country' default 'Malaysia';
    postalCode     : String(20) @title: 'Postal Code';

    // Business information
    establishedYear: Integer @title: 'Established Year';
    employeeCount  : Integer @title: 'Number of Employees';
    annualRevenue  : Decimal(15,2) @title: 'Annual Revenue (RM)';

    // Social media
    instagramHandle: String(100) @title: 'Instagram';
    tiktokHandle   : String(100) @title: 'TikTok';
    facebookPage   : String(200) @title: 'Facebook';

    // Account hierarchy
    parentAccount  : Association to Accounts @title: 'Parent Account';
    childAccounts  : Composition of many Accounts on childAccounts.parentAccount = $self;

    // Account management
    status         : String(20) @title: 'Status' default 'Active';  // Active, Inactive, Prospect
    accountOwner   : Association to Users @title: 'Account Owner';
    accountManager : Association to Users @title: 'Account Manager';
    accountTier    : String(20) @title: 'Account Tier';  // Platinum, Gold, Silver, Bronze

    // Health & scoring
    healthScore    : Integer @title: 'Account Health Score';  // 0-100
    riskLevel      : String(20) @title: 'Risk Level';  // Low, Medium, High, Critical

    // Financial
    creditLimit    : Decimal(15,2) @title: 'Credit Limit (RM)';
    paymentTerms   : String(50) @title: 'Payment Terms';

    // Relationships
    contacts       : Composition of many Contacts on contacts.account = $self;
    opportunities  : Composition of many Opportunities on opportunities.account = $self;
    activities     : Association to many Activities on activities.relatedAccount = $self;

    // Notes
    description    : LargeString @title: 'Description';
    notes          : LargeString @title: 'Notes';
}
```

**Account Types**: Salon, Spa, Retailer, Distributor, E-commerce, Influencer, Chain

### 3. Contacts Entity (beauty.crm)

**Purpose**: Individual people associated with accounts

```cds
entity Contacts : managed, cuid {
    // Basic information
    firstName      : String(100) @title: 'First Name';
    lastName       : String(100) @title: 'Last Name';
    fullName       : String(200) @title: 'Full Name';
    title          : String(50) @title: 'Job Title';
    department     : String(100) @title: 'Department';

    // Contact information
    email          : String(200) @title: 'Email';
    phone          : String(50) @title: 'Phone';
    mobile         : String(50) @title: 'Mobile';

    // Social media
    instagramHandle: String(100) @title: 'Instagram';
    tiktokHandle   : String(100) @title: 'TikTok';
    linkedinProfile: String(200) @title: 'LinkedIn';

    // Account relationship
    account        : Association to Accounts not null @title: 'Account';
    isPrimary      : Boolean default false @title: 'Primary Contact';

    // Contact preferences
    preferredChannel: String(50) @title: 'Preferred Channel';  // Email, WhatsApp, Phone, Instagram
    language       : String(50) @title: 'Language' default 'English';
    timezone       : String(50) @title: 'Timezone';

    // Contact management
    status         : String(20) @title: 'Status' default 'Active';
    owner          : Association to Users @title: 'Contact Owner';

    // Engagement tracking
    lastContactDate: DateTime @title: 'Last Contact';
    engagementScore: Integer @title: 'Engagement Score';  // 0-100

    // AI insights
    sentimentScore : Integer @title: 'Sentiment Score';  // -100 to +100
    sentimentLabel : String(20) @title: 'Sentiment';
    interests      : String(500) @title: 'Interests';

    // Relationships
    activities     : Association to many Activities on activities.relatedContact = $self;

    // Notes
    notes          : LargeString @title: 'Notes';
}
```

### 4. Opportunities (Deals) Entity (beauty.crm)

**Purpose**: Track sales pipeline and deals

```cds
entity Opportunities : managed, cuid {
    // Basic information
    name           : String(200) not null @title: 'Opportunity Name';
    description    : LargeString @title: 'Description';

    // Account relationship
    account        : Association to Accounts not null @title: 'Account';
    primaryContact : Association to Contacts @title: 'Primary Contact';

    // Pipeline stage
    stage          : String(50) @title: 'Stage' default 'Prospecting';
    probability    : Integer @title: 'Win Probability (%)';

    // Financial
    amount         : Decimal(15,2) @title: 'Amount (RM)';
    expectedRevenue: Decimal(15,2) @title: 'Expected Revenue (RM)';

    // Dates
    closeDate      : Date @title: 'Expected Close Date';
    actualCloseDate: Date @title: 'Actual Close Date';

    // Products
    products       : Composition of many OpportunityProducts on products.opportunity = $self;

    // Ownership
    owner          : Association to Users @title: 'Opportunity Owner';

    // Competition & strategy
    competitors    : String(500) @title: 'Competitors';
    winStrategy    : LargeString @title: 'Win Strategy';

    // Discounts & approvals
    discountPercent: Decimal(5,2) @title: 'Discount (%)';
    discountAmount : Decimal(15,2) @title: 'Discount Amount (RM)';
    requiresApproval: Boolean default false @title: 'Requires Approval';
    approval       : Association to Approvals @title: 'Approval';

    // Tracking
    lostReason     : String(500) @title: 'Lost Reason';

    // AI predictions
    aiWinScore     : Integer @title: 'AI Win Score';  // 0-100
    aiRecommendation: LargeString @title: 'AI Recommendation';

    // Relationships
    activities     : Association to many Activities on activities.relatedOpportunity = $self;

    // Notes
    notes          : LargeString @title: 'Notes';
}
```

**Pipeline Stages**: Prospecting, Qualification, Needs Analysis, Proposal, Negotiation, Closed Won, Closed Lost

### 5. Activities Entity (beauty.crm)

**Purpose**: Track all interactions and tasks

```cds
entity Activities : managed, cuid {
    // Basic information
    subject        : String(200) not null @title: 'Subject';
    description    : LargeString @title: 'Description';
    activityType   : String(50) @title: 'Activity Type';  // Call, Email, Meeting, Task, Note

    // Status & priority
    status         : String(20) @title: 'Status' default 'Planned';  // Planned, Completed, Cancelled
    priority       : String(20) @title: 'Priority' default 'Medium';  // High, Medium, Low

    // Dates & duration
    startDateTime  : DateTime @title: 'Start Date/Time';
    endDateTime    : DateTime @title: 'End Date/Time';
    durationMinutes: Integer @title: 'Duration (Minutes)';
    completedDate  : DateTime @title: 'Completed Date';

    // Relationships
    relatedAccount : Association to Accounts @title: 'Related Account';
    relatedContact : Association to Contacts @title: 'Related Contact';
    relatedOpportunity: Association to Opportunities @title: 'Related Opportunity';

    // Ownership
    assignedTo     : Association to Users @title: 'Assigned To';
    owner          : Association to Users @title: 'Owner';

    // Communication details (for emails/calls)
    direction      : String(20) @title: 'Direction';  // Inbound, Outbound
    outcome        : String(200) @title: 'Outcome';

    // Task details (if activity is a task)
    dueDate        : Date @title: 'Due Date';
    reminderDate   : DateTime @title: 'Reminder Date';

    // AI insights
    sentimentScore : Integer @title: 'Sentiment Score';
    keyPoints      : LargeString @title: 'Key Points';

    // Notes
    notes          : LargeString @title: 'Notes';
}
```

**Activity Types**: Call, Email, Meeting, Task, Note, Demo, Presentation, Follow-up

### 6. Products Entity (beauty.crm)

**Purpose**: Catalog of beauty products and brands

```cds
entity Products : managed, cuid {
    // Basic information
    productCode    : String(50) not null @title: 'Product Code';
    productName    : String(200) not null @title: 'Product Name';
    description    : LargeString @title: 'Description';

    // Categorization
    brand          : String(100) @title: 'Brand';
    category       : String(100) @title: 'Category';  // Skincare, Makeup, Haircare, Fragrance
    subCategory    : String(100) @title: 'Sub-Category';

    // Product details
    productType    : String(50) @title: 'Type';  // Product, Service, Bundle
    size           : String(50) @title: 'Size/Volume';
    unit           : String(20) @title: 'Unit';

    // Pricing
    listPrice      : Decimal(15,2) @title: 'List Price (RM)';
    cost           : Decimal(15,2) @title: 'Cost (RM)';
    currency       : String(10) @title: 'Currency' default 'MYR';

    // Availability
    status         : String(20) @title: 'Status' default 'Active';  // Active, Inactive, Discontinued
    inStock        : Boolean default true @title: 'In Stock';
    stockQuantity  : Integer @title: 'Stock Quantity';

    // Marketing
    isPromoted     : Boolean default false @title: 'Promoted';
    isTrending     : Boolean default false @title: 'Trending';
    trendScore     : Integer @title: 'Trend Score';  // 0-100

    // Product hierarchy
    parentProduct  : Association to Products @title: 'Parent Product';

    // Notes
    notes          : LargeString @title: 'Notes';
}
```

**Categories**: Skincare, Makeup, Haircare, Fragrance, Tools, Supplements, Services

### 7. OpportunityProducts Entity (beauty.crm)

**Purpose**: Junction table for products in opportunities

```cds
entity OpportunityProducts : cuid {
    opportunity    : Association to Opportunities not null;
    product        : Association to Products not null;

    quantity       : Integer @title: 'Quantity';
    unitPrice      : Decimal(15,2) @title: 'Unit Price (RM)';
    discount       : Decimal(5,2) @title: 'Discount (%)';
    totalPrice     : Decimal(15,2) @title: 'Total Price (RM)';

    notes          : String(500) @title: 'Notes';
}
```

### 8. Users Entity (beauty.crm)

**Purpose**: Sales reps, managers, and system users

```cds
entity Users : managed, cuid {
    // Basic information
    userID         : String(100) not null @title: 'User ID';
    email          : String(200) not null @title: 'Email';
    firstName      : String(100) @title: 'First Name';
    lastName       : String(100) @title: 'Last Name';
    fullName       : String(200) @title: 'Full Name';

    // Role & position
    role           : String(50) @title: 'Role';  // Sales Rep, Manager, Admin
    title          : String(100) @title: 'Job Title';
    department     : String(100) @title: 'Department';

    // Contact
    phone          : String(50) @title: 'Phone';
    mobile         : String(50) @title: 'Mobile';

    // Territory
    territory      : String(100) @title: 'Territory';
    region         : String(100) @title: 'Region';

    // Management hierarchy
    manager        : Association to Users @title: 'Manager';

    // Status
    status         : String(20) @title: 'Status' default 'Active';  // Active, Inactive
    isActive       : Boolean default true @title: 'Active';

    // Performance
    quota          : Decimal(15,2) @title: 'Sales Quota (RM)';

    // Notes
    notes          : LargeString @title: 'Notes';
}
```

### 9. Approvals Entity (beauty.crm)

**Purpose**: Track approval workflows for discounts and deals

```cds
entity Approvals : managed, cuid {
    // Reference
    opportunityID  : Association to Opportunities @title: 'Opportunity';

    // Approval details
    approvalType   : String(50) @title: 'Approval Type';  // Discount, Price Override, Special Terms
    requestedBy    : Association to Users @title: 'Requested By';
    approver       : Association to Users @title: 'Approver';

    // Request information
    requestDate    : DateTime @title: 'Request Date';
    requestReason  : LargeString @title: 'Reason for Request';
    requestedAmount: Decimal(15,2) @title: 'Requested Amount (RM)';
    requestedDiscount: Decimal(5,2) @title: 'Requested Discount (%)';

    // Status & decision
    status         : String(20) @title: 'Status' default 'Pending';  // Pending, Approved, Rejected, Cancelled
    decision       : String(20) @title: 'Decision';
    decisionDate   : DateTime @title: 'Decision Date';
    approverComments: LargeString @title: 'Approver Comments';

    // Priority
    priority       : String(20) @title: 'Priority' default 'Normal';  // Urgent, High, Normal

    // Notes
    notes          : LargeString @title: 'Notes';
}
```

## Reusable Aspects

**File**: `db/aspects.cds` (new file)

```cds
namespace beauty.aspects;

// Address aspect
aspect Address {
    address        : String(500) @title: 'Address';
    city           : String(100) @title: 'City';
    state          : String(100) @title: 'State';
    country        : String(100) @title: 'Country' default 'Malaysia';
    postalCode     : String(20) @title: 'Postal Code';
}

// Social media aspect
aspect SocialMedia {
    instagramHandle: String(100) @title: 'Instagram';
    tiktokHandle   : String(100) @title: 'TikTok';
    facebookPage   : String(200) @title: 'Facebook';
    linkedinProfile: String(200) @title: 'LinkedIn';
}

// AI insights aspect
aspect AIInsights {
    aiScore        : Integer @title: 'AI Score';
    sentimentScore : Integer @title: 'Sentiment Score';
    sentimentLabel : String(20) @title: 'Sentiment';
    trendScore     : Integer @title: 'Trend Score';
}

// Financial aspect
aspect Financial {
    amount         : Decimal(15,2) @title: 'Amount (RM)';
    currency       : String(10) @title: 'Currency' default 'MYR';
    discountPercent: Decimal(5,2) @title: 'Discount (%)';
    discountAmount : Decimal(15,2) @title: 'Discount Amount (RM)';
}
```

## Entity Relationship Diagram (ERD)

```
┌──────────────┐
│    Leads     │
└──────┬───────┘
       │ converted to
       ↓
┌──────────────┐         ┌──────────────┐
│   Accounts   │◄────────┤   Contacts   │
└──────┬───────┘ account └──────┬───────┘
       │                        │
       │ 1:N                    │ related to
       │                        │
       ↓                        ↓
┌──────────────┐         ┌──────────────┐
│Opportunities │◄────────┤  Activities  │
└──────┬───────┘         └──────┬───────┘
       │                        │
       │ 1:N                    │ assigned to
       │                        │
       ↓                        ↓
┌──────────────┐         ┌──────────────┐
│ Opportunity  │         │    Users     │
│  Products    │         └──────────────┘
└──────┬───────┘
       │
       │ product
       │
       ↓
┌──────────────┐
│   Products   │
└──────────────┘

┌──────────────┐
│  Approvals   │◄────────┤Opportunities │
└──────────────┘         └──────────────┘
```

## Sample Data Requirements

Create CSV files in `db/data/` directory:

### 1. beauty.leads-Leads.csv (20 records)
- Mix of converted and unconverted leads
- Various statuses, sources, platforms
- Range of AI scores (40-95)
- Different cities and countries

### 2. beauty.crm-Accounts.csv (15 records)
- Account types: Salons (5), Retailers (4), Distributors (3), E-commerce (2), Influencers (1)
- Mix of account tiers
- Parent-child relationships (2 chains)
- Health scores ranging from 30-95

### 3. beauty.crm-Contacts.csv (30 records)
- 2-3 contacts per account
- 1 primary contact per account
- Various job titles and departments
- Different communication preferences

### 4. beauty.crm-Opportunities.csv (25 records)
- Distributed across pipeline stages
- 5 closed won, 3 closed lost, rest in pipeline
- Amounts ranging from RM 5,000 to RM 500,000
- 3 requiring approvals

### 5. beauty.crm-Activities.csv (50 records)
- Mix of calls, emails, meetings, tasks
- Various statuses (completed, planned, cancelled)
- Linked to accounts, contacts, opportunities
- Date range: last 3 months to next month

### 6. beauty.crm-Products.csv (40 records)
- 10 brands represented
- All categories covered
- Mix of trending and regular products
- Various price points (RM 20 to RM 2,000)

### 7. beauty.crm-OpportunityProducts.csv (60 records)
- 2-3 products per opportunity on average
- Various quantities and discounts

### 8. beauty.crm-Users.csv (10 records)
- 1 Admin
- 2 Managers
- 7 Sales Reps
- Manager hierarchy defined
- Territories assigned

### 9. beauty.crm-Approvals.csv (5 records)
- 2 pending, 2 approved, 1 rejected
- Discount approvals ranging from 15% to 35%

## Implementation Checklist

### Week 1: Entity Definition
- [ ] Create `db/crm-schema.cds` with new entities
- [ ] Create `db/aspects.cds` with reusable aspects
- [ ] Enhance `db/schema.cds` Leads entity
- [ ] Define all associations and compositions
- [ ] Add value lists and validation annotations
- [ ] Test CDS compilation (`cds compile db/`)

### Week 2: Sample Data
- [ ] Create CSV template files for all entities
- [ ] Generate realistic sample data
- [ ] Ensure referential integrity in CSV data
- [ ] Add CSV files to `db/data/` directory
- [ ] Test data loading (`cds deploy --to sqlite`)
- [ ] Verify relationships with SQL queries

### Week 2: Validation
- [ ] Test `cds watch` with new data model
- [ ] Verify all entities are exposed
- [ ] Check associations work correctly
- [ ] Validate managed aspects (timestamps, user tracking)
- [ ] Test with sample OData queries
- [ ] Document any data model decisions

## Data Model Conventions

1. **Primary Keys**: Use `cuid` aspect for auto-generated UUIDs
2. **Timestamps**: Use `managed` aspect for createdAt/modifiedAt tracking
3. **Nullable**: Only mark fields as `not null` if truly required
4. **Defaults**: Provide sensible defaults for status fields
5. **String Lengths**: Be generous but realistic (max 200 for names, 500 for notes)
6. **Associations**: Use Association for references, Composition for contained entities
7. **Titles**: Always provide @title annotations for UI labels
8. **Naming**: Use camelCase for field names, PascalCase for entities

## Next Phase
After completing the data model, proceed to **Phase 2: Service Layer Enhancement** to create OData services that expose these entities with appropriate business logic.
