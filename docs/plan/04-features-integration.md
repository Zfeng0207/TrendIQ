# Phase 4: Features & Integration

## Overview
This phase implements advanced features including product import functionality, approval workflows, activity tracking automation, and analytics/reporting capabilities.

## Duration
**Weeks 5-6** (10 working days)

## Objectives
1. Build product import UI with CSV upload
2. Implement approval workflow system
3. Create activity timeline visualization
4. Add analytics and reporting features
5. Implement file upload capabilities
6. Add email notification simulation

## Feature Specifications

### 1. Product Import Functionality

#### Purpose
Allow clients to bulk import their product catalog via CSV files.

#### Components

##### A. File Upload UI Component

**Location**: `app/products/webapp/controller/Import.controller.js`

```javascript
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, JSONModel) {
    "use strict";

    return Controller.extend("beautydashboard.products.controller.Import", {
        onInit: function () {
            const oModel = new JSONModel({
                importStatus: "ready",
                totalRows: 0,
                successRows: 0,
                errorRows: 0,
                errors: []
            });
            this.getView().setModel(oModel, "importModel");
        },

        onFileChange: function (oEvent) {
            const oFile = oEvent.getParameter("files")[0];
            if (!oFile) return;

            // Validate file type
            if (!oFile.name.endsWith('.csv')) {
                MessageToast.show("Please upload a CSV file");
                return;
            }

            this._parseCSV(oFile);
        },

        _parseCSV: function (oFile) {
            const reader = new FileReader();

            reader.onload = (e) => {
                const text = e.target.result;
                const rows = this._parseCSVText(text);

                this._validateAndPreview(rows);
            };

            reader.readAsText(oFile);
        },

        _parseCSVText: function (text) {
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            const rows = [];

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;

                const values = lines[i].split(',');
                const row = {};

                headers.forEach((header, index) => {
                    row[header] = values[index] ? values[index].trim() : '';
                });

                rows.push(row);
            }

            return rows;
        },

        _validateAndPreview: function (rows) {
            const requiredFields = ['productCode', 'productName', 'brand', 'category', 'listPrice'];
            const errors = [];
            const validRows = [];

            rows.forEach((row, index) => {
                const rowErrors = [];

                // Check required fields
                requiredFields.forEach(field => {
                    if (!row[field]) {
                        rowErrors.push(`Missing ${field}`);
                    }
                });

                // Validate price format
                if (row.listPrice && isNaN(parseFloat(row.listPrice))) {
                    rowErrors.push('Invalid price format');
                }

                if (rowErrors.length > 0) {
                    errors.push({
                        row: index + 2, // +2 for header and 0-index
                        errors: rowErrors.join(', ')
                    });
                } else {
                    validRows.push(row);
                }
            });

            // Update model
            const oImportModel = this.getView().getModel("importModel");
            oImportModel.setProperty("/totalRows", rows.length);
            oImportModel.setProperty("/validRows", validRows.length);
            oImportModel.setProperty("/errorRows", errors.length);
            oImportModel.setProperty("/errors", errors);
            oImportModel.setProperty("/importStatus", "preview");
            oImportModel.setProperty("/previewData", validRows.slice(0, 10));

            // Open preview dialog
            this._openPreviewDialog();
        },

        onConfirmImport: function () {
            const oImportModel = this.getView().getModel("importModel");
            const validRows = oImportModel.getProperty("/previewData");

            oImportModel.setProperty("/importStatus", "importing");

            this._importProducts(validRows);
        },

        _importProducts: function (rows) {
            const oModel = this.getView().getModel();
            const promises = [];

            rows.forEach(row => {
                const oEntry = {
                    productCode: row.productCode,
                    productName: row.productName,
                    brand: row.brand,
                    category: row.category,
                    subCategory: row.subCategory || '',
                    description: row.description || '',
                    listPrice: parseFloat(row.listPrice),
                    cost: row.cost ? parseFloat(row.cost) : null,
                    size: row.size || '',
                    unit: row.unit || '',
                    status: 'Active',
                    inStock: true
                };

                promises.push(
                    new Promise((resolve, reject) => {
                        oModel.create("/Products", oEntry, {
                            success: resolve,
                            error: reject
                        });
                    })
                );
            });

            Promise.allSettled(promises).then(results => {
                const successful = results.filter(r => r.status === 'fulfilled').length;
                const failed = results.filter(r => r.status === 'rejected').length;

                const oImportModel = this.getView().getModel("importModel");
                oImportModel.setProperty("/importStatus", "completed");
                oImportModel.setProperty("/successRows", successful);
                oImportModel.setProperty("/errorRows", failed);

                MessageToast.show(`Import completed: ${successful} succeeded, ${failed} failed`);
            });
        }
    });
});
```

