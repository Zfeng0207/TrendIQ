// CRM Schema for Smart Beauty CRM
namespace beauty.crm;

using { cuid, managed } from '@sap/cds/common';
using { beauty.aspects as aspects } from './aspects';
using { beauty.leads as leads } from './schema';

/**
 * Users - System users (sales reps, managers, admins)
 */
entity Users : managed, cuid {
    // Basic information
    userID    : String(100) not null @title: 'User ID' @mandatory;
    email     : String(200) not null @title: 'Email' @mandatory;
    firstName : String(100) @title: 'First Name';
    lastName  : String(100) @title: 'Last Name';
    fullName  : String(200) @title: 'Full Name';

    // Role & position
    role       : String(50) @title: 'Role' @assert.enum: ['Sales Rep', 'Manager', 'Admin'];
    title      : String(100) @title: 'Job Title';
    department : String(100) @title: 'Department';

    // Contact
    phone  : String(50) @title: 'Phone';
    mobile : String(50) @title: 'Mobile';

    // Territory
    territory : String(100) @title: 'Territory';
    region    : String(100) @title: 'Region';

    // Management hierarchy
    manager : Association to Users @title: 'Manager';

    // Status
    status   : String(20) @title: 'Status' default 'Active' @assert.enum: ['Active', 'Inactive'];
    isActive : Boolean default true @title: 'Active';

    // Performance
    quota : Decimal(15,2) @title: 'Sales Quota (RM)';

    // Notes
    notes : LargeString @title: 'Notes';
}

/**
 * Accounts - Master data for customer companies, salons, retailers
 */
entity Accounts : managed, cuid, aspects.Address, aspects.SocialMedia, aspects.ContactInfo {
    // Basic information
    accountName : String(200) not null @title: 'Account Name' @mandatory;
    accountType : String(50) @title: 'Account Type'
                  @assert.enum: ['Salon', 'Spa', 'Retailer', 'Distributor', 'E-commerce', 'Influencer', 'Chain'];
    industry    : String(100) @title: 'Industry';
    website     : String(300) @title: 'Website';

    // Business information
    establishedYear : Integer @title: 'Established Year' @assert.range: [1900, 2100];
    employeeCount   : Integer @title: 'Number of Employees';
    annualRevenue   : Decimal(15,2) @title: 'Annual Revenue (RM)';

    // Account hierarchy
    parentAccount : Association to Accounts @title: 'Parent Account';
    childAccounts : Composition of many Accounts on childAccounts.parentAccount = $self;

    // Account management
    status         : String(20) @title: 'Status' default 'Active'
                     @assert.enum: ['Active', 'Inactive', 'Prospect'];
    accountOwner   : Association to Users @title: 'Account Owner';
    accountManager : Association to Users @title: 'Account Manager';
    accountTier    : String(20) @title: 'Account Tier'
                     @assert.enum: ['Platinum', 'Gold', 'Silver', 'Bronze'];

    // Operational fields for List Report
    assignedTo     : String(200) @title: 'Assigned To'; // Sales rep name as string
    dateCreated    : Date @title: 'Date Created';

    // Health & scoring
    healthScore : Integer @title: 'Account Health Score' @assert.range: [0, 100];
    riskLevel   : String(20) @title: 'Risk Level'
                  @assert.enum: ['Low', 'Medium', 'High', 'Critical'];

    // Financial
    creditLimit  : Decimal(15,2) @title: 'Credit Limit (RM)';
    paymentTerms : String(50) @title: 'Payment Terms';
    estimatedMonthlyGMV : Decimal(15,2) @title: 'Estimated Monthly GMV (RM)';
    forecastedRevenueContribution : Decimal(15,2) @title: 'Forecasted Revenue Contribution (RM)';
    contractStatus : String(50) @title: 'Contract Status'
                  @assert.enum: ['Draft', 'Pending', 'Active', 'Expired', 'Terminated'];

    // Partner Priority Timeline
    currentTimelineStage : String(50) @title: 'Current Timeline Stage'
                      @assert.enum: ['Onboarding', 'FinancialNegotiation', 'OpportunityDevelopment', 'CampaignExecution', 'RevenueRealization'];
    timelineStageStatus : String(50) @title: 'Timeline Stage Status'
                      @assert.enum: ['NotStarted', 'InProgress', 'Completed', 'Delayed', 'Blocked'];
    nextRecommendedAction : LargeString @title: 'Next Recommended Action';
    timelineStageDeadline : DateTime @title: 'Timeline Stage Deadline';
    timelineStageOwner : Association to Users @title: 'Timeline Stage Owner';
    timelineStageNotes : LargeString @title: 'Timeline Stage Notes';

    // Sentiment & Trends
    recentSentimentTrend : String(20) @title: 'Recent Sentiment Trend'
                          @assert.enum: ['Improving', 'Stable', 'Declining'];
    sentimentScore : Integer @title: 'Sentiment Score' @assert.range: [-100, 100];

    // Relationships (compositions - owned by account)
    contacts      : Composition of many Contacts on contacts.account = $self;
    opportunities : Composition of many Opportunities on opportunities.account = $self;
    recommendations : Composition of many AccountRecommendations on recommendations.account = $self;
    riskAlerts    : Composition of many AccountRiskAlerts on riskAlerts.account = $self;

    // Relationships (associations - references)
    activities : Association to many Activities on activities.relatedAccount = $self;

    // Source tracking - link to originating MerchantDiscovery
    sourceMerchantDiscovery : Association to MerchantDiscovery @title: 'Source Merchant Discovery';

    // Notes
    description : LargeString @title: 'Description';
    notes       : LargeString @title: 'Notes';
}

