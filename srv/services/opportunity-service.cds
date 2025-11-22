using { beauty.crm as crm } from '../../db/schema';

/**
 * Opportunity & Deal Pipeline Service
 * Handles sales opportunities, deal tracking, and revenue forecasting
 */
service OpportunityService @(path: '/opportunity') {

    // Opportunity management with full CRUD
    @cds.redirection.target
    entity Opportunities as projection on crm.Opportunities {
        *,
        virtual null as winScoreCriticality : Integer,
        virtual null as stageCriticality : Integer
    } actions {
        action moveToStage(newStage: String) returns Opportunities;
        action requestApproval(reason: String, discountPercent: Decimal);
        action markAsWon() returns Opportunities;
        action markAsLost(reason: String) returns Opportunities;
        action updateAIWinScore() returns Opportunities;
    };

    // Opportunity products (line items)
    entity OpportunityProducts as projection on crm.OpportunityProducts;

    // Approval workflow
    @cds.redirection.target
    entity Approvals as projection on crm.Approvals actions {
        action approve(comments: String);
        action reject(comments: String);
    };

    // Read-only analytics views
    @readonly entity OpportunitiesByStage as projection on crm.Opportunities {
        key stage,
        count(ID) as count : Integer,
        sum(amount) as totalAmount : Decimal(15,2),
        sum(expectedRevenue) as forecastRevenue : Decimal(15,2)
    } group by stage;

    @readonly entity OpportunitiesByOwner as projection on crm.Opportunities {
        key owner.fullName as ownerName,
        count(ID) as count : Integer,
        sum(amount) as totalPipeline : Decimal(15,2)
    } group by owner.fullName;

    @readonly entity HighValueDeals as projection on crm.Opportunities
        where amount >= 100000 and stage <> 'Closed Won' and stage <> 'Closed Lost'
        order by amount desc;

    @readonly entity PendingApprovals as projection on crm.Approvals
        where status = 'Pending'
        order by priority desc, requestDate asc;

    // Associated entities
    @readonly entity Accounts as projection on crm.Accounts;
    @readonly entity Contacts as projection on crm.Contacts;
    @readonly entity Products as projection on crm.Products;
    @readonly entity Users as projection on crm.Users;
}
