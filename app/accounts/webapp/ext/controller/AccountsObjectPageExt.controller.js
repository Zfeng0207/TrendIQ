/**
 * Accounts Object Page Extension - Creatio-style Layout
 * Integrates Account Lifecycle Stage Bar, KPI Cards, Enhanced AI Assistant Panel, and Entity Profile
 * 
 * Enhanced Features:
 * - AI Sidebar with Account Health Breakdown, Growth Recommendations, Risk Indicators, Interaction History
 * - Activity Timeline with mock data
 * - Quick Action Buttons (Call, Email, Meeting)
 * - Visual Score Indicators with progress rings
 * - Account Lifecycle Stages (Prospect > Onboarding > Active > At-Risk > Churned)
 */
sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/FlexBox",
    "sap/m/Text",
    "sap/m/Title",
    "sap/m/Label",
    "sap/m/Button",
    "sap/m/ObjectNumber",
    "sap/m/ObjectStatus",
    "sap/m/Panel",
    "sap/m/TextArea",
    "sap/m/ScrollContainer",
    "sap/m/List",
    "sap/m/StandardListItem",
    "sap/m/CustomListItem",
    "sap/m/ProgressIndicator",
    "sap/m/Link",
    "sap/m/CheckBox",
    "sap/f/Avatar",
    "sap/f/Card",
    "sap/ui/core/Icon",
    "sap/ui/core/BusyIndicator",
    "sap/ui/core/HTML",
    "beautyleads/shared/AIAssistantPanelFactory"
], function (
    ControllerExtension, Fragment, JSONModel, MessageBox, MessageToast,
    VBox, HBox, FlexBox, Text, Title, Label, Button, ObjectNumber, ObjectStatus,
    Panel, TextArea, ScrollContainer, List, StandardListItem, CustomListItem,
    ProgressIndicator, Link, CheckBox, Avatar, Card, Icon, BusyIndicator, HTML,
    AIAssistantPanelFactory
) {
    "use strict";

    // Mock data for growth recommendations
    const MOCK_RECOMMENDATIONS = [
        { id: "1", title: "Upsell Premium Products", description: "Based on order history, recommend K-Beauty premium line", impact: "High", potentialValue: "RM 8,500/month" },
        { id: "2", title: "Cross-sell Skincare", description: "Customer only purchases makeup, recommend skincare bundle", impact: "Medium", potentialValue: "RM 3,200/month" },
        { id: "3", title: "Volume Discount Tier", description: "Eligible for Gold tier with 10% volume increase", impact: "Medium", potentialValue: "RM 5,000/month" }
    ];

    // Mock risk indicators
    const MOCK_RISKS = [
        { id: "1", type: "payment", title: "Payment Delay Pattern", description: "3 late payments in last 6 months", severity: "Medium", icon: "sap-icon://money-bills" },
        { id: "2", type: "engagement", title: "Declining Engagement", description: "20% fewer orders vs last quarter", severity: "Low", icon: "sap-icon://decline" }
    ];

    // Mock interaction history
    const MOCK_INTERACTIONS = [
        { id: "1", type: "order", description: "Order #ORD-2025-0891 placed", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), icon: "sap-icon://cart" },
        { id: "2", type: "call", description: "Quarterly review call completed", date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), icon: "sap-icon://call" },
        { id: "3", type: "meeting", description: "Product training session", date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), icon: "sap-icon://appointment" }
    ];

    // Next best actions configuration
    const NEXT_BEST_ACTIONS = [
        { id: "review", label: "Schedule Account Review", icon: "sap-icon://appointment", priority: "High", dueText: "This week", type: "Emphasized" },
        { id: "opportunity", label: "Create Opportunity", icon: "sap-icon://add", priority: "High", dueText: "Today", type: "Emphasized" },
        { id: "email", label: "Send Update Email", icon: "sap-icon://email", priority: "Medium", dueText: "This week", type: "Default" },
        { id: "call", label: "Check-in Call", icon: "sap-icon://call", priority: "Medium", dueText: "Tomorrow", type: "Default" }
    ];

    // Mock tags for account categorization
    const MOCK_TAGS = [
        { id: "platinum", text: "Platinum", colorClass: "tag-hot", removable: true },
        { id: "key_account", text: "Key Account", colorClass: "tag-webinar", removable: true },
        { id: "strategic", text: "Strategic Partner", colorClass: "tag-ai", removable: true }
    ];

    return ControllerExtension.extend("beautyleads.accounts.ext.controller.AccountsObjectPageExt", {
        // Component references
        _oProfileModel: null,
        _oKPIModel: null,
        _oEntityData: null,
        
        // Fragment references
        _oAIPanel: null,
        _oProfileSidebar: null,

        /**
         * Lifecycle: Controller initialization
         */
        onInit: function () {
            console.log("[AccountsObjectPageExt] Initializing Creatio-style extensions (Enhanced)");
            
            // Initialize models
            this._initializeModels();
            
            // Wait for view to be ready, then initialize components
            const oView = this.base.getView();
            if (oView) {
                oView.attachAfterRendering(this._onViewAfterRendering.bind(this));
            }
            
            // Load CSS
            this._loadCreatioCSS();
            
            // Existing functionality
            this._loadRelatedData();
            this._checkOnboardingParameter();
            this._interceptActionResponses();
            
            this._oAIMessages = [];
        },

        /**
         * Initialize JSON models for components
         * @private
         */
        _initializeModels: function () {
            // Profile model with enhanced avatar support
            this._oProfileModel = new JSONModel({
                name: "",
                subtitle: "",
                initials: "",
                avatarColor: "Accent1",
                avatarUrl: "",
                badgeText: "",
                badgeState: "None",
                badgeIcon: "",
                accountType: "",
                industry: "",
                owner: "",
                createdAt: "",
                phone: "",
                email: "",
                showCall: true,
                showMessage: true,
                showEmail: true,
                showSchedule: true
            });

            // KPI model with score data
            this._oKPIModel = new JSONModel({
                kpis: [
                    { id: "totalRevenue", title: "Annual revenue", value: "RM 0", numericValue: 0, color: "blue" },
                    { id: "openOpportunities", title: "Open opportunities", value: "0", numericValue: 0, color: "green" },
                    { id: "healthScore", title: "Health score", value: "0%", numericValue: 0, color: "purple" },
                    { id: "lifetimeValue", title: "Lifetime value", value: "RM 0", numericValue: 0, color: "orange" }
                ],
                healthScore: 0,
                riskLevel: "Low"
            });

            // AI Panel model
            this._oAIPanelModel = new JSONModel({
                expanded: true,
                messages: [],
                inputText: "",
                isLoading: false,
                recommendations: MOCK_RECOMMENDATIONS,
                risks: MOCK_RISKS,
                interactions: MOCK_INTERACTIONS,
                actions: NEXT_BEST_ACTIONS
            });

            // Tags model
            this._oTagsModel = new JSONModel({
                tags: MOCK_TAGS
            });
        },

        /**
         * Load Creatio CSS stylesheet
         * @private
         */
        _loadCreatioCSS: function () {
            const sPath = sap.ui.require.toUrl("beautyleads/shared/creatio-layout.css");
            if (!document.querySelector('link[href*="creatio-layout.css"]')) {
                const oLink = document.createElement("link");
                oLink.rel = "stylesheet";
                oLink.href = sPath;
                document.head.appendChild(oLink);
                console.log("[AccountsObjectPageExt] Loaded creatio-layout.css");
            }
        },

        /**
         * Called after view rendering
         * @private
         */
        _onViewAfterRendering: function () {
            console.log("[AccountsObjectPageExt] View rendered, initializing components");
            
            const fnInit = () => {
                const oObjectPage = this.base.getView().byId("fe::ObjectPage");
                if (oObjectPage && oObjectPage.getDomRef()) {
                    this._initializeCreatioComponents();
                    this._setupBindingContextListener();
                    return true;
                }
                return false;
            };

            if (!fnInit()) {
                let attempts = 0;
                const interval = setInterval(() => {
                    attempts++;
                    if (fnInit() || attempts > 10) {
                        clearInterval(interval);
                    }
                }, 500);
            }
        },

        /**
         * Setup listener for binding context changes
         * @private
         */
        _setupBindingContextListener: function () {
            const oView = this.base.getView();
            if (!oView) return;

            oView.attachModelContextChange(this._onModelContextChange.bind(this));
            
            const oContext = oView.getBindingContext();
            if (oContext) {
                this._updateFromEntity(oContext.getObject());
            }
        },

        /**
         * Handle model context change
         * @private
         */
        _onModelContextChange: function () {
            const oView = this.base.getView();
            const oContext = oView && oView.getBindingContext();
            
            if (oContext) {
                oContext.requestObject().then((oData) => {
                    this._updateFromEntity(oData);
                }).catch((err) => {
                    console.error("[AccountsObjectPageExt] Error loading entity data:", err);
                });
            }
        },

        /**
         * Initialize Creatio-style components
         * @private
         */
        _initializeCreatioComponents: function () {
            const oView = this.base.getView();
            
            if (!oView) {
                console.warn("[AccountsObjectPageExt] View not available");
                return;
            }

            // Render components
            this._renderTagChips();
            this._renderAccountLifecycleBar();
            this._renderKPICards();
            this._renderDashboardWidgets();
            this._renderProfileSidebar();
            this._renderEnhancedAIPanel();
        },

        /**
         * Render Tag Chips in header area
         * @private
         */
        _renderTagChips: function () {
            const that = this;
            
            let oTagContainer = document.getElementById("creatioTagChipsContainer");
            if (!oTagContainer) {
                oTagContainer = document.createElement("div");
                oTagContainer.id = "creatioTagChipsContainer";
                oTagContainer.className = "creatio-tags-container";
                oTagContainer.style.cssText = "position:fixed;top:48px;left:165px;z-index:9550;padding:0.375rem 0;";
                document.body.appendChild(oTagContainer);
            }

            oTagContainer.innerHTML = "";

            const aTags = this._oTagsModel.getProperty("/tags") || [];
            aTags.forEach((oTag) => {
                const oChip = document.createElement("div");
                oChip.className = "creatio-tag-chip " + (oTag.colorClass || "");
                oChip.innerHTML = `
                    <span class="tag-text">${oTag.text}</span>
                    ${oTag.removable ? '<span class="tag-remove" data-tag-id="' + oTag.id + '">✕</span>' : ''}
                `;
                
                const oRemoveBtn = oChip.querySelector(".tag-remove");
                if (oRemoveBtn) {
                    oRemoveBtn.addEventListener("click", function() {
                        that._onRemoveTag(oTag.id);
                    });
                }
                
                oTagContainer.appendChild(oChip);
            });

            const oAddBtn = document.createElement("button");
            oAddBtn.className = "creatio-add-tag-btn";
            oAddBtn.innerHTML = '<span>+</span><span>Add tag</span>';
            oAddBtn.addEventListener("click", function() {
                that._onAddTag();
            });
            oTagContainer.appendChild(oAddBtn);

            console.log("[AccountsObjectPageExt] Tag chips rendered");
        },

        /**
         * Handle tag removal
         * @private
         */
        _onRemoveTag: function (sTagId) {
            const aTags = this._oTagsModel.getProperty("/tags") || [];
            const aNewTags = aTags.filter(t => t.id !== sTagId);
            this._oTagsModel.setProperty("/tags", aNewTags);
            this._renderTagChips();
            MessageToast.show("Tag removed");
        },

        /**
         * Handle add tag
         * @private
         */
        _onAddTag: function () {
            MessageToast.show("Add tag dialog would open here");
        },

        /**
         * Render Profile Sidebar
         * @private
         */
        _renderProfileSidebar: function () {
            const that = this;
            
            let oSidebarContainer = document.getElementById("creatioProfileSidebar");
            if (oSidebarContainer) {
                oSidebarContainer.remove();
            }
            
            oSidebarContainer = document.createElement("div");
            oSidebarContainer.id = "creatioProfileSidebar";
            oSidebarContainer.className = "creatio-profile-sidebar-fixed";
            document.body.appendChild(oSidebarContainer);

            const oSidebar = new VBox({
                width: "100%"
            });
            oSidebar.addStyleClass("creatio-entity-profile");

            // Profile Header with Avatar
            const oProfileHeader = new VBox({
                alignItems: "Center"
            });
            oProfileHeader.addStyleClass("creatio-profile-header");

            const oAvatar = new Avatar({
                initials: "AC",
                displaySize: "L",
                backgroundColor: "Accent3"
            });
            oAvatar.addStyleClass("creatio-profile-avatar creatio-avatar-enhanced");
            oProfileHeader.addItem(oAvatar);

            const oName = new Title({
                text: "Loading...",
                level: "H5"
            });
            oName.addStyleClass("creatio-profile-name");
            oProfileHeader.addItem(oName);

            const oSubtitle = new Text({
                text: ""
            });
            oSubtitle.addStyleClass("creatio-profile-subtitle");
            oProfileHeader.addItem(oSubtitle);

            oSidebar.addItem(oProfileHeader);

            // Quick Action Buttons Row
            const oActionsRow = new HBox({
                justifyContent: "Center",
                alignItems: "Center"
            });
            oActionsRow.addStyleClass("creatio-profile-actions");

            const oCallBtn = new Button({
                icon: "sap-icon://call",
                type: "Default",
                tooltip: "Call",
                press: function() { that._onQuickCall(); }
            });
            oActionsRow.addItem(oCallBtn);

            const oChatBtn = new Button({
                icon: "sap-icon://discussion-2",
                type: "Default",
                tooltip: "Chat",
                press: function() { that._onQuickWhatsApp(); }
            });
            oActionsRow.addItem(oChatBtn);

            const oEmailBtn = new Button({
                icon: "sap-icon://email",
                type: "Default",
                tooltip: "Email",
                press: function() { that._onQuickEmail(); }
            });
            oActionsRow.addItem(oEmailBtn);

            const oMeetingBtn = new Button({
                icon: "sap-icon://appointment",
                type: "Default",
                tooltip: "Schedule Meeting",
                press: function() { that._onQuickSchedule(); }
            });
            oActionsRow.addItem(oMeetingBtn);

            oSidebar.addItem(oActionsRow);

            // Profile Info Fields
            const oInfoSection = new VBox();
            oInfoSection.addStyleClass("creatio-profile-info");

            const oTypeField = this._createProfileField("Account Type", "Loading...", "sap-icon://building");
            oInfoSection.addItem(oTypeField);

            const oIndustryField = this._createProfileField("Industry", "Loading...", "sap-icon://factory");
            oInfoSection.addItem(oIndustryField);

            const oTierField = this._createProfileField("Account Tier", "Loading...", "sap-icon://badge");
            oInfoSection.addItem(oTierField);

            oSidebar.addItem(oInfoSection);

            // Next Steps Section
            const oNextStepsSection = new VBox();
            oNextStepsSection.addStyleClass("creatio-next-steps-section");
            
            const oNextStepsTitle = new Text({ text: "Next steps" });
            oNextStepsTitle.addStyleClass("creatio-section-title");
            oNextStepsSection.addItem(oNextStepsTitle);
            
            const aNextSteps = [
                { text: "Schedule quarterly review", icon: "sap-icon://appointment", date: "This week" },
                { text: "Follow up on open opportunity", icon: "sap-icon://sales-quote", date: "Tomorrow" },
                { text: "Review payment status", icon: "sap-icon://money-bills", date: "Today" }
            ];
            
            aNextSteps.forEach((oStep) => {
                const oStepItem = new HBox({
                    alignItems: "Center"
                });
                oStepItem.addStyleClass("creatio-next-step-item");
                
                const oCheckbox = new CheckBox({
                    selected: false,
                    select: function() {
                        MessageToast.show("Step completed: " + oStep.text);
                    }
                });
                oStepItem.addItem(oCheckbox);
                
                const oStepContent = new VBox();
                const oStepText = new Text({ text: oStep.text });
                oStepText.addStyleClass("creatio-next-step-text");
                oStepContent.addItem(oStepText);
                
                const oStepDate = new Text({ text: oStep.date });
                oStepDate.addStyleClass("creatio-next-step-date");
                oStepContent.addItem(oStepDate);
                
                oStepItem.addItem(oStepContent);
                oNextStepsSection.addItem(oStepItem);
            });
            
            oSidebar.addItem(oNextStepsSection);

            oSidebar.placeAt(oSidebarContainer);
            this._oProfileSidebar = oSidebar;
            this._oProfileAvatar = oAvatar;
            this._oProfileName = oName;
            this._oProfileSubtitle = oSubtitle;
            this._oTypeField = oTypeField;
            this._oIndustryField = oIndustryField;
            this._oTierField = oTierField;

            document.body.classList.add("creatio-with-profile-sidebar");

            console.log("[AccountsObjectPageExt] Profile sidebar rendered");
        },

        /**
         * Create a profile info field
         * @private
         */
        _createProfileField: function (sLabel, sValue, sIcon) {
            const oField = new HBox({
                alignItems: "Start"
            });
            oField.addStyleClass("creatio-profile-field");

            const oIcon = new Icon({
                src: sIcon,
                size: "0.875rem"
            });
            oIcon.addStyleClass("creatio-profile-field-icon");
            oField.addItem(oIcon);

            const oContent = new VBox();
            const oLabel = new Text({ text: sLabel });
            oLabel.addStyleClass("creatio-profile-field-label");
            oContent.addItem(oLabel);

            const oValue = new Text({ text: sValue });
            oValue.addStyleClass("creatio-profile-field-value");
            oContent.addItem(oValue);
            oField.addItem(oContent);

            oField._valueText = oValue;
            return oField;
        },

        /**
         * Render Account Lifecycle Stage Bar (different from Chevron - circular lifecycle)
         * @private
         */
        _renderAccountLifecycleBar: function () {
            const oView = this.base.getView();
            
            let oContainer = this._findOrCreateContainer("accountsLifecycleContainer", "creatio-header-stage-section");
            
            if (oContainer) {
                const oWrapper = new VBox({
                    class: "creatio-lifecycle-container sapUiSmallMarginBottom"
                });
                
                const oLifecycleBar = this._buildLifecycleBar();
                oWrapper.addItem(oLifecycleBar);
                
                oContainer.addItem(oWrapper);
                console.log("[AccountsObjectPageExt] Account Lifecycle Bar rendered");
            }
        },

        /**
         * Build the account lifecycle stage bar
         * @private
         */
        _buildLifecycleBar: function () {
            const that = this;
            const aStages = [
                { key: "Onboarding", label: "ONBOARDING", icon: "sap-icon://user-edit", description: "Setting up account" },
                { key: "Active", label: "ACTIVE", icon: "sap-icon://accept", description: "Regular business" },
                { key: "At Risk", label: "AT RISK", icon: "sap-icon://warning", description: "Attention needed", isWarning: true },
                { key: "Churned", label: "CHURNED", icon: "sap-icon://decline", description: "Lost customer", isNegative: true },
                { key: "Inactive", label: "INACTIVE", icon: "sap-icon://sys-cancel", description: "Account inactive" }
            ];

            const oBar = new HBox({
                justifyContent: "Start",
                alignItems: "Stretch",
                width: "100%"
            });
            oBar.addStyleClass("creatio-lifecycle-bar");

            aStages.forEach((oStage, iIndex) => {
                const oLifecycleStage = new HBox({
                    alignItems: "Center",
                    justifyContent: "Center"
                });
                oLifecycleStage.addStyleClass("creatio-lifecycle-stage");
                oLifecycleStage.addStyleClass("creatio-stage-future");
                oLifecycleStage.data("stageKey", oStage.key);
                oLifecycleStage.data("stageIndex", iIndex);

                const oStageIcon = new Icon({
                    src: oStage.icon,
                    size: "1rem"
                });
                oStageIcon.addStyleClass("creatio-stage-icon");
                
                const oLabel = new Text({ text: oStage.label });
                oLabel.addStyleClass("creatio-stage-label");
                
                oLifecycleStage.addItem(oStageIcon);
                oLifecycleStage.addItem(oLabel);

                oLifecycleStage.attachBrowserEvent("click", function() {
                    that._onLifecycleStageClick(oStage, iIndex);
                });

                oBar.addItem(oLifecycleStage);
            });

            return oBar;
        },

        /**
         * Update lifecycle bar state based on current status
         * @private
         */
        _updateLifecycleState: function (sCurrentStatus) {
            const oView = this.base.getView();
            if (!oView) return;

            const aStageKeys = ["Onboarding", "Active", "At Risk", "Churned", "Inactive"];
            const iCurrentIndex = aStageKeys.indexOf(sCurrentStatus);

            const oContainer = oView.byId("accountsLifecycleContainer");
            if (!oContainer) return;

            const oLifecycleBar = oContainer.getItems()[0]?.getItems()[0];
            if (!oLifecycleBar) return;

            oLifecycleBar.getItems().forEach((oStage, iIndex) => {
                oStage.removeStyleClass("creatio-stage-completed");
                oStage.removeStyleClass("creatio-stage-current");
                oStage.removeStyleClass("creatio-stage-future");
                oStage.removeStyleClass("creatio-stage-warning");
                oStage.removeStyleClass("creatio-stage-negative");

                const sStageKey = oStage.data("stageKey");
                
                if (iIndex < iCurrentIndex) {
                    oStage.addStyleClass("creatio-stage-completed");
                } else if (iIndex === iCurrentIndex) {
                    oStage.addStyleClass("creatio-stage-current");
                    if (sStageKey === "At-Risk") {
                        oStage.addStyleClass("creatio-stage-warning");
                    } else if (sStageKey === "Churned") {
                        oStage.addStyleClass("creatio-stage-negative");
                    }
                } else {
                    oStage.addStyleClass("creatio-stage-future");
                }
            });
        },

        /**
         * Render KPI Cards Row
         * @private
         */
        _renderKPICards: function () {
            const oContainer = this._findOrCreateContainer("accountsKPIContainer", "creatio-header-kpi-section");
            
            if (oContainer) {
                const oKPIRow = new HBox({
                    justifyContent: "Start",
                    wrap: "Wrap"
                });
                oKPIRow.addStyleClass("creatio-kpi-row sapUiSmallMarginBottom");
                
                const aKPIs = this._oKPIModel.getProperty("/kpis");
                aKPIs.forEach((oKPI) => {
                    const oCard = this._createEnhancedKPICard(oKPI);
                    oKPIRow.addItem(oCard);
                });
                
                oContainer.addItem(oKPIRow);
                console.log("[AccountsObjectPageExt] KPI Cards rendered");
            }
        },

        /**
         * Create a clean KPI card
         * @private
         */
        _createEnhancedKPICard: function (oKPI) {
            const oCard = new VBox();
            oCard.addStyleClass("creatio-kpi-card kpi-" + oKPI.color);
            
            const oTitle = new Text({ text: oKPI.title });
            oTitle.addStyleClass("creatio-kpi-title");

            const oValue = new Text({ text: oKPI.value });
            oValue.addStyleClass("creatio-kpi-value");
            
            oCard.addItem(oTitle);
            oCard.addItem(oValue);
            
            oCard.data("kpiId", oKPI.id);
            oCard._valueText = oValue;
            
            return oCard;
        },

        /**
         * Render Dashboard Widgets
         * @private
         */
        _renderDashboardWidgets: function () {
            let oDashContainer = document.getElementById("creatioDashboardContainer");
            if (oDashContainer) {
                return;
            }

            oDashContainer = document.createElement("div");
            oDashContainer.id = "creatioDashboardContainer";
            oDashContainer.className = "creatio-dashboard-container";

            // Quick Info Row
            const sQuickInfoHTML = `
                <div class="creatio-quick-info-row">
                    <div class="creatio-quick-info-item">
                        <span class="creatio-quick-info-label">Industry</span>
                        <span class="creatio-quick-info-value">Beauty & Cosmetics</span>
                    </div>
                    <div class="creatio-quick-info-item">
                        <span class="creatio-quick-info-label">Primary contact</span>
                        <span class="creatio-quick-info-value link">Account Manager</span>
                    </div>
                    <div class="creatio-quick-info-item">
                        <span class="creatio-quick-info-label">Account owner</span>
                        <span class="creatio-quick-info-value link">Sales Rep</span>
                    </div>
                    <div class="creatio-quick-info-item">
                        <span class="creatio-quick-info-label">Customer since</span>
                        <span class="creatio-quick-info-value">Jan 2024</span>
                    </div>
                </div>
            `;

            // Revenue & Health Widgets
            const sRevenueHTML = `
                <div class="creatio-dashboard-row">
                    <div class="creatio-widget-card">
                        <div class="creatio-widget-header">
                            <div class="creatio-widget-icon" style="color: #4CAF50;">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                                </svg>
                            </div>
                            <span class="creatio-widget-title">Revenue Performance</span>
                        </div>
                        <div class="creatio-widget-content">
                            <div class="creatio-widget-metrics">
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">YTD revenue</span>
                                    <span class="creatio-metric-value">
                                        <span class="creatio-metric-icon success">✓</span> RM 245,000
                                    </span>
                                </div>
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">vs Last Year</span>
                                    <span class="creatio-metric-value">+18%</span>
                                </div>
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Avg order value</span>
                                    <span class="creatio-metric-value">RM 8,500</span>
                                </div>
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Order frequency</span>
                                    <span class="creatio-metric-value">2.4x/month</span>
                                </div>
                            </div>
                            <div class="creatio-widget-chart">
                                <span class="creatio-chart-title">Revenue trend (last 12 months)</span>
                                <div class="creatio-chart-container">
                                    <svg class="creatio-chart-svg" viewBox="0 0 300 100" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="accountRevenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:0.2"/>
                                                <stop offset="100%" style="stop-color:#4CAF50;stop-opacity:0"/>
                                            </linearGradient>
                                        </defs>
                                        <path class="creatio-chart-area success" d="M0,70 L25,65 L50,55 L75,60 L100,50 L125,45 L150,40 L175,35 L200,30 L225,28 L250,22 L275,18 L300,15 L300,100 L0,100 Z" fill="url(#accountRevenueGradient)"/>
                                        <path class="creatio-chart-line success" d="M0,70 L25,65 L50,55 L75,60 L100,50 L125,45 L150,40 L175,35 L200,30 L225,28 L250,22 L275,18 L300,15"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="creatio-widget-card">
                        <div class="creatio-widget-header">
                            <div class="creatio-widget-icon" style="color: #2196F3;">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM10 17l-3.5-3.5 1.41-1.41L10 14.17l4.59-4.58L16 11l-6 6z"/>
                                </svg>
                            </div>
                            <span class="creatio-widget-title">Account Health</span>
                        </div>
                        <div class="creatio-widget-content">
                            <div class="creatio-widget-metrics">
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Health score</span>
                                    <span class="creatio-metric-value">
                                        <span class="creatio-metric-icon success">✓</span> 85%
                                    </span>
                                </div>
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Risk level</span>
                                    <span class="creatio-metric-value">Low</span>
                                </div>
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Engagement</span>
                                    <span class="creatio-metric-value">
                                        <span class="creatio-metric-icon success">✓</span> High
                                    </span>
                                </div>
                            </div>
                            <div class="creatio-widget-chart">
                                <span class="creatio-chart-title">Health score trend (last 6 months)</span>
                                <div class="creatio-chart-container">
                                    <svg class="creatio-chart-svg" viewBox="0 0 300 100" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="accountHealthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" style="stop-color:#2196F3;stop-opacity:0.2"/>
                                                <stop offset="100%" style="stop-color:#2196F3;stop-opacity:0"/>
                                            </linearGradient>
                                        </defs>
                                        <path class="creatio-chart-area primary" d="M0,40 L50,35 L100,38 L150,30 L200,25 L250,22 L300,18 L300,100 L0,100 Z" fill="url(#accountHealthGradient)"/>
                                        <path class="creatio-chart-line primary" d="M0,40 L50,35 L100,38 L150,30 L200,25 L250,22 L300,18"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Contacts Section
            const sContactsHTML = `
                <div class="creatio-contact-roles">
                    <div class="creatio-contact-roles-header">
                        <span class="creatio-contact-roles-title">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#757575">
                                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                            </svg>
                            Key contacts (3)
                        </span>
                        <div class="creatio-contact-roles-actions">
                            <button class="creatio-contact-roles-btn" title="Add">+</button>
                            <button class="creatio-contact-roles-btn" title="Settings">⚙</button>
                        </div>
                    </div>
                    <table class="creatio-contact-roles-table">
                        <thead>
                            <tr>
                                <th>Contact</th>
                                <th>Role</th>
                                <th>Primary</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="link">Account Owner</td>
                                <td>Business Owner</td>
                                <td>✓</td>
                            </tr>
                            <tr>
                                <td class="link">Operations Manager</td>
                                <td>Operations</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td class="link">Finance Contact</td>
                                <td>Finance</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;

            oDashContainer.innerHTML = sQuickInfoHTML + sRevenueHTML + sContactsHTML;

            const oObjectPage = document.querySelector(".sapUxAPObjectPageLayout");
            if (oObjectPage) {
                const oWrapper = oObjectPage.querySelector(".sapUxAPObjectPageWrapper");
                if (oWrapper) {
                    const oScrollContainer = oWrapper.querySelector(".sapUxAPObjectPageWrapperTransition") || oWrapper;
                    const oFirstSection = oScrollContainer.querySelector(".sapUxAPObjectPageSection");
                    if (oFirstSection) {
                        oFirstSection.parentNode.insertBefore(oDashContainer, oFirstSection);
                        console.log("[AccountsObjectPageExt] Dashboard widgets rendered");
                        return;
                    }
                }
            }
            
            document.body.appendChild(oDashContainer);
            oDashContainer.style.cssText = "position:fixed;top:200px;left:0;right:380px;z-index:100;";
        },

        /**
         * Render Enhanced AI Assistant Panel using unified factory
         * @private
         */
        _renderEnhancedAIPanel: function () {
            const that = this;
            
            // Get current account data for context
            const oEntityData = this._oEntityData || {};
            
            // Create AI panel using factory
            this._oAIPanelFactory = AIAssistantPanelFactory.create({
                entityType: "accounts",
                entityData: oEntityData,
                callbacks: {
                    onQuickCall: function() { that._onQuickCall(); },
                    onQuickEmail: function() { that._onQuickEmail(); },
                    onQuickMeeting: function() { that._onQuickSchedule(); },
                    onQuickOrder: function() { MessageToast.show("Opening order creation..."); },
                    onActionPress: function(sActionId) { that._onActionButtonPress(sActionId); },
                    onRefresh: function() { that._refreshAIInsights(); },
                    onChatMessage: function(sMessage) { that._onAIChatMessage(sMessage); }
                }
            });
            
            this._oAIPanel = this._oAIPanelFactory.getPanel();
            console.log("[AccountsObjectPageExt] Enhanced AI Panel rendered via factory");
        },

        /**
         * Handle AI chat message
         * @private
         */
        _onAIChatMessage: function (sMessage) {
            console.log("[AccountsObjectPageExt] AI Chat message:", sMessage);
            MessageToast.show("AI: Processing your request...");
            // TODO: Integrate with AI service
        },

        /**
         * Find or create a container in the Object Page
         * @private
         */
        _findOrCreateContainer: function (sId, sClass) {
            const oView = this.base.getView();
            
            let oContainer = oView.byId(sId);
            
            if (!oContainer) {
                oContainer = new VBox({
                    id: oView.createId(sId),
                    width: "100%"
                });
                oContainer.addStyleClass(sClass);
                
                const oObjectPage = oView.byId("fe::ObjectPage");
                if (oObjectPage) {
                    const oDomRef = oObjectPage.getDomRef();
                    if (oDomRef) {
                        const oHeaderContent = oDomRef.querySelector(".sapUxAPObjectPageHeaderContent");
                        if (oHeaderContent) {
                            oContainer.placeAt(oHeaderContent, "first");
                            return oContainer;
                        }
                        
                        const oHeaderTitle = oDomRef.querySelector(".sapUxAPObjectPageHeaderTitle");
                        if (oHeaderTitle) {
                            oContainer.placeAt(oHeaderTitle, "after");
                            return oContainer;
                        }

                        const oWrapper = oDomRef.querySelector(".sapUxAPObjectPageWrapper");
                        if (oWrapper) {
                            oContainer.placeAt(oWrapper, "first");
                            return oContainer;
                        }
                    }
                }
            }
            
            return oContainer;
        },

        /**
         * Update all components from entity data
         * @private
         */
        _updateFromEntity: function (oData) {
            if (!oData) return;
            
            this._oEntityData = oData;
            console.log("[AccountsObjectPageExt] Updating from entity data:", oData.accountName);
            
            // Map accountStatus to lifecycle stage
            const sLifecycleStage = this._mapStatusToLifecycle(oData.accountStatus);
            this._updateLifecycleState(sLifecycleStage);
            
            this._updateProfileModel(oData);
            this._updateKPIModel(oData);
        },

        /**
         * Map account status to lifecycle stage
         * @private
         */
        _mapStatusToLifecycle: function (sStatus) {
            const mMapping = {
                "Onboarding": "Onboarding",
                "Active": "Active",
                "At Risk": "At Risk",
                "At-Risk": "At Risk",
                "AtRisk": "At Risk",
                "Churned": "Churned",
                "Inactive": "Inactive"
            };
            return mMapping[sStatus] || "Active";
        },

        /**
         * Update profile model from entity data
         * @private
         */
        _updateProfileModel: function (oData) {
            const sName = oData.accountName || "Unknown Account";
            const sInitials = this._getInitials(sName);
            const sColor = this._getAvatarColor(sName);
            
            this._oProfileModel.setData({
                name: sName,
                subtitle: oData.accountType || "",
                initials: sInitials,
                avatarColor: sColor,
                avatarUrl: "",
                badgeText: oData.healthScore ? oData.healthScore + "% Health" : "",
                badgeState: this._getScoreState(oData.healthScore),
                badgeIcon: this._getScoreIcon(oData.healthScore),
                accountType: oData.accountType || "",
                industry: oData.industry || "",
                owner: oData.accountOwner?.fullName || "",
                createdAt: this._formatDate(oData.createdAt),
                phone: oData.primaryContact?.phone || "",
                email: oData.primaryContact?.email || "",
                showCall: true,
                showMessage: true,
                showEmail: true,
                showSchedule: true
            });

            this._updateProfileSidebar(oData, sName, sInitials, sColor);
        },

        /**
         * Update profile sidebar content
         * @private
         */
        _updateProfileSidebar: function (oData, sName, sInitials, sColor) {
            if (this._oProfileAvatar) {
                this._oProfileAvatar.setInitials(sInitials);
                this._oProfileAvatar.setBackgroundColor(sColor);
            }
            if (this._oProfileName) {
                this._oProfileName.setText(sName);
            }
            if (this._oProfileSubtitle) {
                const sSubtitle = oData.accountTier ? oData.accountTier + " Tier" : oData.accountType || "";
                this._oProfileSubtitle.setText(sSubtitle);
            }
            if (this._oTypeField && this._oTypeField._valueText) {
                this._oTypeField._valueText.setText(oData.accountType || "-");
            }
            if (this._oIndustryField && this._oIndustryField._valueText) {
                this._oIndustryField._valueText.setText(oData.industry || "-");
            }
            if (this._oTierField && this._oTierField._valueText) {
                this._oTierField._valueText.setText(oData.accountTier || "-");
            }
        },

        /**
         * Update KPI model from entity data
         * @private
         */
        _updateKPIModel: function (oData) {
            const fRevenue = oData.annualRevenue || oData.forecastedRevenueContribution || 0;
            const iHealthScore = oData.healthScore || 0;
            const fLifetimeValue = oData.lifetimeValue || fRevenue * 3;
            
            // Count open opportunities
            const aOpps = oData.opportunities || [];
            const iOpenOpps = aOpps.filter(o => o.stage && !o.stage.startsWith("Closed")).length;
            
            this._oKPIModel.setProperty("/kpis/0/value", this._formatCurrency(fRevenue));
            this._oKPIModel.setProperty("/kpis/0/numericValue", fRevenue);
            
            this._oKPIModel.setProperty("/kpis/1/value", iOpenOpps.toString());
            this._oKPIModel.setProperty("/kpis/1/numericValue", iOpenOpps);
            
            this._oKPIModel.setProperty("/kpis/2/value", iHealthScore + "%");
            this._oKPIModel.setProperty("/kpis/2/numericValue", iHealthScore);
            
            this._oKPIModel.setProperty("/kpis/3/value", this._formatCurrency(fLifetimeValue));
            this._oKPIModel.setProperty("/kpis/3/numericValue", fLifetimeValue);
            
            this._oKPIModel.setProperty("/healthScore", iHealthScore);
            this._oKPIModel.setProperty("/riskLevel", oData.riskLevel || "Low");
        },

        // ============================================
        // Action Handlers
        // ============================================

        /**
         * Handle lifecycle stage click
         * @private
         */
        _onLifecycleStageClick: function (oStage, iTargetIndex) {
            const that = this;
            const sCurrentStatus = this._mapStatusToLifecycle(this._oEntityData?.accountStatus || "Active");
            const aStageKeys = ["Onboarding", "Active", "At Risk", "Churned", "Inactive"];
            const iCurrentIndex = aStageKeys.indexOf(sCurrentStatus);

            if (iTargetIndex === iCurrentIndex) return;

            // Allow moving to At-Risk from Active, or to any stage for admin purposes
            MessageBox.confirm(
                "Update account lifecycle to '" + oStage.label + "'?",
                {
                    title: "Confirm Status Change",
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    emphasizedAction: MessageBox.Action.YES,
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.YES) {
                            that._executeLifecycleChange(oStage.key);
                        }
                    }
                }
            );
        },

        /**
         * Execute lifecycle change via backend
         * @private
         */
        _executeLifecycleChange: function (sNewStatus) {
            const oView = this.base.getView();
            const oContext = oView && oView.getBindingContext();
            
            if (!oContext) {
                MessageBox.error("No account context available");
                return;
            }
            
            const sAccountID = oContext.getProperty("ID");
            BusyIndicator.show(0);
            
            fetch("/account/Accounts(" + sAccountID + ")/AccountService.updateStatus", {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ newStatus: sNewStatus })
            })
            .then((response) => {
                BusyIndicator.hide();
                if (response.ok) {
                    MessageToast.show("Account status updated to: " + sNewStatus);
                    oContext.refresh();
                } else {
                    throw new Error("Failed to update status");
                }
            })
            .catch((error) => {
                BusyIndicator.hide();
                MessageBox.error("Failed to update status: " + error.message);
            });
        },

        /**
         * Handle action button press from AI panel
         * @private
         */
        _onActionButtonPress: function (sActionId) {
            switch (sActionId) {
                case "review":
                    this._onQuickSchedule();
                    break;
                case "opportunity":
                    MessageToast.show("Opening new opportunity creation...");
                    break;
                case "email":
                    this._onQuickEmail();
                    break;
                case "call":
                    this._onQuickCall();
                    break;
            }
        },

        /**
         * Quick action: Call
         * @private
         */
        _onQuickCall: function () {
            const sPhone = this._oProfileModel.getProperty("/phone");
            if (sPhone) {
                window.location.href = "tel:" + sPhone;
            } else {
                MessageToast.show("No phone number available");
            }
        },

        /**
         * Quick action: Email
         * @private
         */
        _onQuickEmail: function () {
            const sEmail = this._oProfileModel.getProperty("/email");
            if (sEmail) {
                window.location.href = "mailto:" + sEmail;
            } else {
                MessageToast.show("No email address available");
            }
        },

        /**
         * Quick action: WhatsApp
         * @private
         */
        _onQuickWhatsApp: function () {
            const sPhone = this._oProfileModel.getProperty("/phone");
            if (sPhone) {
                const sCleanPhone = sPhone.replace(/\D/g, "");
                window.open("https://wa.me/" + sCleanPhone, "_blank");
            } else {
                MessageToast.show("No phone number available");
            }
        },

        /**
         * Quick action: Schedule meeting
         * @private
         */
        _onQuickSchedule: function () {
            MessageToast.show("Opening meeting scheduler...");
        },

        /**
         * Toggle AI panel visibility
         * @private
         */
        _onToggleAIPanel: function () {
            if (this._oAIPanel) {
                const oDomRef = this._oAIPanel.getDomRef();
                if (oDomRef) {
                    oDomRef.classList.toggle("collapsed");
                }
            }
        },

        /**
         * Refresh AI insights
         * @private
         */
        _refreshAIInsights: function () {
            MessageToast.show("Refreshing AI insights...");
        },

        // ============================================
        // Helper/Formatter Functions
        // ============================================

        /**
         * Get initials from name
         * @private
         */
        _getInitials: function (sName) {
            if (!sName) return "?";
            const aParts = sName.trim().split(/\s+/);
            if (aParts.length === 1) {
                return aParts[0].substring(0, 2).toUpperCase();
            }
            return (aParts[0][0] + aParts[aParts.length - 1][0]).toUpperCase();
        },

        /**
         * Get avatar color based on name
         * @private
         */
        _getAvatarColor: function (sName) {
            if (!sName) return "Accent1";
            const aColors = ["Accent1", "Accent2", "Accent3", "Accent4", "Accent5", "Accent6", "Accent7", "Accent8", "Accent9", "Accent10"];
            let iHash = 0;
            for (let i = 0; i < sName.length; i++) {
                iHash = sName.charCodeAt(i) + ((iHash << 5) - iHash);
            }
            return aColors[Math.abs(iHash) % aColors.length];
        },

        /**
         * Get score state
         * @private
         */
        _getScoreState: function (iScore) {
            if (iScore === null || iScore === undefined) return "None";
            if (iScore >= 70) return "Success";
            if (iScore >= 40) return "Warning";
            return "Error";
        },

        /**
         * Get score icon
         * @private
         */
        _getScoreIcon: function (iScore) {
            if (iScore >= 70) return "sap-icon://status-positive";
            if (iScore >= 40) return "sap-icon://status-critical";
            return "sap-icon://status-negative";
        },

        /**
         * Format date
         * @private
         */
        _formatDate: function (oDate) {
            if (!oDate) return "";
            const oDateObj = oDate instanceof Date ? oDate : new Date(oDate);
            return oDateObj.toLocaleDateString("en-MY", {
                year: "numeric",
                month: "short",
                day: "numeric"
            });
        },

        /**
         * Format currency
         * @private
         */
        _formatCurrency: function (fValue) {
            if (!fValue) return "RM 0";
            return "RM " + parseFloat(fValue).toLocaleString("en-MY", { minimumFractionDigits: 0 });
        },

        /**
         * Cleanup on controller destroy
         */
        onExit: function () {
            if (this._oProfileModel) {
                this._oProfileModel.destroy();
            }
            if (this._oKPIModel) {
                this._oKPIModel.destroy();
            }
            if (this._oAIPanelModel) {
                this._oAIPanelModel.destroy();
            }
            if (this._oTagsModel) {
                this._oTagsModel.destroy();
            }
            if (this._oAIPanelFactory) {
                this._oAIPanelFactory.destroy();
            }
            if (this._oProfileSidebar) {
                this._oProfileSidebar.destroy();
            }
            
            // Remove DOM elements
            const oTagContainer = document.getElementById("creatioTagChipsContainer");
            if (oTagContainer) {
                oTagContainer.remove();
            }
            const oSidebarContainer = document.getElementById("creatioProfileSidebar");
            if (oSidebarContainer) {
                oSidebarContainer.remove();
            }
            const oDashContainer = document.getElementById("creatioDashboardContainer");
            if (oDashContainer) {
                oDashContainer.remove();
            }
            
            document.body.classList.remove("creatio-with-profile-sidebar");
        },

        // ============================================
        // EXISTING FUNCTIONALITY (preserved from original)
        // ============================================

        _interceptActionResponses: function() {
            const that = this;
            const oView = this.base.getView();
            
            setTimeout(() => {
                const oModel = oView.getModel();
                if (!oModel) {
                    setTimeout(() => that._interceptActionResponses(), 500);
                    return;
                }
                
                oModel.attachRequestCompleted((oEvent) => {
                    const sUrl = oEvent.getParameter("url");
                    
                    if (sUrl && sUrl.indexOf("getAIRecommendations") > -1) {
                        MessageBox.success(
                            "AI Recommendations have been generated successfully!\n\n" +
                            "Please scroll down to the 'AI Recommendations' section to view them, or refresh the page (F5) to see all updates.",
                            {
                                title: "Success",
                                onClose: function() {
                                    window.location.reload();
                                }
                            }
                        );
                    }
                });
            }, 1000);
        },
        
        _checkOnboardingParameter: function () {
            const oRouter = this.base.getView().getController().getOwnerComponent().getRouter();
            const oRoute = oRouter.getRoute("AccountsObjectPage");
            
            oRoute.attachPatternMatched(function(oEvent) {
                const oQuery = oEvent.getParameter("arguments")["?query"];
                
                if (oQuery && oQuery.onboarding === "true") {
                    setTimeout(() => {
                        MessageBox.information(
                            "Welcome to your new account! The lead has been successfully converted. " +
                            "You can now:\n" +
                            "• Create opportunities\n" +
                            "• Schedule activities\n" +
                            "• Manage contacts\n" +
                            "• Track account health",
                            {
                                title: "Account Created Successfully",
                                styleClass: "sapUiSizeCompact"
                            }
                        );
                    }, 500);
                }
            }, this);
        },

        _loadRelatedData: function () {
            const oView = this.base.getView();
            const oBindingContext = oView.getBindingContext();
            
            if (!oBindingContext) {
                return;
            }

            const sAccountID = oBindingContext.getProperty("ID");
            if (!sAccountID) return;
            
            this._loadOpportunities(sAccountID);
            this._loadCampaigns(sAccountID);
            this._loadActivities(sAccountID);
            this._loadRecommendations(sAccountID);
            this._loadRiskAlerts(sAccountID);
        },

        _loadOpportunities: function (sAccountID) {
            const oModel = this.base.getView().getModel();
            if (!oModel || !oModel.read) return;
            
            oModel.read("/Opportunities", {
                filters: [new sap.ui.model.Filter("account_ID", "EQ", sAccountID)],
                success: (oData) => {},
                error: (oError) => { console.error("Error loading opportunities:", oError); }
            });
        },

        _loadCampaigns: function (sAccountID) {
            const oModel = this.base.getView().getModel();
            const oBindingContext = this.base.getView().getBindingContext();
            if (!oModel || !oModel.read || !oBindingContext) return;
            
            const sOwnerID = oBindingContext.getProperty("accountOwner_ID");
            if (sOwnerID) {
                oModel.read("/MarketingCampaigns", {
                    filters: [new sap.ui.model.Filter("owner_ID", "EQ", sOwnerID)],
                    success: (oData) => {},
                    error: (oError) => { console.error("Error loading campaigns:", oError); }
                });
            }
        },

        _loadActivities: function (sAccountID) {
            const oModel = this.base.getView().getModel();
            if (!oModel || !oModel.read) return;
            
            oModel.read("/Activities", {
                filters: [new sap.ui.model.Filter("relatedAccount_ID", "EQ", sAccountID)],
                success: (oData) => {},
                error: (oError) => { console.error("Error loading activities:", oError); }
            });
        },

        _loadRecommendations: function (sAccountID) {
            const oModel = this.base.getView().getModel();
            if (!oModel || !oModel.read) return;
            
            oModel.read("/AccountRecommendations", {
                filters: [
                    new sap.ui.model.Filter("account_ID", "EQ", sAccountID),
                    new sap.ui.model.Filter("status", "NE", "Dismissed")
                ],
                success: (oData) => {},
                error: (oError) => { console.error("Error loading recommendations:", oError); }
            });
        },

        _loadRiskAlerts: function (sAccountID) {
            const oModel = this.base.getView().getModel();
            if (!oModel || !oModel.read) return;
            
            oModel.read("/AccountRiskAlerts", {
                filters: [
                    new sap.ui.model.Filter("account_ID", "EQ", sAccountID),
                    new sap.ui.model.Filter("isResolved", "EQ", false)
                ],
                success: (oData) => {},
                error: (oError) => { console.error("Error loading risk alerts:", oError); }
            });
        },

        // Existing formatters preserved
        formatStatusState: function (sStatus) {
            const mStates = { "Active": "Success", "Prospect": "Warning", "Inactive": "Error" };
            return mStates[sStatus] || "None";
        },

        formatTierState: function (sTier) {
            const mStates = { "Platinum": "Success", "Gold": "Success", "Silver": "Warning", "Bronze": "None" };
            return mStates[sTier] || "None";
        },

        formatHealthState: function (iScore) {
            if (iScore >= 80) return "Success";
            if (iScore >= 50) return "Warning";
            return "Error";
        },

        formatSentimentIcon: function (sTrend) {
            const mIcons = { "Improving": "sap-icon://trend-up", "Stable": "sap-icon://trend-neutral", "Declining": "sap-icon://trend-down" };
            return mIcons[sTrend] || "sap-icon://trend-neutral";
        },

        formatSentimentColor: function (sTrend) {
            const mColors = { "Improving": "#2b7c2b", "Stable": "#666666", "Declining": "#bb0000" };
            return mColors[sTrend] || "#666666";
        },

        formatCurrency: function (fValue) {
            if (!fValue) return "RM 0.00";
            return "RM " + fValue.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
        }
    });
});
