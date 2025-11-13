/**
 * UI Annotations for Product Catalog Management
 * Includes trend analysis and category-based navigation
 */
using ProductService from './product-service';

// ============================================================================
// Product List Report & Object Page
// ============================================================================

annotate ProductService.Products with @(
    UI: {
        SelectionFields: [
            category,
            brand,
            status,
            isTrending,
            isPromoted
        ],

        LineItem: [
            {
                $Type: 'UI.DataField',
                Value: productName,
                Label: 'Product Name',
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataField',
                Value: productCode,
                Label: 'Code'
            },
            {
                $Type: 'UI.DataField',
                Value: brand,
                Label: 'Brand'
            },
            {
                $Type: 'UI.DataField',
                Value: category,
                Label: 'Category'
            },
            {
                $Type: 'UI.DataFieldForAnnotation',
                Target: '@UI.DataPoint#TrendScore',
                Label: 'Trend'
            },
            {
                $Type: 'UI.DataFieldForAnnotation',
                Target: '@UI.DataPoint#PopularityScore',
                Label: 'Popularity'
            },
            {
                $Type: 'UI.DataField',
                Value: listPrice,
                Label: 'Price'
            },
            {
                $Type: 'UI.DataField',
                Value: inStock,
                Label: 'In Stock',
                Criticality: stockCriticality
            },
            {
                $Type: 'UI.DataField',
                Value: status,
                Label: 'Status',
                Criticality: statusCriticality
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'ProductService.updateAIScore',
                Label: 'Update Scores',
                Inline: true
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'ProductService.adjustPrice',
                Label: 'Adjust Price',
                Inline: true
            }
        ],

        DataPoint#TrendScore: {
            Value: trendScore,
            Title: 'Trend Score',
            TargetValue: 100,
            Visualization: #Progress,
            Criticality: trendCriticality
        },

        DataPoint#PopularityScore: {
            Value: popularityScore,
            Title: 'Popularity',
            TargetValue: 100,
            Visualization: #Progress,
            Criticality: popularityCriticality
        },

        DataPoint#StockLevel: {
            Value: stockQuantity,
            Title: 'Stock Level',
            Criticality: stockCriticality
        },

        HeaderInfo: {
            TypeName: 'Product',
            TypeNamePlural: 'Products',
            Title: {Value: productName},
            Description: {Value: brand},
            ImageUrl: imageUrl,
            TypeImageUrl: 'sap-icon://product'
        },

        HeaderFacets: [
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.DataPoint#TrendScore',
                Label: 'Trend Score'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.DataPoint#PopularityScore',
                Label: 'Popularity'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#PriceInfo',
                Label: 'Pricing'
            }
        ],

        Facets: [
            {
                $Type: 'UI.CollectionFacet',
                Label: 'Product Information',
                ID: 'ProductInfo',
                Facets: [
                    {
                        $Type: 'UI.ReferenceFacet',
                        Target: '@UI.FieldGroup#BasicInfo',
                        Label: 'Basic Details'
                    },
                    {
                        $Type: 'UI.ReferenceFacet',
                        Target: '@UI.FieldGroup#Classification',
                        Label: 'Classification'
                    }
                ]
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#PricingDetails',
                Label: 'Pricing & Cost'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#InventoryInfo',
                Label: 'Inventory'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#MarketingFlags',
                Label: 'Marketing'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#AIScores',
                Label: 'AI Trend Analysis'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#AdditionalInfo',
                Label: 'Additional Details'
            }
        ],

        FieldGroup#BasicInfo: {
            Data: [
                {Value: productName},
                {Value: productCode},
                {Value: brand},
                {Value: manufacturer},
                {Value: productType},
                {Value: status}
            ]
        },

        FieldGroup#Classification: {
            Data: [
                {Value: category},
                {Value: subCategory},
                {Value: sku},
                {Value: barcode}
            ]
        },

        FieldGroup#PricingDetails: {
            Data: [
                {Value: listPrice},
                {Value: cost},
                {Value: currency},
                {Value: unitOfMeasure}
            ]
        },

        FieldGroup#InventoryInfo: {
            Data: [
                {Value: inStock},
                {Value: stockQuantity},
                {Value: minStockLevel},
                {Value: warehouseLocation}
            ]
        },

        FieldGroup#MarketingFlags: {
            Data: [
                {Value: isTrending},
                {Value: isPromoted},
                {Value: isNewArrival},
                {Value: isBestSeller}
            ]
        },

        FieldGroup#AIScores: {
            Data: [
                {Value: trendScore},
                {Value: popularityScore}
            ]
        },

        FieldGroup#AdditionalInfo: {
            Data: [
                {Value: description},
                {Value: specifications},
                {Value: notes}
            ]
        },

        FieldGroup#PriceInfo: {
            Data: [
                {Value: listPrice},
                {Value: cost}
            ]
        },

        Identification: [
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'ProductService.updateAIScore',
                Label: 'Update AI Scores'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'ProductService.adjustPrice',
                Label: 'Adjust Price'
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'ProductService.markDiscontinued',
                Label: 'Mark as Discontinued'
            }
        ]
    }
);

annotate ProductService.Products with {
    productName    @title: 'Product Name' @Common.FieldControl: #Mandatory;
    productCode    @title: 'Product Code' @Common.FieldControl: #Mandatory;
    brand          @title: 'Brand';
    category       @title: 'Category' @Common.FieldControl: #Mandatory;
    listPrice      @title: 'List Price' @Measures.ISOCurrency: currency;
    cost           @title: 'Cost' @Measures.ISOCurrency: currency;
    trendScore     @title: 'Trend Score';
    popularityScore @title: 'Popularity Score';
    stockQuantity  @title: 'Stock Quantity';
    inStock        @title: 'In Stock';
    isTrending     @title: 'Trending';
    isPromoted     @title: 'Promoted';
    description    @title: 'Description' @UI.MultiLineText: true;
    specifications @title: 'Specifications' @UI.MultiLineText: true;
    notes          @title: 'Notes' @UI.MultiLineText: true;
}

// ============================================================================
// Analytical Views
// ============================================================================

annotate ProductService.ProductsByCategory with @(
    UI: {
        Chart: {
            Title: 'Products by Category',
            ChartType: #Bar,
            Dimensions: [category],
            Measures: [count, avgPrice],
            MeasureAttributes: [
                {
                    Measure: count,
                    Role: #Axis1
                },
                {
                    Measure: avgPrice,
                    Role: #Axis2
                }
            ]
        },
        PresentationVariant: {
            Visualizations: ['@UI.Chart'],
            SortOrder: [{
                Property: count,
                Descending: true
            }]
        }
    }
);

annotate ProductService.TrendingProducts with @(
    UI: {
        LineItem: [
            {Value: productName},
            {Value: brand},
            {Value: category},
            {Value: trendScore},
            {Value: popularityScore},
            {Value: listPrice}
        ]
    }
);

annotate ProductService.InStockProducts with @(
    UI: {
        LineItem: [
            {Value: productName},
            {Value: productCode},
            {Value: stockQuantity},
            {Value: listPrice},
            {Value: category}
        ]
    }
);

annotate ProductService.LowStockProducts with @(
    UI: {
        LineItem: [
            {Value: productName},
            {Value: productCode},
            {Value: stockQuantity},
            {Value: minStockLevel},
            {
                $Type: 'UI.DataField',
                Value: stockQuantity,
                Label: 'Stock Level',
                Criticality: 1,
                CriticalityRepresentation: #WithIcon
            }
        ]
    }
);
