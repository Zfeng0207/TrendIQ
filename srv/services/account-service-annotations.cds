/**
 * UI Annotations for Account & Contact Management
 * Includes master-detail relationships
 */
using AccountService from './account-service';

// ============================================================================
// Account List Report & Object Page
// ============================================================================

annotate AccountService.Accounts with @(
    UI: {
        SelectionFields: [
            status,
            accountTier,
            industry,
            city,
            accountOwner_ID,
            currentTimelineStage,
            priorityScore,
            phase,
            assignedTo,
            dateCreated
        ],

        LineItem: [
            {
                $Type: 'UI.DataField',
                Value: accountName,
                Label: 'Account Name',
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataField',
                Value: priorityScore,
                Label: 'Priority Score',
                Criticality: priorityScoreCriticality,
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataFieldForAnnotation',
                Target: '@UI.DataPoint#HealthScore',
                Label: 'Health Score',
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataField',
                Value: lastFollowUp,
                Label: 'Last Follow Up'
            },
            {
                $Type: 'UI.DataField',
                Value: assignedTo,
                Label: 'Assigned To'
            },
            {
                $Type: 'UI.DataField',
                Value: pendingItems,
                Label: 'Pending Items'
            },
            {
                $Type: 'UI.DataField',
                Value: dateCreated,
                Label: 'Date Created'
            }
        ],

        DataPoint#PriorityScore: {
            Value: priorityScore,
            Title: 'Priority Score',
            TargetValue: 100,
            Visualization: #Progress
        },

        DataPoint#HealthScore: {
            Value: healthScore,
            Title: 'Health Score',
            TargetValue: 100,
            Visualization: #Progress,
            Criticality: healthCriticality
        },

        DataPoint#SentimentScore: {
            Value: sentimentScore,
            Title: 'Sentiment Score',
            TargetValue: 100,
            Visualization: #Progress
        },

        HeaderInfo: {
            TypeName: 'Account',
            TypeNamePlural: 'Accounts',
            Title: {Value: accountName},
            Description: {Value: accountType},
            ImageUrl: 'sap-icon://customer-financial-fact-sheet',
            TypeImageUrl: 'sap-icon://building'
        },

        HeaderFacets: [
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.DataPoint#HealthScore',
                Label: 'Partner Health Score'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#KeyMetrics',
                Label: 'Key Metrics'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#AccountOverview',
                Label: 'Account Overview'
            }
        ],

        Facets: [
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#TimelineInfo',
                Label: 'Partner Priority Timeline'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#OpportunityFinancial',
                Label: 'Opportunity & Financial Deal'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#MarketingCampaign',
                Label: 'Joint Marketing Campaign Planner'
            },
            {
                $Type: 'UI.CollectionFacet',
                Label: 'AI Recommendations',
                ID: 'AIRecommendations',
                Facets: [
                    {
                        $Type: 'UI.ReferenceFacet',
                        Target: '@UI.FieldGroup#Recommendations',
                        Label: 'Actions'
                    },
                    {
                        $Type: 'UI.ReferenceFacet',
                        Target: 'recommendations/@UI.LineItem',
                        Label: 'Recommendations List'
                    }
                ]
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#RiskAlerts',
                Label: 'Risk Alerts'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: 'contacts/@UI.LineItem',
                Label: 'Contacts'
            }
        ],

        FieldGroup#BasicInfo: {
            Data: [
                {Value: accountName},
                {Value: accountType},
                {Value: industry},
                {Value: status},
                {Value: accountTier}
            ]
        },

        FieldGroup#ContactDetails: {
            Data: [
                {Value: phone},
                {Value: email},
                {Value: website}
            ]
        },

        FieldGroup#BusinessInfo: {
            Data: [
                {Value: establishedYear},
                {Value: employeeCount},
                {Value: annualRevenue},
                {Value: parentAccount.accountName}
            ]
        },

        FieldGroup#SocialMedia: {
            Data: [
                {Value: instagramHandle},
                {Value: tiktokHandle},
                {Value: facebookPage}
            ]
        },

        FieldGroup#FinancialInfo: {
            Data: [
                {Value: creditLimit},
                {Value: paymentTerms},
                {Value: riskLevel}
            ]
        },

        FieldGroup#AIInsights: {
            Data: [
                {Value: healthScore},
                {Value: riskLevel}
            ]
        },

        FieldGroup#KeyMetrics: {
            Data: [
                {Value: estimatedMonthlyGMV},
                {Value: forecastedRevenueContribution},
                {Value: annualRevenue},
                {Value: contractStatus}
            ]
        },

        FieldGroup#AccountOverview: {
            Data: [
                {Value: accountName},
                {Value: status},
                {Value: accountTier},
                {Value: accountManager.fullName},
                {
                    $Type: 'UI.DataFieldForAnnotation',
                    Target: '@UI.DataPoint#HealthScore',
                    Label: 'Health Score'
                },
                {
                    $Type: 'UI.DataField',
                    Value: recentSentimentTrend,
                    Label: 'Sentiment Trend'
                },
                {Value: accountType},
                {Value: industry},
                {Value: city},
                {Value: country}
            ]
        },

        FieldGroup#TimelineInfo: {
            Data: [
                {Value: currentTimelineStage},
                {Value: timelineStageStatus},
                {Value: nextRecommendedAction},
                {Value: timelineStageDeadline},
                {Value: timelineStageOwner.fullName},
                {Value: timelineStageNotes}
            ]
        },

        FieldGroup#OpportunityFinancial: {
            Data: [
                {Value: estimatedMonthlyGMV},
                {Value: forecastedRevenueContribution},
                {Value: contractStatus},
                {Value: creditLimit},
                {Value: paymentTerms}
            ]
        },

        FieldGroup#MarketingCampaign: {
            Data: [
                {Value: accountType},
                {Value: industry}
            ]
        },

        FieldGroup#Recommendations: {
            Data: [
                {
                    $Type: 'UI.DataFieldForAction',
                    Action: 'AccountService.getAIRecommendations',
                    Label: 'Get AI Recommendations'
                }
            ]
        },

        FieldGroup#RiskAlerts: {
            Data: [
                {Value: riskLevel},
                {Value: recentSentimentTrend},
                {
                    $Type: 'UI.DataFieldForAnnotation',
                    Target: '@UI.DataPoint#SentimentScore',
                    Label: 'Sentiment Score'
                }
            ]
        },

        Identification: [
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'AccountService.updateAIScore',
                Label: 'Refresh Health Score'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'AccountService.getAIRecommendations',
                Label: 'Get AI Recommendations',
                ![@UI.Hidden]: false
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'AccountService.mergeAccount',
                Label: 'Merge Account'
            }
        ]
    }
);

