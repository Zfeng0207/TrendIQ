/**
 * Opportunities Object Page Extension - Creatio-style Layout
 * Integrates ChevronStageBar, KPI Cards, Enhanced AI Assistant Panel, and Entity Profile
 * 
 * Enhanced Features:
 * - AI Sidebar with Win Probability Breakdown, Next Best Actions, Competitors, Deal History
 * - Activity Timeline with mock data
 * - Quick Action Buttons (Call, Email, Meeting)
 * - Visual Score Indicators with progress rings
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
    "sap/ui/core/HTML"
], function (
    ControllerExtension, Fragment, JSONModel, MessageBox, MessageToast,
    VBox, HBox, FlexBox, Text, Title, Label, Button, ObjectNumber, ObjectStatus, 
    Panel, TextArea, ScrollContainer, List, StandardListItem, CustomListItem,
    ProgressIndicator, Link, CheckBox, Avatar, Card, Icon, BusyIndicator, HTML
) {
    "use strict";

    // Mock data for competitors
    const MOCK_COMPETITORS = [
        { id: "1", name: "CompetitorA Beauty", strength: "Price", threat: 75, status: "Active" },
        { id: "2", name: "LocalBeauty Co", strength: "Local presence", threat: 60, status: "Active" },
        { id: "3", name: "BeautyDirect", strength: "Online reach", threat: 45, status: "Monitoring" }
    ];

    // Mock data for deal activities
    const MOCK_ACTIVITIES = [
        { id: "1", type: "proposal", description: "Final proposal submitted", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), icon: "sap-icon://document" },
        { id: "2", type: "meeting", description: "Stakeholder presentation", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), icon: "sap-icon://appointment" },
        { id: "3", type: "call", description: "Pricing negotiation call", date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), icon: "sap-icon://call" }
    ];

    // Mock activity timeline
    const MOCK_TIMELINE = [
        { id: "1", type: "meeting", title: "Contract review meeting", description: "Final contract terms discussion", date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), status: "upcoming", icon: "sap-icon://appointment" },
        { id: "2", type: "proposal", title: "Revised proposal sent", description: "Updated pricing and terms", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), status: "completed", icon: "sap-icon://document" },
        { id: "3", type: "call", title: "Negotiation call", description: "Discussed volume discounts", date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), status: "completed", icon: "sap-icon://call" },
        { id: "4", type: "note", title: "Opportunity created", description: "Converted from qualified prospect", date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), status: "completed", icon: "sap-icon://add" }
    ];

    // Next best actions configuration
    const NEXT_BEST_ACTIONS = [
        { id: "meeting", label: "Schedule Closing Meeting", icon: "sap-icon://appointment", priority: "High", dueText: "This week", type: "Emphasized" },
        { id: "proposal", label: "Send Final Proposal", icon: "sap-icon://document", priority: "High", dueText: "Today", type: "Emphasized" },
        { id: "call", label: "Follow-up Call", icon: "sap-icon://call", priority: "Medium", dueText: "Tomorrow", type: "Default" },
        { id: "email", label: "Send Contract", icon: "sap-icon://email", priority: "Medium", dueText: "This week", type: "Default" }
    ];

    // Mock tags for opportunity categorization
    const MOCK_TAGS = [
        { id: "high_value", text: "High Value", colorClass: "tag-hot", removable: true },
        { id: "q4_close", text: "Q4 Close", colorClass: "tag-webinar", removable: true },
        { id: "key_account", text: "Key Account", colorClass: "tag-ai", removable: true }
    ];

    return ControllerExtension.extend("beautyleads.opportunities.ext.controller.OpportunitiesCreatioExt", {
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
            console.log("[OpportunitiesCreatioExt] Initializing Creatio-style extensions (Enhanced)");
            
            // Initialize models
            this._initializeModels();
            
            // Wait for view to be ready, then initialize components
            const oView = this.base.getView();
            if (oView) {
                oView.attachAfterRendering(this._onViewAfterRendering.bind(this));
            }
            
            // Load CSS
            this._loadCreatioCSS();
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
                account: "",
                contact: "",
                owner: "",
                createdAt: "",
                closeDate: "",
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
                    { id: "daysInPipeline", title: "Days in pipeline", value: "0", numericValue: 0, color: "blue" },
                    { id: "winProbability", title: "Win probability", value: "0%", numericValue: 0, color: "green" },
                    { id: "expectedClose", title: "Expected close", value: "-", numericValue: 0, color: "purple" },
                    { id: "dealValue", title: "Deal value", value: "RM 0", numericValue: 0, color: "orange" }
                ],
                winScore: 0,
                competitorThreat: 0
            });

            // AI Panel model
            this._oAIPanelModel = new JSONModel({
                expanded: true,
                messages: [],
                inputText: "",
                isLoading: false,
                showSuggestions: false,
                competitors: MOCK_COMPETITORS,
                activities: MOCK_ACTIVITIES,
                timeline: MOCK_TIMELINE,
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
                console.log("[OpportunitiesCreatioExt] Loaded creatio-layout.css");
            }
        },

        /**
         * Called after view rendering
         * @private
         */
        _onViewAfterRendering: function () {
            console.log("[OpportunitiesCreatioExt] View rendered, initializing components");
            
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
                    console.error("[OpportunitiesCreatioExt] Error loading entity data:", err);
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
                console.warn("[OpportunitiesCreatioExt] View not available");
                return;
            }

            // Render components
            this._renderTagChips();
            this._renderChevronStageBar();
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

            console.log("[OpportunitiesCreatioExt] Tag chips rendered");
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
                initials: "OP",
                displaySize: "L",
                backgroundColor: "Accent7"
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

            const oAccountField = this._createProfileField("Account", "Loading...", "sap-icon://building");
            oInfoSection.addItem(oAccountField);

            const oContactField = this._createProfileField("Primary Contact", "Loading...", "sap-icon://person-placeholder");
            oInfoSection.addItem(oContactField);

            const oCloseDateField = this._createProfileField("Expected Close", "Loading...", "sap-icon://calendar");
            oInfoSection.addItem(oCloseDateField);

            oSidebar.addItem(oInfoSection);

            // Next Steps Section
            const oNextStepsSection = new VBox();
            oNextStepsSection.addStyleClass("creatio-next-steps-section");
            
            const oNextStepsTitle = new Text({ text: "Next steps" });
            oNextStepsTitle.addStyleClass("creatio-section-title");
            oNextStepsSection.addItem(oNextStepsTitle);
            
            const aNextSteps = [
                { text: "Schedule closing meeting", icon: "sap-icon://appointment", date: "This week" },
                { text: "Send final contract", icon: "sap-icon://document", date: "Tomorrow" },
                { text: "Confirm pricing terms", icon: "sap-icon://currency", date: "Today" }
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
            this._oAccountField = oAccountField;
            this._oContactField = oContactField;
            this._oCloseDateField = oCloseDateField;

            document.body.classList.add("creatio-with-profile-sidebar");

            console.log("[OpportunitiesCreatioExt] Profile sidebar rendered");
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
         * Render Chevron Stage Bar
         * @private
         */
        _renderChevronStageBar: function () {
            const oView = this.base.getView();
            
            let oContainer = this._findOrCreateContainer("oppsChevronContainer", "creatio-header-stage-section");
            
            if (oContainer) {
                const oWrapper = new VBox({
                    class: "creatio-chevron-container sapUiSmallMarginBottom"
                });
                
                const oChevronBar = this._buildChevronBar();
                oWrapper.addItem(oChevronBar);
                
                oContainer.addItem(oWrapper);
                console.log("[OpportunitiesCreatioExt] Chevron Stage Bar rendered");
            }
        },

        /**
         * Build the chevron stage bar
         * @private
         */
        _buildChevronBar: function () {
            const that = this;
            const aStages = [
                { key: "Qualification", label: "QUALIFICATION", icon: "sap-icon://checklist-item" },
                { key: "Discovery", label: "DISCOVERY", icon: "sap-icon://search" },
                { key: "Proposal", label: "PROPOSAL", icon: "sap-icon://document" },
                { key: "Negotiation", label: "NEGOTIATION", icon: "sap-icon://sales-quote" },
                { key: "Closed Won", label: "CLOSED WON", icon: "sap-icon://complete" },
                { key: "Closed Lost", label: "CLOSED LOST", icon: "sap-icon://decline", isNegative: true }
            ];

            const oBar = new HBox({
                justifyContent: "Start",
                alignItems: "Stretch",
                width: "100%"
            });
            oBar.addStyleClass("creatio-chevron-bar");

            aStages.forEach((oStage, iIndex) => {
                const oChevron = new HBox({
                    alignItems: "Center",
                    justifyContent: "Center"
                });
                oChevron.addStyleClass("creatio-chevron-stage");
                oChevron.addStyleClass("creatio-stage-future");
                oChevron.data("stageKey", oStage.key);
                oChevron.data("stageIndex", iIndex);

                const oStageIcon = new Icon({
                    src: oStage.icon,
                    size: "1rem"
                });
                oStageIcon.addStyleClass("creatio-stage-icon");
                
                const oLabel = new Text({ text: oStage.label });
                oLabel.addStyleClass("creatio-stage-label");
                
                oChevron.addItem(oStageIcon);
                oChevron.addItem(oLabel);

                oChevron.attachBrowserEvent("click", function() {
                    that._onStageClick(oStage, iIndex);
                });

                oBar.addItem(oChevron);
            });

            return oBar;
        },

        /**
         * Update chevron bar state based on current stage
         * @private
         */
        _updateChevronState: function (sCurrentStage) {
            const oView = this.base.getView();
            if (!oView) return;

            const aStageKeys = ["Qualification", "Discovery", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
            const iCurrentIndex = aStageKeys.indexOf(sCurrentStage);

            const oContainer = oView.byId("oppsChevronContainer");
            if (!oContainer) return;

            const oChevronBar = oContainer.getItems()[0]?.getItems()[0];
            if (!oChevronBar) return;

            oChevronBar.getItems().forEach((oChevron, iIndex) => {
                oChevron.removeStyleClass("creatio-stage-completed");
                oChevron.removeStyleClass("creatio-stage-current");
                oChevron.removeStyleClass("creatio-stage-future");
                oChevron.removeStyleClass("creatio-stage-negative");

                if (iIndex < iCurrentIndex) {
                    oChevron.addStyleClass("creatio-stage-completed");
                } else if (iIndex === iCurrentIndex) {
                    oChevron.addStyleClass("creatio-stage-current");
                    if (sCurrentStage === "Closed Lost") {
                        oChevron.addStyleClass("creatio-stage-negative");
                    }
                } else {
                    oChevron.addStyleClass("creatio-stage-future");
                }
            });
        },

        /**
         * Render KPI Cards Row
         * @private
         */
        _renderKPICards: function () {
            const oContainer = this._findOrCreateContainer("oppsKPIContainer", "creatio-header-kpi-section");
            
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
                console.log("[OpportunitiesCreatioExt] KPI Cards rendered");
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
                        <span class="creatio-quick-info-label">Product interest</span>
                        <span class="creatio-quick-info-value">K-Beauty Skincare Line</span>
                    </div>
                    <div class="creatio-quick-info-item">
                        <span class="creatio-quick-info-label">Account</span>
                        <span class="creatio-quick-info-value link">GlowUp Cosmetics</span>
                    </div>
                    <div class="creatio-quick-info-item">
                        <span class="creatio-quick-info-label">Contact</span>
                        <span class="creatio-quick-info-value link">Sarah Chen</span>
                    </div>
                    <div class="creatio-quick-info-item">
                        <span class="creatio-quick-info-label">Created on</span>
                        <span class="creatio-quick-info-value">Nov 9, 2025</span>
                    </div>
                </div>
            `;

            // Pipeline Widget with Win Probability
            const sPipelineHTML = `
                <div class="creatio-dashboard-row">
                    <div class="creatio-widget-card">
                        <div class="creatio-widget-header">
                            <div class="creatio-widget-icon" style="color: #4CAF50;">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                                </svg>
                            </div>
                            <span class="creatio-widget-title">Win Probability Analysis</span>
                        </div>
                        <div class="creatio-widget-content">
                            <div class="creatio-widget-metrics">
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">AI Win Score</span>
                                    <span class="creatio-metric-value">
                                        <span class="creatio-metric-icon success">✓</span> 78%
                                    </span>
                                </div>
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Deal momentum</span>
                                    <span class="creatio-metric-value">Strong</span>
                                </div>
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Competitor threat</span>
                                    <span class="creatio-metric-value">
                                        <span class="creatio-metric-icon warning">!</span> Medium
                                    </span>
                                </div>
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Stakeholder buy-in</span>
                                    <span class="creatio-metric-value">85%</span>
                                </div>
                            </div>
                            <div class="creatio-widget-chart">
                                <span class="creatio-chart-title">Deal progress (last 30 days)</span>
                                <div class="creatio-chart-container">
                                    <svg class="creatio-chart-svg" viewBox="0 0 300 100" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="oppsPipelineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:0.2"/>
                                                <stop offset="100%" style="stop-color:#4CAF50;stop-opacity:0"/>
                                            </linearGradient>
                                        </defs>
                                        <path class="creatio-chart-area success" d="M0,80 L30,70 L60,65 L90,50 L120,45 L150,35 L180,30 L210,25 L240,20 L270,15 L300,10 L300,100 L0,100 Z" fill="url(#oppsPipelineGradient)"/>
                                        <path class="creatio-chart-line success" d="M0,80 L30,70 L60,65 L90,50 L120,45 L150,35 L180,30 L210,25 L240,20 L270,15 L300,10"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="creatio-widget-card">
                        <div class="creatio-widget-header">
                            <div class="creatio-widget-icon" style="color: #FF9800;">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                            <span class="creatio-widget-title">Deal Activity</span>
                        </div>
                        <div class="creatio-widget-content">
                            <div class="creatio-widget-metrics">
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Meetings held</span>
                                    <span class="creatio-metric-value">5</span>
                                </div>
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Proposals sent</span>
                                    <span class="creatio-metric-value">
                                        <span class="creatio-metric-icon success">✓</span> 3
                                    </span>
                                </div>
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Last activity</span>
                                    <span class="creatio-metric-value">Yesterday</span>
                                </div>
                            </div>
                            <div class="creatio-widget-chart">
                                <span class="creatio-chart-title">Engagement trend (last 21 days)</span>
                                <div class="creatio-chart-container">
                                    <svg class="creatio-chart-svg" viewBox="0 0 300 100" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="oppsActivityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" style="stop-color:#FF9800;stop-opacity:0.2"/>
                                                <stop offset="100%" style="stop-color:#FF9800;stop-opacity:0"/>
                                            </linearGradient>
                                        </defs>
                                        <path class="creatio-chart-area warning" d="M0,60 L40,50 L80,55 L120,35 L160,40 L200,30 L240,35 L300,25 L300,100 L0,100 Z" fill="url(#oppsActivityGradient)"/>
                                        <path class="creatio-chart-line warning" d="M0,60 L40,50 L80,55 L120,35 L160,40 L200,30 L240,35 L300,25"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Stakeholders Section
            const sStakeholdersHTML = `
                <div class="creatio-contact-roles">
                    <div class="creatio-contact-roles-header">
                        <span class="creatio-contact-roles-title">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#757575">
                                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                            </svg>
                            Stakeholders (3)
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
                                <th>Influence</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="link">Sarah Chen</td>
                                <td>Decision maker</td>
                                <td>High</td>
                            </tr>
                            <tr>
                                <td class="link">James Wong</td>
                                <td>Budget holder</td>
                                <td>High</td>
                            </tr>
                            <tr>
                                <td class="link">Lisa Tan</td>
                                <td>End user</td>
                                <td>Medium</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;

            oDashContainer.innerHTML = sQuickInfoHTML + sPipelineHTML + sStakeholdersHTML;

            const oObjectPage = document.querySelector(".sapUxAPObjectPageLayout");
            if (oObjectPage) {
                const oWrapper = oObjectPage.querySelector(".sapUxAPObjectPageWrapper");
                if (oWrapper) {
                    const oScrollContainer = oWrapper.querySelector(".sapUxAPObjectPageWrapperTransition") || oWrapper;
                    const oFirstSection = oScrollContainer.querySelector(".sapUxAPObjectPageSection");
                    if (oFirstSection) {
                        oFirstSection.parentNode.insertBefore(oDashContainer, oFirstSection);
                        console.log("[OpportunitiesCreatioExt] Dashboard widgets rendered");
                        return;
                    }
                }
            }
            
            document.body.appendChild(oDashContainer);
            oDashContainer.style.cssText = "position:fixed;top:200px;left:0;right:380px;z-index:100;";
        },

        /**
         * Render Enhanced AI Assistant Panel with 5 sections
         * @private
         */
        _renderEnhancedAIPanel: function () {
            const that = this;
            
            const oAIPanel = new Panel({
                expandable: false,
                expanded: true,
                headerText: ""
            });
            oAIPanel.addStyleClass("creatio-ai-panel creatio-ai-panel-enhanced");

            const oHeader = this._createAIPanelHeader();

            const oScrollContainer = new ScrollContainer({
                vertical: true,
                horizontal: false,
                height: "calc(100vh - 120px)"
            });
            oScrollContainer.addStyleClass("creatio-ai-scroll");

            const oContent = new VBox();
            oContent.addStyleClass("creatio-ai-content-enhanced");
            
            // 0. Quick Contact Actions Section
            const oQuickContactSection = this._createQuickContactSection();
            oContent.addItem(oQuickContactSection);
            
            // 1. Win Probability Breakdown Section
            const oScoreSection = this._createWinProbabilityBreakdown();
            oContent.addItem(oScoreSection);
            
            // 2. Next Best Actions Section
            const oActionsSection = this._createNextBestActions();
            oContent.addItem(oActionsSection);
            
            // 3. Competitors Section
            const oCompetitorsSection = this._createCompetitorsSection();
            oContent.addItem(oCompetitorsSection);
            
            // 4. Deal History Section
            const oHistorySection = this._createDealHistory();
            oContent.addItem(oHistorySection);

            oScrollContainer.addContent(oContent);

            oAIPanel.setCustomHeader(oHeader);
            oAIPanel.addContent(oScrollContainer);
            
            oAIPanel.placeAt(document.body);
            this._oAIPanel = oAIPanel;
            
            console.log("[OpportunitiesCreatioExt] Enhanced AI Panel rendered");
        },

        /**
         * Create AI Panel Header
         * @private
         */
        _createAIPanelHeader: function () {
            const that = this;
            
            return new HBox({
                justifyContent: "SpaceBetween",
                alignItems: "Center",
                items: [
                    new HBox({
                        alignItems: "Center",
                        items: [
                            new Icon({ src: "sap-icon://da-2", size: "1.25rem" }).addStyleClass("creatio-ai-logo"),
                            new Title({ text: "AI Assistant", level: "H5" }).addStyleClass("creatio-ai-title")
                        ]
                    }),
                    new HBox({
                        items: [
                            new Button({
                                icon: "sap-icon://refresh",
                                type: "Transparent",
                                tooltip: "Refresh Insights",
                                press: function () {
                                    that._refreshAIInsights();
                                }
                            }),
                            new Button({
                                icon: "sap-icon://slim-arrow-right",
                                type: "Transparent",
                                tooltip: "Toggle Panel",
                                press: function () {
                                    that._onToggleAIPanel();
                                }
                            })
                        ]
                    })
                ]
            }).addStyleClass("creatio-ai-header");
        },

        /**
         * Create Quick Contact Section
         * @private
         */
        _createQuickContactSection: function () {
            const that = this;
            const oSection = new VBox();
            oSection.addStyleClass("creatio-ai-section creatio-quick-contact-section");

            const oHeader = new HBox({
                alignItems: "Center",
                items: [
                    new Icon({ src: "sap-icon://customer", size: "1rem" }).addStyleClass("creatio-section-icon"),
                    new Title({ text: "Quick Actions", level: "H6" }).addStyleClass("creatio-section-title")
                ]
            });
            oSection.addItem(oHeader);

            const oButtonsRow = new HBox({
                justifyContent: "SpaceAround",
                alignItems: "Center"
            });
            oButtonsRow.addStyleClass("creatio-quick-contact-buttons sapUiSmallMarginTop");

            const oCallBtn = new Button({
                icon: "sap-icon://call",
                text: "Call",
                type: "Default",
                press: function () { that._onQuickCall(); }
            });
            oCallBtn.addStyleClass("creatio-contact-btn creatio-contact-call");

            const oEmailBtn = new Button({
                icon: "sap-icon://email",
                text: "Email",
                type: "Default",
                press: function () { that._onQuickEmail(); }
            });
            oEmailBtn.addStyleClass("creatio-contact-btn creatio-contact-email");

            const oMeetingBtn = new Button({
                icon: "sap-icon://appointment",
                text: "Meeting",
                type: "Default",
                press: function () { that._onQuickSchedule(); }
            });
            oMeetingBtn.addStyleClass("creatio-contact-btn creatio-contact-whatsapp");

            const oProposalBtn = new Button({
                icon: "sap-icon://document",
                text: "Proposal",
                type: "Default",
                press: function () { MessageToast.show("Opening proposal editor..."); }
            });
            oProposalBtn.addStyleClass("creatio-contact-btn creatio-contact-schedule");

            oButtonsRow.addItem(oCallBtn);
            oButtonsRow.addItem(oEmailBtn);
            oButtonsRow.addItem(oMeetingBtn);
            oButtonsRow.addItem(oProposalBtn);

            oSection.addItem(oButtonsRow);
            return oSection;
        },

        /**
         * Create Win Probability Breakdown Section
         * @private
         */
        _createWinProbabilityBreakdown: function () {
            const oSection = new VBox();
            oSection.addStyleClass("creatio-ai-section");

            const oHeader = new HBox({
                alignItems: "Center",
                items: [
                    new Icon({ src: "sap-icon://performance", size: "1rem" }).addStyleClass("creatio-section-icon"),
                    new Title({ text: "Win Probability", level: "H6" }).addStyleClass("creatio-section-title")
                ]
            });
            oSection.addItem(oHeader);

            const oScoreCards = new VBox();
            oScoreCards.addStyleClass("creatio-score-cards sapUiSmallMarginTop");

            // AI Win Score
            const oWinScoreCard = this._createScoreCard(
                "AI Win Score",
                "78%",
                78,
                "Strong engagement and stakeholder alignment",
                "Success"
            );
            oScoreCards.addItem(oWinScoreCard);

            // Deal Momentum
            const oMomentumCard = this._createScoreCard(
                "Deal Momentum",
                "85/100",
                85,
                "Consistent progress through sales stages",
                "Success"
            );
            oScoreCards.addItem(oMomentumCard);

            // Competitor Threat
            const oThreatCard = new HBox({
                alignItems: "Center",
                justifyContent: "SpaceBetween"
            });
            oThreatCard.addStyleClass("creatio-sentiment-card sapUiTinyMarginTop");
            
            oThreatCard.addItem(new VBox({
                items: [
                    new Text({ text: "Competitor Threat" }).addStyleClass("creatio-score-label"),
                    new HBox({
                        alignItems: "Center",
                        items: [
                            new Icon({ src: "sap-icon://warning", size: "1.25rem" }).addStyleClass("creatio-sentiment-icon-positive"),
                            new Text({ text: "Medium" }).addStyleClass("creatio-sentiment-value")
                        ]
                    })
                ]
            }));
            oThreatCard.addItem(new Text({ text: "60" }).addStyleClass("creatio-score-number"));
            oScoreCards.addItem(oThreatCard);

            // Overall Rating
            const oRatingBox = new HBox({
                alignItems: "Center",
                justifyContent: "Center"
            });
            oRatingBox.addStyleClass("creatio-overall-rating sapUiSmallMarginTop");
            
            oRatingBox.addItem(new VBox({
                alignItems: "Center",
                items: [
                    new Text({ text: "Deal Outlook" }).addStyleClass("creatio-rating-label"),
                    new ObjectStatus({
                        text: "LIKELY TO WIN",
                        state: "Success",
                        icon: "sap-icon://trend-up"
                    }).addStyleClass("creatio-rating-badge")
                ]
            }));
            oScoreCards.addItem(oRatingBox);

            oSection.addItem(oScoreCards);
            return oSection;
        },

        /**
         * Create a score card with progress ring
         * @private
         */
        _createScoreCard: function (sTitle, sValue, iPercent, sDescription, sState) {
            const oCard = new HBox({
                alignItems: "Start",
                justifyContent: "SpaceBetween"
            });
            oCard.addStyleClass("creatio-score-card");

            const sColor = sState === "Success" ? "#2e7d32" : (sState === "Warning" ? "#f57c00" : "#d32f2f");
            const oRing = new HTML({
                content: this._createScoreRingSVG(iPercent, sColor)
            });

            const oDetails = new VBox({
                items: [
                    new Text({ text: sTitle }).addStyleClass("creatio-score-label"),
                    new Text({ text: sDescription }).addStyleClass("creatio-score-desc")
                ]
            });
            oDetails.addStyleClass("creatio-score-details");

            oCard.addItem(oRing);
            oCard.addItem(oDetails);

            return oCard;
        },

        /**
         * Create SVG score ring
         * @private
         */
        _createScoreRingSVG: function (iPercent, sColor) {
            const iRadius = 24;
            const iStroke = 4;
            const iCircumference = 2 * Math.PI * iRadius;
            const iOffset = iCircumference - (iPercent / 100) * iCircumference;
            
            return `<div class="creatio-score-ring-container">
                <svg width="60" height="60" viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r="${iRadius}" fill="none" stroke="#e0e0e0" stroke-width="${iStroke}"/>
                    <circle cx="30" cy="30" r="${iRadius}" fill="none" stroke="${sColor}" stroke-width="${iStroke}" 
                        stroke-dasharray="${iCircumference}" stroke-dashoffset="${iOffset}" 
                        stroke-linecap="round" transform="rotate(-90 30 30)"/>
                    <text x="30" y="35" text-anchor="middle" class="creatio-ring-text">${iPercent}%</text>
                </svg>
            </div>`;
        },

        /**
         * Create Next Best Actions Section
         * @private
         */
        _createNextBestActions: function () {
            const that = this;
            const oSection = new VBox();
            oSection.addStyleClass("creatio-ai-section");

            const oHeader = new HBox({
                alignItems: "Center",
                items: [
                    new Icon({ src: "sap-icon://action", size: "1rem" }).addStyleClass("creatio-section-icon"),
                    new Title({ text: "Next Best Actions", level: "H6" }).addStyleClass("creatio-section-title")
                ]
            });
            oSection.addItem(oHeader);

            const oActionsList = new VBox();
            oActionsList.addStyleClass("creatio-actions-list sapUiSmallMarginTop");

            NEXT_BEST_ACTIONS.forEach((oAction) => {
                const oActionItem = new HBox({
                    alignItems: "Center",
                    justifyContent: "SpaceBetween"
                });
                oActionItem.addStyleClass("creatio-action-item");

                const oInfo = new HBox({
                    alignItems: "Center",
                    items: [
                        new Icon({ src: oAction.icon, size: "1rem" }).addStyleClass("creatio-action-icon"),
                        new VBox({
                            items: [
                                new Text({ text: oAction.label }).addStyleClass("creatio-action-label"),
                                new Text({ text: oAction.dueText }).addStyleClass("creatio-action-due")
                            ]
                        })
                    ]
                });

                const oPriority = new ObjectStatus({
                    text: oAction.priority,
                    state: oAction.priority === "High" ? "Error" : (oAction.priority === "Medium" ? "Warning" : "None")
                });
                oPriority.addStyleClass("creatio-action-priority");

                const oBtn = new Button({
                    icon: "sap-icon://navigation-right-arrow",
                    type: "Emphasized",
                    tooltip: "Execute " + oAction.label,
                    press: function () {
                        that._onActionButtonPress(oAction.id);
                    }
                });
                oBtn.addStyleClass("creatio-action-btn");

                oActionItem.addItem(oInfo);
                oActionItem.addItem(oPriority);
                oActionItem.addItem(oBtn);
                oActionsList.addItem(oActionItem);
            });

            oSection.addItem(oActionsList);
            return oSection;
        },

        /**
         * Create Competitors Section
         * @private
         */
        _createCompetitorsSection: function () {
            const oSection = new VBox();
            oSection.addStyleClass("creatio-ai-section");

            const oHeader = new HBox({
                alignItems: "Center",
                justifyContent: "SpaceBetween",
                items: [
                    new HBox({
                        alignItems: "Center",
                        items: [
                            new Icon({ src: "sap-icon://competitor", size: "1rem" }).addStyleClass("creatio-section-icon"),
                            new Title({ text: "Competitors", level: "H6" }).addStyleClass("creatio-section-title")
                        ]
                    }),
                    new Link({ text: "View All", press: function() { MessageToast.show("Opening competitor analysis..."); } })
                ]
            });
            oSection.addItem(oHeader);

            const oCompetitorsList = new VBox();
            oCompetitorsList.addStyleClass("creatio-products-list sapUiSmallMarginTop");

            MOCK_COMPETITORS.forEach((oCompetitor) => {
                const oCompetitorCard = new HBox({
                    alignItems: "Center"
                });
                oCompetitorCard.addStyleClass("creatio-product-card");

                const oAvatar = new Avatar({
                    initials: oCompetitor.name.substring(0, 2).toUpperCase(),
                    displaySize: "S",
                    backgroundColor: oCompetitor.threat >= 70 ? "Accent2" : "Accent8"
                });

                const oDetails = new VBox({
                    items: [
                        new Text({ text: oCompetitor.name }).addStyleClass("creatio-product-name"),
                        new Text({ text: "Strength: " + oCompetitor.strength }).addStyleClass("creatio-product-meta")
                    ]
                });
                oDetails.addStyleClass("creatio-product-details");

                const oThreat = new ObjectStatus({
                    text: oCompetitor.threat + "%",
                    state: oCompetitor.threat >= 70 ? "Error" : (oCompetitor.threat >= 50 ? "Warning" : "Success"),
                    icon: oCompetitor.threat >= 70 ? "sap-icon://warning" : "sap-icon://hint"
                });
                oThreat.addStyleClass("creatio-product-trend");

                oCompetitorCard.addItem(oAvatar);
                oCompetitorCard.addItem(oDetails);
                oCompetitorCard.addItem(oThreat);
                oCompetitorsList.addItem(oCompetitorCard);
            });

            oSection.addItem(oCompetitorsList);
            return oSection;
        },

        /**
         * Create Deal History Section
         * @private
         */
        _createDealHistory: function () {
            const oSection = new VBox();
            oSection.addStyleClass("creatio-ai-section");

            const oHeader = new HBox({
                alignItems: "Center",
                justifyContent: "SpaceBetween",
                items: [
                    new HBox({
                        alignItems: "Center",
                        items: [
                            new Icon({ src: "sap-icon://history", size: "1rem" }).addStyleClass("creatio-section-icon"),
                            new Title({ text: "Deal History", level: "H6" }).addStyleClass("creatio-section-title")
                        ]
                    }),
                    new Link({ text: "See All", press: function() { MessageToast.show("Opening activity log..."); } })
                ]
            });
            oSection.addItem(oHeader);

            // Stats row
            const oStatsRow = new HBox({
                justifyContent: "SpaceAround"
            });
            oStatsRow.addStyleClass("creatio-engagement-stats sapUiSmallMarginTop");

            oStatsRow.addItem(new VBox({
                alignItems: "Center",
                items: [
                    new Text({ text: "5" }).addStyleClass("creatio-stat-number"),
                    new Text({ text: "Meetings" }).addStyleClass("creatio-stat-label")
                ]
            }));
            oStatsRow.addItem(new VBox({
                alignItems: "Center",
                items: [
                    new Text({ text: "3" }).addStyleClass("creatio-stat-number creatio-stat-success"),
                    new Text({ text: "Proposals" }).addStyleClass("creatio-stat-label")
                ]
            }));
            oStatsRow.addItem(new VBox({
                alignItems: "Center",
                items: [
                    new Text({ text: "21" }).addStyleClass("creatio-stat-number"),
                    new Text({ text: "Days Active" }).addStyleClass("creatio-stat-label")
                ]
            }));
            oSection.addItem(oStatsRow);

            // Timeline
            const oTimeline = new VBox();
            oTimeline.addStyleClass("creatio-mini-timeline sapUiSmallMarginTop");

            MOCK_ACTIVITIES.forEach((oEntry, iIndex) => {
                const oTimelineItem = new HBox({
                    alignItems: "Start"
                });
                oTimelineItem.addStyleClass("creatio-timeline-item");

                const oIndicator = new VBox({
                    alignItems: "Center"
                });
                oIndicator.addStyleClass("creatio-timeline-indicator");
                
                const oDot = new Icon({ src: oEntry.icon, size: "0.875rem" });
                oDot.addStyleClass("creatio-timeline-dot");
                oIndicator.addItem(oDot);
                
                if (iIndex < MOCK_ACTIVITIES.length - 1) {
                    const oLine = new HTML({ content: '<div class="creatio-timeline-line"></div>' });
                    oIndicator.addItem(oLine);
                }

                const oContent = new VBox({
                    items: [
                        new Text({ text: oEntry.description }).addStyleClass("creatio-timeline-text"),
                        new Text({ text: this._formatRelativeDate(oEntry.date) }).addStyleClass("creatio-timeline-date")
                    ]
                });
                oContent.addStyleClass("creatio-timeline-content");

                oTimelineItem.addItem(oIndicator);
                oTimelineItem.addItem(oContent);
                oTimeline.addItem(oTimelineItem);
            });

            oSection.addItem(oTimeline);
            return oSection;
        },

        /**
         * Format relative date
         * @private
         */
        _formatRelativeDate: function (oDate) {
            const iDays = Math.floor((new Date() - oDate) / (1000 * 60 * 60 * 24));
            if (iDays === 0) return "Today";
            if (iDays === 1) return "Yesterday";
            if (iDays < 7) return iDays + " days ago";
            if (iDays < 30) return Math.floor(iDays / 7) + " week(s) ago";
            return Math.floor(iDays / 30) + " month(s) ago";
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
            console.log("[OpportunitiesCreatioExt] Updating from entity data:", oData.name);
            
            this._updateChevronState(oData.stage);
            this._updateProfileModel(oData);
            this._updateKPIModel(oData);
        },

        /**
         * Update profile model from entity data
         * @private
         */
        _updateProfileModel: function (oData) {
            const sName = oData.name || "Unknown Opportunity";
            const sInitials = this._getInitials(sName);
            const sColor = this._getAvatarColor(sName);
            
            this._oProfileModel.setData({
                name: sName,
                subtitle: oData.account?.accountName || "",
                initials: sInitials,
                avatarColor: sColor,
                avatarUrl: "",
                badgeText: oData.aiWinScore ? oData.aiWinScore + "% Win" : (oData.probability ? oData.probability + "% Win" : ""),
                badgeState: this._getScoreState(oData.aiWinScore || oData.probability),
                badgeIcon: this._getScoreIcon(oData.aiWinScore || oData.probability),
                account: oData.account?.accountName || "",
                contact: oData.contact?.fullName || "",
                owner: oData.owner?.fullName || "",
                createdAt: this._formatDate(oData.createdAt),
                closeDate: this._formatDate(oData.closeDate),
                phone: oData.contact?.phone || "",
                email: oData.contact?.email || "",
                showCall: !!oData.contact?.phone,
                showMessage: true,
                showEmail: !!oData.contact?.email,
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
                const sSubtitle = this._formatCurrency(oData.amount || oData.expectedRevenue);
                this._oProfileSubtitle.setText(sSubtitle);
            }
            if (this._oAccountField && this._oAccountField._valueText) {
                this._oAccountField._valueText.setText(oData.account?.accountName || "-");
            }
            if (this._oContactField && this._oContactField._valueText) {
                this._oContactField._valueText.setText(oData.contact?.fullName || "-");
            }
            if (this._oCloseDateField && this._oCloseDateField._valueText) {
                this._oCloseDateField._valueText.setText(this._formatDate(oData.closeDate) || "-");
            }
        },

        /**
         * Update KPI model from entity data
         * @private
         */
        _updateKPIModel: function (oData) {
            const iDaysInPipeline = this._calculateDaysSince(oData.createdAt);
            const iWinScore = oData.aiWinScore || oData.probability || 0;
            const fDealValue = oData.amount || oData.expectedRevenue || 0;
            
            this._oKPIModel.setProperty("/kpis/0/value", iDaysInPipeline.toString());
            this._oKPIModel.setProperty("/kpis/0/numericValue", iDaysInPipeline);
            
            this._oKPIModel.setProperty("/kpis/1/value", iWinScore + "%");
            this._oKPIModel.setProperty("/kpis/1/numericValue", iWinScore);
            
            this._oKPIModel.setProperty("/kpis/2/value", this._formatDate(oData.closeDate) || "-");
            
            this._oKPIModel.setProperty("/kpis/3/value", this._formatCurrency(fDealValue));
            this._oKPIModel.setProperty("/kpis/3/numericValue", fDealValue);
            
            this._oKPIModel.setProperty("/winScore", iWinScore);
        },

        // ============================================
        // Action Handlers
        // ============================================

        /**
         * Handle stage click
         * @private
         */
        _onStageClick: function (oStage, iTargetIndex) {
            const that = this;
            const sCurrentStage = this._oEntityData?.stage || "Qualification";
            const aStageKeys = ["Qualification", "Discovery", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
            const iCurrentIndex = aStageKeys.indexOf(sCurrentStage);

            if (iTargetIndex === iCurrentIndex) return;
            if (iTargetIndex < iCurrentIndex && !oStage.isNegative) {
                MessageToast.show("Cannot move backwards in the pipeline");
                return;
            }

            MessageBox.confirm(
                "Move from '" + sCurrentStage + "' to '" + oStage.label + "'?",
                {
                    title: "Confirm Stage Change",
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    emphasizedAction: MessageBox.Action.YES,
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.YES) {
                            that._executeStageChange(oStage.key);
                        }
                    }
                }
            );
        },

        /**
         * Execute stage change via backend
         * @private
         */
        _executeStageChange: function (sNewStage) {
            const oView = this.base.getView();
            const oContext = oView && oView.getBindingContext();
            
            if (!oContext) {
                MessageBox.error("No opportunity context available");
                return;
            }
            
            const sOpportunityID = oContext.getProperty("ID");
            BusyIndicator.show(0);
            
            fetch("/opportunity/Opportunities(" + sOpportunityID + ")/OpportunityService.moveToStage", {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ stage: sNewStage })
            })
            .then((response) => {
                BusyIndicator.hide();
                if (response.ok) {
                    MessageToast.show("Stage updated to: " + sNewStage);
                    oContext.refresh();
                } else {
                    throw new Error("Failed to update stage");
                }
            })
            .catch((error) => {
                BusyIndicator.hide();
                MessageBox.error("Failed to update stage: " + error.message);
            });
        },

        /**
         * Handle action button press from AI panel
         * @private
         */
        _onActionButtonPress: function (sActionId) {
            switch (sActionId) {
                case "meeting":
                    this._onQuickSchedule();
                    break;
                case "proposal":
                    MessageToast.show("Opening proposal editor...");
                    break;
                case "call":
                    this._onQuickCall();
                    break;
                case "email":
                    this._onQuickEmail();
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
         * Calculate days since a date
         * @private
         */
        _calculateDaysSince: function (oDate) {
            if (!oDate) return 0;
            const oDateObj = oDate instanceof Date ? oDate : new Date(oDate);
            const oToday = new Date();
            return Math.floor((oToday - oDateObj) / (1000 * 60 * 60 * 24));
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
            if (this._oAIPanel) {
                this._oAIPanel.destroy();
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
        }
    });
});
