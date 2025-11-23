/**
 * UI Annotations for Channel Partner Discovery Service
 * Defines List Report and Object Page layouts
 */
using MerchantService from './merchant-service';

// ============================================================================
// Channel Partner Discovery List Report Annotations
// ============================================================================

annotate MerchantService.MerchantDiscoveries with @(
    UI: {
        // Selection Fields (Filter Bar)
        SelectionFields: [
            status,
            discoverySource,
            businessType,
            merchantScore,
            autoAssignedTo_ID,
            phase,
            priorityScore,
            assignedTo
        ],

        // List View Columns
        LineItem: [
            {
                $Type: 'UI.DataField',
                Value: merchantName,
                Label: 'Channel Partner Name',
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
                Target: '@UI.DataPoint#MerchantScore',
                Label: 'Channel Partner Score',
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
        DataPoint#MerchantScore: {
            Value: merchantScore,
            Title: 'Channel Partner Score',
            TargetValue: 100,
            Visualization: #Progress
        },

        // Header Info (Object Page Header)
        HeaderInfo: {
            TypeName: 'Channel Partner Discovery',
            TypeNamePlural: 'Channel Partner Discoveries',
            Title: {Value: merchantName},
            Description: {Value: businessType},
            ImageUrl: 'sap-icon://business-objects-experience',
            TypeImageUrl: 'sap-icon://business-objects-experience'
        },

        // Header Facets (KPIs in Header)
        HeaderFacets: [
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.DataPoint#MerchantScore',
                Label: 'Channel Partner Score'
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
                Label: 'Discovery Information',
                ID: 'DiscoveryInfo',
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
                {Value: merchantName},
                {Value: businessType},
                {
                    $Type: 'UI.DataField',
                    Value: status,
                    Label: 'Phases'
                },
                {Value: discoveryDate}
            ]
        },

        FieldGroup#DiscoveryDetails: {
            Data: [
                {Value: discoverySource},
                {Value: location},
                {Value: merchantScore}
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
                {Value: contactInfo},
                {Value: socialMediaLinks}
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
                {Value: discoveryMetadata}
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
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'MerchantService.initiateAIMeeting',
                Label: 'AI Meeting Initiator',
                InvocationGrouping: #Isolated
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'MerchantService.qualifyMerchant',
                Label: 'Qualify Channel Partner'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'MerchantService.assignToSalesRep',
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

annotate MerchantService.MerchantDiscoveries with {
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

annotate MerchantService.MerchantDiscoveries with {
    merchantName      @title: 'Channel Partner Name'
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

    merchantScore     @title: 'Channel Partner Score'
                      @Measures.Unit: '%';

    location          @title: 'Location';
    contactInfo       @title: 'Contact Information';
    socialMediaLinks  @title: 'Social Media Links';
    discoveryMetadata @title: 'Discovery Metadata';
    discoveryDate     @title: 'Discovery Date';
}

// ============================================================================
// Side Effects
// ============================================================================

annotate MerchantService.MerchantDiscoveries actions {
    generateAbout @Common.SideEffects: {
        TargetProperties: [
            'about',
            'merchantScore',
            'statusCriticality'
        ]
    };
}

