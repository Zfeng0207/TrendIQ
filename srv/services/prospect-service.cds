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
        action changeStatus(newStatus: String) returns Prospects; // Change prospect status (Creatio chevron bar)
        action createOpportunity() returns {
            message: String;
            opportunityID: UUID;
        };
        // Convert Prospect to Account, Contact, and Opportunity
        action convertToAccount(
            // Account fields
            accountName: String,
            accountType: String,
            industry: String,
            website: String,
            address: String,
            city: String,
            state: String,
            country: String,
            postalCode: String,
            // Contact fields
            contactFirstName: String,
            contactLastName: String,
            contactTitle: String,
            contactEmail: String,
            contactPhone: String,
            // Opportunity fields
            opportunityName: String,
            opportunityDescription: String,
            opportunityStage: String,
            opportunityAmount: Decimal,
            opportunityProbability: Integer,
            opportunityCloseDate: Date
        ) returns {
            message: String;
            accountID: UUID;
            contactID: UUID;
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
    
    // Entities needed for conversion
    entity Accounts as projection on crm.Accounts;
    entity Contacts as projection on crm.Contacts;
}


