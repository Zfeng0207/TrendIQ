/**
 * UI Annotations for Lead Management
 * Defines List Report and Object Page layouts
 */
using LeadService from './lead-service';

// ============================================================================
// Lead List Report / Analytical List Page Annotations
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
                Value: status,
                Label: 'Status',
                Criticality: statusCriticality
            },
            {
                $Type: 'UI.DataField',
                Value: leadQuality,
                Label: 'Quality',
                Criticality: leadQualityCriticality
            },
            {
                $Type: 'UI.DataFieldForAnnotation',
                Target: '@UI.DataPoint#AIScore',
                Label: 'AI Score',
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataFieldForAnnotation',
                Target: '@UI.DataPoint#TrendScore',
                Label: 'Trend',
                ![@UI.Importance]: #Medium
            },
            {
                $Type: 'UI.DataField',
                Value: estimatedValue,
                Label: 'Est. Value'
            },
            {
                $Type: 'UI.DataField',
                Value: platform,
                Label: 'Platform'
            },
            {
                $Type: 'UI.DataField',
                Value: owner.fullName,
                Label: 'Owner'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'LeadService.updateAIScore',
                Label: 'Update AI Score',
                Inline: true,
                IconUrl: 'sap-icon://refresh'
            }
        ],

        // Data Points for Micro Charts
        DataPoint#AIScore: {
            Value: aiScore,
            Title: 'AI Score',
            TargetValue: 100,
            Visualization: #Progress,
            CriticalityCalculation: {
                ImprovementDirection: #Maximize,
                ToleranceLowValue: 50,
                ToleranceHighValue: 80,
                DeviationLowValue: 40,
                DeviationHighValue: 100
            }
        },

        DataPoint#TrendScore: {
            Value: trendScore,
            Title: 'Trend Score',
            TargetValue: 100,
            Visualization: #Progress, // Or Delta if you have a previous value
            CriticalityCalculation: {
                ImprovementDirection: #Maximize,
                ToleranceLowValue: 50,
                ToleranceHighValue: 80,
                DeviationLowValue: 40,
                DeviationHighValue: 100
            }
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
                Target: '@UI.DataPoint#EstValue',
                Label: 'Estimated Value'
            }
        ],

        // Object Page Facets (Sections)
        Facets: [
            {
                $Type: 'UI.CollectionFacet',
                Label: 'Overview',
                ID: 'Overview',
                Facets: [
                    {
                        $Type: 'UI.ReferenceFacet',
                        Target: '@UI.FieldGroup#BasicInfo',
                        Label: 'Basic Details'
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
                Label: 'Contact & Activity',
                ID: 'ContactActivity',
                Facets: [
                    {
                        $Type: 'UI.ReferenceFacet',
                        Target: '@UI.FieldGroup#ContactInfo',
                        Label: 'Contact Information'
                    },
                     {
                        $Type: 'UI.ReferenceFacet',
                        Target: '@UI.FieldGroup#ActivityInfo',
                        Label: 'Activity'
                    }
                ]
            },
            {
                $Type: 'UI.CollectionFacet',
                Label: 'Qualify',
                ID: 'Qualify',
                Facets: [
                     {
                        $Type: 'UI.ReferenceFacet',
                        Target: '@UI.FieldGroup#LeadClassification',
                        Label: 'Classification'
                    },
                    {
                        $Type: 'UI.ReferenceFacet',
                        Target: '@UI.FieldGroup#LocationInfo',
                        Label: 'Location'
                    }
                ]
            }
        ],

        // Field Groups (Form Sections)
        FieldGroup#BasicInfo: {
            Data: [
                {Value: outletName},
                {Value: brandToPitch},
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
                {Value: owner.fullName}
            ]
        },

        FieldGroup#ActivityInfo: {
            Data: [
                {Value: lastContactDate},
                {Value: notes}
            ]
        },

        FieldGroup#LeadClassification: {
            Data: [
                {Value: status},
                {Value: leadQuality},
                {Value: estimatedValue},
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

        DataPoint#EstValue: {
            Value: estimatedValue,
            Title: 'Est. Value',
            Visualization: #Number
        },

        // Actions in Identification section
        Identification: [
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'LeadService.qualifyLead',
                Label: 'Qualify Lead',
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'LeadService.convertToAccount',
                Label: 'Convert to Account',
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'LeadService.updateAIScore',
                Label: 'Refresh AI Score',
                ![@UI.Importance]: #Medium
            }
        ]
    },

    // Semantic annotations for fields
    UI.TextArrangement: #TextOnly
);

// ============================================================================
// Analytics on Leads (ApplySupported + Charts + SPV for ALP)
// ============================================================================

// Enable analytical operations on the Leads entity
annotate LeadService.Leads with @Aggregation.ApplySupported: {
    Rollup: #None,
    GroupableProperties: [ status, source, platform, owner_ID ],
    AggregatableProperties: [ { Property: estimatedValue } ]
};

