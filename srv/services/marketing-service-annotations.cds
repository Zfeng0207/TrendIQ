/**
 * UI Annotations for Marketing Campaign Service
 * Defines List Report and Object Page layouts
 */
using MarketingService from './marketing-service';

// ============================================================================
// Marketing Campaign List Report Annotations
// ============================================================================

annotate MarketingService.MarketingCampaigns with @(
    UI: {
        // Selection Fields (Filter Bar)
        SelectionFields: [
            status,
            campaignType,
            owner_ID
        ],

        // List View Columns
        LineItem: [
            {
                $Type: 'UI.DataField',
                Value: campaignName,
                Label: 'Campaign Name',
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataField',
                Value: campaignType,
                Label: 'Type'
            },
            {
                $Type: 'UI.DataField',
                Value: status,
                Label: 'Status'
            },
            {
                $Type: 'UI.DataField',
                Value: triggerKeyword,
                Label: 'Trigger Keyword'
            },
            {
                $Type: 'UI.DataField',
                Value: ESGTag,
                Label: 'ESG Tag'
            },
            {
                $Type: 'UI.DataField',
                Value: budget,
                Label: 'Budget'
            },
            {
                $Type: 'UI.DataField',
                Value: startDate,
                Label: 'Start Date'
            },
            {
                $Type: 'UI.DataField',
                Value: endDate,
                Label: 'End Date'
            },
            {
                $Type: 'UI.DataField',
                Value: owner.fullName,
                Label: 'Owner'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'MarketingService.generateCampaignBrief',
                Label: 'Generate Brief',
                Inline: true
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'MarketingService.launchCampaign',
                Label: 'Launch',
                Inline: true,
                Criticality: 3
            }
        ],

        // Header Info (Object Page Header)
        HeaderInfo: {
            TypeName: 'Marketing Campaign',
            TypeNamePlural: 'Marketing Campaigns',
            Title: {Value: campaignName},
            Description: {Value: triggerKeyword},
            ImageUrl: 'sap-icon://marketing-campaign',
            TypeImageUrl: 'sap-icon://marketing-campaign'
        },

        // Header Facets (KPIs in Header)
        HeaderFacets: [
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#CampaignStatus',
                Label: 'Status & Budget'
            }
        ],

        // Object Page Facets (Sections)
        Facets: [
            {
                $Type: 'UI.CollectionFacet',
                Label: 'Campaign Details',
                ID: 'CampaignDetails',
                Facets: [
                    {
                        $Type: 'UI.ReferenceFacet',
                        Target: '@UI.FieldGroup#BasicInfo',
                        Label: 'Basic Information'
                    },
                    {
                        $Type: 'UI.ReferenceFacet',
                        Target: '@UI.FieldGroup#CampaignStrategy',
                        Label: 'Campaign Strategy'
                    }
                ]
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#CampaignBrief',
                Label: 'Campaign Brief'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#Timeline',
                Label: 'Timeline'
            }
        ],

        // Field Groups (Form Sections)
        FieldGroup#BasicInfo: {
            Data: [
                {Value: campaignName},
                {Value: campaignType},
                {Value: status},
                {Value: triggerKeyword},
                {
                    $Type: 'UI.DataField',
                    Value: ESGTag,
                    Label: 'ESG Tag'
                },
                {Value: triggerProduct.productName}
            ]
        },

        FieldGroup#CampaignStrategy: {
            Data: [
                {Value: targetAudience},
                {Value: budget}
            ]
        },

        FieldGroup#CampaignBrief: {
            Data: [
                {Value: campaignBrief}
            ]
        },

        FieldGroup#PerformanceMetrics: {
            Data: [
                {
                    $Type: 'UI.DataField',
                    Value: performanceMetrics,
                    Label: 'Performance Summary'
                }
            ]
        },
        
        FieldGroup#PerformanceDetails: {
            Data: [
                {
                    $Type: 'UI.DataField',
                    Value: performanceMetrics,
                    Label: 'Full Metrics Data'
                }
            ]
        },

        FieldGroup#Timeline: {
            Data: [
                {Value: startDate},
                {Value: endDate}
            ]
        },

        FieldGroup#CampaignStatus: {
            Data: [
                {
                    $Type: 'UI.DataField',
                    Value: status,
                    Label: 'Status'
                },
                {
                    $Type: 'UI.DataField',
                    Value: budget,
                    Label: 'Budget'
                }
            ]
        },

        // Actions in Identification section
        Identification: [
            {
                $Type: 'UI.DataField',
                Value: ESGTag,
                Label: 'ESG Tag'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'MarketingService.generateCampaignBrief',
                Label: 'Generate Campaign Brief'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'MarketingService.selectCreators',
                Label: 'Select Creators'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'MarketingService.launchCampaign',
                Label: 'Launch Campaign'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'MarketingService.pauseCampaign',
                Label: 'Pause Campaign'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'MarketingService.generatePerformanceReport',
                Label: 'Generate Performance Report'
            }
        ]
    },

    // Semantic annotations for fields
    UI.TextArrangement: #TextOnly
);

// ============================================================================
// Campaign Creators Annotations
// ============================================================================

annotate MarketingService.CampaignCreators with @(
    UI: {
        LineItem: [
            {
                $Type: 'UI.DataField',
                Value: creatorName,
                Label: 'Creator Name',
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataField',
                Value: platform,
                Label: 'Platform'
            },
            {
                $Type: 'UI.DataField',
                Value: creatorHandle,
                Label: 'Handle'
            },
            {
                $Type: 'UI.DataField',
                Value: followerCount,
                Label: 'Followers'
            },
            {
                $Type: 'UI.DataField',
                Value: engagementRate,
                Label: 'Engagement Rate'
            },
            {
                $Type: 'UI.DataField',
                Value: selected,
                Label: 'Selected'
            },
            {
                $Type: 'UI.DataField',
                Value: assignedBudget,
                Label: 'Assigned Budget'
            }
        ]
    }
);

// ============================================================================
// Field-level Annotations
// ============================================================================

annotate MarketingService.MarketingCampaigns with {
    campaignName      @title: 'Campaign Name'
                      @Common.FieldControl: #Mandatory;

    campaignType      @title: 'Campaign Type'
                      @Common: {
                          ValueListWithFixedValues: true
                      };

    status            @title: 'Status'
                      @Common: {
                          ValueListWithFixedValues: true
                      };

    triggerKeyword    @title: 'Trigger Keyword';
    ESGTag            @title: 'ESG Tag';
    budget            @title: 'Budget'
                      @Measures.ISOCurrency: 'MYR';
    startDate         @title: 'Start Date';
    endDate           @title: 'End Date';
    targetAudience    @title: 'Target Audience';
    campaignBrief     @title: 'Campaign Brief'
                      @UI.MultiLineText: true;
    performanceMetrics @title: 'Performance Metrics'
                      @UI.MultiLineText: true
                      @Common.Text: {$value: performanceMetrics, ![@UI.TextArrangement]: #TextOnly};
}

