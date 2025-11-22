using { beauty.crm as crm } from '../../db/crm-schema';
using { beauty.leads as leads } from '../../db/schema';

/**
 * Channel Partner Discovery Service
 * Handles AI-discovered channel partner opportunities and onboarding
 */
service MerchantService @(path: '/merchant') {
    @cds.redirection.target
    entity MerchantDiscoveries as projection on crm.MerchantDiscovery {
        *,
        virtual null as statusCriticality : Integer,
        virtual null as phase : String(50),
        virtual null as phaseCriticality : Integer,
        virtual null as priorityScore : Integer,
        virtual null as priorityScoreCriticality : Integer,
        virtual null as lastFollowUp : String(100),
        virtual null as pendingItems : String(200),
        virtual null as assignedTo : String(200)
    } actions {
        action qualifyMerchant();
        action assignToSalesRep(salesRepID: String);
        action bulkImport(discoveries: String); // JSON array
        action generateAbout() returns MerchantDiscoveries; // AI-generated channel partner about information
        action initiateAIMeeting() returns String; // AI Meeting Initiator - returns meeting script
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

