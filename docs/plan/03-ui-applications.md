# Phase 3: UI Development - 6 Core Applications

## Overview
This phase creates 6 Fiori Elements applications that provide the complete CRM user experience, from lead management to analytics dashboards.

## Duration
**Weeks 3-5** (15 working days)

## Objectives
1. Create 6 Fiori Elements applications
2. Configure List Report and Object Page templates
3. Enhance Overview Page dashboard
4. Build custom Kanban board for deals pipeline
5. Implement navigation flows between apps
6. Add responsive design and mobile support
7. Configure UI annotations for all entities

## UI Architecture

### Application Portfolio

```
app/
├── leads/              # Lead Management (List Report + Object Page)
├── accounts/           # Account Management (List Report + Object Page)
├── contacts/           # Contact Management (List Report + Object Page)
├── activities/         # Activity Tracking (Worklist)
├── deals/              # Deal Pipeline (Custom Kanban + Object Page)
├── dashboard/          # Analytics Dashboard (Overview Page)
└── common/             # Shared components and utilities
```

### Navigation Map

```
Dashboard (Home)
    ├─> Leads List ──> Lead Detail
    │                      └─> Convert to Account
    │
    ├─> Accounts List ──> Account Detail
    │                      ├─> Contacts (sub-section)
    │                      └─> Opportunities (sub-section)
    │
    ├─> Contacts List ──> Contact Detail
    │                      └─> Related Activities
    │
    ├─> Activities List ──> Activity Detail
    │
    └─> Deals (Kanban) ──> Deal Detail
                            └─> Approval Request
```

## Application Specifications

### 1. Lead Management Application

**App ID**: `beautydashboard.leads`
**Template**: List Report + Object Page
**Service**: LeadService

#### File Structure
```
app/leads/
├── annotations.cds           # UI annotations
├── webapp/
│   ├── manifest.json         # App descriptor
│   ├── Component.js          # App component
│   ├── index.html            # Entry point
│   └── ext/                  # Extensions
│       └── controller/
│           └── ListReportExt.controller.js
├── package.json
└── ui5.yaml
```

#### annotations.cds

