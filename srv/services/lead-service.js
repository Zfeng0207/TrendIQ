/**
 * Lead Service Handler
 * Implements business logic for lead management operations
 */

const cds = require('@sap/cds');

module.exports = async function() {
    const { Leads, Accounts, Contacts } = this.entities;

    // Handler for virtual fields: criticality
    this.on('READ', 'Leads', async (req, next) => {
        const results = await next();

        // Helper to process a single lead record
        const processLead = (lead) => {
            if (lead) {
                // Status Criticality
                switch (lead.status) {
                    case 'Qualified': lead.statusCriticality = 3; break; // Green
                    case 'Contacted': lead.statusCriticality = 2; break; // Yellow
                    case 'New':       lead.statusCriticality = 2; break; // Yellow
                    case 'Lost':      lead.statusCriticality = 1; break; // Red
                    case 'Converted': lead.statusCriticality = 3; break; // Green
                    default:          lead.statusCriticality = 0;        // Neutral
                }

                // Lead Quality Criticality
                switch (lead.leadQuality) {
                    case 'Hot':    lead.leadQualityCriticality = 3; break;
                    case 'Warm':   lead.leadQualityCriticality = 2; break;
                    case 'Cold':   lead.leadQualityCriticality = 1; break;
                    default:       lead.leadQualityCriticality = 0;
                }
            }
        };

        if (Array.isArray(results)) {
            results.forEach(processLead);
        } else if (results) {
            processLead(results);
        }
        return results;
    });

    // Action: Generate AI Summary
    this.on('generateAISummary', 'Leads', async (req) => {
        // This action is handled in the UI controller to show toast
        // Return success - the actual toast will be shown in the UI controller
        return req.reply({ 
            success: true,
            message: 'AI Summary generated'
        });
    });

    // Action: Convert Lead to Account
    this.on('convertToAccount', 'Leads', async (req) => {
        const leadID = req.params[0].ID;
        const lead = await SELECT.one.from(Leads).where({ ID: leadID });

        if (!lead) {
            return req.error(404, `Lead ${leadID} not found`);
        }

        if (lead.converted) {
            return req.error(400, 'Lead has already been converted');
        }

        if (lead.status !== 'Qualified') {
            return req.warn(409, 'Lead should be qualified before conversion');
        }

        // Generate new IDs
        const newAccountID = cds.utils.uuid();
        const merchantDiscoveryID = cds.utils.uuid();

        // Create new account from lead
        await INSERT.into(Accounts).entries({
            ID: newAccountID,
            accountName: lead.outletName,
            accountType: 'Salon', // Default to Salon as it is a valid enum value
            status: 'Active',
            address: lead.address,
            city: lead.city,
            state: lead.state,
            country: lead.country,
            postalCode: lead.postalCode,
            website: lead.source === 'Web' ? lead.sourceDetail : null,
            phone: lead.contactPhone,
            accountOwner_ID: lead.owner_ID
        });

        // Create MerchantDiscovery record for Channel Partner Onboarding
        const { MerchantDiscovery } = cds.entities('beauty.crm');
        await INSERT.into(MerchantDiscovery).entries({
            ID: merchantDiscoveryID,
            merchantName: lead.outletName,
            about: lead.notes || '',
            discoverySource: lead.source === 'Web' ? 'Online Web' : 'Other',
            discoveryDate: new Date().toISOString(),
            location: [lead.address, lead.city, lead.state, lead.country].filter(Boolean).join(', '),
            businessType: 'Salon', // Default to Salon
            contactInfo: JSON.stringify({
                name: lead.contactName,
                email: lead.contactEmail,
                phone: lead.contactPhone
            }),
            socialMediaLinks: lead.source === 'Instagram' ? lead.sourceDetail : '',
            merchantScore: lead.aiScore || 0,
            autoAssignedTo_ID: lead.owner_ID,
            discoveryMetadata: JSON.stringify({
                convertedFromLeadID: leadID,
                leadQuality: lead.leadQuality,
                brandToPitch: lead.brandToPitch,
                estimatedValue: lead.estimatedValue,
                aiScore: lead.aiScore,
                sentimentScore: lead.sentimentScore
            }),
            status: 'Onboarding', // Set to Onboarding for channel partner flow
            convertedToLead_ID: leadID,
            address: lead.address,
            city: lead.city,
            state: lead.state,
            country: lead.country,
            postalCode: lead.postalCode
        });

        // Create contact from lead if contact information exists
        if (lead.contactName || lead.contactEmail) {
            const nameParts = (lead.contactName || '').split(' ');
            await INSERT.into(Contacts).entries({
                account_ID: newAccountID,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                fullName: lead.contactName,
                email: lead.contactEmail,
                phone: lead.contactPhone,
                isPrimary: true,
                status: 'Active',
                owner_ID: lead.owner_ID
            });
        }

        // Update lead as converted
        await UPDATE(Leads).set({
            converted: true,
            convertedDate: new Date().toISOString(),
            convertedTo_ID: newAccountID,
            status: 'Converted'
        }).where({ ID: leadID });

        console.log('Lead converted successfully. Account ID:', newAccountID);
        console.log('Merchant Discovery ID:', merchantDiscoveryID);
        // Return the merchant discovery ID instead of account ID for redirect
        return { message: 'Lead converted successfully', accountID: merchantDiscoveryID };
    });

    // Action: Qualify Lead
    this.on('qualifyLead', 'Leads', async (req) => {
        const leadID = req.params[0].ID;
        const lead = await SELECT.one.from(Leads).where({ ID: leadID });

        if (!lead) {
            return req.error(404, `Lead ${leadID} not found`);
        }

        if (lead.status === 'Qualified') {
            return req.warn(400, 'Lead is already qualified');
        }

        if (lead.status === 'Converted') {
            return req.error(400, 'Cannot qualify a converted lead');
        }

        await UPDATE(Leads).set({
            status: 'Qualified',
            leadQuality: 'Hot'
        }).where({ ID: leadID });

        return req.reply({ message: 'Lead qualified successfully' });
    });

    // Action: Update AI Score
    this.on('updateAIScore', 'Leads', async (req) => {
        const leadID = req.params[0].ID;
        const lead = await SELECT.one.from(Leads).where({ ID: leadID });

        if (!lead) {
            return req.error(404, `Lead ${leadID} not found`);
        }
        
        // Simulate delay for UI feedback
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock AI scoring logic
        const aiScore = calculateLeadScore(lead);
        const sentiment = calculateSentiment(lead);

        await UPDATE(Leads).set({
            aiScore: aiScore.score,
            sentimentScore: sentiment.score,
            sentimentLabel: sentiment.label,
            trendScore: calculateTrendScore(lead),
            recommendedAction: getRecommendedAction(lead, aiScore.score)
        }).where({ ID: leadID });
        
        // Return the updated entity for FE Side Effects
        const updatedLead = await SELECT.one.from(Leads).where({ ID: leadID });
        return updatedLead;
    });

    // Before CREATE: Set defaults and validate
    this.before('CREATE', 'Leads', async (req) => {
        const lead = req.data;

        // Auto-calculate AI score for new leads
        lead.aiScore = calculateLeadScore(lead).score;
        lead.sentimentScore = calculateSentiment(lead).score;
        lead.sentimentLabel = calculateSentiment(lead).label;
        lead.trendScore = calculateTrendScore(lead);

        // Set default status
        if (!lead.status) {
            lead.status = 'New';
        }
    });

    // After CREATE: Log activity
    this.after('CREATE', 'Leads', async (data, req) => {
        console.log(`New lead created: ${data.outletName} (ID: ${data.ID})`);
    });
};

