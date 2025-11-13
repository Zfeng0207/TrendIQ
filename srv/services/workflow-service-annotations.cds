/**
 * UI Annotations for Workflow & User Management
 * Includes approval workflow tracking and user administration
 */
using WorkflowService from './workflow-service';

// ============================================================================
// Approval Workflow List & Object Page
// ============================================================================

annotate WorkflowService.Approvals with @(
    UI: {
        SelectionFields: [
            status,
            priority,
            approvalType,
            requestDate,
            approver_ID
        ],

        LineItem: [
            {
                $Type: 'UI.DataField',
                Value: approvalType,
                Label: 'Approval Type',
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataField',
                Value: opportunityID.opportunityName,
                Label: 'Opportunity'
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
                Criticality: priorityCriticality,
                CriticalityRepresentation: #WithIcon
            },
            {
                $Type: 'UI.DataField',
                Value: requestedDiscount,
                Label: 'Discount %'
            },
            {
                $Type: 'UI.DataField',
                Value: requestedAmount,
                Label: 'Amount'
            },
            {
                $Type: 'UI.DataField',
                Value: requestedBy.fullName,
                Label: 'Requested By'
            },
            {
                $Type: 'UI.DataField',
                Value: requestDate,
                Label: 'Request Date'
            },
            {
                $Type: 'UI.DataField',
                Value: approver.fullName,
                Label: 'Approver'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'WorkflowService.approve',
                Label: 'Approve',
                Inline: true,
                Criticality: 3
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'WorkflowService.rejectApproval',
                Label: 'Reject',
                Inline: true,
                Criticality: 1
            }
        ],

        HeaderInfo: {
            TypeName: 'Approval Request',
            TypeNamePlural: 'Approval Requests',
            Title: {Value: approvalType},
            Description: {Value: status},
            TypeImageUrl: 'sap-icon://approvals'
        },

        HeaderFacets: [
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#HeaderRequest',
                Label: 'Request Details'
            }
        ],

        Facets: [
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#RequestInfo',
                Label: 'Request Information'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#DecisionInfo',
                Label: 'Decision Information'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#EscalationInfo',
                Label: 'Escalation Details'
            }
        ],

        FieldGroup#RequestInfo: {
            Data: [
                {Value: approvalType},
                {Value: priority},
                {Value: requestReason},
                {Value: requestedAmount},
                {Value: requestedDiscount},
                {Value: requestedBy.fullName},
                {Value: requestDate},
                {Value: submitterComments}
            ]
        },

        FieldGroup#DecisionInfo: {
            Data: [
                {Value: status},
                {Value: decision},
                {Value: approver.fullName},
                {Value: decisionDate},
                {Value: approverComments}
            ]
        },

        FieldGroup#EscalationInfo: {
            Data: [
                {Value: escalationReason},
                {Value: escalatedDate},
                {Value: previousApprover.fullName}
            ]
        },

        FieldGroup#HeaderRequest: {
            Data: [
                {Value: requestedAmount},
                {Value: requestedDiscount},
                {Value: priority}
            ]
        },

        Identification: [
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'WorkflowService.approve',
                Label: 'Approve Request'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'WorkflowService.rejectApproval',
                Label: 'Reject Request'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'WorkflowService.escalate',
                Label: 'Escalate'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'WorkflowService.withdraw',
                Label: 'Withdraw Request'
            }
        ]
    }
);

annotate WorkflowService.Approvals with {
    approvalType   @title: 'Approval Type';
    status         @title: 'Status';
    priority       @title: 'Priority';
    requestReason  @title: 'Request Reason' @UI.MultiLineText: true;
    requestedAmount @title: 'Requested Amount' @Measures.ISOCurrency: 'MYR';
    requestedDiscount @title: 'Discount (%)';
    requestDate    @title: 'Request Date';
    decisionDate   @title: 'Decision Date';
    approverComments @title: 'Approver Comments' @UI.MultiLineText: true;
}

// ============================================================================
// User Management
// ============================================================================

