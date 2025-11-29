using { beauty.crm as crm } from '../../db/crm-schema';
using { beauty.leads as leads } from '../../db/schema';

/**
 * Prospect Service
 * Handles qualified prospects converted from leads
 */
service ProspectService @(path: '/prospect') {
    @cds.redirection.target
    entity Prospects as projection on crm.Prospects {
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
        action qualifyProspect();
        action assignToSalesRep(salesRepID: String);
        action bulkImport(prospects: String); // JSON array
        action generateAbout() returns Prospects; // AI-generated prospect about information
        action initiateAIMeeting() returns String; // AI Meeting Initiator - returns meeting script
        action createOpportunity() returns {
            message: String;
            opportunityID: UUID;
        };
    };
    
    @readonly entity ProspectsBySource as projection on crm.Prospects {
        key discoverySource,
        count(ID) as count : Integer,
        avg(prospectScore) as avgScore : Integer
    } group by discoverySource;
    
    @readonly entity HighScoreProspects as projection on crm.Prospects
        where prospectScore >= 70 and status = 'New';
    
    @readonly entity PendingAssignment as projection on crm.Prospects
        where autoAssignedTo is null and status = 'New';
    
    // Related entities
    @readonly entity Users as projection on crm.Users;
    @readonly entity Leads as projection on leads.Leads;
    @readonly entity Opportunities as projection on crm.Opportunities;
}


