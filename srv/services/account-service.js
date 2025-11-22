/**
 * Account Service Handler
 * Implements business logic for account and contact management
 */

const cds = require('@sap/cds');

module.exports = async function() {
    const { Accounts, Contacts } = this.entities;

    // Handler for virtual fields: criticality
    this.on('READ', 'Accounts', async (req, next) => {
        const results = await next();

        const processAccount = (account) => {
            if (account) {
                // Health Criticality
                if (account.healthScore >= 80) account.healthCriticality = 3;      // Green
                else if (account.healthScore >= 50) account.healthCriticality = 2; // Yellow
                else account.healthCriticality = 1;                                // Red

                // Status Criticality
                switch (account.status) {
                    case 'Active':   account.statusCriticality = 3; break;
                    case 'Prospect': account.statusCriticality = 2; break;
                    case 'Inactive': account.statusCriticality = 1; break;
                    default:         account.statusCriticality = 0;
                }
            }
        };

        if (Array.isArray(results)) {
            results.forEach(processAccount);
        } else if (results) {
            processAccount(results);
        }
        return results;
    });

    // Action: Update Account AI Score
    this.on('updateAIScore', 'Accounts', async (req) => {
        const accountID = req.params[0].ID;
        const account = await SELECT.one.from(Accounts).where({ ID: accountID });

        if (!account) {
            return req.error(404, `Account ${accountID} not found`);
        }

        // Mock AI scoring
        await new Promise(resolve => setTimeout(resolve, 1500)); // Mock delay
        const healthScore = calculateAccountHealth(account);
        const sentiment = calculateAccountSentiment(account);

        await UPDATE(Accounts).set({
            healthScore: healthScore,
            sentimentScore: sentiment.score,
            sentimentLabel: sentiment.label
        }).where({ ID: accountID });

        const updatedAccount = await SELECT.one.from(Accounts).where({ ID: accountID });
        return updatedAccount;
    });

    // Action: Merge Account
    this.on('mergeAccount', 'Accounts', async (req) => {
        const sourceID = req.params[0].ID;
        const { targetAccountID } = req.data;

        if (sourceID === targetAccountID) {
            return req.error(400, 'Cannot merge account with itself');
        }

        const source = await SELECT.one.from(Accounts).where({ ID: sourceID });
        const target = await SELECT.one.from(Accounts).where({ ID: targetAccountID });

        if (!source || !target) {
            return req.error(404, 'Source or target account not found');
        }

        // This would typically move contacts, opportunities, and activities to target
        // For now, just mark source as inactive
        await UPDATE(Accounts).set({
            status: 'Inactive',
            notes: (source.notes || '') + `\n[MERGED] Merged into account ${target.accountName} on ${new Date().toISOString()}`
        }).where({ ID: sourceID });

        return req.reply({
            message: 'Account merge completed',
            mergedInto: target.accountName
        });
    });

    // Action: Update Contact Engagement Score
    this.on('updateEngagementScore', 'Contacts', async (req) => {
        const contactID = req.params[0].ID;
        const contact = await SELECT.one.from(Contacts).where({ ID: contactID });

        if (!contact) {
            return req.error(404, `Contact ${contactID} not found`);
        }

        const engagementScore = calculateEngagementScore(contact);
        const sentiment = calculateContactSentiment(contact);

        await UPDATE(Contacts).set({
            engagementScore: engagementScore,
            sentimentScore: sentiment.score,
            sentimentLabel: sentiment.label
        }).where({ ID: contactID });

        return req.reply({ message: 'Engagement score updated', engagementScore });
    });

    // Action: Send Email to Contact
    this.on('sendEmail', 'Contacts', async (req) => {
        const contactID = req.params[0].ID;
        const { subject, body } = req.data;

        const contact = await SELECT.one.from(Contacts).where({ ID: contactID });

        if (!contact) {
            return req.error(404, `Contact ${contactID} not found`);
        }

        if (!contact.email) {
            return req.error(400, 'Contact does not have an email address');
        }

        // Mock email sending
        console.log(`[EMAIL] To: ${contact.email}`);
        console.log(`[EMAIL] Subject: ${subject}`);
        console.log(`[EMAIL] Body: ${body.substring(0, 100)}...`);

        // Log activity (would create Activity record in real implementation)
        await UPDATE(Contacts).set({
            lastContactDate: new Date().toISOString()
        }).where({ ID: contactID });

        return req.reply({
            message: 'Email sent successfully',
            sentTo: contact.email
        });
    });

    // Before CREATE Account: Set defaults
    this.before('CREATE', 'Accounts', async (req) => {
        const account = req.data;

        if (!account.status) {
            account.status = 'Prospect';
        }

        // Calculate initial health score
        account.healthScore = calculateAccountHealth(account);
    });

    // Before CREATE Contact: Validate and set defaults
    this.before('CREATE', 'Contacts', async (req) => {
        const contact = req.data;

        // Auto-generate full name if not provided
        if (!contact.fullName && (contact.firstName || contact.lastName)) {
            contact.fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
        }

        // Set default status
        if (!contact.status) {
            contact.status = 'Active';
        }

        // Calculate initial engagement score
        contact.engagementScore = calculateEngagementScore(contact);
    });
};

