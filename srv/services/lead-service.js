/**
 * Lead Service Handler
 * Implements business logic for lead management operations
 */

const cds = require('@sap/cds');

module.exports = async function() {
    const { Leads } = this.entities;

    // Helper function to get lead data from either active or draft entity
    async function getLeadData(leadID, isActiveEntity) {
        if (isActiveEntity === false) {
            // Read from draft table
            const draftLead = await SELECT.one.from('LeadService.Leads.drafts').where({ ID: leadID });
            return draftLead;
        } else {
            // Read from active table
            return await SELECT.one.from(Leads).where({ ID: leadID });
        }
    }

    // Helper function to update lead in either active or draft entity
    async function updateLeadData(leadID, isActiveEntity, data) {
        if (isActiveEntity === false) {
            // Update draft table
            await UPDATE('LeadService.Leads.drafts').set(data).where({ ID: leadID });
        } else {
            // Update active table
            await UPDATE(Leads).set(data).where({ ID: leadID });
        }
    }

    // Action: Generate AI Summary (works on both active and draft)
    this.on('generateAISummary', async (req) => {
        return req.reply({ 
            success: true,
            message: 'AI Summary generated'
        });
    });

    // Action: Convert Lead to Prospect (works on both active and draft)
    this.on('convertToProspect', async (req) => {
        const leadID = req.params[0].ID;
        const isActiveEntity = req.params[0].IsActiveEntity;
        
        console.log('[convertToProspect] Called with params:', { leadID, isActiveEntity });
        console.log('[convertToProspect] Full req.params:', JSON.stringify(req.params));
        
        // Get lead data from appropriate source
        const lead = await getLeadData(leadID, isActiveEntity);
        console.log('[convertToProspect] Lead data retrieved:', lead ? { 
            ID: lead.ID, 
            outletName: lead.outletName, 
            status: lead.status, 
            converted: lead.converted 
        } : 'NULL');

        if (!lead) {
            console.error('[convertToProspect] Lead not found:', leadID);
            return req.error(404, `Lead ${leadID} not found`);
        }

        if (lead.converted) {
            console.warn('[convertToProspect] Lead already converted:', leadID);
            return req.error(400, 'Lead has already been converted');
        }

        if (lead.status !== 'Qualified') {
            console.warn('[convertToProspect] Lead status is not Qualified. Current status:', lead.status);
            // Allow conversion but log a warning - users may want to convert early
            console.log('[convertToProspect] Proceeding with conversion despite non-Qualified status');
        }

        // Generate new ID for Prospect
        const prospectID = cds.utils.uuid();

        // Create Prospect record from Lead data
        const { Prospects } = cds.entities('beauty.crm');
        await INSERT.into(Prospects).entries({
            ID: prospectID,
            prospectName: lead.outletName,
            about: lead.notes || '',
            discoverySource: 'Lead Conversion',
            discoveryDate: new Date().toISOString(),
            location: [lead.address, lead.city, lead.state, lead.country].filter(Boolean).join(', '),
            businessType: 'Salon', // Default to Salon
            contactInfo: JSON.stringify({
                name: lead.contactName,
                email: lead.contactEmail,
                phone: lead.contactPhone
            }),
            socialMediaLinks: lead.source === 'Instagram' ? lead.sourceDetail : '',
            prospectScore: lead.aiScore || 0,
            autoAssignedTo_ID: lead.owner_ID,
            discoveryMetadata: JSON.stringify({
                convertedFromLeadID: leadID,
                leadQuality: lead.leadQuality,
                brandToPitch: lead.brandToPitch,
                estimatedValue: lead.estimatedValue,
                aiScore: lead.aiScore,
                sentimentScore: lead.sentimentScore
            }),
            status: 'New',
            convertedFromLead_ID: leadID,
            address: lead.address,
            city: lead.city,
            state: lead.state,
            country: lead.country,
            postalCode: lead.postalCode,
            // Populate parsed fields directly
            contactName: lead.contactName,
            contactEmail: lead.contactEmail,
            contactPhone: lead.contactPhone,
            convertedFromLeadID: leadID,
            leadQuality: lead.leadQuality,
            brandToPitch: lead.brandToPitch,
            estimatedValue: lead.estimatedValue,
            aiScore: lead.aiScore,
            sentimentScore: lead.sentimentScore
        });

        // Update lead as converted (in both draft and active if needed)
        const updateData = {
            converted: true,
            convertedDate: new Date().toISOString(),
            prospect_ID: prospectID,
            status: 'Converted'
        };
        
        await updateLeadData(leadID, isActiveEntity, updateData);
        
        // Also update active entity if working on draft
        if (isActiveEntity === false) {
            try {
                await UPDATE(Leads).set(updateData).where({ ID: leadID });
            } catch (e) {
                // Active entity might not exist yet, ignore
            }
        }

        console.log('Lead converted to Prospect successfully. Prospect ID:', prospectID);
        return { 
            message: 'Lead converted to Prospect successfully', 
            prospectID: prospectID 
        };
    });

    // Action: Qualify Lead (works on both active and draft)
    this.on('qualifyLead', async (req) => {
        const leadID = req.params[0].ID;
        const isActiveEntity = req.params[0].IsActiveEntity;
        
        // Get lead data from appropriate source
        const lead = await getLeadData(leadID, isActiveEntity);

        if (!lead) {
            return req.error(404, `Lead ${leadID} not found`);
        }

        if (lead.status === 'Qualified') {
            return req.warn(400, 'Lead is already qualified');
        }

        if (lead.status === 'Converted') {
            return req.error(400, 'Cannot qualify a converted lead');
        }

        const updateData = {
            status: 'Qualified',
            leadQuality: 'Hot'
        };
        
        await updateLeadData(leadID, isActiveEntity, updateData);
        
        // Also update active entity if working on draft
        if (isActiveEntity === false) {
            try {
                await UPDATE(Leads).set(updateData).where({ ID: leadID });
            } catch (e) {
                // Active entity might not exist yet, ignore
            }
        }

        return req.reply({ message: 'Lead qualified successfully' });
    });

    // Action: Update AI Score (works on both active and draft)
    this.on('updateAIScore', async (req) => {
        const leadID = req.params[0].ID;
        const isActiveEntity = req.params[0].IsActiveEntity;
        
        // Get lead data from appropriate source
        const lead = await getLeadData(leadID, isActiveEntity);

        if (!lead) {
            return req.error(404, `Lead ${leadID} not found`);
        }
        
        // Simulate delay for UI feedback
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock AI scoring logic
        const aiScore = calculateLeadScore(lead);
        const sentiment = calculateSentiment(lead);

        const updateData = {
            aiScore: aiScore.score,
            sentimentScore: sentiment.score,
            sentimentLabel: sentiment.label,
            trendScore: calculateTrendScore(lead),
            recommendedAction: getRecommendedAction(lead, aiScore.score)
        };
        
        await updateLeadData(leadID, isActiveEntity, updateData);
        
        // Return the updated entity for FE Side Effects
        const updatedLead = await getLeadData(leadID, isActiveEntity);
        return updatedLead;
    });

    // Action: Change Lead Status (for Creatio chevron stage bar)
    this.on('changeStatus', async (req) => {
        const leadID = req.params[0].ID;
        const isActiveEntity = req.params[0].IsActiveEntity;
        const { newStatus } = req.data;

        // Valid status transitions
        const validStatuses = ['New', 'Contacted', 'Engaged', 'Qualified', 'Converted', 'Disqualified'];
        
        if (!validStatuses.includes(newStatus)) {
            return req.error(400, `Invalid status: ${newStatus}. Valid values are: ${validStatuses.join(', ')}`);
        }

        // Get lead data from appropriate source
        const lead = await getLeadData(leadID, isActiveEntity);

        if (!lead) {
            return req.error(404, `Lead ${leadID} not found`);
        }

        // Validate status transition
        if (lead.status === 'Converted') {
            return req.error(400, 'Cannot change status of a converted lead');
        }

        if (lead.status === 'Disqualified' && newStatus !== 'New') {
            return req.error(400, 'Disqualified leads can only be reactivated to New status');
        }

        // Update the status
        const updateData = {
            status: newStatus,
            lastStatusChange: new Date().toISOString()
        };

        // If moving to Qualified, update quality
        if (newStatus === 'Qualified' && lead.leadQuality !== 'Hot') {
            updateData.leadQuality = 'Warm';
        }

        // If marking as Disqualified or Converted, set end date
        if (newStatus === 'Disqualified' || newStatus === 'Converted') {
            updateData.closedDate = new Date().toISOString();
        }

        await updateLeadData(leadID, isActiveEntity, updateData);

        // Also update active entity if working on draft
        if (isActiveEntity === false) {
            try {
                await UPDATE(Leads).set(updateData).where({ ID: leadID });
            } catch (e) {
                // Active entity might not exist yet, ignore
            }
        }

        console.log(`Lead ${leadID} status changed from ${lead.status} to ${newStatus}`);

        // Return the updated entity
        const updatedLead = await getLeadData(leadID, isActiveEntity);
        return updatedLead;
    });

    // Action: Schedule Task (creates an Activity linked to the lead)
    this.on('scheduleTask', async (req) => {
        const leadID = req.params[0].ID;
        const isActiveEntity = req.params[0].IsActiveEntity;
        const { subject, dueDate, notes } = req.data;

        // Validate required fields
        if (!subject) {
            return req.error(400, 'Subject is required');
        }
        if (!dueDate) {
            return req.error(400, 'Due date is required');
        }

        // Get lead data to verify it exists and get lead name for activity
        const lead = await getLeadData(leadID, isActiveEntity);
        if (!lead) {
            return req.error(404, `Lead ${leadID} not found`);
        }

        // Generate new ID for the activity
        const activityID = cds.utils.uuid();

        // Create Activity record linked to the lead
        const { Activities } = cds.entities('beauty.crm');
        await INSERT.into(Activities).entries({
            ID: activityID,
            subject: subject,
            description: notes || '',
            activityType: 'Task',
            status: 'Planned',
            priority: 'Medium',
            dueDate: dueDate,
            startDateTime: dueDate,
            relatedLead_ID: leadID,
            owner_ID: lead.owner_ID || null,
            assignedTo_ID: lead.owner_ID || null,
            notes: notes || ''
        });

        console.log(`Task created for lead ${lead.outletName}. Activity ID: ${activityID}`);
        
        return activityID;
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
