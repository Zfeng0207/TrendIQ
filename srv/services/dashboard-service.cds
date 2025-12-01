using { beauty.leads as leads, beauty.crm as crm } from '../../db/schema';

/**
 * Dashboard Analytics Service
 * Provides aggregated KPIs and analytics views for the unified CRM dashboard
 * Inspired by Creatio's modern dashboard design
 */
service DashboardService @(path: '/dashboard') {

    // ==========================================
    // SECTION 1: KPI AGGREGATIONS
    // ==========================================

    // Lead KPIs - Summary metrics for lead pipeline
    @readonly entity LeadKPIs as projection on leads.Leads {
        key 1 as id : Integer,
        count(ID) as totalLeads : Integer,
        sum(case when leadQuality = 'Hot' then 1 else 0 end) as hotLeads : Integer,
        sum(case when leadQuality = 'Warm' then 1 else 0 end) as warmLeads : Integer,
        sum(case when leadQuality = 'Cold' then 1 else 0 end) as coldLeads : Integer,
        sum(case when converted = true then 1 else 0 end) as convertedLeads : Integer,
        avg(aiScore) as avgAIScore : Decimal(5,2),
        avg(sentimentScore) as avgSentiment : Decimal(5,2),
        sum(estimatedValue) as totalEstimatedValue : Decimal(15,2)
    };

    // Opportunity KPIs - Pipeline value and win metrics
    @readonly entity OpportunityKPIs as projection on crm.Opportunities {
        key 1 as id : Integer,
        count(ID) as totalOpportunities : Integer,
        sum(expectedRevenue) as totalPipelineValue : Decimal(15,2),
        sum(amount) as totalAmount : Decimal(15,2),
        avg(probability) as avgProbability : Decimal(5,2),
        avg(aiWinScore) as avgWinScore : Decimal(5,2),
        sum(case when stage = 'Closed Won' then expectedRevenue else 0 end) as wonRevenue : Decimal(15,2),
        sum(case when stage = 'Closed Won' then 1 else 0 end) as wonCount : Integer,
        sum(case when stage = 'Closed Lost' then 1 else 0 end) as lostCount : Integer
    };

    // Account KPIs - Health and risk metrics
    @readonly entity AccountKPIs as projection on crm.Accounts {
        key 1 as id : Integer,
        count(ID) as totalAccounts : Integer,
        sum(case when riskLevel = 'Critical' then 1 else 0 end) as criticalRiskAccounts : Integer,
        sum(case when riskLevel = 'High' then 1 else 0 end) as highRiskAccounts : Integer,
        sum(case when riskLevel = 'Medium' then 1 else 0 end) as mediumRiskAccounts : Integer,
        sum(case when riskLevel = 'Low' then 1 else 0 end) as lowRiskAccounts : Integer,
        avg(healthScore) as avgHealthScore : Decimal(5,2),
        avg(sentimentScore) as avgSentiment : Decimal(5,2),
        sum(annualRevenue) as totalAnnualRevenue : Decimal(15,2)
    };

    // Activity KPIs - Engagement metrics
    @readonly entity ActivityKPIs as projection on crm.Activities {
        key 1 as id : Integer,
        count(ID) as totalActivities : Integer,
        sum(case when status = 'Planned' then 1 else 0 end) as plannedActivities : Integer,
        sum(case when status = 'In Progress' then 1 else 0 end) as inProgressActivities : Integer,
        sum(case when status = 'Completed' then 1 else 0 end) as completedActivities : Integer,
        sum(case when activityType = 'Call' then 1 else 0 end) as callCount : Integer,
        sum(case when activityType = 'Email' then 1 else 0 end) as emailCount : Integer,
        sum(case when activityType = 'Meeting' then 1 else 0 end) as meetingCount : Integer
    };

    // ==========================================
    // SECTION 2: PIPELINE BREAKDOWN BY STAGE
    // ==========================================

    // Lead Pipeline by Status - for funnel visualization
    @readonly entity LeadsByStatus as projection on leads.Leads {
        key status,
        count(ID) as count : Integer,
        avg(aiScore) as avgAIScore : Decimal(5,2),
        sum(estimatedValue) as totalValue : Decimal(15,2)
    } group by status;

    // Lead Pipeline by Quality - Hot/Warm/Cold distribution
    @readonly entity LeadsByQuality as projection on leads.Leads {
        key leadQuality,
        count(ID) as count : Integer,
        avg(aiScore) as avgAIScore : Decimal(5,2)
    } group by leadQuality;

    // Lead Pipeline by Source - acquisition channel analysis
    @readonly entity LeadsBySource as projection on leads.Leads {
        key source,
        count(ID) as count : Integer,
        sum(estimatedValue) as totalValue : Decimal(15,2),
        avg(aiScore) as avgAIScore : Decimal(5,2)
    } group by source;

    // Opportunity Pipeline by Stage - for sales funnel
    @readonly entity OpportunitiesByStage as projection on crm.Opportunities {
        key stage,
        count(ID) as count : Integer,
        sum(expectedRevenue) as totalValue : Decimal(15,2),
        sum(amount) as totalAmount : Decimal(15,2),
        avg(probability) as avgProbability : Decimal(5,2),
        avg(aiWinScore) as avgWinScore : Decimal(5,2)
    } group by stage;

    // Account Health Distribution - for health breakdown chart
    @readonly entity AccountsByHealthRange as projection on crm.Accounts {
        key case 
            when healthScore >= 71 then 'Healthy'
            when healthScore >= 41 then 'Monitor'
            else 'At Risk'
        end as healthCategory : String,
        count(ID) as count : Integer,
        avg(healthScore) as avgHealthScore : Decimal(5,2)
    } group by case 
        when healthScore >= 71 then 'Healthy'
        when healthScore >= 41 then 'Monitor'
        else 'At Risk'
    end;

    // Account Risk Distribution
    @readonly entity AccountsByRisk as projection on crm.Accounts {
        key riskLevel,
        count(ID) as count : Integer,
        avg(healthScore) as avgHealthScore : Decimal(5,2),
        sum(annualRevenue) as totalRevenue : Decimal(15,2)
    } group by riskLevel;

    // ==========================================
    // SECTION 3: TOP N LISTS FOR AI INSIGHT CARDS
    // ==========================================

    // Top Leads by AI Score
    @readonly entity TopLeadsByAI as projection on leads.Leads {
        ID,
        outletName,
        contactName,
        contactEmail,
        brandToPitch,
        status,
        leadQuality,
        source,
        aiScore,
        sentimentScore,
        sentimentLabel,
        estimatedValue,
        createdAt
    } where converted = false and status <> 'Disqualified'
      order by aiScore desc;

    // Top Opportunities by Win Score
    @readonly entity TopOpportunitiesByWinScore as projection on crm.Opportunities {
        ID,
        name,
        stage,
        amount,
        expectedRevenue,
        probability,
        aiWinScore,
        aiRecommendation,
        closeDate,
        account.accountName as accountName,
        owner.fullName as ownerName,
        createdAt
    } where stage <> 'Closed Won' and stage <> 'Closed Lost'
      order by aiWinScore desc;

    // At-Risk Accounts (low health score or high risk level)
    @readonly entity AtRiskAccounts as projection on crm.Accounts {
        ID,
        accountName,
        accountType,
        accountTier,
        healthScore,
        riskLevel,
        sentimentScore,
        recentSentimentTrend,
        annualRevenue,
        accountOwner.fullName as ownerName,
        modifiedAt
    } where riskLevel = 'High' or riskLevel = 'Critical' or healthScore < 50
      order by healthScore asc;

    // Healthy Top Accounts
    @readonly entity HealthyAccounts as projection on crm.Accounts {
        ID,
        accountName,
        accountType,
        accountTier,
        healthScore,
        riskLevel,
        sentimentScore,
        annualRevenue,
        accountOwner.fullName as ownerName
    } where healthScore >= 70 and (riskLevel = 'Low' or riskLevel is null)
      order by healthScore desc;

    // ==========================================
    // SECTION 4: ACTIVITY & ENGAGEMENT
    // ==========================================

    // Recent Activities (timeline feed)
    @readonly entity RecentActivities as projection on crm.Activities {
        ID,
        subject,
        description,
        activityType,
        status,
        priority,
        startDateTime,
        endDateTime,
        durationMinutes,
        direction,
        outcome,
        sentimentScore,
        keyPoints,
        relatedAccount.accountName as accountName,
        relatedContact.fullName as contactName,
        relatedOpportunity.name as opportunityName,
        assignedTo.fullName as assignedToName,
        createdAt
    } order by startDateTime desc;

    // Upcoming Tasks (due soon)
    @readonly entity UpcomingTasks as projection on crm.Activities {
        ID,
        subject,
        description,
        activityType,
        status,
        priority,
        dueDate,
        reminderDate,
        relatedAccount.accountName as accountName,
        relatedOpportunity.name as opportunityName,
        assignedTo.fullName as assignedToName
    } where status = 'Planned' or status = 'In Progress'
      order by dueDate asc;

    // Overdue Tasks
    @readonly entity OverdueTasks as projection on crm.Activities {
        ID,
        subject,
        activityType,
        status,
        priority,
        dueDate,
        relatedAccount.accountName as accountName,
        assignedTo.fullName as assignedToName
    } where (status = 'Planned' or status = 'In Progress') and dueDate < $now
      order by dueDate asc;

    // Activities by Type - for engagement breakdown
    @readonly entity ActivitiesByType as projection on crm.Activities {
        key activityType,
        count(ID) as count : Integer,
        avg(sentimentScore) as avgSentiment : Decimal(5,2)
    } group by activityType;

    // ==========================================
    // SECTION 5: PRODUCTS & CAMPAIGNS
    // ==========================================

    // Trending Products
    @readonly entity TrendingProducts as projection on crm.Products {
        ID,
        productCode,
        productName,
        brand,
        category,
        subCategory,
        listPrice,
        trendScore,
        trendVelocity,
        trendingKeywords,
        trendDetectedDate,
        isTrending,
        isPromoted
    } where isTrending = true or trendScore >= 70
      order by trendScore desc;

    // Active Marketing Campaigns
    @readonly entity ActiveCampaigns as projection on crm.MarketingCampaigns {
        ID,
        campaignName,
        campaignType,
        status,
        budget,
        startDate,
        endDate,
        targetAudience,
        triggerKeyword,
        ESGTag,
        performanceMetrics,
        owner.fullName as ownerName
    } where status = 'Active' or status = 'PendingApproval'
      order by startDate desc;

    // Campaign Performance Summary
    @readonly entity CampaignKPIs as projection on crm.MarketingCampaigns {
        key 1 as id : Integer,
        count(ID) as totalCampaigns : Integer,
        sum(case when status = 'Active' then 1 else 0 end) as activeCampaigns : Integer,
        sum(case when status = 'Draft' then 1 else 0 end) as draftCampaigns : Integer,
        sum(case when status = 'Completed' then 1 else 0 end) as completedCampaigns : Integer,
        sum(budget) as totalBudget : Decimal(15,2),
        sum(case when status = 'Active' then budget else 0 end) as activeBudget : Decimal(15,2)
    };

    // ==========================================
    // SECTION 6: PROSPECT PIPELINE
    // ==========================================

    // Prospect KPIs
    @readonly entity ProspectKPIs as projection on crm.Prospects {
        key 1 as id : Integer,
        count(ID) as totalProspects : Integer,
        sum(case when status = 'New' then 1 else 0 end) as newProspects : Integer,
        sum(case when status = 'Contacted' then 1 else 0 end) as contactedProspects : Integer,
        sum(case when status = 'Qualified' then 1 else 0 end) as qualifiedProspects : Integer,
        sum(case when status = 'Converted' then 1 else 0 end) as convertedProspects : Integer,
        avg(prospectScore) as avgProspectScore : Decimal(5,2),
        sum(estimatedValue) as totalEstimatedValue : Decimal(15,2)
    };

    // Prospects by Status - for prospect funnel
    @readonly entity ProspectsByStatus as projection on crm.Prospects {
        key status,
        count(ID) as count : Integer,
        avg(prospectScore) as avgScore : Decimal(5,2),
        sum(estimatedValue) as totalValue : Decimal(15,2)
    } group by status;

    // Top Prospects
    @readonly entity TopProspects as projection on crm.Prospects {
        ID,
        prospectName,
        businessType,
        status,
        prospectScore,
        aiScore,
        sentimentScore,
        estimatedValue,
        discoverySource,
        contactName,
        contactEmail,
        location,
        createdAt
    } where status <> 'Converted'
      order by prospectScore desc;

    // ==========================================
    // ASSOCIATED ENTITIES (Read-only references)
    // These are marked as redirection targets for associations
    // ==========================================

    @readonly entity Users as projection on crm.Users;
    
    @readonly 
    @cds.redirection.target
    entity Accounts as projection on crm.Accounts;
    
    @readonly entity Contacts as projection on crm.Contacts;
    
    @readonly 
    @cds.redirection.target
    entity Opportunities as projection on crm.Opportunities;
    
    @readonly 
    @cds.redirection.target
    entity Activities as projection on crm.Activities;
    
    @readonly 
    @cds.redirection.target
    entity Products as projection on crm.Products;
    
    @readonly 
    @cds.redirection.target
    entity Leads as projection on leads.Leads;
    
    @readonly 
    @cds.redirection.target
    entity Prospects as projection on crm.Prospects;
    
    @readonly 
    @cds.redirection.target
    entity MarketingCampaigns as projection on crm.MarketingCampaigns;

    // Additional entities needed for associations
    @readonly entity AccountRecommendations as projection on crm.AccountRecommendations;
    @readonly entity AccountRiskAlerts as projection on crm.AccountRiskAlerts;
    @readonly entity OpportunityProducts as projection on crm.OpportunityProducts;
    @readonly entity CampaignCreators as projection on crm.CampaignCreators;
}

