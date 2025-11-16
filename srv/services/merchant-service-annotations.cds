/**
 * UI Annotations for Merchant Discovery Service
 * Defines List Report and Object Page layouts
 */
using MerchantService from './merchant-service';

// ============================================================================
// Merchant Discovery List Report Annotations
// ============================================================================

annotate MerchantService.MerchantDiscoveries with @(
    UI: {
        // Selection Fields (Filter Bar)
        SelectionFields: [
            status,
            discoverySource,
            businessType,
            merchantScore,
            autoAssignedTo_ID
        ],

        // List View Columns
        LineItem: [
            {
                $Type: 'UI.DataField',
                Value: merchantName,
                Label: 'Merchant Name',
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataField',
                Value: about,
                Label: 'About',
                ![@UI.Importance]: #Low
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'MerchantService.generateAbout',
                Label: 'AI',
                Inline: true,
                ![@UI.Importance]: #Low
            },
            {
                $Type: 'UI.DataField',
                Value: businessType,
                Label: 'Business Type'
            },
            {
                $Type: 'UI.DataField',
                Value: status,
                Label: 'Status',
                Criticality: statusCriticality
            },
            {
                $Type: 'UI.DataField',
                Value: autoAssignedTo.fullName,
                Label: 'Assigned To'
            },
            {
                $Type: 'UI.DataField',
                Value: discoveryDate,
                Label: 'Discovery Date'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'MerchantService.qualifyMerchant',
                Label: 'Qualify'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'MerchantService.convertToLead',
                Label: 'Convert to Lead',
                Criticality: 3
            }
        ],

        // Data Points for Micro Charts
        DataPoint#MerchantScore: {
            Value: merchantScore,
            Title: 'Merchant Score',
            TargetValue: 100,
            Visualization: #Progress
        },

        // Header Info (Object Page Header)
        HeaderInfo: {
            TypeName: 'Merchant Discovery',
            TypeNamePlural: 'Merchant Discoveries',
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
                Label: 'Merchant Score'
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
        FieldGroup#BasicInfo: {
            Data: [
                {Value: merchantName},
                {Value: about},
                {Value: businessType},
                {Value: status},
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
                Action: 'MerchantService.qualifyMerchant',
                Label: 'Qualify Merchant'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'MerchantService.assignToSalesRep',
                Label: 'Assign to Sales Rep'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'MerchantService.convertToLead',
                Label: 'Convert to Lead'
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
}

// ============================================================================
// Field-level Annotations
// ============================================================================

annotate MerchantService.MerchantDiscoveries with {
    merchantName      @title: 'Merchant Name'
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

    merchantScore     @title: 'Merchant Score'
                      @Measures.Unit: '%';

    location          @title: 'Location';
    contactInfo       @title: 'Contact Information';
    socialMediaLinks  @title: 'Social Media Links';
    discoveryMetadata @title: 'Discovery Metadata';
    discoveryDate     @title: 'Discovery Date';
}