```cds
using LeadService as service from '../../srv/services/lead-service';

////////////////////////////////////////////////////////////
// List Report annotations
////////////////////////////////////////////////////////////

annotate service.Leads with @(
    UI.SelectionFields: [
        status,
        leadQuality,
        platform,
        assignedTo_ID,
        city
    ],

    UI.LineItem: [
        {
            $Type: 'UI.DataField',
            Value: outletName,
            Label: 'Outlet Name',
            ![@HTML5.CssDefaults]: {width: '20%'}
        },
        {
            $Type: 'UI.DataField',
            Value: contactName,
            Label: 'Contact'
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
            Criticality: statusCriticality
        },
        {
            $Type: 'UI.DataFieldForAnnotation',
            Label: 'AI Score',
            Target: '@UI.DataPoint#aiScore'
        },
        {
            $Type: 'UI.DataField',
            Value: leadQuality,
            Label: 'Quality',
            Criticality: qualityCriticality
        },
        {
            $Type: 'UI.DataField',
            Value: assignedToName,
            Label: 'Assigned To'
        },
        {
            $Type: 'UI.DataField',
            Value: lastContactDate,
            Label: 'Last Contact'
        },
        {
            $Type: 'UI.DataField',
            Value: converted,
            Label: 'Converted'
        }
    ]
);

// AI Score visualization
annotate service.Leads with @(
    UI.DataPoint#aiScore: {
        Value: aiScore,
        Visualization: #Progress,
        TargetValue: 100,
        Criticality: aiScoreCriticality
    }
);

// Criticality calculations
annotate service.Leads with {
    aiScore @(
        UI.CriticalityCalculation: {
            ImprovementDirection: #Maximize,
            DeviationRangeLowValue: 40,
            ToleranceRangeLowValue: 60,
            ToleranceRangeHighValue: 80,
            DeviationRangeHighValue: 100
        }
    )
};

////////////////////////////////////////////////////////////
// Object Page annotations
////////////////////////////////////////////////////////////

annotate service.Leads with @(
    UI.HeaderInfo: {
        TypeName: 'Lead',
        TypeNamePlural: 'Leads',
        Title: {Value: outletName},
        Description: {Value: brandToPitch},
        ImageUrl: '', // Could add logo
        TypeImageUrl: 'sap-icon://sales-quote'
    },

    UI.HeaderFacets: [
        {
            $Type: 'UI.ReferenceFacet',
            Target: '@UI.DataPoint#aiScore',
            Label: 'AI Score'
        },
        {
            $Type: 'UI.ReferenceFacet',
            Target: '@UI.DataPoint#status',
            Label: 'Status'
        },
        {
            $Type: 'UI.ReferenceFacet',
            Target: '@UI.DataPoint#sentiment',
            Label: 'Sentiment'
        }
    ],

    UI.Facets: [
        {
            $Type: 'UI.CollectionFacet',
            Label: 'General Information',
            ID: 'GeneralInfo',
            Facets: [
                {
                    $Type: 'UI.ReferenceFacet',
                    Label: 'Details',
                    Target: '@UI.FieldGroup#GeneralInfo'
                }
            ]
        },
        {
            $Type: 'UI.CollectionFacet',
            Label: 'Contact Information',
            ID: 'ContactInfo',
            Facets: [
                {
                    $Type: 'UI.ReferenceFacet',
                    Label: 'Contact Details',
                    Target: '@UI.FieldGroup#ContactInfo'
                }
            ]
        },
        {
            $Type: 'UI.CollectionFacet',
            Label: 'Qualification & Scoring',
            ID: 'Qualification',
            Facets: [
                {
                    $Type: 'UI.ReferenceFacet',
                    Label: 'AI Insights',
                    Target: '@UI.FieldGroup#AIInsights'
                }
            ]
        },
        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Notes & Activities',
            Target: 'notes'
        }
    ],

    UI.FieldGroup#GeneralInfo: {
        Data: [
            {Value: outletName},
            {Value: brandToPitch},
            {Value: platform},
            {Value: source},
            {Value: leadQuality},
            {Value: estimatedValue},
            {Value: assignedTo_ID},
            {Value: owner_ID}
        ]
    },

    UI.FieldGroup#ContactInfo: {
        Data: [
            {Value: contactName},
            {Value: contactEmail},
            {Value: contactPhone},
            {Value: address},
            {Value: city},
            {Value: country}
        ]
    },

    UI.FieldGroup#AIInsights: {
        Data: [
            {Value: aiScore},
            {Value: sentimentScore},
            {Value: sentimentLabel},
            {Value: trendingTopics},
            {Value: recommendedAction}
        ]
    }
);

////////////////////////////////////////////////////////////
// Actions
////////////////////////////////////////////////////////////

annotate service.Leads actions {
    convertToAccount @(
        Common.SideEffects.TargetEntities: ['/Accounts']
    );

    calculateScore @(
        Common.SideEffects.TargetProperties: ['aiScore', 'sentimentScore', 'sentimentLabel']
    );
}
```

#### manifest.json (key sections)

```json
{
  "sap.app": {
    "id": "beautydashboard.leads",
    "type": "application",
    "title": "Lead Management",
    "description": "Manage and qualify beauty industry leads",
    "dataSources": {
      "mainService": {
        "uri": "/odata/v4/lead/",
        "type": "OData",
        "settings": {
          "odataVersion": "4.0"
        }
      }
    }
  },
  "sap.ui5": {
    "routing": {
      "routes": [
        {
          "pattern": ":?query:",
          "name": "LeadsList",
          "target": "LeadsList"
        },
        {
          "pattern": "Leads({key}):?query:",
          "name": "LeadsObjectPage",
          "target": "LeadsObjectPage"
        }
      ],
      "targets": {
        "LeadsList": {
          "type": "Component",
          "id": "LeadsList",
          "name": "sap.fe.templates.ListReport",
          "options": {
            "settings": {
              "entitySet": "Leads",
              "variantManagement": "Page",
              "navigation": {
                "Leads": {
                  "detail": {
                    "route": "LeadsObjectPage"
                  }
                }
              },
              "initialLoad": true,
              "controlConfiguration": {
                "@com.sap.vocabularies.UI.v1.LineItem": {
                  "actions": {
                    "convertToAccount": {
                      "press": "beautydashboard.leads.ext.controller.ListReportExt.onConvertToAccount",
                      "visible": true,
                      "enabled": true,
                      "requiresSelection": true,
                      "text": "Convert to Account"
                    },
                    "calculateScore": {
                      "press": "beautydashboard.leads.ext.controller.ListReportExt.onCalculateScore",
                      "visible": true,
                      "enabled": true,
                      "requiresSelection": true,
                      "text": "Recalculate AI Score"
                    }
                  }
                }
              }
            }
          }
        },
        "LeadsObjectPage": {
          "type": "Component",
          "id": "LeadsObjectPage",
          "name": "sap.fe.templates.ObjectPage",
          "options": {
            "settings": {
              "entitySet": "Leads",
              "editableHeaderContent": false
            }
          }
        }
      }
    }
  }
}
```

