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
        action convertToProspect() returns {
            message: String;
            prospectID: UUID;
        };
        action qualifyLead();
        action updateAIScore() returns Leads;
        action generateAISummary() returns String; // Generate AI Summary - returns summary text
        action changeStatus(newStatus: String) returns Leads; // Change lead status (Creatio chevron bar)
        action scheduleTask(
            subject: String,
            dueDate: DateTime,
            notes: String
        ) returns UUID; // Create a task/reminder linked to this lead
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
        where leadQuality = 'Hot' and status <> 'Converted' and status <> 'Disqualified';

    // Associated CRM entities (read-only from lead context)
    @readonly entity Users as projection on crm.Users;
    @readonly entity Accounts as projection on crm.Accounts;
    
    // Activities entity for task creation
    entity Activities as projection on crm.Activities;
}
