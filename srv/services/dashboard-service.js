/**
 * Dashboard Analytics Service Handler
 * Provides custom logic for dashboard KPIs and analytics
 */

module.exports = class DashboardService extends cds.ApplicationService {

    async init() {
        // Register event handlers for dashboard entities
        
        // Add computed fields for KPI criticality indicators
        this.after('READ', 'LeadKPIs', this._addLeadKPICriticality);
        this.after('READ', 'OpportunityKPIs', this._addOpportunityKPICriticality);
        this.after('READ', 'AccountKPIs', this._addAccountKPICriticality);
        
        // Add criticality to list items
        this.after('READ', 'TopLeadsByAI', this._addLeadCriticality);
        this.after('READ', 'TopOpportunitiesByWinScore', this._addOpportunityCriticality);
        this.after('READ', 'AtRiskAccounts', this._addAccountRiskCriticality);
        this.after('READ', 'UpcomingTasks', this._addTaskPriorityCriticality);
        this.after('READ', 'OverdueTasks', this._addOverdueCriticality);
        
        await super.init();
    }

    /**
     * Add criticality indicators to Lead KPIs
     * Used for semantic coloring in UI tiles
     */
    _addLeadKPICriticality(results) {
        if (!results) return;
        const data = Array.isArray(results) ? results : [results];
        
        data.forEach(kpi => {
            // Hot leads ratio criticality (more hot leads = positive)
            if (kpi.totalLeads > 0) {
                const hotRatio = kpi.hotLeads / kpi.totalLeads;
                kpi.hotLeadsCriticality = hotRatio > 0.3 ? 3 : hotRatio > 0.15 ? 2 : 1;
            }
            
            // AI Score criticality
            kpi.aiScoreCriticality = kpi.avgAIScore >= 70 ? 3 : kpi.avgAIScore >= 50 ? 2 : 1;
            
            // Conversion rate criticality
            if (kpi.totalLeads > 0) {
                const convRate = kpi.convertedLeads / kpi.totalLeads;
                kpi.conversionCriticality = convRate > 0.2 ? 3 : convRate > 0.1 ? 2 : 1;
            }
        });
    }

    /**
     * Add criticality indicators to Opportunity KPIs
     */
    _addOpportunityKPICriticality(results) {
        if (!results) return;
        const data = Array.isArray(results) ? results : [results];
        
        data.forEach(kpi => {
            // Win score criticality
            kpi.winScoreCriticality = kpi.avgWinScore >= 70 ? 3 : kpi.avgWinScore >= 50 ? 2 : 1;
            
            // Win rate criticality
            const totalClosed = kpi.wonCount + kpi.lostCount;
            if (totalClosed > 0) {
                const winRate = kpi.wonCount / totalClosed;
                kpi.winRateCriticality = winRate > 0.5 ? 3 : winRate > 0.3 ? 2 : 1;
            }
            
            // Pipeline health (based on probability)
            kpi.probabilityCriticality = kpi.avgProbability >= 60 ? 3 : kpi.avgProbability >= 40 ? 2 : 1;
        });
    }

    /**
     * Add criticality indicators to Account KPIs
     */
    _addAccountKPICriticality(results) {
        if (!results) return;
        const data = Array.isArray(results) ? results : [results];
        
        data.forEach(kpi => {
            // Health score criticality
            kpi.healthCriticality = kpi.avgHealthScore >= 70 ? 3 : kpi.avgHealthScore >= 50 ? 2 : 1;
            
            // Risk accounts criticality (inverse - fewer at-risk = better)
            const atRiskCount = kpi.criticalRiskAccounts + kpi.highRiskAccounts;
            const atRiskRatio = kpi.totalAccounts > 0 ? atRiskCount / kpi.totalAccounts : 0;
            kpi.riskCriticality = atRiskRatio < 0.1 ? 3 : atRiskRatio < 0.25 ? 2 : 1;
            
            // Sentiment criticality
            kpi.sentimentCriticality = kpi.avgSentiment >= 30 ? 3 : kpi.avgSentiment >= 0 ? 2 : 1;
        });
    }

    /**
     * Add criticality to individual leads based on AI score and quality
     */
    _addLeadCriticality(results) {
        if (!results) return;
        const data = Array.isArray(results) ? results : [results];
        
        data.forEach(lead => {
            // AI Score criticality (0-100 scale)
            lead.aiScoreCriticality = lead.aiScore >= 80 ? 3 : lead.aiScore >= 60 ? 2 : lead.aiScore >= 40 ? 0 : 1;
            
            // Sentiment criticality (-100 to 100 scale)
            lead.sentimentCriticality = lead.sentimentScore >= 30 ? 3 : lead.sentimentScore >= 0 ? 2 : 1;
            
            // Quality criticality
            lead.qualityCriticality = lead.leadQuality === 'Hot' ? 3 : lead.leadQuality === 'Warm' ? 2 : 1;
        });
    }

    /**
     * Add criticality to opportunities based on win score
     */
    _addOpportunityCriticality(results) {
        if (!results) return;
        const data = Array.isArray(results) ? results : [results];
        
        data.forEach(opp => {
            // AI Win Score criticality
            opp.winScoreCriticality = opp.aiWinScore >= 80 ? 3 : opp.aiWinScore >= 60 ? 2 : opp.aiWinScore >= 40 ? 0 : 1;
            
            // Probability criticality
            opp.probabilityCriticality = opp.probability >= 70 ? 3 : opp.probability >= 50 ? 2 : opp.probability >= 30 ? 0 : 1;
            
            // Stage criticality
            const positiveStages = ['Proposal', 'Negotiation'];
            const earlyStages = ['Prospecting', 'Qualification', 'Needs Analysis'];
            opp.stageCriticality = positiveStages.includes(opp.stage) ? 3 : earlyStages.includes(opp.stage) ? 2 : 0;
        });
    }

    /**
     * Add criticality to at-risk accounts
     */
    _addAccountRiskCriticality(results) {
        if (!results) return;
        const data = Array.isArray(results) ? results : [results];
        
        data.forEach(account => {
            // Risk level criticality (inverse - Critical is bad)
            account.riskCriticality = account.riskLevel === 'Critical' ? 1 : 
                                       account.riskLevel === 'High' ? 1 : 
                                       account.riskLevel === 'Medium' ? 2 : 3;
            
            // Health score criticality
            account.healthCriticality = account.healthScore >= 70 ? 3 : 
                                         account.healthScore >= 50 ? 2 : 
                                         account.healthScore >= 30 ? 0 : 1;
            
            // Sentiment trend criticality
            account.trendCriticality = account.recentSentimentTrend === 'Improving' ? 3 :
                                        account.recentSentimentTrend === 'Stable' ? 2 : 1;
        });
    }

    /**
     * Add priority criticality to tasks
     */
    _addTaskPriorityCriticality(results) {
        if (!results) return;
        const data = Array.isArray(results) ? results : [results];
        
        data.forEach(task => {
            // Priority criticality
            task.priorityCriticality = task.priority === 'High' ? 1 : 
                                        task.priority === 'Medium' ? 2 : 3;
            
            // Due date urgency
            if (task.dueDate) {
                const daysUntilDue = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                task.urgencyCriticality = daysUntilDue <= 1 ? 1 : daysUntilDue <= 3 ? 2 : 3;
            }
        });
    }

    /**
     * Add overdue criticality
     */
    _addOverdueCriticality(results) {
        if (!results) return;
        const data = Array.isArray(results) ? results : [results];
        
        data.forEach(task => {
            // All overdue tasks are critical
            task.overdueCriticality = 1;
            
            // Calculate days overdue
            if (task.dueDate) {
                const daysOverdue = Math.ceil((new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24));
                task.daysOverdue = daysOverdue;
                task.severityCriticality = daysOverdue > 7 ? 1 : daysOverdue > 3 ? 1 : 2;
            }
        });
    }
};