/**
 * Contacts - Individual people associated with accounts
 */
entity Contacts : managed, cuid, aspects.SocialMedia, aspects.ContactInfo {
    // Basic information
    firstName : String(100) @title: 'First Name';
    lastName  : String(100) @title: 'Last Name';
    fullName  : String(200) @title: 'Full Name';
    title     : String(50) @title: 'Job Title';
    department: String(100) @title: 'Department';

    // Account relationship (mandatory - contact must belong to an account)
    account   : Association to Accounts not null @title: 'Account' @mandatory;
    isPrimary : Boolean default false @title: 'Primary Contact';

    // Contact preferences
    preferredChannel : String(50) @title: 'Preferred Channel'
                       @assert.enum: ['Email', 'WhatsApp', 'Phone', 'Instagram', 'WeChat'];
    language         : String(50) @title: 'Language' default 'English';
    timezone         : String(50) @title: 'Timezone';

    // Contact management
    status : String(20) @title: 'Status' default 'Active'
             @assert.enum: ['Active', 'Inactive', 'Bounced'];
    owner  : Association to Users @title: 'Contact Owner';

    // Engagement tracking
    lastContactDate : DateTime @title: 'Last Contact Date';
    engagementScore : Integer @title: 'Engagement Score' @assert.range: [0, 100];

    // AI insights
    sentimentScore : Integer @title: 'Sentiment Score' @assert.range: [-100, 100];
    sentimentLabel : String(20) @title: 'Sentiment'
                     @assert.enum: ['Very Positive', 'Positive', 'Neutral', 'Negative', 'Very Negative'];
    interests      : String(500) @title: 'Interests';

    // Relationships
    activities : Association to many Activities on activities.relatedContact = $self;

    // Notes
    notes : LargeString @title: 'Notes';
}

/**
 * Products - Catalog of beauty products and brands
 */
entity Products : managed, cuid {
    // Basic information
    productCode : String(50) not null @title: 'Product Code' @mandatory;
    productName : String(200) not null @title: 'Product Name' @mandatory;
    description : LargeString @title: 'Description';

    // Categorization
    brand       : String(100) @title: 'Brand';
    category    : String(100) @title: 'Category'
                  @assert.enum: ['Skincare', 'Makeup', 'Haircare', 'Fragrance', 'Tools', 'Supplements', 'Services'];
    subCategory : String(100) @title: 'Sub-Category';

    // Product details
    productType : String(50) @title: 'Type' @assert.enum: ['Product', 'Service', 'Bundle'];
    size        : String(50) @title: 'Size/Volume';
    unit        : String(20) @title: 'Unit';

    // Pricing
    listPrice : Decimal(15,2) @title: 'List Price (RM)';
    cost      : Decimal(15,2) @title: 'Cost (RM)';
    currency  : String(10) @title: 'Currency' default 'MYR';

    // Availability
    status        : String(20) @title: 'Status' default 'Active'
                    @assert.enum: ['Active', 'Inactive', 'Discontinued'];
    inStock       : Boolean default true @title: 'In Stock';
    stockQuantity : Integer @title: 'Stock Quantity';

    // Marketing
    isPromoted : Boolean default false @title: 'Promoted';
    isTrending : Boolean default false @title: 'Trending';
    trendScore : Integer @title: 'Trend Score' @assert.range: [0, 100];

    // Trend tracking for marketing campaigns
    trendingKeywords  : String(500) @title: 'Trending Keywords';
    trendDetectedDate : DateTime @title: 'Trend Detected Date';
    trendVelocity     : Integer @title: 'Trend Velocity' @assert.range: [0, 100];

    // Product hierarchy
    parentProduct : Association to Products @title: 'Parent Product';

    // Notes
    notes : LargeString @title: 'Notes';
}

