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
            accountOwner_ID
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
                Value: accountType,
                Label: 'Type'
            },
            {
                $Type: 'UI.DataField',
                Value: industry,
                Label: 'Industry'
            },
            {
                $Type: 'UI.DataField',
                Value: status,
                Label: 'Status'
            },
            {
                $Type: 'UI.DataField',
                Value: accountTier,
                Label: 'Tier'
            },
            {
                $Type: 'UI.DataFieldForAnnotation',
                Target: '@UI.DataPoint#HealthScore',
                Label: 'Health'
            },
            {
                $Type: 'UI.DataField',
                Value: annualRevenue,
                Label: 'Annual Revenue'
            },
            {
                $Type: 'UI.DataField',
                Value: city,
                Label: 'City'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'AccountService.updateAIScore',
                Label: 'Update Health Score',
                Inline: true
            }
        ],

        DataPoint#HealthScore: {
            Value: healthScore,
            Title: 'Health Score',
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
                Label: 'Health Score'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#KeyMetrics',
                Label: 'Key Metrics'
            }
        ],

        Facets: [
            {
                $Type: 'UI.CollectionFacet',
                Label: 'Account Information',
                ID: 'AccountInfo',
                Facets: [
                    {
                        $Type: 'UI.ReferenceFacet',
                        Target: '@UI.FieldGroup#BasicInfo',
                        Label: 'Basic Details'
                    },
                    {
                        $Type: 'UI.ReferenceFacet',
                        Target: '@UI.FieldGroup#ContactDetails',
                        Label: 'Contact Details'
                    }
                ]
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#BusinessInfo',
                Label: 'Business Information'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#SocialMedia',
                Label: 'Social Media'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#FinancialInfo',
                Label: 'Financial Information'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: 'contacts/@UI.LineItem',
                Label: 'Contacts'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#AIInsights',
                Label: 'AI Insights'
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
                {Value: annualRevenue},
                {Value: employeeCount}
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
}

// ============================================================================
// Contact List & Object Page (nested in Account)
// ============================================================================

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