##### B. Import View

**Location**: `app/products/webapp/view/Import.view.xml`

```xml
<mvc:View
    controllerName="beautydashboard.products.controller.Import"
    xmlns:mvc="sap.ui.core.mvc"
    xmlns="sap.m"
    xmlns:upload="sap.m.upload"
    xmlns:form="sap.ui.layout.form">

    <Page
        title="Import Products"
        showNavButton="true"
        navButtonPress="onNavBack">

        <content>
            <VBox class="sapUiMediumMargin">
                <!-- Instructions -->
                <MessageStrip
                    text="Upload a CSV file with product data. Required columns: productCode, productName, brand, category, listPrice"
                    type="Information"
                    showIcon="true"
                    class="sapUiMediumMarginBottom" />

                <!-- Template Download -->
                <HBox class="sapUiSmallMarginBottom">
                    <Button
                        text="Download CSV Template"
                        icon="sap-icon://download"
                        press="onDownloadTemplate" />
                </HBox>

                <!-- File Upload -->
                <upload:UploadSet
                    id="uploadSet"
                    uploadEnabled="true"
                    terminationEnabled="true"
                    fileTypes="csv"
                    maxFileNameLength="100"
                    maxFileSize="5"
                    change="onFileChange">
                </upload:UploadSet>

                <!-- Import Status -->
                <VBox visible="{= ${importModel>/importStatus} !== 'ready'}">
                    <Title text="Import Summary" level="H3" />

                    <form:SimpleForm>
                        <Label text="Total Rows" />
                        <Text text="{importModel>/totalRows}" />

                        <Label text="Valid Rows" />
                        <Text text="{importModel>/validRows}" />

                        <Label text="Errors" />
                        <Text text="{importModel>/errorRows}" />
                    </form:SimpleForm>

                    <!-- Error List -->
                    <Table
                        items="{importModel>/errors}"
                        visible="{= ${importModel>/errorRows} > 0}">
                        <columns>
                            <Column><Text text="Row" /></Column>
                            <Column><Text text="Errors" /></Column>
                        </columns>
                        <items>
                            <ColumnListItem>
                                <Text text="{importModel>row}" />
                                <Text text="{importModel>errors}" />
                            </ColumnListItem>
                        </items>
                    </Table>

                    <!-- Action Buttons -->
                    <HBox class="sapUiSmallMarginTop">
                        <Button
                            text="Confirm Import"
                            type="Emphasized"
                            press="onConfirmImport"
                            visible="{= ${importModel>/importStatus} === 'preview'}" />
                        <Button
                            text="Cancel"
                            press="onCancelImport" />
                    </HBox>
                </VBox>
            </VBox>
        </content>
    </Page>
</mvc:View>
```

##### C. CSV Template Generator

**Location**: `srv/utils/csv-template.js`

```javascript
module.exports = {
    generateProductTemplate: () => {
        const headers = [
            'productCode',
            'productName',
            'brand',
            'category',
            'subCategory',
            'description',
            'listPrice',
            'cost',
            'size',
            'unit'
        ];

        const sampleRow = [
            'PROD001',
            'Vitamin C Serum',
            'GlowLab',
            'Skincare',
            'Serums',
            'Brightening vitamin C serum',
            '89.90',
            '45.00',
            '30ml',
            'bottle'
        ];

        return {
            headers: headers.join(','),
            sample: sampleRow.join(',')
        };
    }
};
```

### 2. Approval Workflow System

#### Purpose
Manage discount and deal approval requests with multi-level approval chains.

#### Components

##### A. Approval Request Creation

**Location**: `app/deals/webapp/controller/ApprovalRequest.controller.js`

