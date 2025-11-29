/**
 * UI Annotations for Prospect Service
 * Defines List Report and Object Page layouts
 */
using ProspectService from './prospect-service';

// ============================================================================
// Prospect List Report Annotations
// ============================================================================

annotate ProspectService.Prospects with @(
    UI: {
        // Selection Fields (Filter Bar)
        SelectionFields: [
            status,
            discoverySource,
            businessType,
            prospectScore,
            autoAssignedTo_ID,
            phase,
            priorityScore,
            assignedTo
        ],

        // List View Columns
        LineItem: [
            {
                $Type: 'UI.DataField',
                Value: prospectName,
                Label: 'Prospect Name',
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataField',
                Value: businessType,
                Label: 'Business Type',
                ![@UI.Importance]: #Medium
            },
            {
                $Type: 'UI.DataFieldForAnnotation',
                Target: '@UI.DataPoint#ProspectScore',
                Label: 'Prospect Score',
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataField',
                Value: phase,
                Label: 'Phase',
                Criticality: phaseCriticality,
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
                $Type: 'UI.DataField',
                Value: lastFollowUp,
                Label: 'Last Follow Up',
                ![@UI.Importance]: #Medium
            },
            {
                $Type: 'UI.DataField',
                Value: pendingItems,
                Label: 'Pending Items',
                ![@UI.Importance]: #Medium
            },
            {
                $Type: 'UI.DataField',
                Value: discoverySource,
                Label: 'Discovery Source',
                ![@UI.Importance]: #Low
            },
            {
                $Type: 'UI.DataField',
                Value: discoveryDate,
                Label: 'Discovery Date',
                ![@UI.Importance]: #Medium
            },
            {
                $Type: 'UI.DataField',
                Value: assignedTo,
                Label: 'Assigned To',
                ![@UI.Importance]: #Medium
            }
        ],

        // Data Points for Micro Charts
        DataPoint#ProspectScore: {
            Value: prospectScore,
            Title: 'Prospect Score',
            TargetValue: 100,
            Visualization: #Progress
        },

        // Header Info (Object Page Header)
        HeaderInfo: {
            TypeName: 'Prospect',
            TypeNamePlural: 'Prospects',
            Title: {Value: prospectName},
            Description: {Value: businessType},
            ImageUrl: 'sap-icon://person-placeholder',
            TypeImageUrl: 'sap-icon://person-placeholder'
        },

        // Header Facets (KPIs in Header)
        HeaderFacets: [
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.DataPoint#ProspectScore',
                Label: 'Prospect Score'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#DiscoveryInfo',
                Label: 'Discovery Info'
            }
        ],

        // Object Page Facets (Sections)
        Facets: [
            {
                $Type: 'UI.CollectionFacet',
                Label: 'Prospect Information',
                ID: 'ProspectInfo',
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
                    },
                    {
                        $Type: 'UI.ReferenceFacet',
                        Target: '@UI.FieldGroup#DiscoveryDetails',
                        Label: 'Discovery Details'
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
                Target: '@UI.FieldGroup#ContactSocial',
                Label: 'Contact & Social Media'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#AssignmentInfo',
                Label: 'Assignment'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#AdditionalInfo',
                Label: 'Additional Information'
            }
        ],

        // Field Groups (Form Sections)
        FieldGroup#AIInsights: {
            Data: [
                {Value: about}
            ]
        },

        FieldGroup#BasicInfo: {
            Data: [
                {Value: prospectName},
                {Value: businessType},
                {
                    $Type: 'UI.DataField',
                    Value: status,
                    Label: 'Status'
                },
                {Value: discoveryDate}
            ]
        },

        FieldGroup#DiscoveryDetails: {
            Data: [
                {Value: discoverySource},
                {Value: location},
                {Value: prospectScore}
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

        FieldGroup#ContactSocial: {
            Data: [
                {
                    $Type: 'UI.DataField',
                    Value: contactName,
                    Label: 'Contact Name'
                },
                {
                    $Type: 'UI.DataField',
                    Value: contactEmail,
                    Label: 'Email'
                },
                {
                    $Type: 'UI.DataField',
                    Value: contactPhone,
                    Label: 'Phone'
                },
                {
                    $Type: 'UI.DataField',
                    Value: socialMediaLinks,
                    Label: 'Social Media Links'
                }
            ]
        },

        FieldGroup#AssignmentInfo: {
            Data: [
                {Value: autoAssignedTo.fullName},
                {Value: autoAssignedTo.email}
            ]
        },

        FieldGroup#AdditionalInfo: {
            Data: [
                {
                    $Type: 'UI.DataField',
                    Value: leadQuality,
                    Label: 'Lead Quality'
                },
                {
                    $Type: 'UI.DataField',
                    Value: brandToPitch,
                    Label: 'Brand To Pitch'
                },
                {
                    $Type: 'UI.DataField',
                    Value: estimatedValue,
                    Label: 'Estimated Value (MYR)'
                },
                {
                    $Type: 'UI.DataField',
                    Value: aiScore,
                    Label: 'AI Score'
                },
                {
                    $Type: 'UI.DataField',
                    Value: sentimentScore,
                    Label: 'Sentiment Score'
                }
            ]
        },

        FieldGroup#DiscoveryInfo: {
            Data: [
                {
                    $Type: 'UI.DataField',
                    Value: discoverySource,
                    Label: 'Discovery Source'
                },
                {
                    $Type: 'UI.DataField',
                    Value: discoveryDate,
                    Label: 'Discovery Date'
                }
            ]
        },

        // Actions in Identification section (Object Page)
        Identification: [
            // convertToAccount is hidden - using custom action in manifest.json instead
            // {
            //     $Type: 'UI.DataFieldForAction',
            //     Action: 'ProspectService.convertToAccount',
            //     Label: 'Convert',
            //     ![@UI.Importance]: #High
            // },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'ProspectService.qualifyProspect',
                Label: 'Qualify Prospect'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'ProspectService.assignToSalesRep',
                Label: 'Assign to Sales Rep'
            }
        ]
    },

    // Semantic annotations for fields
    UI.TextArrangement: #TextOnly
);

