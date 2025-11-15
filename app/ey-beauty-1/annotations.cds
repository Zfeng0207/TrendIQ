using LeadService from '../../srv/services/lead-service';
using AccountService from '../../srv/services/account-service';
using OpportunityService from '../../srv/services/opportunity-service';
using ActivityService from '../../srv/services/activity-service';
using ProductService from '../../srv/services/product-service';

// Lead Pipeline Card Annotations
annotate LeadService.Leads with @(
  UI.SelectionVariant #LeadsByStatus: {
    SelectOptions: [],
    Parameters: [],
    Text: 'Leads by Status'
  },
  UI.Chart #LeadsByStatus: {
    Title: 'Lead Distribution',
    ChartType: #Donut,
    Measures: [ID],
    MeasureAttributes: [{
      DataPoint: '@UI.DataPoint#LeadCount',
      Role: #Axis1,
      Measure: ID
    }],
    Dimensions: [status]
  },
  UI.DataPoint #LeadCount: {
    Value: ID,
    Title: 'Number of Leads'
  }
);

// Lead Quality Card Annotations
annotate LeadService.Leads with @(
  UI.SelectionVariant #LeadsByQuality: {
    SelectOptions: [],
    Parameters: [],
    Text: 'Leads by Quality'
  },
  UI.Chart #LeadsByQuality: {
    Title: 'Lead Quality Distribution',
    ChartType: #Donut,
    Measures: [ID],
    MeasureAttributes: [{
      DataPoint: '@UI.DataPoint#LeadCount',
      Role: #Axis1,
      Measure: ID
    }],
    Dimensions: [leadQuality]
  }
);

// Top Leads List Card
annotate LeadService.Leads with @(
  UI.LineItem #TopLeads: [
    {
      $Type: 'UI.DataField',
      Value: outletName,
      Label: 'Outlet'
    },
    {
      $Type: 'UI.DataField',
      Value: brandToPitch,
      Label: 'Brand'
    },
    {
      $Type: 'UI.DataFieldForAnnotation',
      Target: '@UI.DataPoint#AIScore',
      Label: 'AI Score'
    },
    {
      $Type: 'UI.DataField',
      Value: leadQuality,
      Label: 'Quality'
    },
    {
      $Type: 'UI.DataField',
      Value: status,
      Label: 'Status'
    }
  ]
);

// Account Health Card Annotations
annotate AccountService.Accounts with @(
  UI.LineItem #AccountHealth: [
    {
      $Type: 'UI.DataField',
      Value: accountName,
      Label: 'Account'
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
      Value: status,
      Label: 'Status'
    }
  ]
);

// Opportunity Pipeline Card Annotations
annotate OpportunityService.Opportunities with @(
  UI.SelectionVariant #OpportunitiesByStage: {
    SelectOptions: [],
    Parameters: [],
    Text: 'Opportunities by Stage'
  },
  UI.Chart #OpportunitiesByStage: {
    Title: 'Sales Pipeline',
    ChartType: #Bar,
    Measures: [expectedRevenue],
    MeasureAttributes: [{
      DataPoint: '@UI.DataPoint#OpportunityRevenue',
      Role: #Axis1,
      Measure: expectedRevenue
    }],
    Dimensions: [stage]
  },
  UI.DataPoint #OpportunityRevenue: {
    Value: expectedRevenue,
    Title: 'Expected Revenue',
    ValueFormat: {
      ScaleFactor: 1,
      NumberOfFractionalDigits: 2
    }
  }
);

// Revenue Forecast Card
annotate OpportunityService.Opportunities with @(
  UI.LineItem #RevenueOpportunities: [
    {
      $Type: 'UI.DataField',
      Value: name,
      Label: 'Opportunity'
    },
    {
      $Type: 'UI.DataField',
      Value: account.accountName,
      Label: 'Account'
    },
    {
      $Type: 'UI.DataField',
      Value: stage,
      Label: 'Stage'
    },
    {
      $Type: 'UI.DataFieldForAnnotation',
      Target: '@UI.DataPoint#WinProbability',
      Label: 'Win Prob'
    },
    {
      $Type: 'UI.DataField',
      Value: expectedRevenue,
      Label: 'Expected Revenue'
    },
    {
      $Type: 'UI.DataField',
      Value: closeDate,
      Label: 'Close Date'
    }
  ]
);

// Recent Activities Card
annotate ActivityService.Activities with @(
  UI.LineItem #RecentActivities: [
    {
      $Type: 'UI.DataField',
      Value: activityType,
      Label: 'Type'
    },
    {
      $Type: 'UI.DataField',
      Value: subject,
      Label: 'Subject'
    },
    {
      $Type: 'UI.DataField',
      Value: relatedAccount.accountName,
      Label: 'Account'
    },
    {
      $Type: 'UI.DataField',
      Value: startDateTime,
      Label: 'Date'
    },
    {
      $Type: 'UI.DataField',
      Value: status,
      Label: 'Status'
    },
    {
      $Type: 'UI.DataField',
      Value: owner.fullName,
      Label: 'Owner'
    }
  ]
);

// Top Products Card
annotate ProductService.Products with @(
  UI.LineItem #TopProducts: [
    {
      $Type: 'UI.DataField',
      Value: productName,
      Label: 'Product'
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
      $Type: 'UI.DataField',
      Value: listPrice,
      Label: 'Price'
    },
    {
      $Type: 'UI.DataField',
      Value: stockQuantity,
      Label: 'Stock'
    },
    {
      $Type: 'UI.DataField',
      Value: status,
      Label: 'Status'
    }
  ]
);