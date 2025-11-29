using { beauty.leads as leads, beauty.crm as crm } from '../../db/schema';

/**
 * Lead Management Service
 * Handles lead capture, qualification, and conversion tracking
 */
service LeadService @(path: '/lead') {

    // Main Lead entity with full CRUD and draft support for editing
    @cds.redirection.target
    @odata.draft.enabled
    entity Leads as projection on leads.Leads actions {
        action convertToAccount() returns {
            message: String;
            accountID: UUID;
        };
        action qualifyLead();
        action updateAIScore() returns Leads;
        action generateAISummary() returns String; // Generate AI Summary - returns summary text
    };

    // Read-only views for lead analytics
    @readonly entity LeadsByStatus as projection on leads.Leads {
        key status,
        count(ID) as count : Integer,
        avg(aiScore) as avgScore : Integer
    } group by status;

    @readonly entity LeadsBySource as projection on leads.Leads {
        key source,
        count(ID) as count : Integer,
        sum(estimatedValue) as totalValue : Decimal(15,2)
    } group by source;

    @readonly entity HotLeads as projection on leads.Leads
        where leadQuality = 'Hot' and status <> 'Converted' and status <> 'Lost';

    // Associated CRM entities (read-only from lead context)
    @readonly entity Users as projection on crm.Users;
    @readonly entity Accounts as projection on crm.Accounts;
}