annotate AccountService.Accounts with {
    accountName    @title: 'Account Name' @Common.FieldControl: #Mandatory;
    accountType    @title: 'Account Type' @Common.FieldControl: #Mandatory;
    industry       @title: 'Industry';
    status         @title: 'Status';
    accountTier    @title: 'Tier';
    healthScore    @title: 'Health Score';
    annualRevenue  @title: 'Annual Revenue' @Measures.ISOCurrency: 'MYR';
    creditLimit    @title: 'Credit Limit' @Measures.ISOCurrency: 'MYR';
    estimatedMonthlyGMV @title: 'Estimated Monthly GMV' @Measures.ISOCurrency: 'MYR';
    forecastedRevenueContribution @title: 'Forecasted Revenue Contribution' @Measures.ISOCurrency: 'MYR';
    contractStatus @title: 'Contract Status';
    currentTimelineStage @title: 'Current Timeline Stage';
    timelineStageStatus @title: 'Timeline Stage Status';
    nextRecommendedAction @title: 'Next Recommended Action';
    timelineStageDeadline @title: 'Timeline Stage Deadline';
    timelineStageNotes @title: 'Timeline Stage Notes';
    recentSentimentTrend @title: 'Recent Sentiment Trend';
    sentimentScore @title: 'Sentiment Score';
    priorityScore @title: 'Priority Score';
    priorityScoreCriticality @UI.Hidden: true;
    currentStageSummary @title: 'Current Stage Summary' @UI.MultiLineText: true;
    nextStepsSummary @title: 'Next Steps Summary' @UI.MultiLineText: true;
    lastFollowUp @title: 'Last Follow Up';
    pendingItems @title: 'Pending Items';
    phase @title: 'Phase';
    phaseCriticality @UI.Hidden: true;
    assignedTo @title: 'Assigned To';
    dateCreated @title: 'Date Created';
}

// ============================================================================
// Side Effects
// ============================================================================

annotate AccountService.Accounts actions {
    updateAIScore @(
        Common.SideEffects: {
            TargetProperties: ['healthScore', 'sentimentScore', 'recentSentimentTrend']
        }
    );
    updateTimelineStage @(
        Common.SideEffects: {
            TargetProperties: ['currentTimelineStage', 'timelineStageStatus', 'timelineStageNotes', 'timelineStageDeadline']
        }
    );
    getAIRecommendations @(
        Common.IsActionCritical: false,
        Common.SideEffects: {
            $Type: 'Common.SideEffectsType',
            TargetProperties: [],
            TargetEntities: []
        }
    );
}

