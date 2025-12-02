/**
 * AI Assistant Service
 * Provides contextual AI chat functionality for all CRM entities
 */
using { beauty.leads as leads, beauty.crm as crm } from '../../db/schema';

service AIAssistantService @(path: '/ai-assistant') {
    
    /**
     * Main chat action - processes user queries and returns AI responses
     */
    action chat(
        query: String not null,
        entityType: String not null,  // 'leads', 'prospects', 'opportunities', 'accounts'
        entityData: LargeString        // JSON string of entity data for context
    ) returns {
        message: String;
        data: LargeString;             // JSON string for additional data
        suggestions: array of String;  // Follow-up suggestions
    };
    
    /**
     * Get quick action response
     */
    action quickAction(
        actionId: String not null,
        entityType: String not null,
        entityData: LargeString
    ) returns {
        message: String;
        data: LargeString;
    };
    
    /**
     * Get lead scoring insights
     */
    function getLeadInsights(leadId: UUID) returns {
        aiScore: Integer;
        sentimentScore: Integer;
        recommendedActions: array of String;
        bestTimeToContact: String;
        conversionProbability: Integer;
    };
    
    /**
     * Get prospect qualification insights
     */
    function getProspectInsights(prospectId: UUID) returns {
        qualificationScore: Integer;
        conversionLikelihood: Integer;
        nextBestActions: array of String;
        engagementLevel: String;
    };
    
    /**
     * Get opportunity win analysis
     */
    function getOpportunityInsights(opportunityId: UUID) returns {
        winProbability: Integer;
        competitorAnalysis: LargeString;
        dealRecommendations: array of String;
        riskFactors: array of String;
    };
    
    /**
     * Get account health analysis
     */
    function getAccountInsights(accountId: UUID) returns {
        healthScore: Integer;
        growthRecommendations: array of String;
        riskAlerts: array of String;
        upsellOpportunities: array of String;
    };
}