annotate WorkflowService.Users with @(
    UI: {
        SelectionFields: [
            status,
            role,
            team,
            territory
        ],

        LineItem: [
            {
                $Type: 'UI.DataField',
                Value: fullName,
                Label: 'Name',
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataField',
                Value: userName,
                Label: 'Username'
            },
            {
                $Type: 'UI.DataField',
                Value: email,
                Label: 'Email'
            },
            {
                $Type: 'UI.DataField',
                Value: role,
                Label: 'Role',
                Criticality: roleCriticality
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
                Value: team,
                Label: 'Team'
            },
            {
                $Type: 'UI.DataField',
                Value: territory,
                Label: 'Territory'
            },
            {
                $Type: 'UI.DataFieldForAnnotation',
                Target: '@UI.DataPoint#PerformanceScore',
                Label: 'Performance'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'WorkflowService.updateStatus',
                Label: 'Update Status',
                Inline: true
            }
        ],

        DataPoint#PerformanceScore: {
            Value: performanceScore,
            Title: 'Performance',
            TargetValue: 100,
            Visualization: #Progress,
            Criticality: performanceCriticality
        },

        HeaderInfo: {
            TypeName: 'User',
            TypeNamePlural: 'Users',
            Title: {Value: fullName},
            Description: {Value: role},
            ImageUrl: 'sap-icon://employee',
            TypeImageUrl: 'sap-icon://person-placeholder'
        },

        HeaderFacets: [
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.DataPoint#PerformanceScore',
                Label: 'Performance Score'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#HeaderInfo',
                Label: 'User Info'
            }
        ],

        Facets: [
            {
                $Type: 'UI.CollectionFacet',
                Label: 'User Information',
                ID: 'UserInfo',
                Facets: [
                    {
                        $Type: 'UI.ReferenceFacet',
                        Target: '@UI.FieldGroup#BasicInfo',
                        Label: 'Basic Details'
                    },
                    {
                        $Type: 'UI.ReferenceFacet',
                        Target: '@UI.FieldGroup#ContactInfo',
                        Label: 'Contact Information'
                    }
                ]
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#WorkInfo',
                Label: 'Work Assignment'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#PerformanceInfo',
                Label: 'Performance Metrics'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#AdditionalInfo',
                Label: 'Additional Details'
            }
        ],

        FieldGroup#BasicInfo: {
            Data: [
                {Value: userName},
                {Value: firstName},
                {Value: lastName},
                {Value: fullName},
                {Value: status}
            ]
        },

        FieldGroup#ContactInfo: {
            Data: [
                {Value: email},
                {Value: phone},
                {Value: mobile}
            ]
        },

        FieldGroup#WorkInfo: {
            Data: [
                {Value: role},
                {Value: team},
                {Value: territory},
                {Value: department},
                {Value: manager.fullName}
            ]
        },

        FieldGroup#PerformanceInfo: {
            Data: [
                {Value: performanceScore},
                {Value: lastPerformanceUpdate}
            ]
        },

        FieldGroup#AdditionalInfo: {
            Data: [
                {Value: notes}
            ]
        },

        FieldGroup#HeaderInfo: {
            Data: [
                {Value: role},
                {Value: team}
            ]
        },

        Identification: [
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'WorkflowService.updateStatus',
                Label: 'Update Status'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'WorkflowService.updatePerformance',
                Label: 'Update Performance'
            }
        ]
    }
);

annotate WorkflowService.Users with {
    userName       @title: 'Username' @Common.FieldControl: #Mandatory;
    fullName       @title: 'Full Name';
    firstName      @title: 'First Name';
    lastName       @title: 'Last Name';
    email          @title: 'Email' @Common.FieldControl: #Mandatory;
    role           @title: 'Role';
    status         @title: 'Status';
    team           @title: 'Team';
    territory      @title: 'Territory';
    performanceScore @title: 'Performance Score';
    notes          @title: 'Notes' @UI.MultiLineText: true;
}

// ============================================================================
// Analytical Views
// ============================================================================

annotate WorkflowService.PendingApprovals with @(
    UI: {
        LineItem: [
            {Value: approvalType},
            {Value: priority},
            {Value: requestDate},
            {Value: requestedBy.fullName},
            {Value: approver.fullName},
            {Value: requestedAmount}
        ]
    }
);

annotate WorkflowService.ApprovalsByType with @(
    UI: {
        Chart: {
            Title: 'Approvals by Type',
            ChartType: #Donut,
            Dimensions: [approvalType],
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
