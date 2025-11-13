// Reusable aspects for the Smart Beauty CRM
namespace beauty.aspects;

using { cuid, managed } from '@sap/cds/common';

/**
 * Address aspect for entities with physical location
 */
aspect Address {
    address    : String(500) @title: 'Address';
    city       : String(100) @title: 'City';
    state      : String(100) @title: 'State/Province';
    country    : String(100) @title: 'Country' default 'Malaysia';
    postalCode : String(20)  @title: 'Postal Code';
}

/**
 * Social Media aspect for entities with social presence
 */
aspect SocialMedia {
    instagramHandle : String(100) @title: 'Instagram Handle';
    tiktokHandle    : String(100) @title: 'TikTok Handle';
    facebookPage    : String(200) @title: 'Facebook Page';
    linkedinProfile : String(200) @title: 'LinkedIn Profile';
}

/**
 * AI Insights aspect for entities with AI scoring
 */
aspect AIInsights {
    aiScore        : Integer @title: 'AI Score' @assert.range: [0, 100];
    sentimentScore : Integer @title: 'Sentiment Score' @assert.range: [-100, 100];
    sentimentLabel : String(20) @title: 'Sentiment' @assert.enum: ['Very Positive', 'Positive', 'Neutral', 'Negative', 'Very Negative'];
    trendScore     : Integer @title: 'Trend Score' @assert.range: [0, 100];
}

/**
 * Financial aspect for entities with monetary values
 */
aspect Financial {
    amount         : Decimal(15,2) @title: 'Amount';
    currency       : String(10) @title: 'Currency' default 'MYR';
    discountPercent: Decimal(5,2) @title: 'Discount (%)' @assert.range: [0, 100];
    discountAmount : Decimal(15,2) @title: 'Discount Amount';
}

/**
 * Contact Information aspect
 */
aspect ContactInfo {
    email : String(200) @title: 'Email Address';
    phone : String(50)  @title: 'Phone Number';
    mobile: String(50)  @title: 'Mobile Number';
}

/**
 * Status tracking aspect
 */
aspect StatusTracking {
    status       : String(20) @title: 'Status';
    isActive     : Boolean default true @title: 'Active';
    lastModified : DateTime @title: 'Last Modified Date';
}
