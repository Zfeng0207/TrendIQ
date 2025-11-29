/**
 * Account Service Handler
 * Implements business logic for account and contact management
 */

const cds = require('@sap/cds');

module.exports = async function() {
    const { Accounts, Contacts, AccountRecommendations, AccountRiskAlerts, Opportunities, MarketingCampaigns, Activities } = this.entities;

    // Handler for virtual fields: criticality, priority score, and AI summaries (using after to avoid draft conflicts)
    this.after('READ', 'Accounts', async (results, req) => {
        const processAccount = async (account) => {
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

                // Calculate Priority Score (1-5 scale for CRM operations)
                const priorityScore100 = calculatePriorityScore(account);
                account.priorityScore = convertToPriorityScore1to5(priorityScore100);
                account.priorityScoreCriticality = getPriorityScoreCriticality(account.priorityScore);

                // Generate Last Follow Up text
                account.lastFollowUp = generateLastFollowUp(account);

                // Generate Pending Items text with icons
                account.pendingItems = generatePendingItemsWithIcons(account);

                // Set AssignedTo from accountManager or accountOwner
                // Try to get from expanded associations first
                if (account.accountManager && typeof account.accountManager === 'object' && account.accountManager.fullName) {
                    account.assignedTo = account.accountManager.fullName;
                } else if (account.accountOwner && typeof account.accountOwner === 'object' && account.accountOwner.fullName) {
                    account.assignedTo = account.accountOwner.fullName;
                } else if (account.accountManager_ID) {
                    // If we have the ID but not expanded, use demo value for now
                    account.assignedTo = generateAssignedToDemo(account);
                } else if (account.accountOwner_ID) {
                    account.assignedTo = generateAssignedToDemo(account);
                } else if (!account.assignedTo) {
                    account.assignedTo = generateAssignedToDemo(account);
                }

                // Set DateCreated from createdAt (managed aspect)
                if (!account.dateCreated && account.createdAt) {
                    account.dateCreated = account.createdAt.split('T')[0]; // Extract date part
                } else if (!account.dateCreated) {
                    account.dateCreated = generateDateCreatedDemo(account);
                }

                // Set Phase based on timeline stage or generate
                account.phase = determinePhase(account);
                account.phaseCriticality = getPhaseCriticality(account.phase);

                // Generate AI summaries
                const summaries = await generateAISummaries(account, Opportunities, AccountRecommendations, Activities);
                account.currentStageSummary = summaries.currentStage;
                account.nextStepsSummary = summaries.nextSteps;
            }
        };

        if (Array.isArray(results)) {
            for (const account of results) {
                await processAccount(account);
            }
        } else if (results) {
            await processAccount(results);
        }
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
        const sentimentTrend = calculateSentimentTrend(account);

        // Detect risk alerts
        const riskAlerts = detectRiskAlerts(account);
        for (const alert of riskAlerts) {
            await INSERT.into(AccountRiskAlerts).entries({
                account_ID: accountID,
                alertType: alert.type,
                severity: alert.severity,
                alertMessage: alert.message,
                detectedDate: new Date().toISOString(),
                isResolved: false
            });
        }

        await UPDATE(Accounts).set({
            healthScore: healthScore,
            sentimentScore: sentiment.score,
            recentSentimentTrend: sentimentTrend
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

    // Action: Get AI Recommendations
    this.on('getAIRecommendations', 'Accounts', async (req) => {
        console.log('[getAIRecommendations] Action triggered');
        console.log('[getAIRecommendations] Request params:', req.params);
        
        const accountID = req.params[0].ID;
        console.log('[getAIRecommendations] Account ID:', accountID);
        
        const account = await SELECT.one.from(Accounts).where({ ID: accountID });

        if (!account) {
            console.error('[getAIRecommendations] Account not found:', accountID);
            return req.error(404, `Account ${accountID} not found`);
        }

        console.log('[getAIRecommendations] Account found:', account.accountName);

        // Get related opportunities and campaigns
        const opportunities = await SELECT.from(Opportunities).where({ account_ID: accountID });
        const campaigns = await SELECT.from(MarketingCampaigns).where({ owner_ID: account.accountOwner_ID });
        
        console.log('[getAIRecommendations] Found', opportunities.length, 'opportunities and', campaigns.length, 'campaigns');

        // Generate recommendations
        const recommendations = generateRecommendations(account, opportunities, campaigns);
        console.log('[getAIRecommendations] Generated', recommendations.length, 'recommendations');

        // Store recommendations
        const recommendationEntries = recommendations.map(rec => ({
            account_ID: accountID,
            recommendationType: rec.type,
            recommendationText: rec.text,
            priority: rec.priority,
            aiGenerated: true,
            status: 'New',
            generatedDate: new Date().toISOString()
        }));

        await INSERT.into(AccountRecommendations).entries(recommendationEntries);
        console.log('[getAIRecommendations] Recommendations stored in database');

        // Return recommendations
        const savedRecommendations = await SELECT.from(AccountRecommendations)
            .where({ account_ID: accountID, status: 'New' })
            .orderBy('priority desc');

        console.log('[getAIRecommendations] Returning', savedRecommendations.length, 'recommendations');
        console.log('[getAIRecommendations] Action completed successfully');
        
        // Return a simple success result with the recommendations
        req.notify(200, `Successfully generated ${recommendations.length} AI recommendations! Please refresh the page to see them.`);
        
        return savedRecommendations;
    });

    // Action: Update Timeline Stage
    this.on('updateTimelineStage', 'Accounts', async (req) => {
        const accountID = req.params[0].ID;
        const { newStage, notes } = req.data;
        const account = await SELECT.one.from(Accounts).where({ ID: accountID });

        if (!account) {
            return req.error(404, `Account ${accountID} not found`);
        }

        const validStages = ['Onboarding', 'FinancialNegotiation', 'OpportunityDevelopment', 'CampaignExecution', 'RevenueRealization'];
        if (!validStages.includes(newStage)) {
            return req.error(400, `Invalid timeline stage: ${newStage}`);
        }

        // Determine status based on stage progression
        let stageStatus = 'InProgress';
        if (newStage === 'RevenueRealization' && account.currentTimelineStage === 'RevenueRealization') {
            stageStatus = 'Completed';
        }

        await UPDATE(Accounts).set({
            currentTimelineStage: newStage,
            timelineStageStatus: stageStatus,
            timelineStageNotes: notes || account.timelineStageNotes,
            timelineStageDeadline: calculateNextDeadline(newStage)
        }).where({ ID: accountID });

        const updatedAccount = await SELECT.one.from(Accounts).where({ ID: accountID });
        return updatedAccount;
    });

    // Action: Acknowledge Recommendation
    this.on('acknowledgeRecommendation', 'Accounts', async (req) => {
        const { recommendationID } = req.data;
        const recommendation = await SELECT.one.from(AccountRecommendations).where({ ID: recommendationID });

        if (!recommendation) {
            return req.error(404, `Recommendation ${recommendationID} not found`);
        }

        await UPDATE(AccountRecommendations).set({
            status: 'Acknowledged',
            acknowledgedDate: new Date().toISOString()
        }).where({ ID: recommendationID });

        const updated = await SELECT.one.from(AccountRecommendations).where({ ID: recommendationID });
        return updated;
    });

    // Action: Dismiss Risk Alert
    this.on('dismissRiskAlert', 'Accounts', async (req) => {
        const { alertID } = req.data;
        const alert = await SELECT.one.from(AccountRiskAlerts).where({ ID: alertID });

        if (!alert) {
            return req.error(404, `Risk alert ${alertID} not found`);
        }

        await UPDATE(AccountRiskAlerts).set({
            isResolved: true,
            resolvedDate: new Date().toISOString()
        }).where({ ID: alertID });

        const updated = await SELECT.one.from(AccountRiskAlerts).where({ ID: alertID });
        return updated;
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

// Helper: Calculate Sentiment Trend
function calculateSentimentTrend(account) {
    const score = account.sentimentScore || 0;
    if (score > 20) return 'Improving';
    if (score < -20) return 'Declining';
    return 'Stable';
}

// Helper: Detect Risk Alerts
function detectRiskAlerts(account) {
    const alerts = [];

    // Declining engagement
    if (account.healthScore < 50) {
        alerts.push({
            type: 'DecliningEngagement',
            severity: account.healthScore < 30 ? 'Critical' : 'High',
            message: `Account health score has dropped to ${account.healthScore}. Immediate attention required.`
        });
    }

    // Negative sentiment
    if (account.sentimentScore < -20) {
        alerts.push({
            type: 'NegativeSentiment',
            severity: account.sentimentScore < -50 ? 'Critical' : 'High',
            message: `Negative sentiment detected (score: ${account.sentimentScore}). Review recent interactions.`
        });
    }

    // Slow response (if we had last contact date)
    if (account.recentSentimentTrend === 'Declining') {
        alerts.push({
            type: 'SlowResponse',
            severity: 'Medium',
            message: 'Sentiment trend is declining. Follow up required.'
        });
    }

    return alerts;
}

// Helper: Generate Recommendations
function generateRecommendations(account, opportunities, campaigns) {
    const recommendations = [];

    // Product recommendations
    if (account.accountType === 'Salon' || account.accountType === 'Spa') {
        recommendations.push({
            type: 'Product',
            text: `Based on account type (${account.accountType}), recommend skincare product bundles for professional use.`,
            priority: 'High'
        });
    }

    // Campaign opportunities
    if (campaigns.length === 0) {
        recommendations.push({
            type: 'Campaign',
            text: 'No active campaigns found. Consider launching a joint marketing campaign to increase engagement.',
            priority: 'Medium'
        });
    }

    // Deal recommendations
    if (opportunities.length > 0) {
        const totalPipeline = opportunities.reduce((sum, opp) => sum + (opp.expectedRevenue || 0), 0);
        if (totalPipeline > 100000) {
            recommendations.push({
                type: 'Deal',
                text: `High-value pipeline detected (RM ${totalPipeline.toLocaleString()}). Prioritize deal closure.`,
                priority: 'High'
            });
        }
    } else {
        recommendations.push({
            type: 'Deal',
            text: 'No active opportunities. Create new opportunity to drive revenue growth.',
            priority: 'Medium'
        });
    }

    // Risk recommendations
    if (account.riskLevel === 'High' || account.riskLevel === 'Critical') {
        recommendations.push({
            type: 'Risk',
            text: `Account has ${account.riskLevel.toLowerCase()} risk level. Review account health and engagement strategy.`,
            priority: 'High'
        });
    }

    return recommendations;
}

// Helper: Calculate Next Deadline
function calculateNextDeadline(stage) {
    const now = new Date();
    const deadlines = {
        'Onboarding': 7,           // 7 days
        'FinancialNegotiation': 14, // 14 days
        'OpportunityDevelopment': 21, // 21 days
        'CampaignExecution': 30,   // 30 days
        'RevenueRealization': 60    // 60 days
    };

    const days = deadlines[stage] || 30;
    now.setDate(now.getDate() + days);
    return now.toISOString();
}

// Helper: Calculate Priority Score (0-100)
function calculatePriorityScore(account) {
    let score = 0;

    // Health Score (40% weight)
    const healthWeight = 0.4;
    score += (account.healthScore || 0) * healthWeight;

    // Revenue Potential (25% weight)
    const revenueWeight = 0.25;
    let revenueScore = 0;
    if (account.annualRevenue) {
        if (account.annualRevenue > 1000000) revenueScore = 100;
        else if (account.annualRevenue > 500000) revenueScore = 80;
        else if (account.annualRevenue > 100000) revenueScore = 60;
        else if (account.annualRevenue > 50000) revenueScore = 40;
        else revenueScore = 20;
    }
    if (account.estimatedMonthlyGMV) {
        const monthlyGMVScore = Math.min(100, (account.estimatedMonthlyGMV / 10000) * 10);
        revenueScore = Math.max(revenueScore, monthlyGMVScore);
    }
    score += revenueScore * revenueWeight;

    // Account Tier (15% weight)
    const tierWeight = 0.15;
    let tierScore = 0;
    switch (account.accountTier) {
        case 'Platinum': tierScore = 100; break;
        case 'Gold': tierScore = 75; break;
        case 'Silver': tierScore = 50; break;
        case 'Bronze': tierScore = 25; break;
        default: tierScore = 0;
    }
    score += tierScore * tierWeight;

    // Timeline Stage Progress (10% weight)
    const stageWeight = 0.1;
    let stageScore = 0;
    const stages = ['Onboarding', 'FinancialNegotiation', 'OpportunityDevelopment', 'CampaignExecution', 'RevenueRealization'];
    const currentStageIndex = stages.indexOf(account.currentTimelineStage || '');
    if (currentStageIndex >= 0) {
        stageScore = ((currentStageIndex + 1) / stages.length) * 100;
    }
    if (account.timelineStageStatus === 'Completed') stageScore = 100;
    else if (account.timelineStageStatus === 'Delayed') stageScore *= 0.7;
    else if (account.timelineStageStatus === 'Blocked') stageScore *= 0.5;
    score += stageScore * stageWeight;

    // Sentiment (10% weight)
    const sentimentWeight = 0.1;
    const sentimentScore = Math.max(0, Math.min(100, (account.sentimentScore || 0) + 100) / 2);
    score += sentimentScore * sentimentWeight;

    return Math.round(Math.min(100, Math.max(0, score)));
}

// Helper: Generate AI Summaries
async function generateAISummaries(account, Opportunities, AccountRecommendations, Activities) {
    // Get related data for context
    let opportunities = [];
    let recentActivities = [];
    let recommendations = [];

    try {
        if (account.ID) {
            opportunities = await SELECT.from(Opportunities).where({ account_ID: account.ID }).limit(5);
            if (Activities) {
                recentActivities = await SELECT.from(Activities)
                    .where({ relatedAccount_ID: account.ID })
                    .orderBy({ startDateTime: 'desc' })
                    .limit(5);
            }
            recommendations = await SELECT.from(AccountRecommendations)
                .where({ account_ID: account.ID, status: 'New' })
                .limit(3);
        }
    } catch (e) {
        console.warn('Error fetching related data for AI summaries:', e);
    }

    // Generate Current Stage Summary
    const currentStageSummary = generateCurrentStageSummary(account, opportunities, recentActivities);

    // Generate Next Steps Summary
    const nextStepsSummary = generateNextStepsSummary(account, opportunities, recommendations);

    return {
        currentStage: currentStageSummary,
        nextSteps: nextStepsSummary
    };
}

// Helper: Generate Current Stage Summary
function generateCurrentStageSummary(account, opportunities, activities = []) {
    const stage = account.currentTimelineStage || 'Not Started';
    const status = account.timelineStageStatus || 'NotStarted';
    const accountName = account.accountName || 'This account';

    let summary = `**Current Stage: ${stage}**\n\n`;
    
    if (status === 'Completed') {
        summary += `${accountName} has successfully completed the ${stage} stage. `;
    } else if (status === 'InProgress') {
        summary += `${accountName} is currently in the ${stage} stage. `;
    } else if (status === 'Delayed') {
        summary += `${accountName}'s progress in ${stage} has been delayed. `;
    } else if (status === 'Blocked') {
        summary += `${accountName}'s progress in ${stage} is currently blocked. `;
    } else {
        summary += `${accountName} has not yet started the ${stage} stage. `;
    }

    // Add context from recent activities
    if (activities && activities.length > 0) {
        const lastActivity = activities[0];
        const daysSince = lastActivity.startDateTime 
            ? Math.floor((new Date() - new Date(lastActivity.startDateTime)) / (1000 * 60 * 60 * 24))
            : null;
        
        if (daysSince !== null && daysSince < 30) {
            summary += `Most recent activity was ${lastActivity.activityType || 'an interaction'} ${daysSince} day${daysSince !== 1 ? 's' : ''} ago. `;
        }
    }

    // Add opportunity context
    if (opportunities && opportunities.length > 0) {
        const activeOpps = opportunities.filter(opp => opp.stage !== 'Closed Won' && opp.stage !== 'Closed Lost');
        if (activeOpps.length > 0) {
            summary += `There ${activeOpps.length === 1 ? 'is' : 'are'} ${activeOpps.length} active opportunit${activeOpps.length === 1 ? 'y' : 'ies'} in the pipeline. `;
        }
    }

    // Add health context
    if (account.healthScore !== undefined) {
        if (account.healthScore >= 80) {
            summary += `Account health is excellent (${account.healthScore}/100).`;
        } else if (account.healthScore >= 50) {
            summary += `Account health is moderate (${account.healthScore}/100).`;
        } else {
            summary += `Account health requires attention (${account.healthScore}/100).`;
        }
    }

    return summary;
}

// Helper: Generate Next Steps Summary
function generateNextStepsSummary(account, opportunities, recommendations) {
    const stage = account.currentTimelineStage || 'Onboarding';
    const status = account.timelineStageStatus || 'NotStarted';
    const accountName = account.accountName || 'This account';

    let summary = `**Recommended Next Steps:**\n\n`;

    // Stage-specific next steps
    if (status === 'Blocked') {
        summary += `⚠️ **Immediate Action Required:** ${accountName} is blocked in ${stage}. Review blockers and take corrective action. `;
    } else if (status === 'Delayed') {
        summary += `⏱️ **Acceleration Needed:** ${accountName} is delayed in ${stage}. Consider expediting key activities. `;
    }

    // Stage progression recommendations
    const stageRecommendations = {
        'Onboarding': 'Complete onboarding documentation and initial setup. Schedule kickoff meeting with key stakeholders.',
        'FinancialNegotiation': 'Finalize pricing terms and payment structure. Prepare contract documents for review.',
        'OpportunityDevelopment': 'Identify and qualify new opportunities. Develop proposals for high-value deals.',
        'CampaignExecution': 'Launch joint marketing campaigns. Monitor campaign performance and engagement metrics.',
        'RevenueRealization': 'Focus on deal closure and revenue recognition. Expand partnership scope and scale.'
    };

    if (stageRecommendations[stage]) {
        summary += `${stageRecommendations[stage]} `;
    }

    // Add deadline context
    if (account.timelineStageDeadline) {
        const deadline = new Date(account.timelineStageDeadline);
        const daysUntil = Math.floor((deadline - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntil > 0) {
            summary += `Deadline is in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}. `;
        } else if (daysUntil === 0) {
            summary += `⚠️ Deadline is today! `;
        } else {
            summary += `⚠️ Deadline was ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} ago. `;
        }
    }

    // Add recommendation-based next steps
    if (recommendations && recommendations.length > 0) {
        const highPriorityRecs = recommendations.filter(r => r.priority === 'High');
        if (highPriorityRecs.length > 0) {
            summary += `\n\n**AI Recommendations:** ${highPriorityRecs[0].recommendationText}`;
        }
    }

    // Add opportunity-based next steps
    if (opportunities && opportunities.length > 0) {
        const highValueOpps = opportunities.filter(opp => 
            opp.expectedRevenue && opp.expectedRevenue > 50000 && 
            opp.stage !== 'Closed Won' && opp.stage !== 'Closed Lost'
        );
        if (highValueOpps.length > 0) {
            summary += `\n\n**High-Value Opportunities:** Focus on closing ${highValueOpps.length} high-value deal${highValueOpps.length !== 1 ? 's' : ''} in the pipeline.`;
        }
    }

    return summary;
}

// Helper: Convert Priority Score from 0-100 to 1-5 scale
function convertToPriorityScore1to5(score100) {
    if (score100 >= 80) return 5; // High Priority
    if (score100 >= 60) return 4; // Medium-High
    if (score100 >= 40) return 3; // Medium
    if (score100 >= 20) return 2; // Low-Medium
    return 1; // Low Priority
}

// Helper: Get Priority Score Criticality for color coding
// 5 = Red (1), 4 = Orange (2), 3 = Yellow (2), 2 = Light Green (3), 1 = Dark Green (3)
function getPriorityScoreCriticality(priorityScore) {
    switch (priorityScore) {
        case 5: return 1; // Red (Critical/Negative)
        case 4: return 2; // Orange (Warning)
        case 3: return 2; // Yellow (Warning)
        case 2: return 3; // Light Green (Positive)
        case 1: return 3; // Dark Green (Positive)
        default: return 0; // Neutral
    }
}

// Helper: Generate Last Follow Up text
function generateLastFollowUp(account) {
    // Try to get from last activity date
    if (account.lastContactDate) {
        const lastContact = new Date(account.lastContactDate);
        const now = new Date();
        const diffMs = now - lastContact;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        const diffWeeks = Math.floor(diffDays / 7);

        if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        } else if (diffWeeks < 4) {
            return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
        } else {
            const diffMonths = Math.floor(diffDays / 30);
            return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
        }
    }

    // Generate demo values based on account ID for consistency
    const demoValues = [
        '7 hours ago',
        '3 days ago',
        '1 week ago',
        '2 weeks ago',
        '5 days ago',
        '12 hours ago',
        '4 days ago',
        '1 month ago'
    ];
    
    // Use account ID hash to get consistent demo value
    if (account.ID) {
        const hash = account.ID.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return demoValues[hash % demoValues.length];
    }
    
    return '1 week ago'; // Default
}

// Helper: Generate Pending Items text with icons
function generatePendingItemsWithIcons(account) {
    // Generate demo values with icons based on account ID for consistency
    const demoValues = [
        '📝 2 Tasks',
        '✔️ 1 Approval',
        '📄 3 Documents',
        '📝 1 Task, ✔️ 2 Approvals',
        '📄 2 Documents',
        '✔️ 1 Approval, 📝 1 Task',
        '📝 3 Tasks, 📄 1 Document',
        'No pending items',
        '📝 1 Task',
        '✔️ 2 Approvals, 📄 1 Document'
    ];
    
    // Use account ID hash to get consistent demo value
    if (account.ID) {
        const hash = account.ID.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return demoValues[hash % demoValues.length];
    }
    
    return '📝 2 Tasks'; // Default
}

// Helper: Generate Pending Items text (legacy, kept for compatibility)
function generatePendingItems(account) {
    return generatePendingItemsWithIcons(account);
}

// Helper: Generate AssignedTo demo value
function generateAssignedToDemo(account) {
    const demoNames = [
        'Sarah Tan',
        'Kevin Tan',
        'Lisa Wong',
        'David Lee',
        'Amy Chen',
        'Michael Lim',
        'Jennifer Ng',
        'James Ho',
        'Rachel Yap',
        'Tommy Ong'
    ];
    
    if (account.ID) {
        const hash = account.ID.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return demoNames[hash % demoNames.length];
    }
    
    return 'Sarah Tan'; // Default
}

// Helper: Generate DateCreated demo value
function generateDateCreatedDemo(account) {
    // Generate dates within the last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    if (account.ID) {
        const hash = account.ID.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const daysAgo = hash % 180; // 0-179 days ago
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    }
    
    // Default: 30 days ago
    const defaultDate = new Date(now);
    defaultDate.setDate(defaultDate.getDate() - 30);
    return defaultDate.toISOString().split('T')[0];
}

// Helper: Determine Phase from timeline stage
function determinePhase(account) {
    // Map timeline stages to phases
    const stageToPhase = {
        'Onboarding': 'Onboarding',
        'FinancialNegotiation': 'Dealing',
        'OpportunityDevelopment': 'Dealing',
        'CampaignExecution': 'Running Campaign',
        'RevenueRealization': 'Discounting'
    };

    if (account.currentTimelineStage && stageToPhase[account.currentTimelineStage]) {
        // If stage is completed, move to next phase or Completed
        if (account.timelineStageStatus === 'Completed') {
            if (account.currentTimelineStage === 'RevenueRealization') {
                return 'Completed';
            }
            // Otherwise stay in current phase
        }
        return stageToPhase[account.currentTimelineStage];
    }

    // Default based on status or generate demo
    if (account.status === 'Inactive') {
        return 'Completed';
    }

    // Generate demo values based on account ID for consistency
    const demoPhases = ['Onboarding', 'Dealing', 'Running Campaign', 'Discounting', 'Completed'];
    if (account.ID) {
        const hash = account.ID.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return demoPhases[hash % demoPhases.length];
    }

    return 'Onboarding'; // Default
}

// Helper: Get Phase Criticality for color coding
// Onboarding = Blue (0), Dealing = Orange (2), Running Campaign = Purple (0), Discounting = Yellow (2), Completed = Green (3)
function getPhaseCriticality(phase) {
    switch (phase) {
        case 'Onboarding': return 0; // Blue (Neutral - will need custom styling)
        case 'Dealing': return 2; // Orange (Warning)
        case 'Running Campaign': return 0; // Purple (Neutral - will need custom styling)
        case 'Discounting': return 2; // Yellow (Warning)
        case 'Completed': return 3; // Green (Positive)
        default: return 0; // Neutral
    }
}