```javascript
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("beautydashboard.deals.controller.ApprovalRequest", {
        onRequestApproval: function (opportunityID, discountPercent, reason) {
            const oModel = this.getView().getModel();

            // Get opportunity details
            oModel.read(`/Opportunities(${opportunityID})`, {
                success: (opp) => {
                    // Create approval request
                    const approvalEntry = {
                        opportunityID_ID: opportunityID,
                        approvalType: 'Discount',
                        requestedBy_ID: opp.owner_ID,
                        approver_ID: this._getApproverID(opp.owner_ID),
                        requestDate: new Date().toISOString(),
                        requestReason: reason,
                        requestedDiscount: discountPercent,
                        requestedAmount: opp.amount,
                        status: 'Pending',
                        priority: discountPercent > 25 ? 'Urgent' : 'Normal'
                    };

                    oModel.create("/Approvals", approvalEntry, {
                        success: () => {
                            MessageToast.show("Approval request submitted");
                            this._sendNotification(approvalEntry);
                        },
                        error: () => {
                            MessageToast.show("Failed to submit approval request");
                        }
                    });
                }
            });
        },

        _getApproverID: function (userID) {
            // In real implementation, lookup user's manager
            // For now, return mock manager ID
            return "MANAGER_001";
        },

        _sendNotification: function (approval) {
            // Simulate notification to approver
            console.log("Notification sent to approver:", approval.approver_ID);

            // In real implementation, integrate with email/notification service
            // Could use SAP Work Zone API or email service
        },

        onApprove: function (approvalID) {
            const oModel = this.getView().getModel();

            oModel.callFunction(`/Approvals(${approvalID})/approve`, {
                method: "POST",
                urlParameters: {
                    comments: "Approved"
                },
                success: () => {
                    MessageToast.show("Approval granted");
                },
                error: () => {
                    MessageToast.show("Failed to approve");
                }
            });
        },

        onReject: function (approvalID, reason) {
            const oModel = this.getView().getModel();

            oModel.callFunction(`/Approvals(${approvalID})/reject`, {
                method: "POST",
                urlParameters: {
                    comments: reason
                },
                success: () => {
                    MessageToast.show("Approval rejected");
                },
                error: () => {
                    MessageToast.show("Failed to reject");
                }
            });
        }
    });
});
```

##### B. Approval Inbox Component

**Location**: `app/approvals/webapp/view/Inbox.view.xml`

```xml
<mvc:View
    controllerName="beautydashboard.approvals.controller.Inbox"
    xmlns:mvc="sap.ui.core.mvc"
    xmlns="sap.m">

    <Page
        title="My Approvals"
        showNavButton="false">

        <headerContent>
            <Button
                icon="sap-icon://refresh"
                press="onRefresh" />
        </headerContent>

        <content>
            <IconTabBar
                id="approvalTabs"
                select="onTabSelect">

                <items>
                    <IconTabFilter
                        text="Pending"
                        key="Pending"
                        count="{approvalModel>/pendingCount}">

                        <List
                            items="{
                                path: '/Approvals',
                                filters: [{path: 'status', operator: 'EQ', value1: 'Pending'}]
                            }"
                            mode="None">
                            <CustomListItem press="onApprovalPress">
                                <VBox class="sapUiSmallMargin">
                                    <HBox justifyContent="SpaceBetween">
                                        <Title text="{opportunityName}" level="H4" />
                                        <ObjectStatus
                                            text="{priority}"
                                            state="{
                                                path: 'priority',
                                                formatter: '.formatter.priorityState'
                                            }" />
                                    </HBox>

                                    <Text text="Requested by: {requestedByName}" />
                                    <Text text="Discount: {requestedDiscount}%" />
                                    <Text text="Amount: RM {requestedAmount}" />
                                    <Text text="{requestReason}" class="sapUiTinyMarginTop" />

                                    <HBox class="sapUiSmallMarginTop">
                                        <Button
                                            text="Approve"
                                            type="Accept"
                                            press="onApprove" />
                                        <Button
                                            text="Reject"
                                            type="Reject"
                                            press="onReject" />
                                    </HBox>
                                </VBox>
                            </CustomListItem>
                        </List>
                    </IconTabFilter>

                    <IconTabFilter
                        text="Approved"
                        key="Approved"
                        count="{approvalModel>/approvedCount}">
                        <!-- List of approved items -->
                    </IconTabFilter>

                    <IconTabFilter
                        text="Rejected"
                        key="Rejected"
                        count="{approvalModel>/rejectedCount}">
                        <!-- List of rejected items -->
                    </IconTabFilter>
                </items>
            </IconTabBar>
        </content>
    </Page>
</mvc:View>
```

