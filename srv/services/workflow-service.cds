using { beauty.crm as crm } from '../../db/schema';

/**
 * Workflow & Administration Service
 * Handles approvals, user management, and system administration
 */
service WorkflowService @(path: '/workflow') {

    // User management
    @cds.redirection.target
    entity Users as projection on crm.Users;

    // Approval workflow (also exposed in OpportunityService)
    @cds.redirection.target
    entity Approvals as projection on crm.Approvals actions {
        action approve(comments: String);
        action reject(comments: String);
        action reassign(newApproverID: UUID);
    };

    // Read-only analytics views
    @readonly entity ApprovalsByStatus as projection on crm.Approvals {
        key status,
        count(ID) as count : Integer,
        avg(requestedAmount) as avgAmount : Decimal(15,2)
    } group by status;

    @readonly entity ApprovalsByType as projection on crm.Approvals {
        key approvalType,
        count(ID) as count : Integer
    } group by approvalType;

    @readonly entity PendingApprovals as projection on crm.Approvals
        where status = 'Pending'
        order by requestDate asc;

    @readonly entity UsersByRole as projection on crm.Users {
        key role,
        count(ID) as count : Integer
    } group by role;

    @readonly entity ActiveUsers as projection on crm.Users
        where status = 'Active'
        order by fullName asc;

    // Associated entities
    @readonly entity Opportunities as projection on crm.Opportunities;
}