/**
 * Opportunities - Track sales pipeline and deals
 */
entity Opportunities : managed, cuid, aspects.Financial {
    // Basic information
    name        : String(200) not null @title: 'Opportunity Name' @mandatory;
    description : LargeString @title: 'Description';

    // Account relationship (mandatory)
    account        : Association to Accounts not null @title: 'Account' @mandatory;
    primaryContact : Association to Contacts @title: 'Primary Contact';

    // Pipeline stage
    stage       : String(50) @title: 'Stage' default 'Prospecting'
                  @assert.enum: ['Prospecting', 'Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
    probability : Integer @title: 'Win Probability (%)' @assert.range: [0, 100];

    // Financial (inherits from Financial aspect: amount, currency, discountPercent, discountAmount)
    expectedRevenue : Decimal(15,2) @title: 'Expected Revenue (RM)';

    // Dates
    closeDate       : Date @title: 'Expected Close Date';
    actualCloseDate : Date @title: 'Actual Close Date';

    // Products
    products : Composition of many OpportunityProducts on products.opportunity = $self;

    // Ownership
    owner : Association to Users @title: 'Opportunity Owner';

    // Competition & strategy
    competitors : String(500) @title: 'Competitors';
    winStrategy : LargeString @title: 'Win Strategy';

    // Discounts & approvals
    requiresApproval : Boolean default false @title: 'Requires Approval';
    approval         : Association to Approvals @title: 'Approval';

    // Tracking
    lostReason : String(500) @title: 'Lost Reason';

    // AI predictions
    aiWinScore       : Integer @title: 'AI Win Score' @assert.range: [0, 100];
    aiRecommendation : LargeString @title: 'AI Recommendation';

    // Relationships
    activities : Association to many Activities on activities.relatedOpportunity = $self;

    // Notes
    notes : LargeString @title: 'Notes';
}

/**
 * OpportunityProducts - Junction table for products in opportunities
 */
entity OpportunityProducts : cuid {
    opportunity : Association to Opportunities not null @title: 'Opportunity' @mandatory;
    product     : Association to Products not null @title: 'Product' @mandatory;

    quantity   : Integer @title: 'Quantity' default 1;
    unitPrice  : Decimal(15,2) @title: 'Unit Price (RM)';
    discount   : Decimal(5,2) @title: 'Discount (%)' @assert.range: [0, 100];
    totalPrice : Decimal(15,2) @title: 'Total Price (RM)';

    notes : String(500) @title: 'Notes';
}

/**
 * Activities - Track all interactions and tasks
 */
entity Activities : managed, cuid {
    // Basic information
    subject     : String(200) not null @title: 'Subject' @mandatory;
    description : LargeString @title: 'Description';
    activityType: String(50) @title: 'Activity Type'
                  @assert.enum: ['Call', 'Email', 'Meeting', 'Task', 'Note', 'Demo', 'Presentation', 'Follow-up'];

    // Status & priority
    status   : String(20) @title: 'Status' default 'Planned'
               @assert.enum: ['Planned', 'In Progress', 'Completed', 'Cancelled'];
    priority : String(20) @title: 'Priority' default 'Medium'
               @assert.enum: ['High', 'Medium', 'Low'];

    // Dates & duration
    startDateTime   : DateTime @title: 'Start Date/Time';
    endDateTime     : DateTime @title: 'End Date/Time';
    durationMinutes : Integer @title: 'Duration (Minutes)';
    completedDate   : DateTime @title: 'Completed Date';

    // Relationships (polymorphic - activity can relate to multiple entity types)
    relatedAccount     : Association to Accounts @title: 'Related Account';
    relatedContact     : Association to Contacts @title: 'Related Contact';
    relatedOpportunity : Association to Opportunities @title: 'Related Opportunity';

    // Ownership
    assignedTo : Association to Users @title: 'Assigned To';
    owner      : Association to Users @title: 'Owner';

    // Communication details (for emails/calls)
    direction : String(20) @title: 'Direction' @assert.enum: ['Inbound', 'Outbound'];
    outcome   : String(200) @title: 'Outcome';

    // Task details (if activity is a task)
    dueDate      : DateTime @title: 'Due Date';
    reminderDate : DateTime @title: 'Reminder Date';

    // AI insights
    sentimentScore : Integer @title: 'Sentiment Score' @assert.range: [-100, 100];
    keyPoints      : LargeString @title: 'Key Points';

    // Notes
    notes : LargeString @title: 'Notes';
}

/**
 * Approvals - Track approval workflows for discounts and deals
 */
entity Approvals : managed, cuid {
    // Reference
    opportunityID : Association to Opportunities @title: 'Opportunity';

    // Approval details
    approvalType : String(50) @title: 'Approval Type'
                   @assert.enum: ['Discount', 'Price Override', 'Special Terms', 'Contract Exception'];
    requestedBy  : Association to Users @title: 'Requested By';
    approver     : Association to Users @title: 'Approver';

    // Request information
    requestDate      : DateTime @title: 'Request Date';
    requestReason    : LargeString @title: 'Reason for Request';
    requestedAmount  : Decimal(15,2) @title: 'Requested Amount (RM)';
    requestedDiscount: Decimal(5,2) @title: 'Requested Discount (%)' @assert.range: [0, 100];

    // Status & decision
    status           : String(20) @title: 'Status' default 'Pending'
                       @assert.enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'];
    decision         : String(20) @title: 'Decision' @assert.enum: ['Approved', 'Rejected'];
    decisionDate     : DateTime @title: 'Decision Date';
    approverComments : LargeString @title: 'Approver Comments';

    // Priority
    priority : String(20) @title: 'Priority' default 'Normal'
               @assert.enum: ['Urgent', 'High', 'Normal', 'Low'];

    // Notes
    notes : LargeString @title: 'Notes';
}

/**
 * MerchantDiscovery - AI-discovered channel partner opportunities from web scraping
 */
entity MerchantDiscovery : managed, cuid, aspects.Address {
    merchantName      : String(200) not null @title: 'Channel Partner Name' @mandatory;
    about             : LargeString @title: 'About';
    discoverySource   : String(50) @title: 'Discovery Source'
                      @assert.enum: ['Online Web', 'Partnership', 'Offline', 'Other'];
    discoveryDate     : DateTime @title: 'Discovery Date';
    location          : String(500) @title: 'Location';
    businessType      : String(50) @title: 'Business Type'
                      @assert.enum: ['Salon', 'Spa', 'Retailer', 'E-commerce', 'Kiosk', 'Distributor'];
    contactInfo       : LargeString @title: 'Contact Information';
    socialMediaLinks  : LargeString @title: 'Social Media Links';
    merchantScore     : Integer @title: 'Channel Partner Score' @assert.range: [0, 100];
    autoAssignedTo    : Association to Users @title: 'Auto Assigned To';
    discoveryMetadata : LargeString @title: 'Discovery Metadata'; // JSON string for raw scraped data
    status            : String(20) @title: 'Status' default 'Discovered'
                      @assert.enum: ['Discovered', 'Contacted', 'Qualified', 'Onboarding', 'In Review', 'Completed'];
    
    // Parsed contact information fields (populated from contactInfo JSON)
    contactName       : String(200) @title: 'Contact Name';
    contactEmail      : String(200) @title: 'Email';
    contactPhone      : String(50) @title: 'Phone';
    
    // Parsed discovery metadata fields (populated from discoveryMetadata JSON)
    convertedFromLeadID : UUID @title: 'Converted From Lead ID';
    leadQuality       : String(20) @title: 'Lead Quality';
    brandToPitch      : String(100) @title: 'Brand To Pitch';
    estimatedValue    : Decimal(15,2) @title: 'Estimated Value';
    aiScore           : Integer @title: 'AI Score';
    sentimentScore    : Integer @title: 'Sentiment Score';
    
    // Relationships
    convertedToLead   : Association to leads.Leads @title: 'Converted to Lead';
    convertedToAccount : Association to Accounts @title: 'Converted to Account';
}

/**
 * MarketingCampaigns - Trend-driven marketing campaign automation
 */
entity MarketingCampaigns : managed, cuid {
    campaignName      : String(200) not null @title: 'Campaign Name' @mandatory;
    campaignType      : String(50) @title: 'Campaign Type'
                      @assert.enum: ['Influencer', 'SocialAds', 'Email', 'TikTok', 'Instagram', 'ShopeeAds'];
    triggerKeyword    : String(200) @title: 'Trigger Keyword';
    ESGTag            : String(100) @title: 'ESG Tag';
    triggerProduct    : Association to Products @title: 'Trigger Product';
    status            : String(20) @title: 'Status' default 'Draft'
                      @assert.enum: ['Draft', 'PendingApproval', 'Active', 'Paused', 'Completed'];
    budget            : Decimal(15,2) @title: 'Budget (RM)';
    startDate         : DateTime @title: 'Start Date';
    endDate           : DateTime @title: 'End Date';
    targetAudience    : String(500) @title: 'Target Audience';
    campaignBrief     : LargeString @title: 'Campaign Brief'; // Auto-generated
    performanceMetrics: LargeString @title: 'Performance Metrics'; // JSON for ROI, clicks, conversions
    owner             : Association to Users @title: 'Owner';
    
    // Relationships
    creators          : Composition of many CampaignCreators on creators.campaign = $self;
}

/**
 * AccountRecommendations - AI-generated recommendations for account growth
 */
entity AccountRecommendations : managed, cuid {
    account : Association to Accounts not null @title: 'Account' @mandatory;
    
    recommendationType : String(50) @title: 'Recommendation Type'
                       @assert.enum: ['Product', 'Campaign', 'Deal', 'Risk'];
    recommendationText : LargeString @title: 'Recommendation Text' @mandatory;
    priority : String(20) @title: 'Priority'
              @assert.enum: ['High', 'Medium', 'Low'];
    aiGenerated : Boolean default true @title: 'AI Generated';
    status : String(20) @title: 'Status' default 'New'
            @assert.enum: ['New', 'Acknowledged', 'Implemented', 'Dismissed'];
    
    // Metadata
    generatedDate : DateTime @title: 'Generated Date';
    acknowledgedDate : DateTime @title: 'Acknowledged Date';
    acknowledgedBy : Association to Users @title: 'Acknowledged By';
    
    notes : LargeString @title: 'Notes';
}

/**
 * AccountRiskAlerts - AI-detected risk alerts for accounts
 */
entity AccountRiskAlerts : managed, cuid {
    account : Association to Accounts not null @title: 'Account' @mandatory;
    
    alertType : String(50) @title: 'Alert Type'
               @assert.enum: ['DecliningEngagement', 'NegativeSentiment', 'CompetitorTagging', 'PriceComplaint', 'SlowResponse'];
    severity : String(20) @title: 'Severity'
              @assert.enum: ['Critical', 'High', 'Medium', 'Low'];
    alertMessage : LargeString @title: 'Alert Message' @mandatory;
    
    detectedDate : DateTime @title: 'Detected Date';
    resolvedDate : DateTime @title: 'Resolved Date';
    resolvedBy : Association to Users @title: 'Resolved By';
    resolutionNotes : LargeString @title: 'Resolution Notes';
    
    isResolved : Boolean default false @title: 'Is Resolved';
}

/**
 * CampaignCreators - Selected creators/influencers for campaigns
 */
entity CampaignCreators : cuid {
    campaign          : Association to MarketingCampaigns not null @title: 'Campaign' @mandatory;
    creatorName       : String(200) @title: 'Creator Name';
    platform          : String(50) @title: 'Platform'
                      @assert.enum: ['Instagram', 'TikTok', 'YouTube', 'Facebook'];
    creatorHandle     : String(200) @title: 'Creator Handle';
    followerCount     : Integer @title: 'Follower Count';
    engagementRate    : Decimal(5,2) @title: 'Engagement Rate (%)';
    selected          : Boolean default false @title: 'Selected';
    assignedBudget    : Decimal(15,2) @title: 'Assigned Budget (RM)';
}