### 3. Activity Timeline Visualization

#### Purpose
Display chronological history of all interactions with accounts, contacts, and opportunities.

#### Components

##### A. Timeline Component

**Location**: `app/common/control/ActivityTimeline.js`

```javascript
sap.ui.define([
    "sap/ui/core/Control",
    "sap/suite/ui/commons/Timeline",
    "sap/suite/ui/commons/TimelineItem"
], function (Control, Timeline, TimelineItem) {
    "use strict";

    return Control.extend("beautydashboard.common.control.ActivityTimeline", {
        metadata: {
            properties: {
                entityType: { type: "string", defaultValue: "" },
                entityID: { type: "string", defaultValue: "" }
            },
            aggregations: {
                _timeline: { type: "sap.suite.ui.commons.Timeline", multiple: false, visibility: "hidden" }
            }
        },

        init: function () {
            this.setAggregation("_timeline", new Timeline({
                enableDoubleSided: false,
                groupBy: "date",
                sort: true,
                sortOldestFirst: false
            }));
        },

        renderer: function (oRM, oControl) {
            oRM.openStart("div", oControl);
            oRM.class("activityTimeline");
            oRM.openEnd();
            oRM.renderControl(oControl.getAggregation("_timeline"));
            oRM.close("div");
        },

        loadActivities: function () {
            const sEntityType = this.getEntityType();
            const sEntityID = this.getEntityID();

            if (!sEntityType || !sEntityID) return;

            const oModel = this.getModel();
            const sPath = `/Activities`;
            const aFilters = [
                new sap.ui.model.Filter(`related${sEntityType}_ID`, sap.ui.model.FilterOperator.EQ, sEntityID)
            ];

            oModel.read(sPath, {
                filters: aFilters,
                success: (oData) => {
                    this._buildTimeline(oData.results);
                }
            });
        },

        _buildTimeline: function (activities) {
            const oTimeline = this.getAggregation("_timeline");
            oTimeline.destroyContent();

            activities.forEach(activity => {
                const oItem = new TimelineItem({
                    dateTime: activity.startDateTime,
                    title: activity.subject,
                    text: activity.description,
                    userName: activity.ownerName,
                    userNameClickable: false,
                    icon: this._getIconForType(activity.activityType)
                });

                oTimeline.addContent(oItem);
            });
        },

        _getIconForType: function (type) {
            const icons = {
                'Call': 'sap-icon://phone',
                'Email': 'sap-icon://email',
                'Meeting': 'sap-icon://meeting-room',
                'Task': 'sap-icon://task',
                'Note': 'sap-icon://notes'
            };

            return icons[type] || 'sap-icon://activity-items';
        }
    });
});
```

### 4. Analytics & Reporting

#### Purpose
Provide business intelligence and forecasting capabilities.

#### Components

##### A. Sales Forecast Calculator

**Location**: `srv/utils/forecast.js`

