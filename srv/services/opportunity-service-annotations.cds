/**
 * UI Annotations for Opportunity & Approval Management
 * Includes pipeline visualization and approval workflows
 */
using OpportunityService from './opportunity-service';

// ============================================================================
// Opportunity List Report & Object Page
// ============================================================================

annotate OpportunityService.Opportunities with @(
    UI: {
        SelectionFields: [
            stage,
            account_ID,
            owner_ID,
            closeDate,
            requiresApproval
        ],

        LineItem: [
            {
                $Type: 'UI.DataField',
                Value: name,
                Label: 'Opportunity',
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataField',
                Value: account.accountName,
                Label: 'Account'
            },
            {
                $Type: 'UI.DataField',
                Value: stage,
                Label: 'Stage',
                Criticality: stageCriticality
            },
            {
                $Type: 'UI.DataField',
                Value: amount,
                Label: 'Amount'
            },
            {
                $Type: 'UI.DataField',
                Value: probability,
                Label: 'Probability (%)',
                Criticality: winScoreCriticality
            },
            {
                $Type: 'UI.DataFieldForAnnotation',
                Target: '@UI.DataPoint#AIWinScore',
                Label: 'AI Win Score',
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataField',
                Value: expectedRevenue,
                Label: 'Expected Revenue'
            },
            {
                $Type: 'UI.DataField',
                Value: closeDate,
                Label: 'Expected Close'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'OpportunityService.updateAIWinScore',
                Label: 'Update AI Score',
                Inline: true,
                IconUrl: 'sap-icon://refresh'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'OpportunityService.moveToStage',
                Label: 'Move Stage',
                Inline: true
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'OpportunityService.markAsWon',
                Label: 'Mark Won',
                Inline: true,
                Criticality: 3
            }
        ],

        DataPoint#AIWinScore: {
            Value: aiWinScore,
            Title: 'AI Win Probability',
            TargetValue: 100,
            Visualization: #Progress,
            Criticality: winScoreCriticality
        },

        DataPoint#Amount: {
            Value: amount,
            Title: 'Opportunity Value'
        },

        HeaderInfo: {
            TypeName: 'Opportunity',
            TypeNamePlural: 'Opportunities',
            Title: {Value: name},
            Description: {Value: account.accountName},
            ImageUrl: 'sap-icon://sales-order',
            TypeImageUrl: 'sap-icon://opportunity'
        },

        HeaderFacets: [
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.DataPoint#Amount',
                Label: 'Amount'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.DataPoint#AIWinScore',
                Label: 'Win Probability'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#HeaderMetrics',
                Label: 'Key Metrics'
            }
        ],

        Facets: [
            {
                $Type: 'UI.CollectionFacet',
                Label: 'Overview',
                ID: 'Overview',
                Facets: [
                    {
                        $Type: 'UI.ReferenceFacet',
                        Target: '@UI.FieldGroup#BasicInfo',
                        Label: 'Basic Information'
                    },
                    {
                        $Type: 'UI.ReferenceFacet',
                        Target: '@UI.FieldGroup#AIInsights',
                        Label: 'AI Insights'
                    }
                ]
            },
            {
                $Type: 'UI.CollectionFacet',
                Label: 'Stage & Timeline',
                ID: 'StageInfo',
                Facets: [
                    {
                        $Type: 'UI.ReferenceFacet',
                        Target: '@UI.FieldGroup#StageInfo',
                        Label: 'Timeline Details'
                    }
                ]
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#FinancialInfo',
                Label: 'Financial Details'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: 'products/@UI.LineItem',
                Label: 'Products'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#AdditionalInfo',
                Label: 'Additional Information'
            }
        ],

        FieldGroup#BasicInfo: {
            Data: [
                {Value: name},
                {Value: account.accountName},
                {Value: primaryContact.fullName},
                {Value: description}
            ]
        },

        FieldGroup#StageInfo: {
            Data: [
                {Value: stage},
                {Value: probability},
                {Value: closeDate},
                {Value: actualCloseDate}
            ]
        },

        FieldGroup#FinancialInfo: {
            Data: [
                {Value: amount},
                {Value: expectedRevenue},
                {Value: discountPercent},
                {Value: discountAmount},
                {Value: requiresApproval}
            ]
        },

        FieldGroup#AIInsights: {
            Data: [
                {Value: aiWinScore},
                {Value: aiRecommendation}
            ]
        },

        FieldGroup#AdditionalInfo: {
            Data: [
                {Value: description},
                {Value: competitors},
                {Value: winStrategy},
                {Value: lostReason},
                {Value: notes}
            ]
        },

        FieldGroup#HeaderMetrics: {
            Data: [
                {Value: probability},
                {Value: expectedRevenue}
            ]
        },

        Identification: [
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'OpportunityService.moveToStage',
                Label: 'Move to Stage'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'OpportunityService.markAsWon',
                Label: 'Mark as Won'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'OpportunityService.markAsLost',
                Label: 'Mark as Lost'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'OpportunityService.requestApproval',
                Label: 'Request Approval'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'OpportunityService.updateAIWinScore',
                Label: 'Update AI Score'
            }
        ]
    }
);

annotate OpportunityService.Opportunities with {
    name           @title: 'Opportunity Name' @Common.FieldControl: #Mandatory;
    stage          @title: 'Stage';
    amount         @title: 'Amount' @Measures.ISOCurrency: currency;
    probability    @title: 'Probability (%)';
    aiWinScore     @title: 'AI Win Score'
                   @Common.FieldControl: #ReadOnly;
    aiRecommendation @title: 'AI Recommendation'
                   @Common.FieldControl: #ReadOnly;
    expectedRevenue @title: 'Expected Revenue' @Measures.ISOCurrency: currency
                   @Common.FieldControl: #ReadOnly;
    winScoreCriticality @UI.Hidden: true
                   @Common.FieldControl: #ReadOnly;
    stageCriticality @UI.Hidden: true
                   @Common.FieldControl: #ReadOnly;
    discountAmount @title: 'Discount Amount' @Measures.ISOCurrency: currency;
}

