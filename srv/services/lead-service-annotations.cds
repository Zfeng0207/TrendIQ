/**
 * UI Annotations for Lead Management
 * Defines List Report and Object Page layouts
 */
using LeadService from './lead-service';

// ============================================================================
// Lead List Report Annotations
// ============================================================================

annotate LeadService.Leads with @(
    UI: {
        // Selection Fields (Filter Bar)
        SelectionFields: [
            status,
            leadQuality,
            platform,
            source,
            owner_ID
        ],

        // List View Columns
        LineItem: [
            {
                $Type: 'UI.DataField',
                Value: outletName,
                Label: 'Outlet Name',
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataField',
                Value: brandToPitch,
                Label: 'Brand to Pitch'
            },
            {
                $Type: 'UI.DataField',
                Value: platform,
                Label: 'Platform',
                Criticality: platformCriticality
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
                Value: leadQuality,
                Label: 'Quality',
                Criticality: qualityCriticality,
                CriticalityRepresentation: #WithoutIcon
            },
            {
                $Type: 'UI.DataFieldForAnnotation',
                Target: '@UI.DataPoint#AIScore',
                Label: 'AI Score'
            },
            {
                $Type: 'UI.DataField',
                Value: estimatedValue,
                Label: 'Est. Value'
            },
            {
                $Type: 'UI.DataField',
                Value: owner.fullName,
                Label: 'Owner'
            },
            {
                $Type: 'UI.DataField',
                Value: lastContactDate,
                Label: 'Last Contact'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'LeadService.updateAIScore',
                Label: 'Update AI Score',
                Inline: true
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'LeadService.convertToAccount',
                Label: 'Convert to Account',
                Inline: true,
                Criticality: 3
            }
        ],

        // Data Points for Micro Charts
        DataPoint#AIScore: {
            Value: aiScore,
            Title: 'AI Score',
            TargetValue: 100,
            Visualization: #Progress,
            Criticality: aiScoreCriticality
        },

        DataPoint#TrendScore: {
            Value: trendScore,
            Title: 'Trend Score',
            TargetValue: 100,
            Visualization: #Progress
        },

        // Header Info (Object Page Header)
        HeaderInfo: {
            TypeName: 'Lead',
            TypeNamePlural: 'Leads',
            Title: {Value: outletName},
            Description: {Value: brandToPitch},
            ImageUrl: 'sap-icon://customer',
            TypeImageUrl: 'sap-icon://lead'
        },

        // Header Facets (KPIs in Header)
        HeaderFacets: [
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.DataPoint#AIScore',
                Label: 'AI Score'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.DataPoint#TrendScore',
                Label: 'Trend Score'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#EstimatedValue',
                Label: 'Estimated Value'
            }
        ],

        // Object Page Facets (Sections)
        Facets: [
            {
                $Type: 'UI.CollectionFacet',
                Label: 'General Information',
                ID: 'GeneralInfo',
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
                $Type: 'UI.CollectionFacet',
                Label: 'Lead Details',
                ID: 'LeadDetails',
                Facets: [
                    {
                        $Type: 'UI.ReferenceFacet',
                        Target: '@UI.FieldGroup#LeadClassification',
                        Label: 'Classification'
                    },
                    {
                        $Type: 'UI.ReferenceFacet',
                        Target: '@UI.FieldGroup#AIInsights',
                        Label: 'AI Insights'
                    }
                ]
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#LocationInfo',
                Label: 'Location'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#AdditionalInfo',
                Label: 'Additional Information'
            }
        ],

        // Field Groups (Form Sections)
        FieldGroup#BasicInfo: {
            Data: [
                {Value: outletName},
                {Value: brandToPitch},
                {Value: productCategory},
                {Value: platform},
                {Value: source},
                {Value: sourceDetail}
            ]
        },

        FieldGroup#ContactInfo: {
            Data: [
                {Value: contactName},
                {Value: contactEmail},
                {Value: contactPhone},
                {Value: lastContactDate}
            ]
        },

        FieldGroup#LeadClassification: {
            Data: [
                {Value: status},
                {Value: leadQuality},
                {Value: estimatedValue},
                {Value: currency},
                {Value: converted},
                {Value: convertedDate}
            ]
        },

        FieldGroup#AIInsights: {
            Data: [
                {Value: aiScore},
                {Value: sentimentScore},
                {Value: sentimentLabel},
                {Value: trendScore},
                {Value: recommendedAction}
            ]
        },

        FieldGroup#LocationInfo: {
            Data: [
                {Value: address},
                {Value: city},
                {Value: state},
                {Value: country},
                {Value: postalCode}
            ]
        },

        FieldGroup#AdditionalInfo: {
            Data: [
                {Value: notes},
                {Value: owner.fullName}
            ]
        },

        FieldGroup#EstimatedValue: {
            Data: [
                {
                    $Type: 'UI.DataField',
                    Value: estimatedValue,
                    Label: 'Estimated Value'
                }
            ]
        },

        // Actions in Identification section
        Identification: [
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'LeadService.convertToAccount',
                Label: 'Convert to Account'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'LeadService.updateAIScore',
                Label: 'Refresh AI Score'
            }
        ]
    },

    // Semantic annotations for fields
    UI.TextArrangement: #TextOnly
);

// ============================================================================
// Field-level Annotations
// ============================================================================

annotate LeadService.Leads with {
    outletName     @title: 'Outlet Name'
                   @Common.FieldControl: #Mandatory;

    brandToPitch   @title: 'Brand to Pitch'
                   @Common.FieldControl: #Mandatory;

    platform       @title: 'Platform'
                   @Common: {
                       ValueList: {
                           CollectionPath: 'Leads',
                           Parameters: [
                               {
                                   $Type: 'Common.ValueListParameterInOut',
                                   LocalDataProperty: platform,
                                   ValueListProperty: 'platform'
                               }
                           ]
                       }
                   };

    status         @title: 'Status'
                   @Common: {
                       ValueListWithFixedValues: true,
                       Text: status,
                       TextArrangement: #TextOnly
                   };

    leadQuality    @title: 'Lead Quality'
                   @Common: {
                       ValueListWithFixedValues: true
                   };

    source         @title: 'Source';

    contactName    @title: 'Contact Name';
    contactEmail   @title: 'Email';
    contactPhone   @title: 'Phone';

    aiScore        @title: 'AI Score'
                   @Measures.Unit: '%';

    sentimentScore @title: 'Sentiment Score';
    sentimentLabel @title: 'Sentiment';
    trendScore     @title: 'Trend Score';

    estimatedValue @title: 'Estimated Value'
                   @Measures.ISOCurrency: currency;

    notes          @UI.MultiLineText: true;
}

// ============================================================================
// Virtual Fields for Criticality (calculated in service)
// ============================================================================

// Virtual fields would need to be added to the service projection
// Commenting out for now
// annotate LeadService.Leads with {
//     statusCriticality: Integer @UI.Hidden;
//     qualityCriticality: Integer @UI.Hidden;
//     platformCriticality: Integer @UI.Hidden;
//     aiScoreCriticality: Integer @UI.Hidden;
// }


// ============================================================================
// Action Parameter Annotations
// ============================================================================

annotate LeadService.convertToAccount with @(
    Common.SideEffects: {
        TargetProperties: ['converted', 'convertedDate', 'status']
    }
);

annotate LeadService.updateAIScore with @(
    Common.SideEffects: {
        TargetProperties: ['aiScore', 'sentimentScore', 'trendScore', 'recommendedAction']
    }
);