// Mock AI Functions
function calculateAccountHealth(account) {
    let score = 50;

    // Status
    if (account.status === 'Active') score += 20;
    else if (account.status === 'Prospect') score += 10;
    else if (account.status === 'Inactive') score -= 20;

    // Tier
    if (account.accountTier === 'Platinum') score += 25;
    else if (account.accountTier === 'Gold') score += 15;
    else if (account.accountTier === 'Silver') score += 5;

    // Revenue
    if (account.annualRevenue > 500000) score += 20;
    else if (account.annualRevenue > 100000) score += 10;

    // Completeness
    if (account.website) score += 5;
    if (account.phone) score += 5;
    if (account.address) score += 5;

    return Math.min(100, Math.max(0, score));
}

function calculateAccountSentiment(account) {
    const notes = (account.notes || '').toLowerCase();
    let score = 0;

    const positive = ['satisfied', 'excellent', 'happy', 'loyal', 'partnership'];
    const negative = ['unhappy', 'issues', 'complaints', 'churn', 'difficult'];

    positive.forEach(word => {
        if (notes.includes(word)) score += 20;
    });

    negative.forEach(word => {
        if (notes.includes(word)) score -= 20;
    });

    let label = 'Neutral';
    if (score >= 50) label = 'Very Positive';
    else if (score >= 20) label = 'Positive';
    else if (score <= -50) label = 'Very Negative';
    else if (score <= -20) label = 'Negative';

    return { score: Math.min(100, Math.max(-100, score)), label };
}

function calculateEngagementScore(contact) {
    let score = 50;

    // Primary contact
    if (contact.isPrimary) score += 15;

    // Contact information completeness
    if (contact.email) score += 10;
    if (contact.mobile) score += 10;
    if (contact.phone) score += 5;

    // Social media presence
    if (contact.instagramHandle) score += 10;
    if (contact.tiktokHandle) score += 10;
    if (contact.linkedinProfile) score += 5;

    // Recent activity
    if (contact.lastContactDate) {
        const daysSinceContact = (Date.now() - new Date(contact.lastContactDate)) / (1000 * 60 * 60 * 24);
        if (daysSinceContact < 7) score += 20;
        else if (daysSinceContact < 30) score += 10;
        else if (daysSinceContact > 90) score -= 10;
    }

    return Math.min(100, Math.max(0, score));
}

function calculateContactSentiment(contact) {
    const notes = (contact.notes || '').toLowerCase();
    const interests = (contact.interests || '').toLowerCase();
    let score = 0;

    const positive = ['engaged', 'interested', 'responsive', 'enthusiastic', 'advocate'];
    const negative = ['unresponsive', 'disengaged', 'difficult', 'hostile'];

    positive.forEach(word => {
        if (notes.includes(word) || interests.includes(word)) score += 15;
    });

    negative.forEach(word => {
        if (notes.includes(word)) score -= 15;
    });

    let label = 'Neutral';
    if (score >= 50) label = 'Very Positive';
    else if (score >= 20) label = 'Positive';
    else if (score <= -50) label = 'Very Negative';
    else if (score <= -20) label = 'Negative';

    return { score: Math.min(100, Math.max(-100, score)), label };
}
