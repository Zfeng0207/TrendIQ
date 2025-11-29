sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/format/DateFormat",
    "sap/m/MessageToast"
], function (Controller, JSONModel, Filter, FilterOperator, DateFormat, MessageToast) {
    "use strict";

    return Controller.extend("beautyleads.dashboard.controller.Dashboard", {

        /**
         * Controller initialization
         */
        onInit: function () {
            // Initialize KPI model with default values
            var oKPIModel = new JSONModel({
                lastUpdated: this.formatDateTime(new Date()),
                leadKPIs: {
                    totalLeads: 0,
                    hotLeads: 0,
                    warmLeads: 0,
                    coldLeads: 0,
                    convertedLeads: 0,
                    avgAIScore: 0
                },
                opportunityKPIs: {
                    totalOpportunities: 0,
                    totalPipelineValue: 0,
                    avgWinScore: 0,
                    wonCount: 0,
                    lostCount: 0
                },
                accountKPIs: {
                    totalAccounts: 0,
                    atRiskCount: 0,
                    avgHealthScore: 0
                },
                activityKPIs: {
                    totalActivities: 0,
                    plannedActivities: 0,
                    completedActivities: 0
                },
                campaignKPIs: {
                    totalCampaigns: 0,
                    activeCampaigns: 0,
                    totalBudget: 0
                },
                healthDistribution: {
                    healthy: 0,
                    monitor: 0,
                    atRisk: 0,
                    healthyPercent: 0,
                    monitorPercent: 0,
                    atRiskPercent: 0
                },
                closingThisMonth: 0
            });
            this.getView().setModel(oKPIModel, "kpi");

            // For OData V4, use afterRendering to ensure model is ready
            this.getView().addEventDelegate({
                onAfterRendering: function() {
                    if (!this._bDataLoaded) {
                        this._bDataLoaded = true;
                        setTimeout(function() {
                            this._loadDashboardData();
                            this._setupCharts();
                        }.bind(this), 300);
                    }
                }.bind(this)
            });
        },

        /**
         * Setup VizFrame charts with proper configuration
         */
        _setupCharts: function() {
            this._setupLeadPipelineChart();
            this._setupOpportunityPipelineChart();
        },

        /**
         * Configure Lead Pipeline Chart
         */
        _setupLeadPipelineChart: function() {
            var oVizFrame = this.byId("leadPipelineChart");
            if (!oVizFrame) {
                return;
            }

            oVizFrame.setVizProperties({
                plotArea: {
                    dataLabel: {
                        visible: true,
                        formatString: "#"
                    },
                    colorPalette: ["#0854A0", "#107E3E", "#E76500", "#BB0000", "#6C3483"],
                    drawingEffect: "glossy"
                },
                legend: {
                    visible: false
                },
                title: {
                    visible: false
                },
                categoryAxis: {
                    title: {
                        visible: false
                    }
                },
                valueAxis: {
                    title: {
                        visible: false
                    }
                },
                interaction: {
                    selectability: {
                        mode: "single"
                    }
                }
            });
        },

        /**
         * Configure Opportunity Pipeline Chart
         */
        _setupOpportunityPipelineChart: function() {
            var oVizFrame = this.byId("opportunityPipelineChart");
            if (!oVizFrame) {
                return;
            }

            oVizFrame.setVizProperties({
                plotArea: {
                    dataLabel: {
                        visible: true,
                        formatString: "#,##0"
                    },
                    colorPalette: ["#107E3E", "#0854A0", "#E76500", "#0097A7", "#6C3483", "#BB0000"],
                    drawingEffect: "glossy"
                },
                legend: {
                    visible: false
                },
                title: {
                    visible: false
                },
                categoryAxis: {
                    title: {
                        visible: false
                    }
                },
                valueAxis: {
                    title: {
                        visible: false
                    }
                },
                interaction: {
                    selectability: {
                        mode: "single"
                    }
                }
            });
        },

        /**
         * Load all dashboard data from OData services
         */
        _loadDashboardData: function () {
            var that = this;
            var oModel = this.getView().getModel();

            if (!oModel) {
                console.warn("Dashboard model not available yet");
                return;
            }

            // Load Lead KPIs
            this._loadEntityData("/LeadKPIs", function (data) {
                if (data && data.length > 0) {
                    that.getView().getModel("kpi").setProperty("/leadKPIs", data[0]);
                }
            });

            // Load Opportunity KPIs
            this._loadEntityData("/OpportunityKPIs", function (data) {
                if (data && data.length > 0) {
                    var kpis = data[0];
                    that.getView().getModel("kpi").setProperty("/opportunityKPIs", kpis);
                }
            });

            // Load Account KPIs
            this._loadEntityData("/AccountKPIs", function (data) {
                if (data && data.length > 0) {
                    var kpis = data[0];
                    kpis.atRiskCount = (kpis.criticalRiskAccounts || 0) + (kpis.highRiskAccounts || 0);
                    that.getView().getModel("kpi").setProperty("/accountKPIs", kpis);
                }
            });

            // Load Activity KPIs
            this._loadEntityData("/ActivityKPIs", function (data) {
                if (data && data.length > 0) {
                    that.getView().getModel("kpi").setProperty("/activityKPIs", data[0]);
                }
            });

            // Load Campaign KPIs
            this._loadEntityData("/CampaignKPIs", function (data) {
                if (data && data.length > 0) {
                    that.getView().getModel("kpi").setProperty("/campaignKPIs", data[0]);
                }
            });

            // Load Account Health Distribution
            this._loadEntityData("/AccountsByHealthRange", function (data) {
                if (data && data.length > 0) {
                    var dist = { healthy: 0, monitor: 0, atRisk: 0 };
                    var total = 0;
                    data.forEach(function (item) {
                        total += item.count || 0;
                        if (item.healthCategory === "Healthy") {
                            dist.healthy = item.count || 0;
                        } else if (item.healthCategory === "Monitor") {
                            dist.monitor = item.count || 0;
                        } else {
                            dist.atRisk = item.count || 0;
                        }
                    });
                    if (total > 0) {
                        dist.healthyPercent = Math.round((dist.healthy / total) * 100);
                        dist.monitorPercent = Math.round((dist.monitor / total) * 100);
                        dist.atRiskPercent = Math.round((dist.atRisk / total) * 100);
                    }
                    that.getView().getModel("kpi").setProperty("/healthDistribution", dist);
                }
            });

            // Calculate closing this month
            this._loadClosingThisMonth();
        },

        /**
         * Load data from a specific entity set using OData V4
         */
        _loadEntityData: function (sPath, fnCallback) {
            var oModel = this.getView().getModel();
            
            if (!oModel) {
                console.warn("Model not available for path:", sPath);
                fnCallback([]);
                return;
            }

            try {
                var oBinding = oModel.bindList(sPath);
                
                oBinding.requestContexts(0, 100).then(function (aContexts) {
                    var aData = aContexts.map(function (oContext) {
                        return oContext.getObject();
                    });
                    fnCallback(aData);
                }).catch(function (oError) {
                    console.error("Error loading " + sPath + ":", oError);
                    fnCallback([]);
                });
            } catch (e) {
                console.error("Exception loading " + sPath + ":", e);
                fnCallback([]);
            }
        },

        /**
         * Calculate opportunities closing this month
         */
        _loadClosingThisMonth: function () {
            var that = this;
            var oModel = this.getView().getModel();
            
            if (!oModel) {
                return;
            }

            try {
                // Get current month date range
                var today = new Date();
                var firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                var lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

                var oBinding = oModel.bindList("/Opportunities", null, null, [
                    new Filter("closeDate", FilterOperator.GE, firstDay),
                    new Filter("closeDate", FilterOperator.LE, lastDay),
                    new Filter("stage", FilterOperator.NE, "Closed Won"),
                    new Filter("stage", FilterOperator.NE, "Closed Lost")
                ]);

                oBinding.requestContexts(0, 1000).then(function (aContexts) {
                    that.getView().getModel("kpi").setProperty("/closingThisMonth", aContexts.length);
                }).catch(function () {
                    that.getView().getModel("kpi").setProperty("/closingThisMonth", 0);
                });
            } catch (e) {
                console.error("Error loading closing this month:", e);
            }
        },

        // ==========================================
        // EVENT HANDLERS
        // ==========================================

        /**
         * Refresh dashboard data
         */
        onRefresh: function () {
            MessageToast.show("Refreshing dashboard...");
            this._loadDashboardData();
            this.getView().getModel("kpi").setProperty("/lastUpdated", this.formatDateTime(new Date()));
        },

        /**
         * Handle KPI tile press
         */
        onTilePress: function (oEvent) {
            var sTileId = oEvent.getSource().getId();
            var sNavTarget = "";

            if (sTileId.includes("HotLeads")) {
                sNavTarget = "Leads";
            } else if (sTileId.includes("Pipeline") || sTileId.includes("WinScore") || sTileId.includes("Closing")) {
                sNavTarget = "Opportunities";
            } else if (sTileId.includes("AtRisk")) {
                sNavTarget = "Accounts";
            } else if (sTileId.includes("Tasks")) {
                sNavTarget = "Activities";
            }

            if (sNavTarget) {
                this._navigateToApp(sNavTarget);
            }
        },

        /**
         * Handle lead item press
         */
        onLeadPress: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            if (oContext) {
                var sLeadId = oContext.getProperty("ID");
                this._navigateToApp("Leads", sLeadId);
            }
        },

        /**
         * Handle account item press
         */
        onAccountPress: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            if (oContext) {
                var sAccountId = oContext.getProperty("ID");
                this._navigateToApp("Accounts", sAccountId);
            }
        },

        /**
         * Handle opportunity item press
         */
        onOpportunityPress: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            if (oContext) {
                var sOpportunityId = oContext.getProperty("ID");
                this._navigateToApp("Opportunities", sOpportunityId);
            }
        },

        /**
         * Handle task item press
         */
        onTaskPress: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            if (oContext) {
                var sTaskId = oContext.getProperty("ID");
                MessageToast.show("Opening task: " + sTaskId);
            }
        },

        /**
         * Handle activity press
         */
        onActivityPress: function () {
            MessageToast.show("Activity details");
        },

        /**
         * Handle activity sender press
         */
        onActivitySenderPress: function () {
            MessageToast.show("User profile");
        },

        /**
         * Handle product press
         */
        onProductPress: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            if (oContext) {
                var sProductId = oContext.getProperty("ID");
                MessageToast.show("Opening product: " + sProductId);
            }
        },

        /**
         * Handle campaign press
         */
        onCampaignPress: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            if (oContext) {
                var sCampaignId = oContext.getProperty("ID");
                MessageToast.show("Opening campaign: " + sCampaignId);
            }
        },

        /**
         * View all leads
         */
        onViewAllLeads: function () {
            this._navigateToApp("Leads");
        },

        /**
         * View all accounts
         */
        onViewAllAccounts: function () {
            this._navigateToApp("Accounts");
        },

        /**
         * View all opportunities
         */
        onViewAllOpportunities: function () {
            this._navigateToApp("Opportunities");
        },

        // ==========================================
        // NAVIGATION HELPERS
        // ==========================================

        /**
         * Navigate to another app
         */
        _navigateToApp: function (sSemanticObject, sKey) {
            // Try to use cross-app navigation if available
            var oCrossAppNavigator = sap.ushell && sap.ushell.Container && 
                sap.ushell.Container.getService("CrossApplicationNavigation");

            if (oCrossAppNavigator) {
                var sAction = "manage";
                var oParams = {};
                
                if (sKey) {
                    oParams.key = sKey;
                }

                oCrossAppNavigator.toExternal({
                    target: {
                        semanticObject: sSemanticObject,
                        action: sAction
                    },
                    params: oParams
                });
            } else {
                // Fallback - show message
                var sMessage = sKey ? 
                    "Navigate to " + sSemanticObject + ": " + sKey :
                    "Navigate to " + sSemanticObject;
                MessageToast.show(sMessage);
            }
        },

        // ==========================================
        // FORMATTERS
        // ==========================================

        /**
         * Format date/time for display
         */
        formatDateTime: function (oDate) {
            if (!oDate) return "";
            
            if (typeof oDate === "string") {
                oDate = new Date(oDate);
            }

            var oDateFormat = DateFormat.getDateTimeInstance({
                pattern: "dd MMM yyyy, HH:mm"
            });
            return oDateFormat.format(oDate);
        },

        /**
         * Format date for display
         */
        formatDate: function (oDate) {
            if (!oDate) return "";
            
            if (typeof oDate === "string") {
                oDate = new Date(oDate);
            }

            var oDateFormat = DateFormat.getDateInstance({
                pattern: "dd MMM"
            });
            return oDateFormat.format(oDate);
        },

        /**
         * Format currency
         */
        formatCurrency: function (value) {
            if (!value && value !== 0) return "";
            
            var oFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance({
                currencyCode: false,
                decimals: 0
            });
            return "RM " + oFormat.format(value);
        },

        /**
         * Format number with abbreviation (K, M)
         */
        formatNumberAbbreviated: function (value) {
            if (!value && value !== 0) return "0";
            
            if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + "M";
            } else if (value >= 1000) {
                return (value / 1000).toFixed(1) + "K";
            }
            return value.toString();
        }
    });
});