### 2. Account Management Application

**App ID**: `beautydashboard.accounts`
**Template**: List Report + Object Page
**Service**: AccountService

#### Key Features
- Hierarchical account view (parent-child relationships)
- Account health score visualization
- Embedded contacts section
- Embedded opportunities section
- Timeline of activities

#### annotations.cds (key sections)

```cds
using AccountService as service from '../../srv/services/account-service';

annotate service.Accounts with @(
    UI.SelectionFields: [
        accountType,
        accountTier,
        status,
        city,
        accountOwner_ID
    ],

    UI.LineItem: [
        {Value: accountName, Label: 'Account Name'},
        {Value: accountType, Label: 'Type'},
        {Value: accountTier, Label: 'Tier', Criticality: tierCriticality},
        {
            $Type: 'UI.DataFieldForAnnotation',
            Label: 'Health Score',
            Target: '@UI.DataPoint#healthScore'
        },
        {Value: city, Label: 'City'},
        {Value: accountOwnerName, Label: 'Owner'},
        {Value: status, Label: 'Status'}
    ],

    UI.HeaderInfo: {
        TypeName: 'Account',
        TypeNamePlural: 'Accounts',
        Title: {Value: accountName},
        Description: {Value: accountType},
        TypeImageUrl: 'sap-icon://building'
    },

    UI.Facets: [
        {
            $Type: 'UI.CollectionFacet',
            Label: 'Account Information',
            ID: 'AccountInfo',
            Facets: [
                {
                    $Type: 'UI.ReferenceFacet',
                    Label: 'General',
                    Target: '@UI.FieldGroup#General'
                },
                {
                    $Type: 'UI.ReferenceFacet',
                    Label: 'Contact Details',
                    Target: '@UI.FieldGroup#Contact'
                },
                {
                    $Type: 'UI.ReferenceFacet',
                    Label: 'Social Media',
                    Target: '@UI.FieldGroup#SocialMedia'
                }
            ]
        },
        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Contacts',
            Target: 'contacts/@UI.LineItem',
            ID: 'ContactsSection'
        },
        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Opportunities',
            Target: 'opportunities/@UI.LineItem',
            ID: 'OpportunitiesSection'
        },
        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Activities',
            Target: 'activities/@UI.LineItem',
            ID: 'ActivitiesSection'
        }
    ]
);

// Contacts embedded table
annotate service.Contacts with @(
    UI.LineItem: [
        {Value: fullName, Label: 'Name'},
        {Value: title, Label: 'Title'},
        {Value: email, Label: 'Email'},
        {Value: phone, Label: 'Phone'},
        {Value: isPrimary, Label: 'Primary'}
    ]
);
```

### 3. Contact Management Application

**App ID**: `beautydashboard.contacts`
**Template**: List Report + Object Page
**Service**: AccountService

#### Key Features
- Quick contact creation
- Email and phone click-to-action
- Engagement score tracking
- Communication history timeline
- Social media profile links

#### annotations.cds (key sections)

