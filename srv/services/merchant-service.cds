using { beauty.crm as crm } from '../../db/crm-schema';
using { beauty.leads as leads } from '../../db/schema';

/**
 * Merchant Discovery Service
 * Handles AI-discovered merchant opportunities and onboarding
 */
service MerchantService @(path: '/merchant') {
    @cds.redirection.target
    entity MerchantDiscoveries as projection on crm.MerchantDiscovery actions {
        action qualifyMerchant();
        action assignToSalesRep(salesRepID: String);
        action convertToLead();
        action bulkImport(discoveries: String); // JSON array
        action generateAbout(); // AI-generated merchant about information
    };
    
    @readonly entity MerchantDiscoveriesBySource as projection on crm.MerchantDiscovery {
        key discoverySource,
        count(ID) as count : Integer,
        avg(merchantScore) as avgScore : Integer
    } group by discoverySource;
    
    @readonly entity HighScoreMerchants as projection on crm.MerchantDiscovery
        where merchantScore >= 70 and status = 'Discovered';
    
    @readonly entity PendingAssignment as projection on crm.MerchantDiscovery
        where autoAssignedTo is null and status = 'Discovered';
    
    // Related entities
    @readonly entity Users as projection on crm.Users;
    @readonly entity Leads as projection on leads.Leads;
}

