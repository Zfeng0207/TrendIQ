using { beauty.crm as crm } from '../../db/crm-schema';

/**
 * Marketing Campaign Service
 * Handles trend-driven marketing campaign automation
 */
service MarketingService @(path: '/marketing') {
    @cds.redirection.target
    entity MarketingCampaigns as projection on crm.MarketingCampaigns actions {
        action generateCampaignBrief();
        action selectCreators(keyword: String, platform: String);
        action launchCampaign();
        action pauseCampaign();
        action generatePerformanceReport();
    };
    
    @readonly entity ActiveCampaigns as projection on crm.MarketingCampaigns
        where status = 'Active';
    
    @readonly entity CampaignsByType as projection on crm.MarketingCampaigns {
        key campaignType,
        count(ID) as count : Integer,
        sum(budget) as totalBudget : Decimal(15,2)
    } group by campaignType;
    
    @readonly entity TrendingKeywords as projection on crm.Products
        where trendVelocity >= 50
        order by trendVelocity desc;
    
    // Related entities
    entity CampaignCreators as projection on crm.CampaignCreators;
    @cds.redirection.target
    @readonly entity Products as projection on crm.Products;
    @readonly entity Users as projection on crm.Users;
}