```cds
annotate service.Contacts with @(
    UI.SelectionFields: [
        account_ID,
        owner_ID,
        preferredChannel,
        status
    ],

    UI.LineItem: [
        {Value: fullName, Label: 'Name'},
        {Value: title, Label: 'Title'},
        {Value: accountName, Label: 'Account'},
        {Value: email, Label: 'Email'},
        {Value: phone, Label: 'Phone'},
        {Value: preferredChannel, Label: 'Preferred Channel'},
        {
            $Type: 'UI.DataFieldForAnnotation',
            Label: 'Engagement',
            Target: '@UI.DataPoint#engagementScore'
        },
        {Value: isPrimary, Label: 'Primary'}
    ],

    UI.HeaderInfo: {
        TypeName: 'Contact',
        TypeNamePlural: 'Contacts',
        Title: {Value: fullName},
        Description: {Value: title},
        ImageUrl: '', // Could add profile picture
        TypeImageUrl: 'sap-icon://person-placeholder'
    }
);
```

### 4. Activities Application

**App ID**: `beautydashboard.activities`
**Template**: Worklist
**Service**: ActivityService

#### Key Features
- Calendar view option
- Quick task creation
- Activity completion actions
- Filter by type, status, date range
- Related entity navigation

#### annotations.cds

```cds
using ActivityService as service from '../../srv/services/activity-service';

annotate service.Activities with @(
    UI.SelectionFields: [
        activityType,
        status,
        priority,
        startDateTime,
        assignedTo_ID
    ],

    UI.LineItem: [
        {Value: subject, Label: 'Subject'},
        {Value: activityType, Label: 'Type'},
        {Value: status, Label: 'Status', Criticality: statusCriticality},
        {Value: priority, Label: 'Priority', Criticality: priorityCriticality},
        {Value: startDateTime, Label: 'Date/Time'},
        {Value: accountName, Label: 'Account'},
        {Value: contactName, Label: 'Contact'},
        {Value: assignedToName, Label: 'Assigned To'}
    ],

    UI.HeaderInfo: {
        TypeName: 'Activity',
        TypeNamePlural: 'Activities',
        Title: {Value: subject},
        Description: {Value: activityType},
        TypeImageUrl: 'sap-icon://activities'
    },

    UI.Identification: [
        {
            $Type: 'UI.DataFieldForAction',
            Action: 'ActivityService.complete',
            Label: 'Complete'
        },
        {
            $Type: 'UI.DataFieldForAction',
            Action: 'ActivityService.cancel',
            Label: 'Cancel'
        }
    ]
);
```

### 5. Deal Pipeline Application (Custom Kanban)

**App ID**: `beautydashboard.deals`
**Template**: Custom UI5 Application with Kanban Board
**Service**: OpportunityService

#### File Structure
```
app/deals/
├── annotations.cds
├── webapp/
│   ├── manifest.json
│   ├── Component.js
│   ├── index.html
│   ├── controller/
│   │   ├── Main.controller.js
│   │   └── DealDetail.controller.js
│   ├── view/
│   │   ├── Main.view.xml
│   │   └── DealDetail.view.xml
│   ├── css/
│   │   └── style.css
│   └── model/
│       └── formatter.js
├── package.json
└── ui5.yaml
```

#### Main.view.xml (Kanban Board)

