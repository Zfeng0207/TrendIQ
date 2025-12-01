// Lead Management Schema for Smart Beauty CRM
namespace beauty.leads;

using { cuid, managed } from '@sap/cds/common';
using { beauty.crm as crm } from './crm-schema';
using { beauty.aspects as aspects } from './aspects';

/**
 * Leads - Capture and qualify potential customers from external sources
 * (social media, web forms, referrals, etc.)
 */
entity Leads : managed, cuid, aspects.Address, aspects.AIInsights {
    // Existing fields (enhanced with better types and constraints)
    outletName   : String(200) @title: 'Outlet Name';
    brandToPitch : String(100) @title: 'Brand to Pitch';
    status       : String(20) @title: 'Status' default 'New'
                   @assert.enum: ['New', 'Contacted', 'Engaged', 'Qualified', 'Converted', 'Disqualified'];
    platform     : String(50) @title: 'Platform'
                   @assert.enum: ['Instagram', 'TikTok', 'Facebook', 'LinkedIn', 'Web', 'Referral', 'Other'];
    contactEmail : String(200) @title: 'Contact Email';

    // AI scoring (inherits aiScore from AIInsights aspect)
    // Also inherits: sentimentScore, sentimentLabel, trendScore

    // New contact fields
    contactName  : String(200) @title: 'Contact Name';
    contactPhone : String(50) @title: 'Contact Phone';

    // Address fields inherited from Address aspect:
    // address, city, state, country, postalCode

    // Lead qualification
    source         : String(100) @title: 'Lead Source'
                     @assert.enum: ['Web', 'Social', 'Referral', 'Import', 'Partner', 'Cold', 'Event'];
    sourceDetail   : String(500) @title: 'Source Details';
    leadQuality    : String(20) @title: 'Quality' default 'Medium'
                     @assert.enum: ['Hot', 'Warm', 'Medium', 'Cold'];
    estimatedValue : Decimal(15,2) @title: 'Estimated Value (RM)';

    // Assignment & ownership
    assignedTo : Association to crm.Users @title: 'Assigned To';
    owner      : Association to crm.Users @title: 'Owner';

    // Conversion tracking
    converted     : Boolean default false @title: 'Converted';
    convertedDate : DateTime @title: 'Conversion Date';
    prospect      : Association to crm.Prospects @title: 'Converted to Prospect';

    // Notes and engagement
    notes           : LargeString @title: 'Notes';
    lastContactDate : DateTime @title: 'Last Contact';
    nextFollowUp    : DateTime @title: 'Next Follow-up';

    // AI-enhanced fields (trending topics detected by AI)
    trendingTopics    : String(500) @title: 'Trending Topics';
    recommendedAction : String(1000) @title: 'AI Recommendation';

    // Discovery tracking
    discoverySource   : String(100) @title: 'Discovery Source';
    autoDiscovered    : Boolean default false @title: 'Auto Discovered';
}