annotate AccountService.Contacts with @(
    UI: {
        SelectionFields: [
            status,
            isPrimary,
            account_ID
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
                Value: title,
                Label: 'Title'
            },
            {
                $Type: 'UI.DataField',
                Value: email,
                Label: 'Email'
            },
            {
                $Type: 'UI.DataField',
                Value: mobile,
                Label: 'Mobile'
            },
            {
                $Type: 'UI.DataField',
                Value: isPrimary,
                Label: 'Primary'
            },
            {
                $Type: 'UI.DataFieldForAnnotation',
                Target: '@UI.DataPoint#EngagementScore',
                Label: 'Engagement'
            },
            {
                $Type: 'UI.DataField',
                Value: status,
                Label: 'Status'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'AccountService.updateEngagementScore',
                Label: 'Update Score',
                Inline: true
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'AccountService.sendEmail',
                Label: 'Send Email',
                Inline: true
            }
        ],

        DataPoint#EngagementScore: {
            Value: engagementScore,
            Title: 'Engagement',
            TargetValue: 100,
            Visualization: #Progress
        },

        HeaderInfo: {
            TypeName: 'Contact',
            TypeNamePlural: 'Contacts',
            Title: {Value: fullName},
            Description: {Value: title},
            ImageUrl: 'sap-icon://customer',
            TypeImageUrl: 'sap-icon://person-placeholder'
        },

        HeaderFacets: [
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.DataPoint#EngagementScore',
                Label: 'Engagement Score'
            }
        ],

        Facets: [
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#ContactInfo',
                Label: 'Contact Information'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#SocialMedia',
                Label: 'Social Media'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#Preferences',
                Label: 'Preferences & Insights'
            }
        ],

        FieldGroup#ContactInfo: {
            Data: [
                {Value: firstName},
                {Value: lastName},
                {Value: fullName},
                {Value: title},
                {Value: department},
                {Value: email},
                {Value: phone},
                {Value: mobile},
                {Value: isPrimary},
                {Value: status}
            ]
        },

        FieldGroup#SocialMedia: {
            Data: [
                {Value: instagramHandle},
                {Value: tiktokHandle},
                {Value: linkedinProfile}
            ]
        },

        FieldGroup#Preferences: {
            Data: [
                {Value: preferredChannel},
                {Value: interests},
                {Value: engagementScore},
                {Value: sentimentScore},
                {Value: sentimentLabel},
                {Value: lastContactDate}
            ]
        },

        Identification: [
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'AccountService.sendEmail',
                Label: 'Send Email'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'AccountService.updateEngagementScore',
                Label: 'Update Engagement'
            }
        ]
    }
);

annotate AccountService.Contacts with {
    fullName       @title: 'Full Name' @Common.FieldControl: #Mandatory;
    firstName      @title: 'First Name';
    lastName       @title: 'Last Name';
    title          @title: 'Job Title';
    department     @title: 'Department';
    email          @title: 'Email' @Common.FieldControl: #Mandatory;
    mobile         @title: 'Mobile';
    isPrimary      @title: 'Primary Contact';
    engagementScore @title: 'Engagement Score';
    notes          @UI.MultiLineText: true;
}

// ============================================================================
// Account Recommendations Annotations
// ============================================================================

annotate AccountService.AccountRecommendations with @(
    UI: {
        LineItem: [
            {
                $Type: 'UI.DataField',
                Value: recommendationType,
                Label: 'Type',
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataField',
                Value: recommendationText,
                Label: 'Recommendation',
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataField',
                Value: priority,
                Label: 'Priority'
            },
            {
                $Type: 'UI.DataField',
                Value: status,
                Label: 'Status'
            },
            {
                $Type: 'UI.DataField',
                Value: generatedDate,
                Label: 'Generated Date'
            }
        ],

        HeaderInfo: {
            TypeName: 'Recommendation',
            TypeNamePlural: 'Recommendations',
            Title: {Value: recommendationText},
            Description: {Value: recommendationType}
        }
    }
);

annotate AccountService.AccountRecommendations with {
    recommendationType @title: 'Recommendation Type';
    recommendationText @title: 'Recommendation Text' @Common.FieldControl: #Mandatory;
    priority @title: 'Priority';
    aiGenerated @title: 'AI Generated';
    status @title: 'Status';
    generatedDate @title: 'Generated Date';
}

// ============================================================================
// Account Risk Alerts Annotations
// ============================================================================

annotate AccountService.AccountRiskAlerts with @(
    UI: {
        LineItem: [
            {
                $Type: 'UI.DataField',
                Value: alertType,
                Label: 'Alert Type',
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataField',
                Value: alertMessage,
                Label: 'Alert Message',
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataField',
                Value: severity,
                Label: 'Severity'
            },
            {
                $Type: 'UI.DataField',
                Value: detectedDate,
                Label: 'Detected Date'
            },
            {
                $Type: 'UI.DataField',
                Value: isResolved,
                Label: 'Resolved'
            }
        ],

        HeaderInfo: {
            TypeName: 'Risk Alert',
            TypeNamePlural: 'Risk Alerts',
            Title: {Value: alertMessage},
            Description: {Value: alertType}
        }
    }
);

annotate AccountService.AccountRiskAlerts with {
    alertType @title: 'Alert Type';
    alertMessage @title: 'Alert Message' @Common.FieldControl: #Mandatory;
    severity @title: 'Severity';
    detectedDate @title: 'Detected Date';
    resolvedDate @title: 'Resolved Date';
    isResolved @title: 'Is Resolved';
}