```xml
<mvc:View
    controllerName="beautydashboard.deals.controller.Main"
    xmlns:mvc="sap.ui.core.mvc"
    xmlns="sap.m"
    xmlns:core="sap.ui.core"
    xmlns:dnd="sap.ui.core.dnd"
    height="100%">

    <Page
        id="dealPipelinePage"
        title="Deal Pipeline"
        showNavButton="false"
        class="sapUiContentPadding">

        <headerContent>
            <Button
                icon="sap-icon://add"
                text="New Deal"
                press="onCreateDeal" />
            <Button
                icon="sap-icon://refresh"
                press="onRefresh" />
        </headerContent>

        <content>
            <ScrollContainer
                horizontal="true"
                vertical="false"
                height="100%"
                class="kanban-container">

                <HBox class="kanban-board">
                    <!-- Prospecting Stage -->
                    <VBox class="kanban-column">
                        <Title text="Prospecting" level="H4" />
                        <Text text="{pipelineModel>/prospecting/count} deals · RM {pipelineModel>/prospecting/total}" />

                        <ScrollContainer
                            vertical="true"
                            height="calc(100vh - 200px)"
                            class="kanban-cards-container">

                            <VBox
                                items="{
                                    path: '/Opportunities',
                                    filters: [{path: 'stage', operator: 'EQ', value1: 'Prospecting'}]
                                }">
                                <core:Fragment fragmentName="beautydashboard.deals.view.DealCard" type="XML" />
                            </VBox>
                        </ScrollContainer>
                    </VBox>

                    <!-- Repeat for other stages: Qualification, Needs Analysis, Proposal, Negotiation -->

                    <!-- Closed Won Stage -->
                    <VBox class="kanban-column kanban-column-won">
                        <Title text="Closed Won" level="H4" />
                        <Text text="{pipelineModel>/closedWon/count} deals · RM {pipelineModel>/closedWon/total}" />

                        <ScrollContainer
                            vertical="true"
                            height="calc(100vh - 200px)"
                            class="kanban-cards-container">

                            <VBox
                                items="{
                                    path: '/Opportunities',
                                    filters: [{path: 'stage', operator: 'EQ', value1: 'Closed Won'}]
                                }">
                                <core:Fragment fragmentName="beautydashboard.deals.view.DealCard" type="XML" />
                            </VBox>
                        </ScrollContainer>
                    </VBox>
                </HBox>
            </ScrollContainer>
        </content>
    </Page>
</mvc:View>
```

#### DealCard.xml (Fragment)

```xml
<core:FragmentDefinition
    xmlns="sap.m"
    xmlns:core="sap.ui.core"
    xmlns:f="sap.f"
    xmlns:dnd="sap.ui.core.dnd">

    <f:Card class="kanban-card" press="onCardPress">
        <f:header>
            <f:card:Header
                title="{name}"
                subtitle="{accountName}" />
        </f:header>
        <f:content>
            <VBox class="sapUiSmallMargin">
                <HBox justifyContent="SpaceBetween">
                    <Text text="RM {amount}" class="deal-amount" />
                    <ObjectStatus
                        text="{probability}%"
                        state="{
                            path: 'probability',
                            formatter: '.formatter.probabilityState'
                        }" />
                </HBox>
                <ProgressIndicator
                    percentValue="{aiWinScore}"
                    displayValue="AI Score: {aiWinScore}"
                    state="{
                        path: 'aiWinScore',
                        formatter: '.formatter.scoreState'
                    }"
                    class="sapUiTinyMarginTop" />
                <Text
                    text="Close: {
                        path: 'closeDate',
                        type: 'sap.ui.model.type.Date',
                        formatOptions: {pattern: 'MMM dd, yyyy'}
                    }"
                    class="sapUiTinyMarginTop deal-date" />
                <HBox class="sapUiTinyMarginTop">
                    <Avatar
                        initials="{ownerName}"
                        displaySize="XS"
                        class="sapUiTinyMarginEnd" />
                    <Text text="{ownerName}" />
                </HBox>
            </VBox>
        </f:content>

        <!-- Drag and Drop support -->
        <dnd:DragDropConfig>
            <dnd:DragInfo
                sourceAggregation="items"
                dragStart="onDragStart" />
            <dnd:DropInfo
                targetAggregation="items"
                drop="onDrop" />
        </dnd:DragDropConfig>
    </f:Card>
</core:FragmentDefinition>
```

#### Main.controller.js (Key Functions)

