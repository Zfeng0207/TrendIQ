using { beauty.crm as crm } from '../../db/schema';

/**
 * Account & Contact Management Service
 * Handles customer accounts, contacts, and relationship management
 */
service AccountService @(path: '/account') {

    // Account management with full CRUD
    @cds.redirection.target
    entity Accounts as projection on crm.Accounts actions {
        action updateAIScore();
        action mergeAccount(targetAccountID: UUID);
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

    // Associated entities
    @readonly entity Users as projection on crm.Users;
    @readonly entity Opportunities as projection on crm.Opportunities;
    @readonly entity Activities as projection on crm.Activities;
}