// ============================================================================
// Opportunity Products (Line Items)
// ============================================================================

annotate OpportunityService.OpportunityProducts with @(
    UI: {
        LineItem: [
            {
                $Type: 'UI.DataField',
                Value: product.productName,
                Label: 'Product'
            },
            {
                $Type: 'UI.DataField',
                Value: product.productCode,
                Label: 'Product Code'
            },
            {
                $Type: 'UI.DataField',
                Value: quantity,
                Label: 'Quantity'
            },
            {
                $Type: 'UI.DataField',
                Value: unitPrice,
                Label: 'Unit Price'
            },
            {
                $Type: 'UI.DataField',
                Value: discount,
                Label: 'Discount (%)'
            },
            {
                $Type: 'UI.DataField',
                Value: totalPrice,
                Label: 'Total Price'
            }
        ],

        Facets: [
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#ProductDetails',
                Label: 'Product Details'
            }
        ],

        FieldGroup#ProductDetails: {
            Data: [
                {Value: product.productName},
                {Value: quantity},
                {Value: unitPrice},
                {Value: discount},
                {Value: totalPrice},
                {Value: notes}
            ]
        }
    }
);

annotate OpportunityService.OpportunityProducts with {
    quantity    @title: 'Quantity';
    unitPrice   @title: 'Unit Price';
    discount    @title: 'Discount (%)';
    totalPrice  @title: 'Total Price';
}

// ============================================================================
// Approvals
// ============================================================================

annotate OpportunityService.Approvals with @(
    UI: {
        SelectionFields: [
            status,
            priority,
            approvalType,
            requestDate
        ],

        LineItem: [
            {
                $Type: 'UI.DataField',
                Value: approvalType,
                Label: 'Type'
            },
            {
                $Type: 'UI.DataField',
                Value: opportunityID.name,
                Label: 'Opportunity'
            },
            {
                $Type: 'UI.DataField',
                Value: status,
                Label: 'Status',
                
                
            },
            {
                $Type: 'UI.DataField',
                Value: priority,
                Label: 'Priority',
                
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
                Value: requestDate,
                Label: 'Requested'
            },
            {
                $Type: 'UI.DataField',
                Value: approver.fullName,
                Label: 'Approver'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'OpportunityService.approve',
                Label: 'Approve',
                Inline: true,
                Criticality: 3
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'OpportunityService.reject',
                Label: 'Reject',
                Inline: true,
                Criticality: 1
            }
        ],

        HeaderInfo: {
            TypeName: 'Approval',
            TypeNamePlural: 'Approvals',
            Title: {Value: approvalType},
            Description: {Value: status},
            TypeImageUrl: 'sap-icon://approvals'
        },

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
                {Value: requestDate}
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

        Identification: [
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'OpportunityService.approve',
                Label: 'Approve'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'OpportunityService.reject',
                Label: 'Reject'
            }
        ]
    }
);

annotate OpportunityService.Approvals with {
    approvalType   @title: 'Approval Type';
    status         @title: 'Status';
    priority       @title: 'Priority';
    requestedAmount @title: 'Requested Amount' @Measures.ISOCurrency: 'MYR';
    requestedDiscount @title: 'Requested Discount (%)';
}

// ============================================================================
// Capabilities for Edit/Save/Delete
// ============================================================================

annotate OpportunityService.Opportunities with @(
    Capabilities: {
        InsertRestrictions: { Insertable: true },
        UpdateRestrictions: { Updatable: true },
        DeleteRestrictions: { Deletable: true }
    }
);

// ============================================================================
// Side Effects
// ============================================================================

annotate OpportunityService.Opportunities actions {
    updateAIWinScore @(
        Common.SideEffects: {
            TargetProperties: ['aiWinScore', 'aiRecommendation', 'probability']
        }
    );
    markAsWon @(
        Common.SideEffects: {
            // Note: stageCriticality is a virtual field computed in after READ handler - not included to avoid polling loops
            TargetProperties: ['stage', 'probability', 'actualCloseDate']
        }
    );
    markAsLost @(
        Common.SideEffects: {
            // Note: stageCriticality is a virtual field computed in after READ handler - not included to avoid polling loops
            TargetProperties: ['stage', 'probability', 'actualCloseDate', 'lostReason']
        }
    );
    moveToStage @(
        Common.SideEffects: {
            // Note: stageCriticality is a virtual field computed in after READ handler - not included to avoid polling loops
            TargetProperties: ['stage', 'probability']
        }
    );
}

// ============================================================================
// Analytical Views
// ============================================================================

annotate OpportunityService.OpportunitiesByStage with @(
    UI: {
        Chart: {
            Title: 'Pipeline by Stage',
            ChartType: #Column,
            Dimensions: [stage],
            Measures: [count, totalAmount],
            MeasureAttributes: [
                {
                    Measure: totalAmount,
                    Role: #Axis1
                },
                {
                    Measure: count,
                    Role: #Axis2
                }
            ]
        },
        PresentationVariant: {
            Visualizations: ['@UI.Chart']
        }
    }
);

annotate OpportunityService.HighValueDeals with @(
    UI: {
        LineItem: [
            {Value: name},
            {Value: amount},
            {Value: stage},
            {Value: aiWinScore}
        ]
    }
);