```javascript
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("beautydashboard.deals.controller.Main", {
        onInit: function () {
            // Initialize pipeline summary model
            const pipelineModel = new JSONModel({
                prospecting: { count: 0, total: 0 },
                qualification: { count: 0, total: 0 },
                needsAnalysis: { count: 0, total: 0 },
                proposal: { count: 0, total: 0 },
                negotiation: { count: 0, total: 0 },
                closedWon: { count: 0, total: 0 }
            });
            this.getView().setModel(pipelineModel, "pipelineModel");

            this._loadPipelineData();
        },

        _loadPipelineData: function () {
            const oModel = this.getView().getModel();

            // Load opportunities
            oModel.read("/Opportunities", {
                success: (oData) => {
                    this._calculatePipelineSummary(oData.results);
                },
                error: (oError) => {
                    MessageToast.show("Failed to load opportunities");
                }
            });
        },

        _calculatePipelineSummary: function (opportunities) {
            const summary = {
                prospecting: { count: 0, total: 0 },
                qualification: { count: 0, total: 0 },
                needsAnalysis: { count: 0, total: 0 },
                proposal: { count: 0, total: 0 },
                negotiation: { count: 0, total: 0 },
                closedWon: { count: 0, total: 0 }
            };

            opportunities.forEach(opp => {
                const stage = opp.stage.toLowerCase().replace(/ /g, '');
                if (summary[stage]) {
                    summary[stage].count++;
                    summary[stage].total += opp.amount || 0;
                }
            });

            this.getView().getModel("pipelineModel").setData(summary);
        },

        onDragStart: function (oEvent) {
            const oDraggedControl = oEvent.getParameter("target");
            const oDragSession = oEvent.getParameter("dragSession");

            oDragSession.setComplexData("draggedOpportunity", {
                opportunity: oDraggedControl.getBindingContext().getObject()
            });
        },

        onDrop: function (oEvent) {
            const oDragSession = oEvent.getParameter("dragSession");
            const oDroppedControl = oEvent.getParameter("droppedControl");
            const opportunity = oDragSession.getComplexData("draggedOpportunity").opportunity;

            // Determine new stage from drop target
            const newStage = this._getStageFromColumn(oDroppedControl);

            if (newStage && newStage !== opportunity.stage) {
                this._updateOpportunityStage(opportunity.ID, newStage);
            }
        },

        _updateOpportunityStage: function (opportunityID, newStage) {
            const oModel = this.getView().getModel();
            const sPath = `/Opportunities(${opportunityID})/OpportunityService.updateStage`;

            oModel.callFunction(sPath, {
                method: "POST",
                urlParameters: {
                    newStage: newStage
                },
                success: () => {
                    MessageToast.show(`Deal moved to ${newStage}`);
                    this._loadPipelineData();
                },
                error: () => {
                    MessageToast.show("Failed to update deal stage");
                }
            });
        },

        onCardPress: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            const opportunityID = oContext.getProperty("ID");

            // Navigate to Object Page
            this.getOwnerComponent().getRouter().navTo("DealDetail", {
                key: opportunityID
            });
        },

        onCreateDeal: function () {
            // Open creation dialog
            MessageToast.show("Create Deal dialog (TBD)");
        }
    });
});
```

### 6. Dashboard (Analytics Overview Page)

**App ID**: `beautydashboard.dashboard`
**Template**: Fiori Overview Page
**Service**: Multiple services

#### manifest.json (OVP Configuration)

```json
{
  "sap.ovp": {
    "globalFilterModel": "mainModel",
    "globalFilterEntitySet": "Leads",
    "containerLayout": "resizable",
    "enableLiveFilter": true,
    "cards": {
      "card01_leadsByStatus": {
        "model": "leadModel",
        "template": "sap.ovp.cards.charts.analytical",
        "settings": {
          "title": "Leads by Status",
          "subTitle": "Current pipeline status",
          "entitySet": "Leads",
          "selectionAnnotationPath": "com.sap.vocabularies.UI.v1.SelectionVariant#StatusVariant",
          "chartAnnotationPath": "com.sap.vocabularies.UI.v1.Chart#StatusChart",
          "identificationAnnotationPath": "com.sap.vocabularies.UI.v1.Identification"
        }
      },
      "card02_topLeads": {
        "model": "leadModel",
        "template": "sap.ovp.cards.list",
        "settings": {
          "title": "High Priority Leads",
          "subTitle": "AI Score > 80",
          "entitySet": "Leads",
          "listType": "extended",
          "listFlavor": "standard",
          "sortBy": "aiScore",
          "sortOrder": "descending",
          "annotationPath": "com.sap.vocabularies.UI.v1.LineItem#TopLeads"
        }
      },
      "card03_pipelineValue": {
        "model": "opportunityModel",
        "template": "sap.ovp.cards.charts.analytical",
        "settings": {
          "title": "Pipeline Value by Stage",
          "subTitle": "Total opportunity value",
          "entitySet": "Opportunities",
          "chartAnnotationPath": "com.sap.vocabularies.UI.v1.Chart#PipelineChart"
        }
      },
      "card04_recentActivities": {
        "model": "activityModel",
        "template": "sap.ovp.cards.list",
        "settings": {
          "title": "Recent Activities",
          "subTitle": "Last 7 days",
          "entitySet": "Activities",
          "listType": "condensed",
          "sortBy": "startDateTime",
          "sortOrder": "descending"
        }
      },
      "card05_topProducts": {
        "model": "productModel",
        "template": "sap.ovp.cards.table",
        "settings": {
          "title": "Trending Products",
          "subTitle": "Most popular items",
          "entitySet": "Products",
          "annotationPath": "com.sap.vocabularies.UI.v1.LineItem#TrendingProducts"
        }
      },
      "card06_kpis": {
        "model": "leadModel",
        "template": "sap.ovp.cards.quickview",
        "settings": {
          "title": "Key Performance Indicators",
          "entitySet": "Leads",
          "annotationPath": "com.sap.vocabularies.UI.v1.HeaderInfo#KPIs"
        }
      }
    }
  }
}
```