// Mock AI Scoring Functions
function calculateLeadScore(lead) {
    let score = 50; // Base score

    // Quality indicators
    if (lead.leadQuality === 'Hot') score += 30;
    else if (lead.leadQuality === 'Warm') score += 15;
    else if (lead.leadQuality === 'Cold') score -= 10;

    // Estimated value
    if (lead.estimatedValue > 100000) score += 20;
    else if (lead.estimatedValue > 50000) score += 10;
    else if (lead.estimatedValue > 20000) score += 5;

    // Source quality
    if (lead.source === 'Referral') score += 15;
    else if (lead.source === 'Event') score += 10;
    else if (lead.source === 'Social') score += 5;

    // Status progression
    if (lead.status === 'Qualified') score += 20;
    else if (lead.status === 'Contacted') score += 10;

    // Contact information completeness
    if (lead.contactEmail) score += 5;
    if (lead.contactPhone) score += 5;
    if (lead.contactName) score += 5;

    return {
        score: Math.min(100, Math.max(0, score)),
        factors: ['quality', 'value', 'source', 'completeness']
    };
}

function calculateSentiment(lead) {
    const notes = (lead.notes || '').toLowerCase();
    let score = 0;
    let label = 'Neutral';

    // Positive indicators
    const positive = ['interested', 'excellent', 'keen', 'excited', 'positive', 'enthusiastic'];
    const negative = ['not interested', 'rejected', 'cold', 'negative', 'skeptical'];

    positive.forEach(word => {
        if (notes.includes(word)) score += 15;
    });

    negative.forEach(word => {
        if (notes.includes(word)) score -= 15;
    });

    if (score >= 50) label = 'Very Positive';
    else if (score >= 20) label = 'Positive';
    else if (score <= -50) label = 'Very Negative';
    else if (score <= -20) label = 'Negative';

    return { score: Math.min(100, Math.max(-100, score)), label };
}

function calculateTrendScore(lead) {
    let score = 50;

    // Platform trends
    if (lead.platform === 'TikTok') score += 25;
    else if (lead.platform === 'Instagram') score += 15;

    // Trending brands
    const trendingBrands = ['K-Beauty', 'Clean Beauty', 'Organic'];
    if (trendingBrands.includes(lead.brandToPitch)) score += 20;

    // Recent activity
    if (lead.lastContactDate) {
        const daysSinceContact = (Date.now() - new Date(lead.lastContactDate)) / (1000 * 60 * 60 * 24);
        if (daysSinceContact < 7) score += 15;
        else if (daysSinceContact < 30) score += 5;
    }

    return Math.min(100, Math.max(0, score));
}

function getRecommendedAction(lead, aiScore) {
    if (aiScore >= 80) {
        return 'Priority follow-up recommended. High conversion potential.';
    } else if (aiScore >= 60) {
        return 'Schedule meeting to discuss requirements.';
    } else if (aiScore >= 40) {
        return 'Nurture with targeted content and follow-up.';
    } else {
        return 'Add to nurture campaign for future engagement.';
    }
}
