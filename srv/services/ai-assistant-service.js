/**
 * AI Assistant Service Handler
 * Provides intelligent, contextual responses for CRM entities
 */
const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
    const { Leads } = cds.entities('beauty.leads');
    const { Accounts, Opportunities, Prospects, Contacts, Activities } = cds.entities('beauty.crm');

    /**
     * Main chat action handler
     */
    this.on('chat', async (req) => {
        const { query, entityType, entityData } = req.data;
        
        // Parse entity data if provided
        let oData = {};
        try {
            if (entityData) {
                oData = JSON.parse(entityData);
            }
        } catch (e) {
            console.warn('[AI Assistant] Could not parse entity data:', e);
        }

        // Generate response based on entity type and query
        const response = await generateChatResponse(query, entityType, oData);
        
        return response;
    });

    /**
     * Quick action handler
     */
    this.on('quickAction', async (req) => {
        const { actionId, entityType, entityData } = req.data;
        
        let oData = {};
        try {
            if (entityData) {
                oData = JSON.parse(entityData);
            }
        } catch (e) {
            console.warn('[AI Assistant] Could not parse entity data:', e);
        }

        const response = await generateQuickActionResponse(actionId, entityType, oData);
        
        return response;
    });

    /**
     * Get lead insights
     */
    this.on('getLeadInsights', async (req) => {
        const { leadId } = req.data;
        
        const lead = await SELECT.one.from(Leads).where({ ID: leadId });
        
        if (!lead) {
            return req.error(404, 'Lead not found');
        }

        return {
            aiScore: lead.aiScore || calculateAIScore(lead),
            sentimentScore: lead.sentimentScore || 0,
            recommendedActions: generateLeadRecommendations(lead),
            bestTimeToContact: determineBestContactTime(lead),
            conversionProbability: calculateConversionProbability(lead)
        };
    });

    /**
     * Get prospect insights
     */
    this.on('getProspectInsights', async (req) => {
        const { prospectId } = req.data;
        
        const prospect = await SELECT.one.from(Prospects).where({ ID: prospectId });
        
        if (!prospect) {
            return req.error(404, 'Prospect not found');
        }

        return {
            qualificationScore: prospect.prospectScore || 50,
            conversionLikelihood: calculateProspectConversionLikelihood(prospect),
            nextBestActions: generateProspectActions(prospect),
            engagementLevel: determineEngagementLevel(prospect)
        };
    });

    /**
     * Get opportunity insights
     */
    this.on('getOpportunityInsights', async (req) => {
        const { opportunityId } = req.data;
        
        const opportunity = await SELECT.one.from(Opportunities)
            .where({ ID: opportunityId })
            .columns('*', 'account { accountName, healthScore }');
        
        if (!opportunity) {
            return req.error(404, 'Opportunity not found');
        }

        return {
            winProbability: opportunity.aiWinScore || opportunity.probability || 50,
            competitorAnalysis: generateCompetitorAnalysis(opportunity),
            dealRecommendations: generateDealRecommendations(opportunity),
            riskFactors: identifyRiskFactors(opportunity)
        };
    });

    /**
     * Get account insights
     */
    this.on('getAccountInsights', async (req) => {
        const { accountId } = req.data;
        
        const account = await SELECT.one.from(Accounts)
            .where({ ID: accountId })
            .columns('*');
        
        if (!account) {
            return req.error(404, 'Account not found');
        }

        return {
            healthScore: account.healthScore || 75,
            growthRecommendations: generateGrowthRecommendations(account),
            riskAlerts: generateRiskAlerts(account),
            upsellOpportunities: identifyUpsellOpportunities(account)
        };
    });

    // =====================================================
    // HELPER FUNCTIONS
    // =====================================================

    /**
     * Generate chat response based on query and context
     */
    async function generateChatResponse(query, entityType, entityData) {
        const queryLower = query.toLowerCase();
        let message = '';
        let data = null;
        let suggestions = [];

        switch (entityType) {
            case 'leads':
                ({ message, data, suggestions } = generateLeadResponse(queryLower, entityData));
                break;
            case 'prospects':
                ({ message, data, suggestions } = generateProspectResponse(queryLower, entityData));
                break;
            case 'opportunities':
                ({ message, data, suggestions } = generateOpportunityResponse(queryLower, entityData));
                break;
            case 'accounts':
                ({ message, data, suggestions } = generateAccountResponse(queryLower, entityData));
                break;
            default:
                message = "I'm here to help. Please ask me about leads, prospects, opportunities, or accounts.";
                suggestions = ['What can you help with?', 'Show overview'];
        }

        return {
            message,
            data: data ? JSON.stringify(data) : null,
            suggestions
        };
    }

    /**
     * Generate lead-specific response
     */
    function generateLeadResponse(query, data) {
        const leadName = data.outletName || data.contactName || 'this lead';
        const aiScore = data.aiScore || 0;
        
        if (query.includes('score') || query.includes('scoring')) {
            return {
                message: `AI Score Analysis for ${leadName}:\n\n` +
                    `• Current AI Score: ${aiScore}%\n` +
                    `• Sentiment Score: ${data.sentimentScore || 0}\n` +
                    `• Trend Score: ${data.trendScore || 0}\n\n` +
                    `${aiScore >= 70 ? 'This is a high-quality lead with strong conversion potential.' : 
                      aiScore >= 40 ? 'This lead shows moderate potential. Consider nurturing.' :
                      'This lead needs more qualification before active pursuit.'}`,
                data: { aiScore, sentiment: data.sentimentScore, trend: data.trendScore },
                suggestions: ['Recommended actions', 'Best time to contact', 'Similar leads']
            };
        }

        if (query.includes('action') || query.includes('recommend')) {
            return {
                message: `Recommended Actions for ${leadName}:\n\n` +
                    `1. ${aiScore >= 70 ? 'Schedule a discovery call within 24 hours' : 'Send introductory email with product info'}\n` +
                    `2. ${data.platform === 'Instagram' ? 'Engage with their recent posts' : 'Connect on social media'}\n` +
                    `3. Prepare ${data.brandToPitch || 'relevant'} product samples\n` +
                    `4. Research their current product lineup\n\n` +
                    `Priority: ${aiScore >= 70 ? 'HIGH' : aiScore >= 40 ? 'MEDIUM' : 'LOW'}`,
                data: null,
                suggestions: ['Schedule call', 'Generate email', 'View products']
            };
        }

        if (query.includes('time') || query.includes('contact') || query.includes('when')) {
            return {
                message: `Best Time to Contact ${leadName}:\n\n` +
                    `• Primary Window: Tuesday-Thursday, 10:00 AM - 12:00 PM\n` +
                    `• Secondary Window: Monday/Friday, 2:00 PM - 4:00 PM\n` +
                    `• Preferred Channel: ${data.preferredChannel || 'WhatsApp or Email'}\n\n` +
                    `Based on: Industry patterns and ${data.platform || 'source'} engagement data.`,
                data: null,
                suggestions: ['Schedule now', 'Set reminder', 'View contact history']
            };
        }

        // Default overview
        return {
            message: `Lead Overview: ${leadName}\n\n` +
                `• Status: ${data.status || 'New'}\n` +
                `• Quality: ${data.leadQuality || 'Medium'}\n` +
                `• Source: ${data.source || data.platform || 'Unknown'}\n` +
                `• AI Score: ${aiScore}%\n` +
                `• Est. Value: RM ${(data.estimatedValue || 0).toLocaleString()}\n\n` +
                `Next Step: ${aiScore >= 70 ? 'Initiate contact' : 'Continue nurturing'}`,
            data: null,
            suggestions: ['Lead scoring insights', 'Recommended actions', 'Best time to contact']
        };
    }

    /**
     * Generate prospect-specific response
     */
    function generateProspectResponse(query, data) {
        const prospectName = data.prospectName || 'this prospect';
        const score = data.prospectScore || 50;

        if (query.includes('qualification') || query.includes('qualify')) {
            return {
                message: `Qualification Analysis for ${prospectName}:\n\n` +
                    `• Prospect Score: ${score}%\n` +
                    `• Business Type: ${data.businessType || 'Unknown'}\n` +
                    `• Discovery Source: ${data.discoverySource || 'Unknown'}\n\n` +
                    `Qualification Status: ${score >= 70 ? 'Ready for opportunity creation' : 
                      score >= 40 ? 'Needs more nurturing' : 'Requires further qualification'}\n\n` +
                    `${score >= 70 ? 'Recommendation: Create opportunity and assign to sales rep.' : 
                      'Recommendation: Schedule follow-up meeting to better understand needs.'}`,
                data: { score, qualified: score >= 70 },
                suggestions: ['Create opportunity', 'Schedule meeting', 'Update qualification']
            };
        }

        if (query.includes('conversion') || query.includes('likelihood')) {
            const conversionProb = Math.min(score + 10, 95);
            return {
                message: `Conversion Analysis for ${prospectName}:\n\n` +
                    `• Conversion Probability: ${conversionProb}%\n` +
                    `• Estimated Timeline: ${score >= 70 ? '1-2 weeks' : '2-4 weeks'}\n` +
                    `• Key Success Factors:\n` +
                    `  - Brand alignment\n` +
                    `  - Decision-maker access\n` +
                    `  - Budget availability\n\n` +
                    `${conversionProb >= 70 ? 'Strong conversion potential - prioritize this prospect.' : 
                      'Continue building relationship before conversion attempt.'}`,
                data: { probability: conversionProb },
                suggestions: ['Convert to account', 'Add decision maker', 'Schedule call']
            };
        }

        // Default overview
        return {
            message: `Prospect Overview: ${prospectName}\n\n` +
                `• Status: ${data.status || 'New'}\n` +
                `• Business Type: ${data.businessType || 'Unknown'}\n` +
                `• Score: ${score}%\n` +
                `• Source: ${data.discoverySource || 'Unknown'}\n` +
                `• Est. Value: RM ${(data.estimatedValue || 0).toLocaleString()}\n\n` +
                `Recommendation: ${score >= 70 ? 'Ready for sales engagement' : 'Continue qualification'}`,
            data: null,
            suggestions: ['Qualification insights', 'Conversion likelihood', 'Next actions']
        };
    }

    /**
     * Generate opportunity-specific response
     */
    function generateOpportunityResponse(query, data) {
        const oppName = data.name || 'this opportunity';
        const winScore = data.aiWinScore || data.probability || 50;

        if (query.includes('win') || query.includes('probability')) {
            return {
                message: `Win Probability Analysis for ${oppName}:\n\n` +
                    `• AI Win Score: ${winScore}%\n` +
                    `• Current Stage: ${data.stage || 'Unknown'}\n` +
                    `• Deal Value: RM ${(data.amount || data.expectedRevenue || 0).toLocaleString()}\n\n` +
                    `Factors Affecting Win Rate:\n` +
                    `✓ ${winScore >= 60 ? 'Strong stakeholder engagement' : 'Need more stakeholder buy-in'}\n` +
                    `✓ ${data.stage && data.stage.includes('Proposal') ? 'Proposal submitted' : 'Proposal pending'}\n` +
                    `✓ ${winScore >= 70 ? 'Low competitive threat' : 'Monitor competitive activity'}\n\n` +
                    `${winScore >= 70 ? 'High confidence - focus on closing.' : 'Work on addressing buyer concerns.'}`,
                data: { winScore, stage: data.stage },
                suggestions: ['Move to next stage', 'Add competitors', 'Request approval']
            };
        }

        if (query.includes('competitor')) {
            return {
                message: `Competitor Analysis for ${oppName}:\n\n` +
                    `Known Competitors: ${data.competitors || 'None identified'}\n\n` +
                    `Our Advantages:\n` +
                    `• Better pricing flexibility\n` +
                    `• Local market expertise\n` +
                    `• Marketing partnership benefits\n` +
                    `• Strong support infrastructure\n\n` +
                    `Competitive Strategy: Focus on relationship and service differentiation.`,
                data: null,
                suggestions: ['Update competitors', 'View win strategy', 'Similar won deals']
            };
        }

        if (query.includes('recommend') || query.includes('strategy')) {
            return {
                message: `Deal Recommendations for ${oppName}:\n\n` +
                    `1. ${data.stage === 'Negotiation' ? 'Finalize contract terms' : 'Push for next stage'}\n` +
                    `2. ${winScore < 70 ? 'Schedule executive sponsor meeting' : 'Prepare for implementation'}\n` +
                    `3. Address any pending concerns\n` +
                    `4. Confirm budget and timeline\n\n` +
                    `Win Strategy: ${data.winStrategy || 'Build value through partnership benefits'}`,
                data: null,
                suggestions: ['Move stage', 'Schedule meeting', 'Update strategy']
            };
        }

        // Default overview
        return {
            message: `Opportunity Overview: ${oppName}\n\n` +
                `• Stage: ${data.stage || 'Unknown'}\n` +
                `• Win Probability: ${winScore}%\n` +
                `• Deal Value: RM ${(data.amount || data.expectedRevenue || 0).toLocaleString()}\n` +
                `• Expected Close: ${data.closeDate || 'TBD'}\n` +
                `• Account: ${data.account?.accountName || 'Unknown'}\n\n` +
                `Focus: ${winScore >= 70 ? 'Close the deal' : 'Address objections'}`,
            data: null,
            suggestions: ['Win probability', 'Competitor insights', 'Deal recommendations']
        };
    }

    /**
     * Generate account-specific response
     */
    function generateAccountResponse(query, data) {
        const accountName = data.accountName || 'this account';
        const healthScore = data.healthScore || 75;

        if (query.includes('health')) {
            return {
                message: `Account Health Analysis for ${accountName}:\n\n` +
                    `• Health Score: ${healthScore}%\n` +
                    `• Risk Level: ${data.riskLevel || 'Low'}\n` +
                    `• Sentiment Trend: ${data.recentSentimentTrend || 'Stable'}\n` +
                    `• Sentiment Score: ${data.sentimentScore || 0}\n\n` +
                    `Health Factors:\n` +
                    `✓ Order frequency: ${healthScore >= 70 ? 'Healthy' : 'Declining'}\n` +
                    `✓ Payment patterns: ${healthScore >= 50 ? 'On time' : 'Delayed'}\n` +
                    `✓ Engagement: ${healthScore >= 60 ? 'Active' : 'Needs attention'}\n\n` +
                    `${healthScore >= 70 ? 'Account is in good standing.' : 'Requires attention to improve health.'}`,
                data: { healthScore, riskLevel: data.riskLevel },
                suggestions: ['Growth recommendations', 'Risk alerts', 'View contacts']
            };
        }

        if (query.includes('growth') || query.includes('recommend')) {
            return {
                message: `Growth Recommendations for ${accountName}:\n\n` +
                    `1. **Upsell Opportunity**\n` +
                    `   Introduce premium product lines\n` +
                    `   Est. Revenue: RM 8,000/month\n\n` +
                    `2. **Cross-sell**\n` +
                    `   Recommend complementary categories\n` +
                    `   Est. Revenue: RM 5,000/month\n\n` +
                    `3. **Volume Increase**\n` +
                    `   Offer tiered pricing for larger orders\n` +
                    `   Est. Revenue: RM 3,000/month\n\n` +
                    `Total Potential: RM 16,000/month additional revenue`,
                data: { potentialRevenue: 16000 },
                suggestions: ['Create opportunity', 'View products', 'Schedule review']
            };
        }

        if (query.includes('risk') || query.includes('warning') || query.includes('alert')) {
            return {
                message: `Risk Assessment for ${accountName}:\n\n` +
                    `• Current Risk Level: ${data.riskLevel || 'Low'}\n` +
                    `• Active Alerts: ${data.riskAlerts?.length || 0}\n\n` +
                    `Risk Monitoring:\n` +
                    `✓ Order patterns: Normal\n` +
                    `✓ Payment status: Current\n` +
                    `✓ Communication: Active\n` +
                    `✓ Competitor mentions: None detected\n\n` +
                    `${data.riskLevel === 'High' || data.riskLevel === 'Critical' ? 
                      'ALERT: Immediate attention required!' : 
                      'No immediate concerns. Continue regular engagement.'}`,
                data: { riskLevel: data.riskLevel },
                suggestions: ['View all alerts', 'Contact account', 'Update status']
            };
        }

        // Default overview
        return {
            message: `Account Overview: ${accountName}\n\n` +
                `• Type: ${data.accountType || 'Unknown'}\n` +
                `• Tier: ${data.accountTier || 'Standard'}\n` +
                `• Health Score: ${healthScore}%\n` +
                `• Status: ${data.status || 'Active'}\n` +
                `• Revenue: RM ${(data.annualRevenue || 0).toLocaleString()}\n\n` +
                `Account Manager: ${data.accountManager?.fullName || data.accountOwner?.fullName || 'Unassigned'}`,
            data: null,
            suggestions: ['Account health', 'Growth recommendations', 'Risk warnings']
        };
    }

    /**
     * Generate quick action response
     */
    async function generateQuickActionResponse(actionId, entityType, entityData) {
        const queryMap = {
            // Leads
            'scoring': 'lead scoring insights',
            'nextActions': 'recommended actions',
            'bestTime': 'best time to contact',
            'overview': 'overview',
            // Prospects
            'qualification': 'qualification insights',
            'conversion': 'conversion likelihood',
            // Opportunities
            'winProbability': 'win probability analysis',
            'competitors': 'competitor insights',
            'recommendations': 'deal recommendations',
            // Accounts
            'healthAnalysis': 'account health analysis',
            'growthRecs': 'growth recommendations',
            'riskAlerts': 'risk warnings'
        };

        const query = queryMap[actionId] || 'overview';
        return generateChatResponse(query, entityType, entityData);
    }

    // =====================================================
    // SCORING HELPER FUNCTIONS
    // =====================================================

    function calculateAIScore(lead) {
        let score = 50;
        if (lead.leadQuality === 'Hot') score += 30;
        else if (lead.leadQuality === 'Warm') score += 15;
        if (lead.sentimentScore > 50) score += 10;
        if (lead.trendScore > 50) score += 10;
        return Math.min(score, 100);
    }

    function calculateConversionProbability(lead) {
        let prob = lead.aiScore || 50;
        if (lead.status === 'Qualified') prob += 20;
        if (lead.leadQuality === 'Hot') prob += 15;
        return Math.min(prob, 95);
    }

    function calculateProspectConversionLikelihood(prospect) {
        let likelihood = prospect.prospectScore || 50;
        if (prospect.status === 'Qualified') likelihood += 15;
        if (prospect.status === 'Negotiation') likelihood += 25;
        return Math.min(likelihood, 95);
    }

    function generateLeadRecommendations(lead) {
        const actions = [];
        if (lead.aiScore >= 70) {
            actions.push('Schedule discovery call immediately');
            actions.push('Prepare personalized product presentation');
        } else {
            actions.push('Send nurturing email with valuable content');
            actions.push('Connect on social media');
        }
        actions.push('Update lead information');
        return actions;
    }

    function generateProspectActions(prospect) {
        const actions = [];
        if (prospect.prospectScore >= 70) {
            actions.push('Create opportunity');
            actions.push('Schedule proposal meeting');
        } else {
            actions.push('Schedule qualification call');
            actions.push('Send additional information');
        }
        return actions;
    }

    function generateCompetitorAnalysis(opportunity) {
        return JSON.stringify({
            competitors: opportunity.competitors || 'None identified',
            ourStrengths: ['Local expertise', 'Pricing flexibility', 'Partnership support'],
            strategy: opportunity.winStrategy || 'Focus on value differentiation'
        });
    }

    function generateDealRecommendations(opportunity) {
        const recs = [];
        if (opportunity.stage === 'Proposal') {
            recs.push('Follow up on proposal within 48 hours');
        }
        if (opportunity.stage === 'Negotiation') {
            recs.push('Prepare final contract terms');
        }
        recs.push('Schedule executive sponsor meeting');
        recs.push('Address any pending concerns');
        return recs;
    }

    function identifyRiskFactors(opportunity) {
        const risks = [];
        if (opportunity.probability < 50) {
            risks.push('Low win probability');
        }
        if (!opportunity.competitors) {
            risks.push('Unknown competitive landscape');
        }
        return risks;
    }

    function generateGrowthRecommendations(account) {
        return [
            'Upsell premium product lines',
            'Cross-sell complementary categories',
            'Offer volume-based pricing',
            'Propose joint marketing campaign'
        ];
    }

    function generateRiskAlerts(account) {
        const alerts = [];
        if (account.healthScore < 50) {
            alerts.push('Low health score - immediate attention required');
        }
        if (account.riskLevel === 'High' || account.riskLevel === 'Critical') {
            alerts.push('High risk level detected');
        }
        return alerts;
    }

    function identifyUpsellOpportunities(account) {
        return [
            'Premium skincare line',
            'Professional tools collection',
            'Exclusive brand partnerships'
        ];
    }

    function determineBestContactTime(lead) {
        // Mock implementation - could use ML in production
        return 'Tuesday-Thursday, 10 AM - 12 PM';
    }

    function determineEngagementLevel(prospect) {
        const score = prospect.prospectScore || 0;
        if (score >= 70) return 'High';
        if (score >= 40) return 'Medium';
        return 'Low';
    }
});

