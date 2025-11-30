sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Text",
    "sap/m/Title",
    "sap/m/Button",
    "sap/m/Panel",
    "sap/m/TextArea",
    "sap/m/ScrollContainer",
    "sap/ui/core/Icon",
    "sap/ui/model/json/JSONModel"
], function (ControllerExtension, Fragment, MessageBox, MessageToast, VBox, HBox, Text, Title, Button, Panel, TextArea, ScrollContainer, Icon, JSONModel) {
    "use strict";

    return ControllerExtension.extend("beautyleads.accounts.ext.controller.AccountsObjectPageExt", {
        // Lifecycle hooks
        onInit: function () {
            this._loadRelatedData();
            this._checkOnboardingParameter();
            this._interceptActionResponses();
            this._initializeCreatioComponents();
            console.log("=== AccountsObjectPageExt Controller Initialized ===");
        },
        
        // =====================================================
        // CREATIO-STYLE COMPONENTS
        // =====================================================
        
        /**
         * Initialize Creatio-style AI panel for accounts
         */
        _initializeCreatioComponents: function() {
            const that = this;
            
            // Load Creatio CSS
            this._loadCreatioCSS();
            
            // Initialize models
            this._oKPIModel = new JSONModel({
                kpis: [
                    { id: "totalRevenue", title: "Total Revenue", value: "RM 0", color: "blue" },
                    { id: "openOpportunities", title: "Open Opportunities", value: "0", color: "green" },
                    { id: "healthScore", title: "Health Score", value: "0%", color: "purple" },
                    { id: "activeContacts", title: "Active Contacts", value: "0", color: "orange" }
                ]
            });
            
            this._oAIMessages = [];
            
            // Render after view is ready
            const oView = this.base.getView();
            if (oView) {
                oView.attachAfterRendering(function() {
                    setTimeout(function() {
                        that._renderKPICards();
                        that._renderAIPanel();
                        that._setupEntityDataListener();
                    }, 500);
                });
            }
        },
        
        /**
         * Load Creatio CSS
         */
        _loadCreatioCSS: function() {
            const sPath = sap.ui.require.toUrl("beautyleads/shared/creatio-layout.css");
            if (!document.querySelector('link[href*="creatio-layout.css"]')) {
                const oLink = document.createElement("link");
                oLink.rel = "stylesheet";
                oLink.href = sPath;
                document.head.appendChild(oLink);
            }
        },
        
        /**
         * Setup listener for entity data changes
         */
        _setupEntityDataListener: function() {
            const oView = this.base.getView();
            if (!oView) return;
            
            oView.attachModelContextChange(this._onEntityDataChange.bind(this));
            
            const oContext = oView.getBindingContext();
            if (oContext) {
                this._updateKPIsFromEntity(oContext.getObject());
            }
        },
        
        /**
         * Handle entity data change
         */
        _onEntityDataChange: function() {
            const oView = this.base.getView();
            const oContext = oView && oView.getBindingContext();
            if (oContext) {
                oContext.requestObject().then((oData) => {
                    this._updateKPIsFromEntity(oData);
                });
            }
        },
        
        /**
         * Update KPIs from entity data
         */
        _updateKPIsFromEntity: function(oData) {
            if (!oData || !this._oKPIModel) return;
            
            // Format currency
            const formatCurrency = (val) => {
                if (!val) return "RM 0";
                return "RM " + parseFloat(val).toLocaleString("en-MY", { minimumFractionDigits: 0 });
            };
            
            this._oKPIModel.setProperty("/kpis/0/value", formatCurrency(oData.annualRevenue || oData.forecastedRevenueContribution));
            
            // Count open opportunities
            const aOpps = oData.opportunities || [];
            const iOpenOpps = aOpps.filter(o => o.stage && !o.stage.startsWith("Closed")).length;
            this._oKPIModel.setProperty("/kpis/1/value", iOpenOpps.toString());
            
            this._oKPIModel.setProperty("/kpis/2/value", (oData.healthScore || 0) + "%");
            
            // Count active contacts
            const aContacts = oData.contacts || [];
            const iActiveContacts = aContacts.filter(c => c.status === "Active").length;
            this._oKPIModel.setProperty("/kpis/3/value", iActiveContacts.toString());
        },
        
        /**
         * Render KPI Cards
         */
        _renderKPICards: function() {
            const oView = this.base.getView();
            if (!oView) return;
            
            // Find header area
            const oObjectPage = oView.byId("fe::ObjectPage");
            if (!oObjectPage) return;
            
            try {
                const oDomRef = oObjectPage.getDomRef();
                if (!oDomRef) return;
                
                const oHeaderContent = oDomRef.querySelector(".sapUxAPObjectPageHeaderContent");
                if (!oHeaderContent) return;
                
                // Create KPI container
                const oKPIContainer = new VBox({
                    id: oView.createId("accountsKPIContainer"),
                    width: "100%"
                });
                oKPIContainer.addStyleClass("creatio-header-kpi-section");
                
                const oKPIRow = new HBox({
                    class: "creatio-kpi-row sapUiSmallMarginBottom",
                    justifyContent: "Start",
                    wrap: "Wrap"
                });
                
                const aKPIs = this._oKPIModel.getProperty("/kpis");
                aKPIs.forEach((oKPI) => {
                    const oCard = new VBox({ class: "creatio-kpi-card kpi-" + oKPI.color });
                    oCard.addItem(new Text({ text: oKPI.title, class: "creatio-kpi-title" }));
                    oCard.addItem(new Text({ text: oKPI.value, class: "creatio-kpi-value" }));
                    oCard.data("kpiId", oKPI.id);
                    oKPIRow.addItem(oCard);
                });
                
                oKPIContainer.addItem(oKPIRow);
                oKPIContainer.placeAt(oHeaderContent, "first");
            } catch (e) {
                console.warn("[AccountsObjectPageExt] Could not render KPIs:", e);
            }
        },
        
        /**
         * Render AI Panel
         */
        _renderAIPanel: function() {
            const that = this;
            
            const oAIPanel = new Panel({
                class: "creatio-ai-panel",
                expandable: false,
                expanded: true
            });
            
            const oHeader = new HBox({
                class: "creatio-ai-header",
                justifyContent: "SpaceBetween",
                alignItems: "Center",
                items: [
                    new HBox({
                        alignItems: "Center",
                        items: [
                            new Icon({ src: "sap-icon://da-2", class: "creatio-ai-logo" }),
                            new Title({ text: "AI Assistant", level: "H5", class: "creatio-ai-title" })
                        ]
                    }),
                    new HBox({
                        items: [
                            new Button({ icon: "sap-icon://undo", type: "Transparent", press: function() { that._onResetAIChat(); } }),
                            new Button({ icon: "sap-icon://slim-arrow-right", type: "Transparent", press: function() { that._onToggleAIPanel(); } })
                        ]
                    })
                ]
            });
            
            const oWelcome = new VBox({
                class: "creatio-ai-welcome sapUiSmallMargin",
                alignItems: "Center",
                items: [
                    new Icon({ src: "sap-icon://da-2", size: "3rem" }),
                    new Text({ text: "AI Assistant", class: "creatio-ai-welcome-title sapUiTinyMarginTop" }),
                    new Text({ text: "Ask about account health, growth opportunities, or risk alerts.", class: "creatio-ai-welcome-text sapUiTinyMarginTop", textAlign: "Center" })
                ]
            });
            
            const oQuickActions = this._createAIQuickActions();
            
            this._oAIMessagesContainer = new ScrollContainer({
                class: "creatio-ai-messages",
                height: "300px",
                vertical: true,
                horizontal: false
            });
            
            this._oAIInput = new TextArea({
                placeholder: "Type your message...",
                rows: 2,
                growing: true,
                growingMaxLines: 4,
                width: "100%"
            });
            
            const oInputArea = new VBox({
                class: "creatio-ai-input-area",
                items: [
                    this._oAIInput,
                    new HBox({ justifyContent: "End", items: [
                        new Button({ icon: "sap-icon://paper-plane", type: "Emphasized", press: function() { that._onSendAIMessage(); } })
                    ]})
                ]
            });
            
            const oContent = new VBox({
                class: "creatio-ai-content",
                items: [oWelcome, oQuickActions, this._oAIMessagesContainer, oInputArea]
            });
            
            oAIPanel.setCustomHeader(oHeader);
            oAIPanel.addContent(oContent);
            oAIPanel.placeAt(document.body);
            this._oAIPanel = oAIPanel;
        },
        
        /**
         * Create AI quick actions
         */
        _createAIQuickActions: function() {
            const that = this;
            const aActions = [
                { id: "healthAnalysis", label: "Account Health Analysis", icon: "sap-icon://monitor-payments" },
                { id: "growthRecs", label: "Growth Recommendations", icon: "sap-icon://trend-up" },
                { id: "riskAlerts", label: "Risk Warnings", icon: "sap-icon://warning" },
                { id: "overview", label: "Account Overview", icon: "sap-icon://hint" }
            ];
            
            const oBox = new HBox({ class: "creatio-ai-quick-actions sapUiSmallMargin", wrap: "Wrap", justifyContent: "Center" });
            
            aActions.forEach((oAction) => {
                const oBtn = new Button({
                    text: oAction.label,
                    icon: oAction.icon,
                    type: "Transparent",
                    press: function() { that._onAIQuickAction(oAction.id); }
                });
                oBtn.addStyleClass("sapUiTinyMarginEnd sapUiTinyMarginBottom");
                oBox.addItem(oBtn);
            });
            
            return oBox;
        },
        
        /**
         * Handle AI quick action
         */
        _onAIQuickAction: function(sActionId) {
            const mQueries = {
                "healthAnalysis": "Account Health Analysis",
                "growthRecs": "Growth Recommendations",
                "riskAlerts": "Risk Warnings",
                "overview": "Account Overview"
            };
            this._sendAIQuery(mQueries[sActionId] || "Help");
        },
        
        /**
         * Send AI message
         */
        _onSendAIMessage: function() {
            if (!this._oAIInput) return;
            const sMessage = this._oAIInput.getValue();
            if (!sMessage || sMessage.trim() === "") return;
            
            this._sendAIQuery(sMessage);
            this._oAIInput.setValue("");
        },
        
        /**
         * Send query to AI
         */
        _sendAIQuery: function(sQuery) {
            const oView = this.base.getView();
            const oContext = oView && oView.getBindingContext();
            const oData = oContext ? oContext.getObject() : {};
            
            // Add user message
            this._oAIMessages.push({
                type: "user",
                text: sQuery,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            
            // Generate mock AI response
            let sResponse = this._generateAIResponse(sQuery, oData);
            
            this._oAIMessages.push({
                type: "ai",
                text: sResponse,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            
            this._refreshAIMessages();
        },
        
        /**
         * Generate AI response
         */
        _generateAIResponse: function(sQuery, oData) {
            const sLower = sQuery.toLowerCase();
            
            if (sLower.includes("health")) {
                const iHealth = oData.healthScore || 75;
                return `Account health analysis:\n\n• Health Score: ${iHealth}%\n• Risk Level: ${oData.riskLevel || 'Low'}\n• Sentiment: ${oData.recentSentimentTrend || 'Stable'}\n\n${iHealth >= 70 ? 'Account is in good standing.' : 'Attention needed.'}`;
            }
            if (sLower.includes("growth") || sLower.includes("recommend")) {
                return "Growth recommendations:\n\n1. Upsell premium product lines\n2. Cross-sell complementary categories\n3. Volume increase with tiered pricing\n\nEstimated potential: RM 15,000/month";
            }
            if (sLower.includes("risk") || sLower.includes("warning")) {
                return `Risk assessment:\n\n• Risk Level: ${oData.riskLevel || 'Low'}\n• Potential Concerns: None critical\n• Monitoring: Order frequency, payments\n\nNo immediate action required.`;
            }
            return `Account "${oData.accountName || 'Unknown'}" is a ${oData.accountType || 'partner'} with ${oData.accountTier || 'standard'} tier. Health: ${oData.healthScore || 'N/A'}%.`;
        },
        
        /**
         * Refresh AI messages
         */
        _refreshAIMessages: function() {
            if (!this._oAIMessagesContainer) return;
            
            this._oAIMessagesContainer.removeAllContent();
            
            this._oAIMessages.forEach((oMsg) => {
                const oMsgBox = new VBox({ class: "creatio-ai-message " + (oMsg.type === "user" ? "user-message" : "ai-message") });
                oMsgBox.addItem(new Text({ text: oMsg.text, class: "creatio-ai-message-text" }));
                oMsgBox.addItem(new Text({ text: oMsg.timestamp, class: "creatio-ai-message-time" }));
                this._oAIMessagesContainer.addContent(oMsgBox);
            });
            
            const oDomRef = this._oAIMessagesContainer.getDomRef();
            if (oDomRef) oDomRef.scrollTop = oDomRef.scrollHeight;
        },
        
        /**
         * Reset AI chat
         */
        _onResetAIChat: function() {
            this._oAIMessages = [];
            if (this._oAIMessagesContainer) {
                this._oAIMessagesContainer.removeAllContent();
            }
        },
        
        /**
         * Toggle AI panel
         */
        _onToggleAIPanel: function() {
            if (this._oAIPanel) {
                const oDomRef = this._oAIPanel.getDomRef();
                if (oDomRef) oDomRef.classList.toggle("collapsed");
            }
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

