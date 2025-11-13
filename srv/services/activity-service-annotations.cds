/**
 * UI Annotations for Activity Management
 * Includes calendar-ready annotations for timeline views
 */
using ActivityService from './activity-service';

// ============================================================================
// Activity List Report & Object Page
// ============================================================================

annotate ActivityService.Activities with @(
    UI: {
        SelectionFields: [
            activityType,
            status,
            priority,
            startDateTime,
            assignedTo_ID
        ],

        LineItem: [
            {
                $Type: 'UI.DataField',
                Value: subject,
                Label: 'Subject',
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataField',
                Value: activityType,
                Label: 'Type',
                Criticality: typeCriticality
            },
            {
                $Type: 'UI.DataField',
                Value: status,
                Label: 'Status',
                Criticality: statusCriticality,
                CriticalityRepresentation: #WithIcon
            },
            {
                $Type: 'UI.DataField',
                Value: priority,
                Label: 'Priority',
                Criticality: priorityCriticality
            },
            {
                $Type: 'UI.DataField',
                Value: startDateTime,
                Label: 'Start Date/Time'
            },
            {
                $Type: 'UI.DataField',
                Value: durationMinutes,
                Label: 'Duration (min)'
            },
            {
                $Type: 'UI.DataFieldForAnnotation',
                Target: '@UI.DataPoint#SentimentScore',
                Label: 'Sentiment'
            },
            {
                $Type: 'UI.DataField',
                Value: relatedAccount.accountName,
                Label: 'Related Account'
            },
            {
                $Type: 'UI.DataField',
                Value: assignedTo.fullName,
                Label: 'Assigned To'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'ActivityService.complete',
                Label: 'Complete',
                Inline: true,
                Criticality: 3
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'ActivityService.reschedule',
                Label: 'Reschedule',
                Inline: true
            }
        ],

        DataPoint#SentimentScore: {
            Value: sentimentScore,
            Title: 'Sentiment',
            TargetValue: 100,
            Visualization: #Rating,
            Criticality: sentimentCriticality
        },

        HeaderInfo: {
            TypeName: 'Activity',
            TypeNamePlural: 'Activities',
            Title: {Value: subject},
            Description: {Value: activityType},
            ImageUrl: 'sap-icon://activity-items',
            TypeImageUrl: 'sap-icon://calendar'
        },

        HeaderFacets: [
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.DataPoint#SentimentScore',
                Label: 'Sentiment'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#HeaderTiming',
                Label: 'Timing'
            }
        ],

        Facets: [
            {
                $Type: 'UI.CollectionFacet',
                Label: 'Activity Details',
                ID: 'ActivityDetails',
                Facets: [
                    {
                        $Type: 'UI.ReferenceFacet',
                        Target: '@UI.FieldGroup#BasicInfo',
                        Label: 'Basic Information'
                    },
                    {
                        $Type: 'UI.ReferenceFacet',
                        Target: '@UI.FieldGroup#ScheduleInfo',
                        Label: 'Schedule'
                    }
                ]
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#RelatedEntities',
                Label: 'Related To'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#Ownership',
                Label: 'Ownership & Assignment'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#OutcomeInfo',
                Label: 'Outcome & Sentiment'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#AdditionalInfo',
                Label: 'Additional Details'
            }
        ],

        FieldGroup#BasicInfo: {
            Data: [
                {Value: subject},
                {Value: description},
                {Value: activityType},
                {Value: status},
                {Value: priority}
            ]
        },

        FieldGroup#ScheduleInfo: {
            Data: [
                {Value: startDateTime},
                {Value: endDateTime},
                {Value: durationMinutes},
                {Value: completedDate},
                {Value: dueDate},
                {Value: reminderDate}
            ]
        },

        FieldGroup#RelatedEntities: {
            Data: [
                {Value: relatedAccount.accountName},
                {Value: relatedContact.fullName},
                {Value: relatedOpportunity.opportunityName}
            ]
        },

        FieldGroup#Ownership: {
            Data: [
                {Value: assignedTo.fullName},
                {Value: owner.fullName}
            ]
        },

        FieldGroup#OutcomeInfo: {
            Data: [
                {Value: direction},
                {Value: outcome},
                {Value: sentimentScore},
                {Value: keyPoints}
            ]
        },

        FieldGroup#AdditionalInfo: {
            Data: [
                {Value: notes}
            ]
        },

        FieldGroup#HeaderTiming: {
            Data: [
                {Value: startDateTime},
                {Value: durationMinutes}
            ]
        },

        Identification: [
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'ActivityService.complete',
                Label: 'Complete Activity'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'ActivityService.reschedule',
                Label: 'Reschedule'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'ActivityService.cancel',
                Label: 'Cancel Activity'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'ActivityService.analyzeSentiment',
                Label: 'Analyze Sentiment'
            }
        ]
    },

    // Calendar annotations for timeline views
    Common: {
        SemanticKey: [subject],
        SemanticObject: 'Activity'
    }
);

annotate ActivityService.Activities with {
    subject        @title: 'Subject' @Common.FieldControl: #Mandatory;
    description    @title: 'Description' @UI.MultiLineText: true;
    activityType   @title: 'Activity Type';
    status         @title: 'Status';
    priority       @title: 'Priority';
    startDateTime  @title: 'Start Date/Time';
    endDateTime    @title: 'End Date/Time';
    durationMinutes @title: 'Duration (Minutes)';
    completedDate  @title: 'Completed Date';
    dueDate        @title: 'Due Date';
    direction      @title: 'Direction';
    outcome        @title: 'Outcome' @UI.MultiLineText: true;
    sentimentScore @title: 'Sentiment Score';
    keyPoints      @title: 'Key Points' @UI.MultiLineText: true;
    notes          @title: 'Notes' @UI.MultiLineText: true;
}

// ============================================================================
// Analytical Views
// ============================================================================

annotate ActivityService.ActivitiesByType with @(
    UI: {
        Chart: {
            Title: 'Activities by Type',
            ChartType: #Donut,
            Dimensions: [activityType],
            Measures: [count],
            MeasureAttributes: [{
                Measure: count,
                Role: #Axis1
            }]
        },
        PresentationVariant: {
            Visualizations: ['@UI.Chart']
        }
    }
);

annotate ActivityService.UpcomingActivities with @(
    UI: {
        LineItem: [
            {Value: subject},
            {Value: activityType},
            {Value: startDateTime},
            {Value: assignedTo.fullName},
            {Value: priority}
        ]
    }
);

annotate ActivityService.CompletedActivities with @(
    UI: {
        LineItem: [
            {Value: subject},
            {Value: activityType},
            {Value: completedDate},
            {Value: sentimentScore},
            {Value: outcome}
        ]
    }
);