// Charts and SelectionPresentationVariant for Analytical List Page
annotate LeadService.Leads with @(
    // Main chart on status
    UI.Chart #ByStatus: {
        Title: 'Leads by Status',
        Description: 'Total estimated value per status',
        ChartType: #Column,
        Dimensions: [status],
        Measures: [estimatedValue],
        DimensionAttributes: [{
            Dimension: status,
            Role: #Category
        }],
        MeasureAttributes: [{
            Measure: estimatedValue,
            Role: #Axis1
        }]
    },

    // Secondary chart on source
    UI.Chart #BySource: {
        Title: 'Leads by Source',
        Description: 'Total estimated value per source',
        ChartType: #Donut,
        Dimensions: [source],
        Measures: [estimatedValue],
        DimensionAttributes: [{
            Dimension: source,
            Role: #Category
        }],
        MeasureAttributes: [{
            Measure: estimatedValue,
            Role: #Axis1
        }]
    },

    // SelectionVariant used by the ALP (filter bar)
    UI.SelectionVariant #Default: {
        Text: 'Leads'
    },

    // PresentationVariant combining chart + table
    UI.PresentationVariant #Main: {
        Visualizations: [
            '@UI.Chart#ByStatus',
            '@UI.LineItem'
        ]
    },

    // SelectionPresentationVariant that the ALP will use
    UI.SelectionPresentationVariant #Main: {
        SelectionVariant: '@UI.SelectionVariant#Default',
        PresentationVariant: '@UI.PresentationVariant#Main'
    }
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

    // Visual filter-enabled value help for status
    status         @title: 'Status'
                   @Common: {
                       ValueListWithFixedValues: true,
                       Text: status,
                       TextArrangement: #TextOnly,
                       ValueList: {
                           CollectionPath: 'LeadsByStatus',
                           PresentationVariantQualifier: 'ByStatusFilter',
                           Parameters: [
                               {
                                   $Type: 'Common.ValueListParameterInOut',
                                   LocalDataProperty: status,
                                   ValueListProperty: 'status'
                               }
                           ]
                       }
                   };

    leadQuality    @title: 'Lead Quality'
                   @Common: {
                       ValueListWithFixedValues: true
                   };

    // Visual filter-enabled value help for source
    source         @title: 'Source'
                   @Common: {
                       ValueList: {
                           CollectionPath: 'LeadsBySource',
                           PresentationVariantQualifier: 'BySourceFilter',
                           Parameters: [
                               {
                                   $Type: 'Common.ValueListParameterInOut',
                                   LocalDataProperty: source,
                                   ValueListProperty: 'source'
                               }
                           ]
                       }
                   };

    contactName    @title: 'Contact Name';
    contactEmail   @title: 'Email';
    contactPhone   @title: 'Phone';

    aiScore        @title: 'AI Score'
                   @Measures.Unit: '%';

    sentimentScore @title: 'Sentiment Score';
    sentimentLabel @title: 'Sentiment';
    trendScore     @title: 'Trend Score';

    estimatedValue @title: 'Estimated Value (MYR)';

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
// Chart Annotations for Analytics (Aggregated Entities + Visual Filters)
// ============================================================================

annotate LeadService.LeadsByStatus with @(
    UI.Chart #ByStatus: {
        Title: 'Leads by Status',
        Description: 'Count of leads per status',
        ChartType: #Column,
        Dimensions: [status],
        Measures: [count],
        DimensionAttributes: [{
            Dimension: status,
            Role: #Category
        }],
        MeasureAttributes: [{
            Measure: count,
            Role: #Axis1
        }]
    },

    // Used by visual filter on Status
    UI.PresentationVariant #ByStatusFilter: {
        Visualizations: ['@UI.Chart#ByStatus']
    }
);

annotate LeadService.LeadsBySource with @(
    UI.Chart #BySource: {
        Title: 'Leads by Source',
        Description: 'Count of leads per source',
        ChartType: #Donut,
        Dimensions: [source],
        Measures: [count],
        DimensionAttributes: [{
            Dimension: source,
            Role: #Category
        }],
        MeasureAttributes: [{
            Measure: count,
            Role: #Axis1
        }]
    },

    // Used by visual filter on Source
    UI.PresentationVariant #BySourceFilter: {
        Visualizations: ['@UI.Chart#BySource']
    }
);

// ============================================================================
// Side Effects
// ============================================================================

annotate LeadService.Leads actions {
    convertToAccount @(
        Common.SideEffects: {
            TargetProperties: ['converted', 'convertedDate', 'status']
        }
    );
    qualifyLead @(
        Common.SideEffects: {
            TargetProperties: ['status', 'leadQuality', 'statusCriticality', 'leadQualityCriticality']
        }
    );
    updateAIScore @(
        Common.SideEffects: {
            TargetProperties: ['aiScore', 'sentimentScore', 'trendScore', 'recommendedAction']
        }
    );
}
