using { beauty.crm as crm } from '../../db/schema';

/**
 * Activity & Task Management Service
 * Handles all customer interactions, tasks, and communication tracking
 */
service ActivityService @(path: '/activity') {

    // Activity management with full CRUD
    @cds.redirection.target
    entity Activities as projection on crm.Activities actions {
        action complete(outcome: String);
        action reschedule(newDateTime: DateTime);
        action cancel(reason: String);
        action analyzeSentiment();
    };

    // Read-only analytics views
    @readonly entity ActivitiesByType as projection on crm.Activities {
        key activityType,
        count(ID) as count : Integer,
        avg(durationMinutes) as avgDuration : Integer
    } group by activityType;

    @readonly entity ActivitiesByStatus as projection on crm.Activities {
        key status,
        count(ID) as count : Integer
    } group by status;

    @readonly entity UpcomingActivities as projection on crm.Activities
        where status = 'Planned'
        order by startDateTime asc;

    @readonly entity OverdueTasks as projection on crm.Activities
        where status = 'Planned' and activityType = 'Task'
        order by priority desc, dueDate asc;

    // Associated entities
    @readonly entity Accounts as projection on crm.Accounts;
    @readonly entity Contacts as projection on crm.Contacts;
    @readonly entity Opportunities as projection on crm.Opportunities;
    @readonly entity Users as projection on crm.Users;
}