// ============================================================================
// Criticality Annotations for Status Colors
// ============================================================================

annotate ProspectService.Prospects with {
    statusCriticality @UI.Hidden: true;
    phase @title: 'Phase';
    phaseCriticality @UI.Hidden: true;
    priorityScore @title: 'Priority Score';
    priorityScoreCriticality @UI.Hidden: true;
    lastFollowUp @title: 'Last Follow Up';
    pendingItems @title: 'Pending Items';
    assignedTo @title: 'Assigned To';
}

// ============================================================================
// Field-level Annotations
// ============================================================================

annotate ProspectService.Prospects with {
    prospectName      @title: 'Prospect Name'
                      @Common.FieldControl: #Mandatory
                      @UI.TextStyle: #Bold;

    about             @title: 'About'
                      @UI.MultiLineText: true;

    discoverySource   @title: 'Discovery Source'
                      @Common: {
                          ValueListWithFixedValues: true
                      };

    businessType      @title: 'Business Type'
                      @Common: {
                          ValueListWithFixedValues: true
                      };

    status            @title: 'Status'
                      @Common: {
                          ValueListWithFixedValues: true
                      };

    phase             @title: 'Phase'
                      @Common: {
                          ValueListWithFixedValues: true
                      };

    prospectScore     @title: 'Prospect Score'
                      @Measures.Unit: '%';

    location          @title: 'Location';
    contactInfo       @title: 'Contact Information';
    socialMediaLinks  @title: 'Social Media Links';
    discoveryMetadata @title: 'Discovery Metadata';
    discoveryDate     @title: 'Discovery Date';
    
    // Virtual fields for parsed contact info
    contactName       @title: 'Contact Name';
    contactEmail      @title: 'Email';
    contactPhone      @title: 'Phone';
    
    // Virtual fields for parsed discovery metadata
    convertedFromLeadID @title: 'Converted From Lead ID';
    leadQuality       @title: 'Lead Quality';
    brandToPitch      @title: 'Brand To Pitch';
    estimatedValue    @title: 'Estimated Value (MYR)';
    aiScore           @title: 'AI Score';
    sentimentScore    @title: 'Sentiment Score';
}

// ============================================================================
// Side Effects
// ============================================================================

annotate ProspectService.Prospects actions {
    generateAbout @Common.SideEffects: {
        TargetProperties: [
            'about',
            'prospectScore'
        ]
    };
    createOpportunity @Common.SideEffects: {
        TargetProperties: [
            'status'
        ]
    };
    convertToAccount @Common.SideEffects: {
        TargetProperties: [
            'status'
        ]
    };
}


