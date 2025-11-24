sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (ControllerExtension, Fragment, MessageBox, MessageToast) {
    "use strict";

    return ControllerExtension.extend("beautyleads.accounts.ext.controller.AccountsObjectPageExt", {
        // Lifecycle hooks
        onInit: function () {
            this._loadRelatedData();
            this._checkOnboardingParameter();
            this._interceptActionResponses();
            console.log("=== AccountsObjectPageExt Controller Initialized ===");
        },
        
        // Intercept OData responses to detect when our action completes
        _interceptActionResponses: function() {
            const that = this;
            const oView = this.base.getView();
            
            // Wait for view to be fully loaded
            setTimeout(() => {
                const oModel = oView.getModel();
                if (!oModel) {
                    console.warn("Model not found, retrying...");
                    setTimeout(() => that._interceptActionResponses(), 500);
                    return;
                }
                
                console.log("Setting up action response interceptor");
                
                // Listen for request completed events
                oModel.attachRequestCompleted((oEvent) => {
                    const sUrl = oEvent.getParameter("url");
                    console.log("Request completed:", sUrl);
                    
                    // Check if this was our getAIRecommendations action  
                    if (sUrl && sUrl.indexOf("getAIRecommendations") > -1) {
                        console.log("=== getAIRecommendations action completed! ===");
                        
                        // Show success message with instruction
                        MessageBox.success(
                            "AI Recommendations have been generated successfully!\n\n" +
                            "Please scroll down to the 'AI Recommendations' section to view them, or refresh the page (F5) to see all updates.",
                            {
                                title: "Success",
                                onClose: function() {
                                    // Refresh the page
                                    window.location.reload();
                                }
                            }
                        );
                    }
                });
            }, 1000);
        },
        
        _checkOnboardingParameter: function () {
            // Check if onboarding parameter is present
            const oRouter = this.base.getView().getController().getOwnerComponent().getRouter();
            const oRoute = oRouter.getRoute("AccountsObjectPage");
            
            oRoute.attachPatternMatched(function(oEvent) {
                const oQuery = oEvent.getParameter("arguments")["?query"];
                
                if (oQuery && oQuery.onboarding === "true") {
                    // Show onboarding welcome message
                    setTimeout(() => {
                        MessageBox.information(
                            "Welcome to your new account! The lead has been successfully converted. " +
                            "You can now:\n" +
                            "• Create opportunities\n" +
                            "• Schedule activities\n" +
                            "• Manage contacts\n" +
                            "• Track account health",
                            {
                                title: "🎉 Account Created Successfully",
                                styleClass: "sapUiSizeCompact"
                            }
                        );
                    }, 500);
                }
            }, this);
        },

        // Load related data (opportunities, campaigns, activities, recommendations, risk alerts)
        _loadRelatedData: function () {
            const oView = this.base.getView();
            const oBindingContext = oView.getBindingContext();
            
            if (!oBindingContext) {
                return;
            }

            const sAccountID = oBindingContext.getProperty("ID");
            
            // Load opportunities
            this._loadOpportunities(sAccountID);
            
            // Load campaigns
            this._loadCampaigns(sAccountID);
            
            // Load activities
            this._loadActivities(sAccountID);
            
            // Load recommendations
            this._loadRecommendations(sAccountID);
            
            // Load risk alerts
            this._loadRiskAlerts(sAccountID);
        },

        _loadOpportunities: function (sAccountID) {
            const oModel = this.base.getView().getModel();
            oModel.read(`/Opportunities`, {
                filters: [
                    new sap.ui.model.Filter("account_ID", "EQ", sAccountID)
                ],
                success: (oData) => {
                    // Data loaded - binding will update automatically
                },
                error: (oError) => {
                    console.error("Error loading opportunities:", oError);
                }
            });
        },

        _loadCampaigns: function (sAccountID) {
            const oModel = this.base.getView().getModel();
            const oBindingContext = this.base.getView().getBindingContext();
            const sOwnerID = oBindingContext.getProperty("accountOwner_ID");
            
            if (sOwnerID) {
                oModel.read(`/MarketingCampaigns`, {
                    filters: [
                        new sap.ui.model.Filter("owner_ID", "EQ", sOwnerID)
                    ],
                    success: (oData) => {
                        // Data loaded
                    },
                    error: (oError) => {
                        console.error("Error loading campaigns:", oError);
                    }
                });
            }
        },

        _loadActivities: function (sAccountID) {
            const oModel = this.base.getView().getModel();
            oModel.read(`/Activities`, {
                filters: [
                    new sap.ui.model.Filter("relatedAccount_ID", "EQ", sAccountID)
                ],
                success: (oData) => {
                    // Data loaded
                },
                error: (oError) => {
                    console.error("Error loading activities:", oError);
                }
            });
        },

        _loadRecommendations: function (sAccountID) {
            const oModel = this.base.getView().getModel();
            oModel.read(`/AccountRecommendations`, {
                filters: [
                    new sap.ui.model.Filter("account_ID", "EQ", sAccountID),
                    new sap.ui.model.Filter("status", "NE", "Dismissed")
                ],
                success: (oData) => {
                    // Data loaded
                },
                error: (oError) => {
                    console.error("Error loading recommendations:", oError);
                }
            });
        },

        _loadRiskAlerts: function (sAccountID) {
            const oModel = this.base.getView().getModel();
            oModel.read(`/AccountRiskAlerts`, {
                filters: [
                    new sap.ui.model.Filter("account_ID", "EQ", sAccountID),
                    new sap.ui.model.Filter("isResolved", "EQ", false)
                ],
                success: (oData) => {
                    // Data loaded
                },
                error: (oError) => {
                    console.error("Error loading risk alerts:", oError);
                }
            });
        },

        // Timeline actions
        onUpdateTimelineStage: function (oEvent) {
            const sNewStage = oEvent.getParameter("newStage");
            const sNotes = oEvent.getParameter("notes");
            const oBindingContext = this.base.getView().getBindingContext();
            const sAccountID = oBindingContext.getProperty("ID");
            
            const oModel = this.base.getView().getModel();
            oModel.callFunction("/Accounts(" + sAccountID + ")/updateTimelineStage", {
                method: "POST",
                urlParameters: {
                    newStage: sNewStage,
                    notes: sNotes
                },
                success: () => {
                    MessageToast.show("Timeline stage updated successfully");
                    oBindingContext.refresh();
                },
                error: (oError) => {
                    MessageBox.error("Failed to update timeline stage: " + oError.message);
                }
            });
        },

        // Recommendation actions
        onRecommendationPress: function (oEvent) {
            const oItem = oEvent.getSource();
            const sRecommendationID = oItem.getCustomData()[0].getValue();
            
            MessageBox.confirm(
                "Would you like to acknowledge this recommendation?",
                {
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO, MessageBox.Action.CLOSE],
                    onClose: (sAction) => {
                        if (sAction === MessageBox.Action.YES) {
                            this._acknowledgeRecommendation(sRecommendationID);
                        }
                    }
                }
            );
        },

        _acknowledgeRecommendation: function (sRecommendationID) {
            const oModel = this.base.getView().getModel();
            const oBindingContext = this.base.getView().getBindingContext();
            const sAccountID = oBindingContext.getProperty("ID");
            
            oModel.callFunction("/Accounts(" + sAccountID + ")/acknowledgeRecommendation", {
                method: "POST",
                urlParameters: {
                    recommendationID: sRecommendationID
                },
                success: () => {
                    MessageToast.show("Recommendation acknowledged");
                    this._loadRecommendations(sAccountID);
                },
                error: (oError) => {
                    MessageBox.error("Failed to acknowledge recommendation: " + oError.message);
                }
            });
        },

        // Risk alert actions
        onRiskAlertPress: function (oEvent) {
            const oItem = oEvent.getSource();
            const sAlertID = oItem.getCustomData()[0].getValue();
            
            MessageBox.confirm(
                "Would you like to dismiss this risk alert?",
                {
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO, MessageBox.Action.CLOSE],
                    onClose: (sAction) => {
                        if (sAction === MessageBox.Action.YES) {
                            this._dismissRiskAlert(sAlertID);
                        }
                    }
                }
            );
        },

        _dismissRiskAlert: function (sAlertID) {
            const oModel = this.base.getView().getModel();
            const oBindingContext = this.base.getView().getBindingContext();
            const sAccountID = oBindingContext.getProperty("ID");
            
            oModel.callFunction("/Accounts(" + sAccountID + ")/dismissRiskAlert", {
                method: "POST",
                urlParameters: {
                    alertID: sAlertID
                },
                success: () => {
                    MessageToast.show("Risk alert dismissed");
                    this._loadRiskAlerts(sAccountID);
                },
                error: (oError) => {
                    MessageBox.error("Failed to dismiss risk alert: " + oError.message);
                }
            });
        },

        onViewAllAlerts: function () {
            // Navigate to full risk alerts view
            MessageToast.show("Viewing all risk alerts");
        },

        // Navigation handlers
        onNavigateToOpportunities: function () {
            const oBindingContext = this.base.getView().getBindingContext();
            const sAccountID = oBindingContext.getProperty("ID");
            // Navigate to opportunities list filtered by account
            MessageToast.show("Navigating to opportunities");
        },

        onNavigateToOpportunity: function (oEvent) {
            const oItem = oEvent.getSource();
            const oBindingContext = oItem.getBindingContext();
            const sOpportunityID = oBindingContext.getProperty("ID");
            // Navigate to opportunity detail
            MessageToast.show("Navigating to opportunity: " + sOpportunityID);
        },

        onNavigateToCampaign: function (oEvent) {
            const oItem = oEvent.getSource();
            const oBindingContext = oItem.getBindingContext();
            const sCampaignID = oBindingContext.getProperty("ID");
            // Navigate to campaign detail
            MessageToast.show("Navigating to campaign: " + sCampaignID);
        },

        onActivityPress: function (oEvent) {
            const oItem = oEvent.getSource();
            const oBindingContext = oItem.getBindingContext();
            const sActivityID = oBindingContext.getProperty("ID");
            // Navigate to activity detail
            MessageToast.show("Navigating to activity: " + sActivityID);
        },

        // Formatters
        formatStatusState: function (sStatus) {
            const mStates = {
                "Active": "Success",
                "Prospect": "Warning",
                "Inactive": "Error"
            };
            return mStates[sStatus] || "None";
        },

        formatTierState: function (sTier) {
            const mStates = {
                "Platinum": "Success",
                "Gold": "Success",
                "Silver": "Warning",
                "Bronze": "None"
            };
            return mStates[sTier] || "None";
        },

        formatHealthState: function (iScore) {
            if (iScore >= 80) return "Success";
            if (iScore >= 50) return "Warning";
            return "Error";
        },

        formatSentimentIcon: function (sTrend) {
            const mIcons = {
                "Improving": "sap-icon://trend-up",
                "Stable": "sap-icon://trend-neutral",
                "Declining": "sap-icon://trend-down"
            };
            return mIcons[sTrend] || "sap-icon://trend-neutral";
        },

        formatSentimentColor: function (sTrend) {
            const mColors = {
                "Improving": "#2b7c2b",
                "Stable": "#666666",
                "Declining": "#bb0000"
            };
            return mColors[sTrend] || "#666666";
        },

        formatSentimentState: function (sTrend) {
            const mStates = {
                "Improving": "Success",
                "Stable": "None",
                "Declining": "Error"
            };
            return mStates[sTrend] || "None";
        },

        formatCurrency: function (fValue) {
            if (!fValue) return "RM 0.00";
            return "RM " + fValue.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },

        formatTotalPipeline: function (aOpportunities) {
            if (!aOpportunities || aOpportunities.length === 0) return "RM 0.00";
            const fTotal = aOpportunities.reduce((sum, opp) => sum + (opp.expectedRevenue || 0), 0);
            return this.formatCurrency(fTotal);
        },

        formatStageState: function (sStage) {
            const mStates = {
                "Closed Won": "Success",
                "Negotiation": "Warning",
                "Proposal": "Warning",
                "Closed Lost": "Error"
            };
            return mStates[sStage] || "None";
        },

        formatCampaignStatusState: function (sStatus) {
            const mStates = {
                "Active": "Success",
                "PendingApproval": "Warning",
                "Paused": "Warning",
                "Completed": "Success",
                "Draft": "None"
            };
            return mStates[sStatus] || "None";
        },

        formatCampaignPerformance: function (sMetrics) {
            // Parse JSON performance metrics
            try {
                const oMetrics = JSON.parse(sMetrics || "{}");
                const parts = [];
                
                // Format ROI
                if (oMetrics.roi !== undefined && oMetrics.roi !== null) {
                    const roi = parseFloat(oMetrics.roi).toFixed(1);
                    parts.push("ROI: " + roi + "%");
                }
                
                // Format Clicks
                if (oMetrics.clicks !== undefined && oMetrics.clicks !== null) {
                    const clicks = new Intl.NumberFormat('en-MY').format(Math.round(oMetrics.clicks));
                    parts.push(clicks + " clicks");
                }
                
                // Format Conversions
                if (oMetrics.conversions !== undefined && oMetrics.conversions !== null) {
                    const conversions = new Intl.NumberFormat('en-MY').format(Math.round(oMetrics.conversions));
                    parts.push(conversions + " conv.");
                }
                
                // Return formatted string or N/A
                return parts.length > 0 ? parts.join(" • ") : "No data";
            } catch (e) {
                return "N/A";
            }
        },

        formatPriorityState: function (sPriority) {
            const mStates = {
                "High": "Error",
                "Medium": "Warning",
                "Low": "None"
            };
            return mStates[sPriority] || "None";
        },

        formatSeverityState: function (sSeverity) {
            const mStates = {
                "Critical": "Error",
                "High": "Error",
                "Medium": "Warning",
                "Low": "None"
            };
            return mStates[sSeverity] || "None";
        },

        formatActivityStatusState: function (sStatus) {
            const mStates = {
                "Completed": "Success",
                "In Progress": "Warning",
                "Planned": "None",
                "Cancelled": "Error"
            };
            return mStates[sStatus] || "None";
        },

        formatDate: function (sDate) {
            if (!sDate) return "";
            const oDate = new Date(sDate);
            return oDate.toLocaleDateString("en-MY");
        },

        formatDateTime: function (sDateTime) {
            if (!sDateTime) return "";
            const oDate = new Date(sDateTime);
            return oDate.toLocaleString("en-MY");
        },

        formatHealthStatus: function (iScore) {
            if (iScore >= 80) return "Excellent";
            if (iScore >= 50) return "Good";
            return "Needs Attention";
        },

        formatActivityCount: function (aActivities) {
            if (!aActivities) return "0";
            return aActivities.length.toString();
        },

        formatPipelineVelocity: function (aOpportunities) {
            if (!aOpportunities || aOpportunities.length === 0) return "No pipeline";
            return aOpportunities.length + " deals";
        },

        formatOverdueTasks: function (aActivities) {
            if (!aActivities) return "0";
            const oToday = new Date();
            const iOverdue = aActivities.filter(act => {
                if (act.activityType !== "Task" || act.status === "Completed") return false;
                if (!act.dueDate) return false;
                return new Date(act.dueDate) < oToday;
            }).length;
            return iOverdue.toString();
        },

        formatContractStatus: function (sStatus) {
            return sStatus || "N/A";
        }
    });
});