```javascript
module.exports = {
    /**
     * Calculate sales forecast based on pipeline and historical data
     */
    calculateForecast: async (opportunities, timeframe) => {
        const now = new Date();
        let endDate;

        switch (timeframe) {
            case 'month':
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'quarter':
                endDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
                break;
            case 'year':
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
            default:
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }

        // Filter opportunities closing in timeframe
        const relevantOpps = opportunities.filter(opp => {
            const closeDate = new Date(opp.closeDate);
            return closeDate >= now && closeDate <= endDate;
        });

        // Calculate expected revenue
        const expectedRevenue = relevantOpps.reduce((sum, opp) => {
            return sum + (opp.expectedRevenue || 0);
        }, 0);

        // Calculate best case (all opportunities with >50% probability)
        const bestCase = relevantOpps
            .filter(opp => opp.probability >= 50)
            .reduce((sum, opp) => sum + (opp.amount || 0), 0);

        // Calculate worst case (only opportunities with >75% probability)
        const worstCase = relevantOpps
            .filter(opp => opp.probability >= 75)
            .reduce((sum, opp) => sum + (opp.amount || 0), 0);

        // Calculate committed (Closed Won)
        const committed = relevantOpps
            .filter(opp => opp.stage === 'Closed Won')
            .reduce((sum, opp) => sum + (opp.amount || 0), 0);

        return {
            period: timeframe,
            expectedRevenue: expectedRevenue,
            bestCase: bestCase,
            worstCase: worstCase,
            committed: committed,
            opportunityCount: relevantOpps.length
        };
    },

    /**
     * Calculate conversion rates
     */
    calculateConversionRates: async (leads, accounts, opportunities) => {
        const leadToAccount = accounts.length / leads.length * 100;
        const accountToOpportunity = opportunities.length / accounts.length * 100;
        const opportunityToWin = opportunities.filter(o => o.stage === 'Closed Won').length / opportunities.length * 100;

        return {
            leadToAccount: leadToAccount.toFixed(2),
            accountToOpportunity: accountToOpportunity.toFixed(2),
            opportunityToWin: opportunityToWin.toFixed(2),
            overallConversion: (leadToAccount * accountToOpportunity * opportunityToWin / 10000).toFixed(2)
        };
    }
};
```

##### B. Analytics Service Function

**Location**: `srv/services/analytics-service.cds`

```cds
using { beauty.crm as crm } from '../../db/crm-schema';
using { beauty.leads as leads } from '../../db/schema';

@path: '/odata/v4/analytics'
service AnalyticsService @(requires: 'authenticated-user') {

    function getSalesForecast(timeframe: String) returns {
        period: String;
        expectedRevenue: Decimal;
        bestCase: Decimal;
        worstCase: Decimal;
        committed: Decimal;
        opportunityCount: Integer;
    };

    function getConversionRates() returns {
        leadToAccount: Decimal;
        accountToOpportunity: Decimal;
        opportunityToWin: Decimal;
        overallConversion: Decimal;
    };

    function getPerformanceMetrics() returns {
        totalLeads: Integer;
        totalAccounts: Integer;
        totalOpportunities: Integer;
        totalRevenue: Decimal;
        avgDealSize: Decimal;
        avgSalesCycle: Integer;
    };

    function getTrendAnalysis() returns array of {
        month: String;
        leadsCreated: Integer;
        accountsCreated: Integer;
        dealsWon: Integer;
        revenue: Decimal;
    };
}
```

## Implementation Checklist

### Week 5: Product Import & Approvals
- [ ] Create product import UI component
- [ ] Implement CSV parser and validator
- [ ] Create CSV template generator
- [ ] Build approval request dialog
- [ ] Implement approval inbox
- [ ] Create approval action handlers
- [ ] Add notification simulation
- [ ] Test import with sample CSV files
- [ ] Test approval workflow end-to-end

### Week 6: Activity Timeline & Analytics
- [ ] Create activity timeline custom control
- [ ] Integrate timeline into Account/Contact/Opportunity pages
- [ ] Implement forecast calculator
- [ ] Create analytics service functions
- [ ] Build analytics charts for dashboard
- [ ] Implement conversion rate calculations
- [ ] Add performance metrics
- [ ] Test all analytics features

## Testing Scenarios

1. **Product Import**
   - Upload valid CSV
   - Upload CSV with errors
   - Validate error reporting
   - Verify products created correctly

2. **Approval Workflow**
   - Request approval for discount
   - View pending approvals
   - Approve request
   - Reject request
   - Verify opportunity updated

3. **Activity Timeline**
   - Create activities
   - View timeline on account
   - Filter by date range
   - Navigate to activity details

4. **Analytics**
   - View forecast for different timeframes
   - Check conversion rates
   - Verify calculations accurate
   - Test chart visualizations

## Next Phase
Proceed to **Phase 5: AI & Intelligence Layer** to implement the mock AI services and integrate them throughout the application.