## Common Components & Utilities

### app/common/formatter.js

```javascript
sap.ui.define([], function () {
    "use strict";

    return {
        /**
         * Format probability to state
         */
        probabilityState: function (probability) {
            if (probability >= 75) return "Success";
            if (probability >= 50) return "Warning";
            return "Error";
        },

        /**
         * Format AI score to state
         */
        scoreState: function (score) {
            if (score >= 80) return "Success";
            if (score >= 60) return "Warning";
            return "Error";
        },

        /**
         * Format currency
         */
        currency: function (amount) {
            if (!amount) return "RM 0.00";
            return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        },

        /**
         * Format date relative
         */
        dateRelative: function (date) {
            if (!date) return "";
            const now = new Date();
            const diff = now - new Date(date);
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));

            if (days === 0) return "Today";
            if (days === 1) return "Yesterday";
            if (days < 7) return `${days} days ago`;
            if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
            return `${Math.floor(days / 30)} months ago`;
        }
    };
});
```

## Implementation Checklist

### Week 3: Lead & Account Apps
- [ ] Generate Lead Management app using Fiori Generator
- [ ] Create UI annotations for Leads
- [ ] Configure List Report filters and columns
- [ ] Configure Object Page facets
- [ ] Add custom actions (convert, score)
- [ ] Generate Account Management app
- [ ] Create UI annotations for Accounts
- [ ] Add embedded Contacts and Opportunities sections
- [ ] Test navigation and CRUD operations

### Week 4: Contact, Activity & Deal Apps
- [ ] Generate Contact Management app
- [ ] Create UI annotations for Contacts
- [ ] Generate Activities app (Worklist template)
- [ ] Create custom Deals app with Kanban board
- [ ] Implement drag-and-drop functionality
- [ ] Add deal detail Object Page
- [ ] Test all apps independently

### Week 5: Dashboard & Integration
- [ ] Enhance Overview Page dashboard
- [ ] Configure 6 OVP cards
- [ ] Create chart annotations
- [ ] Implement cross-app navigation
- [ ] Add common utilities and formatters
- [ ] Test responsive design
- [ ] Test mobile compatibility
- [ ] Perform end-to-end integration testing

## Testing Scenarios

1. **Lead Management Flow**
   - Create new lead
   - Calculate AI score
   - Assign to user
   - Convert to account
   - Verify account and contact created

2. **Account Management Flow**
   - Create new account
   - Add multiple contacts
   - Calculate health score
   - Create opportunity from account

3. **Deal Pipeline Flow**
   - Create opportunity
   - Drag between stages
   - Add products
   - Request approval
   - Close won

4. **Activity Tracking Flow**
   - Create activity from account
   - Complete activity
   - View timeline

5. **Dashboard Analytics**
   - View all cards
   - Apply filters
   - Navigate to details

## Next Phase
After completing UI development, proceed to **Phase 4: Features & Integration** to add product import, approval workflows, and advanced analytics capabilities.
