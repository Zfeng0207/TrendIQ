using { beauty.crm as crm } from '../../db/schema';

/**
 * Account & Contact Management Service
 * Handles customer accounts, contacts, and relationship management
 */
service AccountService @(path: '/account') {

    // Account management with full CRUD and draft support for editing
    @cds.redirection.target
    @odata.draft.enabled
    entity Accounts as projection on crm.Accounts {
        *,
        // Exclude compositions that cause issues with draft navigation
        recommendations: redirected to AccountRecommendations,
        riskAlerts: redirected to AccountRiskAlerts,
        // Virtual fields for UI (criticality and computed text fields)
        virtual null as healthCriticality : Integer,
        virtual null as statusCriticality : Integer,
        virtual null as priorityScoreCriticality : Integer, // For color coding
        virtual null as currentStageSummary : LargeString,
        virtual null as nextStepsSummary : LargeString,
        virtual null as lastFollowUp : String(100), // Text timeline like "7 hours ago"
        virtual null as pendingItems : String(200), // Demo values like "2 tasks, 1 approval"
        virtual null as phase : String(50), // Onboarding, Dealing, Running Campaign, Discounting, Completed
        virtual null as phaseCriticality : Integer // For color coding
    } actions {
        action updateAIScore() returns Accounts;
        action mergeAccount(targetAccountID: UUID);
        action getAIRecommendations() returns array of AccountRecommendations;
        action updateTimelineStage(newStage: String, notes: LargeString) returns Accounts;
        action acknowledgeRecommendation(recommendationID: UUID) returns AccountRecommendations;
        action dismissRiskAlert(alertID: UUID) returns AccountRiskAlerts;
    };

    // Contact management with full CRUD
    @cds.redirection.target
    entity Contacts as projection on crm.Contacts actions {
        action updateEngagementScore();
        action sendEmail(subject: String, body: LargeString);
    };

    // Read-only analytics views
    @readonly entity AccountsByType as projection on crm.Accounts {
        key accountType,
        count(ID) as count : Integer,
        sum(annualRevenue) as totalRevenue : Decimal(15,2)
    } group by accountType;

    @readonly entity AccountsByStatus as projection on crm.Accounts {
        key status,
        count(ID) as count : Integer,
        avg(healthScore) as avgHealth : Integer
    } group by status;

    @readonly entity TopAccounts as projection on crm.Accounts
        where status = 'Active' and accountTier = 'Platinum'
        order by annualRevenue desc;

    @readonly entity ActiveContacts as projection on crm.Contacts
        where status = 'Active'
        order by engagementScore desc;

    // Account Recommendations & Risk Alerts (readonly - managed via actions)
    @cds.redirection.target
    @readonly
    entity AccountRecommendations as projection on crm.AccountRecommendations;
    
    @cds.redirection.target
    @readonly
    entity AccountRiskAlerts as projection on crm.AccountRiskAlerts;

    // Aggregated views for account details
    @readonly entity AccountOpportunities as projection on crm.Opportunities {
        key account,
        count(ID) as opportunityCount : Integer,
        sum(expectedRevenue) as totalPipelineValue : Decimal(15,2),
        avg(probability) as avgProbability : Integer
    } group by account;

    @readonly entity AccountCampaigns as projection on crm.MarketingCampaigns {
        key owner,
        count(ID) as campaignCount : Integer,
        sum(budget) as totalBudget : Decimal(15,2)
    } group by owner;

    @readonly entity AccountActivities as projection on crm.Activities {
        key relatedAccount,
        count(ID) as activityCount : Integer
    } group by relatedAccount;

    // Associated entities
    @readonly entity Users as projection on crm.Users;
    @cds.redirection.target
    @readonly entity Opportunities as projection on crm.Opportunities;
    @cds.redirection.target
    @readonly entity Activities as projection on crm.Activities;
    @cds.redirection.target
    @readonly entity MarketingCampaigns as projection on crm.MarketingCampaigns;
}
