/**
 * Prospects Object Page Extension - Creatio-style Layout
 * Integrates ChevronStageBar, KPI Cards, Enhanced AI Assistant Panel, and Entity Profile
 * 
 * Enhanced Features:
 * - AI Sidebar with Score Breakdown, Next Best Actions, Products, Engagement History
 * - Activity Timeline with mock data
 * - Quick Action Buttons (Call, Email, WhatsApp)
 * - Convert to Account button
 * - Visual Score Indicators with progress rings
 */
console.log("[ProspectsCreatioExt] Module file is being loaded at:", new Date().toISOString());
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

    // Mock data for recommended products
    const MOCK_PRODUCTS = [
        { id: "1", name: "K-Beauty Glass Skin Serum", brand: "COSRX", trendScore: 94, category: "Skincare", price: "RM 89.00" },
        { id: "2", name: "Snail Mucin Essence", brand: "COSRX", trendScore: 91, category: "Skincare", price: "RM 75.00" },
        { id: "3", name: "Rice Water Toner", brand: "I'm From", trendScore: 88, category: "Skincare", price: "RM 95.00" }
    ];

    // Mock data for engagement history
    const MOCK_ENGAGEMENT = [
        { id: "1", type: "meeting", description: "Initial discovery call", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), icon: "sap-icon://appointment" },
        { id: "2", type: "email", description: "Product catalog sent", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), icon: "sap-icon://email" },
        { id: "3", type: "call", description: "Follow-up call completed", date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), icon: "sap-icon://call" }
    ];

    // Mock activity timeline
    const MOCK_ACTIVITIES = [
        { id: "1", type: "meeting", title: "Business review scheduled", description: "Quarterly business review with stakeholders", date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), status: "upcoming", icon: "sap-icon://appointment" },
        { id: "2", type: "proposal", title: "Proposal sent", description: "Partnership proposal for Q1 2025", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), status: "completed", icon: "sap-icon://document" },
        { id: "3", type: "call", title: "Discovery call", description: "Initial requirements discussion", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), status: "completed", icon: "sap-icon://call" },
        { id: "4", type: "note", title: "Prospect created", description: "Converted from lead", date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), status: "completed", icon: "sap-icon://add" }
    ];

    // Next best actions configuration
    const NEXT_BEST_ACTIONS = [
        { id: "meeting", label: "Schedule Meeting", icon: "sap-icon://appointment", priority: "High", dueText: "This week", type: "Emphasized" },
        { id: "proposal", label: "Send Proposal", icon: "sap-icon://document", priority: "High", dueText: "Today", type: "Emphasized" },
        { id: "email", label: "Send Email", icon: "sap-icon://email", priority: "Medium", dueText: "This week", type: "Default" },
        { id: "call", label: "Follow-up Call", icon: "sap-icon://call", priority: "Medium", dueText: "Tomorrow", type: "Default" }
    ];

    // Mock tags for prospect categorization
    const MOCK_TAGS = [
        { id: "hot", text: "Hot", colorClass: "tag-hot", removable: true },
        { id: "kbeauty", text: "K-Beauty", colorClass: "tag-webinar", removable: true },
        { id: "tiktok", text: "TikTok Lead", colorClass: "tag-ai", removable: true }
    ];

    return ControllerExtension.extend("beautyleads.prospects.ext.controller.ProspectsCreatioExt", {
        // Component references
        _oProfileModel: null,
        _oKPIModel: null,
        _oEntityData: null,
        
        // Fragment references
        _oAIPanel: null,
        _oProfileSidebar: null,
        _oConvertButton: null,
        _oOpportunityButton: null,

        /**
         * Lifecycle: Controller initialization
         */
        onInit: function () {
            console.log("[ProspectsCreatioExt] Initializing Creatio-style extensions (Enhanced)");
            
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
                businessType: "",
                source: "",
                sourceIcon: "",
                owner: "",
                createdAt: "",
                phone: "",
                email: "",
                showCall: true,
                showMessage: true,
                showEmail: true,
                showSchedule: true,
                converted: false
            });

            // KPI model with score data
            this._oKPIModel = new JSONModel({
                kpis: [
                    { id: "daysSinceDiscovery", title: "Days since discovery", value: "0", numericValue: 0, color: "blue" },
                    { id: "daysAtStage", title: "Days at current stage", value: "0", numericValue: 0, color: "teal" },
                    { id: "prospectScore", title: "Prospect score", value: "0%", numericValue: 0, color: "green" },
                    { id: "estimatedValue", title: "Estimated value", value: "RM 0", numericValue: 0, color: "orange" }
                ],
                prospectScore: 0,
                trendScore: 0,
                sentimentScore: 0,
                sentimentLabel: "Neutral"
            });

            // AI Panel model
            this._oAIPanelModel = new JSONModel({
                expanded: true,
                messages: [],
                inputText: "",
                isLoading: false,
                showSuggestions: false,
                products: MOCK_PRODUCTS,
                engagement: MOCK_ENGAGEMENT,
                activities: MOCK_ACTIVITIES,
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
                console.log("[ProspectsCreatioExt] Loaded creatio-layout.css");
            }
        },

        /**
         * Called after view rendering
         * @private
         */
        _onViewAfterRendering: function () {
            console.log("[ProspectsCreatioExt] View rendered, initializing components");
            
            // Robust initialization with retry mechanism
            const fnInit = () => {
                // Check if critical DOM elements exist
                const oObjectPage = this.base.getView().byId("fe::ObjectPage");
                if (oObjectPage && oObjectPage.getDomRef()) {
                this._initializeCreatioComponents();
                this._setupBindingContextListener();
                    return true;
                }
                return false;
            };

            // Try immediately
            if (!fnInit()) {
                // Retry a few times if DOM isn't ready
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

            // Listen for binding context changes
            oView.attachModelContextChange(this._onModelContextChange.bind(this));
            
            // Also check if context already exists
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
                // Wait for data to be loaded
                oContext.requestObject().then((oData) => {
                    this._updateFromEntity(oData);
                }).catch((err) => {
                    console.error("[ProspectsCreatioExt] Error loading entity data:", err);
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
                console.warn("[ProspectsCreatioExt] View not available");
                return;
            }

            // Render components
            this._renderTagChips();
            this._renderChevronStageBar();
            this._renderKPICards();
            this._renderDashboardWidgets();
            this._renderProfileSidebar();
            this._renderEnhancedAIPanel();
            this._renderConvertButton();
        },

        /**
         * Render Tag Chips in header area
         * @private
         */
        _renderTagChips: function () {
            const that = this;
            
            // Create tag chips container
            let oTagContainer = document.getElementById("creatioTagChipsContainer");
            if (!oTagContainer) {
                oTagContainer = document.createElement("div");
                oTagContainer.id = "creatioTagChipsContainer";
                oTagContainer.className = "creatio-tags-container";
                oTagContainer.style.cssText = "position:fixed;top:48px;left:165px;z-index:9550;padding:0.375rem 0;";
                document.body.appendChild(oTagContainer);
            }

            // Clear existing content
            oTagContainer.innerHTML = "";

            // Render tags
            const aTags = this._oTagsModel.getProperty("/tags") || [];
            aTags.forEach((oTag) => {
                const oChip = document.createElement("div");
                oChip.className = "creatio-tag-chip " + (oTag.colorClass || "");
                oChip.innerHTML = `
                    <span class="tag-text">${oTag.text}</span>
                    ${oTag.removable ? '<span class="tag-remove" data-tag-id="' + oTag.id + '">✕</span>' : ''}
                `;
                
                // Add remove handler
                const oRemoveBtn = oChip.querySelector(".tag-remove");
                if (oRemoveBtn) {
                    oRemoveBtn.addEventListener("click", function() {
                        that._onRemoveTag(oTag.id);
                    });
                }
                
                oTagContainer.appendChild(oChip);
            });

            // Add "Add tag" button
            const oAddBtn = document.createElement("button");
            oAddBtn.className = "creatio-add-tag-btn";
            oAddBtn.innerHTML = '<span>+</span><span>Add tag</span>';
            oAddBtn.addEventListener("click", function() {
                that._onAddTag();
            });
            oTagContainer.appendChild(oAddBtn);

            console.log("[ProspectsCreatioExt] Tag chips rendered");
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
            
            // Create sidebar container
            let oSidebarContainer = document.getElementById("creatioProfileSidebar");
            if (oSidebarContainer) {
                oSidebarContainer.remove();
            }
            
            oSidebarContainer = document.createElement("div");
            oSidebarContainer.id = "creatioProfileSidebar";
            oSidebarContainer.className = "creatio-profile-sidebar-fixed";
            document.body.appendChild(oSidebarContainer);

            // Create profile sidebar content using SAPUI5 controls
            const oSidebar = new VBox({
                width: "100%"
            });
            oSidebar.addStyleClass("creatio-entity-profile");

            // Profile Header with Avatar
            const oProfileHeader = new VBox({
                alignItems: "Center"
            });
            oProfileHeader.addStyleClass("creatio-profile-header");

            // Avatar
            const oAvatar = new Avatar({
                initials: "PR",
                displaySize: "L",
                backgroundColor: "Accent5"
            });
            oAvatar.addStyleClass("creatio-profile-avatar creatio-avatar-enhanced");
            oProfileHeader.addItem(oAvatar);

            // Name
            const oName = new Title({
                text: "Loading...",
                level: "H5"
            });
            oName.addStyleClass("creatio-profile-name");
            oProfileHeader.addItem(oName);

            // Subtitle (date info)
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

            // Call button
            const oCallBtn = new Button({
                icon: "sap-icon://call",
                type: "Default",
                tooltip: "Call",
                press: function() { that._onQuickCall(); }
            });
            oActionsRow.addItem(oCallBtn);

            // Chat button
            const oChatBtn = new Button({
                icon: "sap-icon://discussion-2",
                type: "Default",
                tooltip: "Chat",
                press: function() { that._onQuickWhatsApp(); }
            });
            oActionsRow.addItem(oChatBtn);

            // Email button
            const oEmailBtn = new Button({
                icon: "sap-icon://email",
                type: "Default",
                tooltip: "Email",
                press: function() { that._onQuickEmail(); }
            });
            oActionsRow.addItem(oEmailBtn);

            // Flag button
            const oFlagBtn = new Button({
                icon: "sap-icon://flag",
                type: "Default",
                tooltip: "Flag",
                press: function() { MessageToast.show("Flagged for follow-up"); }
            });
            oActionsRow.addItem(oFlagBtn);

            oSidebar.addItem(oActionsRow);

            // Profile Info Fields
            const oInfoSection = new VBox();
            oInfoSection.addStyleClass("creatio-profile-info");

            // Business Type field
            const oBusinessField = this._createProfileField("Business Type", "Loading...", "sap-icon://factory");
            oInfoSection.addItem(oBusinessField);

            // Source field
            const oSourceField = this._createProfileField("Discovery Source", "Loading...", "sap-icon://world");
            oInfoSection.addItem(oSourceField);

            oSidebar.addItem(oInfoSection);

            // Communication Options expandable section
            const oCommPanel = new Panel({
                headerText: "Communication options",
                expandable: true,
                expanded: false
            });
            oCommPanel.addStyleClass("creatio-profile-comm-panel");
            oSidebar.addItem(oCommPanel);

            // Next Steps Section (Creatio style)
            const oNextStepsSection = new VBox();
            oNextStepsSection.addStyleClass("creatio-next-steps-section");
            
            const oNextStepsTitle = new Text({ text: "Next steps" });
            oNextStepsTitle.addStyleClass("creatio-section-title");
            oNextStepsSection.addItem(oNextStepsTitle);
            
            // Next step items
            const aNextSteps = [
                { text: "Schedule business review", icon: "sap-icon://appointment", date: "This week" },
                { text: "Send partnership proposal", icon: "sap-icon://document", date: "Tomorrow" },
                { text: "Review meeting notes", icon: "sap-icon://notes", date: "Today" }
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

            // Place sidebar
            oSidebar.placeAt(oSidebarContainer);
            this._oProfileSidebar = oSidebar;
            this._oProfileAvatar = oAvatar;
            this._oProfileName = oName;
            this._oProfileSubtitle = oSubtitle;
            this._oBusinessField = oBusinessField;
            this._oSourceField = oSourceField;

            // Add class to body for layout adjustment
            document.body.classList.add("creatio-with-profile-sidebar");

            console.log("[ProspectsCreatioExt] Profile sidebar rendered");
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
            
            // Find or create container in Object Page header
            let oContainer = this._findOrCreateContainer("prospectsChevronContainer", "creatio-header-stage-section");
            
            if (oContainer) {
                // Create wrapper
                const oWrapper = new VBox({
                    class: "creatio-chevron-container sapUiSmallMarginBottom"
                });
                
                // Build chevron stages
                const oChevronBar = this._buildChevronBar();
                oWrapper.addItem(oChevronBar);
                
                oContainer.addItem(oWrapper);
                console.log("[ProspectsCreatioExt] Chevron Stage Bar rendered");
            }
        },

        /**
         * Build the chevron stage bar
         * @private
         */
        _buildChevronBar: function () {
            const that = this;
            const aStages = [
                { key: "New", label: "NEW", icon: "sap-icon://add" },
                { key: "Engaged", label: "ENGAGED", icon: "sap-icon://collaborate" },
                { key: "Discovery", label: "DISCOVERY", icon: "sap-icon://search" },
                { key: "Proposal", label: "PROPOSAL", icon: "sap-icon://document" },
                { key: "Negotiation", label: "NEGOTIATION", icon: "sap-icon://sales-quote" },
                { key: "Converted", label: "CONVERTED", icon: "sap-icon://complete" },
                { key: "Lost", label: "LOST", icon: "sap-icon://decline", isNegative: true }
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

                // Stage content with SAP icon and label (horizontal layout)
                const oStageIcon = new Icon({
                    src: oStage.icon,
                    size: "1rem"
                });
                oStageIcon.addStyleClass("creatio-stage-icon");
                
                const oLabel = new Text({ text: oStage.label });
                oLabel.addStyleClass("creatio-stage-label");
                
                oChevron.addItem(oStageIcon);
                oChevron.addItem(oLabel);

                // Click handler
                oChevron.attachBrowserEvent("click", function() {
                    that._onStageClick(oStage, iIndex);
                });

                oBar.addItem(oChevron);
            });

            return oBar;
        },

        /**
         * Update chevron bar state based on current status
         * @private
         */
        _updateChevronState: function (sCurrentStatus) {
            const oView = this.base.getView();
            if (!oView) return;

            const aStageKeys = ["New", "Engaged", "Discovery", "Proposal", "Negotiation", "Converted", "Lost"];
            const iCurrentIndex = aStageKeys.indexOf(sCurrentStatus);

            // Find all chevron stages and update their state
            const oContainer = oView.byId("prospectsChevronContainer");
            if (!oContainer) return;

            const oChevronBar = oContainer.getItems()[0]?.getItems()[0];
            if (!oChevronBar) return;

            oChevronBar.getItems().forEach((oChevron, iIndex) => {
                oChevron.removeStyleClass("creatio-stage-completed");
                oChevron.removeStyleClass("creatio-stage-current");
                oChevron.removeStyleClass("creatio-stage-future");

                if (iIndex < iCurrentIndex) {
                    oChevron.addStyleClass("creatio-stage-completed");
                } else if (iIndex === iCurrentIndex) {
                    oChevron.addStyleClass("creatio-stage-current");
                } else {
                    oChevron.addStyleClass("creatio-stage-future");
                }
            });
        },

        /**
         * Render KPI Cards Row with visual progress indicators
         * @private
         */
        _renderKPICards: function () {
            const oContainer = this._findOrCreateContainer("prospectsKPIContainer", "creatio-header-kpi-section");
            
            if (oContainer) {
                const oKPIRow = new HBox({
                    justifyContent: "Start",
                    wrap: "Wrap"
                });
                oKPIRow.addStyleClass("creatio-kpi-row sapUiSmallMarginBottom");
                
                // Create enhanced KPI cards
                const aKPIs = this._oKPIModel.getProperty("/kpis");
                aKPIs.forEach((oKPI) => {
                    const oCard = this._createEnhancedKPICard(oKPI);
                    oKPIRow.addItem(oCard);
                });
                
                oContainer.addItem(oKPIRow);
                console.log("[ProspectsCreatioExt] KPI Cards rendered");
            }
        },

        /**
         * Create a clean KPI card (Creatio style)
         * @private
         */
        _createEnhancedKPICard: function (oKPI) {
            const oCard = new VBox();
            oCard.addStyleClass("creatio-kpi-card kpi-" + oKPI.color);
            
            // Title
            const oTitle = new Text({ text: oKPI.title });
            oTitle.addStyleClass("creatio-kpi-title");

            // Large Value
            const oValue = new Text({ text: oKPI.value });
            oValue.addStyleClass("creatio-kpi-value");
            
            oCard.addItem(oTitle);
            oCard.addItem(oValue);
            
            // Store reference for updates
            oCard.data("kpiId", oKPI.id);
            oCard._valueText = oValue;
            
            return oCard;
        },

        /**
         * Render Dashboard Widgets (Engagement & Email Nurturing)
         * @private
         */
        _renderDashboardWidgets: function () {
            // Create dashboard container
            let oDashContainer = document.getElementById("creatioDashboardContainer");
            if (oDashContainer) {
                // Already rendered
                return;
            }

            oDashContainer = document.createElement("div");
            oDashContainer.id = "creatioDashboardContainer";
            oDashContainer.className = "creatio-dashboard-container";

            // Quick Info Row
            const sQuickInfoHTML = `
                <div class="creatio-quick-info-row">
                    <div class="creatio-quick-info-item">
                        <span class="creatio-quick-info-label">Business need</span>
                        <span class="creatio-quick-info-value">Beauty Products Distribution</span>
                    </div>
                    <div class="creatio-quick-info-item">
                        <span class="creatio-quick-info-label">Contact</span>
                        <span class="creatio-quick-info-value link">Primary Contact</span>
                    </div>
                    <div class="creatio-quick-info-item">
                        <span class="creatio-quick-info-label">Source</span>
                        <span class="creatio-quick-info-value link">TikTok Campaign</span>
                    </div>
                    <div class="creatio-quick-info-item">
                        <span class="creatio-quick-info-label">Discovered on</span>
                        <span class="creatio-quick-info-value">Nov 16, 2025</span>
                    </div>
                </div>
            `;

            // Engagement Widget with Line Chart
            const sEngagementHTML = `
                <div class="creatio-dashboard-row">
                    <div class="creatio-widget-card">
                        <div class="creatio-widget-header">
                            <div class="creatio-widget-icon" style="color: #2196F3;">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z"/>
                                </svg>
                            </div>
                            <span class="creatio-widget-title">Engagement</span>
                        </div>
                        <div class="creatio-widget-content">
                            <div class="creatio-widget-metrics">
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Meetings held</span>
                                    <span class="creatio-metric-value">
                                        <span class="creatio-metric-icon success">✓</span> 3
                                    </span>
                                </div>
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Proposals sent</span>
                                    <span class="creatio-metric-value">2</span>
                                </div>
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Last interaction</span>
                                    <span class="creatio-metric-value">Nov 28, 2025</span>
                                </div>
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Avg. response time</span>
                                    <span class="creatio-metric-value">4h 30m</span>
                                </div>
                            </div>
                            <div class="creatio-widget-chart">
                                <span class="creatio-chart-title">Engagement trend (last 30 days)</span>
                                <div class="creatio-chart-container">
                                    <svg class="creatio-chart-svg" viewBox="0 0 300 100" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="prospectEngagementGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" style="stop-color:#2196F3;stop-opacity:0.2"/>
                                                <stop offset="100%" style="stop-color:#2196F3;stop-opacity:0"/>
                                            </linearGradient>
                                        </defs>
                                        <path class="creatio-chart-area primary" d="M0,70 L30,55 L60,60 L90,35 L120,45 L150,30 L180,40 L210,20 L240,25 L270,15 L300,10 L300,100 L0,100 Z" fill="url(#prospectEngagementGradient)"/>
                                        <path class="creatio-chart-line primary" d="M0,70 L30,55 L60,60 L90,35 L120,45 L150,30 L180,40 L210,20 L240,25 L270,15 L300,10"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="creatio-widget-card">
                        <div class="creatio-widget-header">
                            <div class="creatio-widget-icon" style="color: #4CAF50;">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                </svg>
                            </div>
                            <span class="creatio-widget-title">Communication</span>
                        </div>
                        <div class="creatio-widget-content">
                            <div class="creatio-widget-metrics">
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Emails sent</span>
                                    <span class="creatio-metric-value">8</span>
                                </div>
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Open rate</span>
                                    <span class="creatio-metric-value">
                                        <span class="creatio-metric-icon success">✓</span> 87%
                                    </span>
                                </div>
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Reply rate</span>
                                    <span class="creatio-metric-value">
                                        <span class="creatio-metric-icon success">✓</span> 62%
                                    </span>
                                </div>
                            </div>
                            <div class="creatio-widget-chart">
                                <span class="creatio-chart-title">Communication activity (last 8 interactions)</span>
                                <div class="creatio-chart-container">
                                    <svg class="creatio-chart-svg" viewBox="0 0 300 100" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="prospectCommGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:0.2"/>
                                                <stop offset="100%" style="stop-color:#4CAF50;stop-opacity:0"/>
                                            </linearGradient>
                                        </defs>
                                        <path class="creatio-chart-area success" d="M0,50 L40,40 L80,55 L120,30 L160,40 L200,25 L240,35 L300,20 L300,100 L0,100 Z" fill="url(#prospectCommGradient)"/>
                                        <path class="creatio-chart-line success" d="M0,50 L40,40 L80,55 L120,30 L160,40 L200,25 L240,35 L300,20"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Contact Roles Section
            const sContactRolesHTML = `
                <div class="creatio-contact-roles">
                    <div class="creatio-contact-roles-header">
                        <span class="creatio-contact-roles-title">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#757575">
                                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                            </svg>
                            Key contacts (2)
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
                                <td class="link">Business Owner</td>
                                <td>Decision maker</td>
                                <td>✓</td>
                            </tr>
                            <tr>
                                <td class="link">Operations Manager</td>
                                <td>Influencer</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;

            oDashContainer.innerHTML = sQuickInfoHTML + sEngagementHTML + sContactRolesHTML;

            // Find insertion point - inside Object Page main content area
            const oObjectPage = document.querySelector(".sapUxAPObjectPageLayout");
            if (oObjectPage) {
                const oWrapper = oObjectPage.querySelector(".sapUxAPObjectPageWrapper");
                if (oWrapper) {
                    const oScrollContainer = oWrapper.querySelector(".sapUxAPObjectPageWrapperTransition") || oWrapper;
                    const oFirstSection = oScrollContainer.querySelector(".sapUxAPObjectPageSection");
                    if (oFirstSection) {
                        oFirstSection.parentNode.insertBefore(oDashContainer, oFirstSection);
                        console.log("[ProspectsCreatioExt] Dashboard widgets rendered (before sections)");
                        return;
                    }
                }

                const oHeaderContent = oObjectPage.querySelector(".sapUxAPObjectPageHeaderContent");
                if (oHeaderContent) {
                    oHeaderContent.appendChild(oDashContainer);
                    console.log("[ProspectsCreatioExt] Dashboard widgets rendered (in header)");
                    return;
                }
            }
            
            // Last resort
            document.body.appendChild(oDashContainer);
            oDashContainer.style.cssText = "position:fixed;top:200px;left:0;right:380px;z-index:100;";
            console.log("[ProspectsCreatioExt] Dashboard widgets rendered (fixed fallback)");
        },

        /**
         * Render Enhanced AI Assistant Panel with 5 sections
         * @private
         */
        _renderEnhancedAIPanel: function () {
            const that = this;
            
            // Create AI panel container (fixed position sidebar)
            const oAIPanel = new Panel({
                expandable: false,
                expanded: true,
                headerText: ""
            });
            oAIPanel.addStyleClass("creatio-ai-panel creatio-ai-panel-enhanced");

            // Custom header with gradient
            const oHeader = this._createAIPanelHeader();

            // Create scrollable content
            const oScrollContainer = new ScrollContainer({
                vertical: true,
                horizontal: false,
                height: "calc(100vh - 120px)"
            });
            oScrollContainer.addStyleClass("creatio-ai-scroll");

            // Build all 5 sections
            const oContent = new VBox();
            oContent.addStyleClass("creatio-ai-content-enhanced");
            
            // 0. Quick Contact Actions Section (prominent at top)
            const oQuickContactSection = this._createQuickContactSection();
            oContent.addItem(oQuickContactSection);
            
            // 1. Score Breakdown Section
            const oScoreSection = this._createScoreBreakdown();
            oContent.addItem(oScoreSection);
            
            // 2. Next Best Actions Section
            const oActionsSection = this._createNextBestActions();
            oContent.addItem(oActionsSection);
            
            // 3. Recommended Products Section
            const oProductsSection = this._createRecommendedProducts();
            oContent.addItem(oProductsSection);
            
            // 4. Engagement History Section
            const oEngagementSection = this._createEngagementHistory();
            oContent.addItem(oEngagementSection);

            oScrollContainer.addContent(oContent);

            oAIPanel.setCustomHeader(oHeader);
            oAIPanel.addContent(oScrollContainer);
            
            // Place panel in body
            oAIPanel.placeAt(document.body);
            this._oAIPanel = oAIPanel;
            
            console.log("[ProspectsCreatioExt] Enhanced AI Panel rendered");
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
         * Create Quick Contact Section with action buttons
         * @private
         */
        _createQuickContactSection: function () {
            const that = this;
            const oSection = new VBox();
            oSection.addStyleClass("creatio-ai-section creatio-quick-contact-section");

            // Section header
            const oHeader = new HBox({
                alignItems: "Center",
                items: [
                    new Icon({ src: "sap-icon://customer", size: "1rem" }).addStyleClass("creatio-section-icon"),
                    new Title({ text: "Quick Actions", level: "H6" }).addStyleClass("creatio-section-title")
                ]
            });
            oSection.addItem(oHeader);

            // Quick action buttons row
            const oButtonsRow = new HBox({
                justifyContent: "SpaceAround",
                alignItems: "Center"
            });
            oButtonsRow.addStyleClass("creatio-quick-contact-buttons sapUiSmallMarginTop");

            // Call button
            const oCallBtn = new Button({
                icon: "sap-icon://call",
                text: "Call",
                type: "Default",
                press: function () { that._onQuickCall(); }
            });
            oCallBtn.addStyleClass("creatio-contact-btn creatio-contact-call");

            // Email button
            const oEmailBtn = new Button({
                icon: "sap-icon://email",
                text: "Email",
                type: "Default",
                press: function () { that._onQuickEmail(); }
            });
            oEmailBtn.addStyleClass("creatio-contact-btn creatio-contact-email");

            // WhatsApp button
            const oWhatsAppBtn = new Button({
                icon: "sap-icon://discussion-2",
                text: "WhatsApp",
                type: "Default",
                press: function () { that._onQuickWhatsApp(); }
            });
            oWhatsAppBtn.addStyleClass("creatio-contact-btn creatio-contact-whatsapp");

            // Schedule button
            const oScheduleBtn = new Button({
                icon: "sap-icon://appointment",
                text: "Schedule",
                type: "Default",
                press: function () { that._onQuickSchedule(); }
            });
            oScheduleBtn.addStyleClass("creatio-contact-btn creatio-contact-schedule");

            oButtonsRow.addItem(oCallBtn);
            oButtonsRow.addItem(oEmailBtn);
            oButtonsRow.addItem(oWhatsAppBtn);
            oButtonsRow.addItem(oScheduleBtn);

            oSection.addItem(oButtonsRow);
            return oSection;
        },

        /**
         * Create Score Breakdown Section
         * @private
         */
        _createScoreBreakdown: function () {
            const oSection = new VBox();
            oSection.addStyleClass("creatio-ai-section");

            // Section header
            const oHeader = new HBox({
                alignItems: "Center",
                items: [
                    new Icon({ src: "sap-icon://performance", size: "1rem" }).addStyleClass("creatio-section-icon"),
                    new Title({ text: "Prospect Scoring", level: "H6" }).addStyleClass("creatio-section-title")
                ]
            });
            oSection.addItem(oHeader);

            // Score cards container
            const oScoreCards = new VBox();
            oScoreCards.addStyleClass("creatio-score-cards sapUiSmallMarginTop");

            // Prospect Score with circular indicator
            const oProspectScoreCard = this._createScoreCard(
                "Prospect Score",
                "88%",
                88,
                "Strong potential based on engagement and business fit",
                "Success"
            );
            oScoreCards.addItem(oProspectScoreCard);

            // Trend Score
            const oTrendScoreCard = this._createScoreCard(
                "Trend Score",
                "92/100",
                92,
                "Business sector showing strong growth indicators",
                "Success"
            );
            oScoreCards.addItem(oTrendScoreCard);

            // Sentiment Score
            const oSentimentCard = new HBox({
                alignItems: "Center",
                justifyContent: "SpaceBetween"
            });
            oSentimentCard.addStyleClass("creatio-sentiment-card sapUiTinyMarginTop");
            
            oSentimentCard.addItem(new VBox({
                items: [
                    new Text({ text: "Sentiment" }).addStyleClass("creatio-score-label"),
                    new HBox({
                        alignItems: "Center",
                        items: [
                            new Icon({ src: "sap-icon://sentiment-positive", size: "1.25rem" }).addStyleClass("creatio-sentiment-icon-positive"),
                            new Text({ text: "Very Positive" }).addStyleClass("creatio-sentiment-value")
                        ]
                    })
                ]
            }));
            oSentimentCard.addItem(new Text({ text: "82" }).addStyleClass("creatio-score-number"));
            oScoreCards.addItem(oSentimentCard);

            // Overall Rating
            const oRatingBox = new HBox({
                alignItems: "Center",
                justifyContent: "Center"
            });
            oRatingBox.addStyleClass("creatio-overall-rating sapUiSmallMarginTop");
            
            oRatingBox.addItem(new VBox({
                alignItems: "Center",
                items: [
                    new Text({ text: "Overall Prospect Rating" }).addStyleClass("creatio-rating-label"),
                    new ObjectStatus({
                        text: "HIGH POTENTIAL",
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

            // Score ring visualization
            const sColor = sState === "Success" ? "#2e7d32" : (sState === "Warning" ? "#f57c00" : "#d32f2f");
            const oRing = new HTML({
                content: this._createScoreRingSVG(iPercent, sColor)
            });

            // Score details
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

            // Section header
            const oHeader = new HBox({
                alignItems: "Center",
                items: [
                    new Icon({ src: "sap-icon://action", size: "1rem" }).addStyleClass("creatio-section-icon"),
                    new Title({ text: "Next Best Actions", level: "H6" }).addStyleClass("creatio-section-title")
                ]
            });
            oSection.addItem(oHeader);

            // Actions list
            const oActionsList = new VBox();
            oActionsList.addStyleClass("creatio-actions-list sapUiSmallMarginTop");

            NEXT_BEST_ACTIONS.forEach((oAction) => {
                const oActionItem = new HBox({
                    alignItems: "Center",
                    justifyContent: "SpaceBetween"
                });
                oActionItem.addStyleClass("creatio-action-item");

                // Action info
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

                // Priority badge
                const oPriority = new ObjectStatus({
                    text: oAction.priority,
                    state: oAction.priority === "High" ? "Error" : (oAction.priority === "Medium" ? "Warning" : "None")
                });
                oPriority.addStyleClass("creatio-action-priority");

                // Action button
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
         * Create Recommended Products Section
         * @private
         */
        _createRecommendedProducts: function () {
            const oSection = new VBox();
            oSection.addStyleClass("creatio-ai-section");

            // Section header
            const oHeader = new HBox({
                alignItems: "Center",
                justifyContent: "SpaceBetween",
                items: [
                    new HBox({
                        alignItems: "Center",
                        items: [
                            new Icon({ src: "sap-icon://product", size: "1rem" }).addStyleClass("creatio-section-icon"),
                            new Title({ text: "Recommended Products", level: "H6" }).addStyleClass("creatio-section-title")
                        ]
                    }),
                    new Link({ text: "View All", press: function() { MessageToast.show("Opening product catalog..."); } })
                ]
            });
            oSection.addItem(oHeader);

            // Products list
            const oProductsList = new VBox();
            oProductsList.addStyleClass("creatio-products-list sapUiSmallMarginTop");

            MOCK_PRODUCTS.forEach((oProduct) => {
                const oProductCard = new HBox({
                    alignItems: "Center"
                });
                oProductCard.addStyleClass("creatio-product-card");

                // Product avatar/placeholder
                const oAvatar = new Avatar({
                    initials: oProduct.name.substring(0, 2).toUpperCase(),
                    displaySize: "S",
                    backgroundColor: "Accent6"
                });

                // Product details
                const oDetails = new VBox({
                items: [
                        new Text({ text: oProduct.name }).addStyleClass("creatio-product-name"),
                        new Text({ text: oProduct.brand + " • " + oProduct.price }).addStyleClass("creatio-product-meta")
                    ]
                });
                oDetails.addStyleClass("creatio-product-details");

                // Trend score badge
                const oTrend = new ObjectStatus({
                    text: oProduct.trendScore + "%",
                    state: "Success",
                    icon: "sap-icon://trend-up"
                });
                oTrend.addStyleClass("creatio-product-trend");

                oProductCard.addItem(oAvatar);
                oProductCard.addItem(oDetails);
                oProductCard.addItem(oTrend);
                oProductsList.addItem(oProductCard);
            });

            oSection.addItem(oProductsList);
            return oSection;
        },

        /**
         * Create Engagement History Section
         * @private
         */
        _createEngagementHistory: function () {
            const oSection = new VBox();
            oSection.addStyleClass("creatio-ai-section");

            // Section header
            const oHeader = new HBox({
                alignItems: "Center",
                justifyContent: "SpaceBetween",
                items: [
                    new HBox({
                        alignItems: "Center",
                        items: [
                            new Icon({ src: "sap-icon://history", size: "1rem" }).addStyleClass("creatio-section-icon"),
                            new Title({ text: "Engagement History", level: "H6" }).addStyleClass("creatio-section-title")
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
                    new Text({ text: "Interactions" }).addStyleClass("creatio-stat-label")
                ]
            }));
            oStatsRow.addItem(new VBox({
                alignItems: "Center",
                items: [
                    new Text({ text: "87%" }).addStyleClass("creatio-stat-number creatio-stat-success"),
                    new Text({ text: "Response Rate" }).addStyleClass("creatio-stat-label")
                ]
            }));
            oStatsRow.addItem(new VBox({
                alignItems: "Center",
                items: [
                    new Text({ text: "4h" }).addStyleClass("creatio-stat-number"),
                    new Text({ text: "Avg Response" }).addStyleClass("creatio-stat-label")
                ]
            }));
            oSection.addItem(oStatsRow);

            // Timeline
            const oTimeline = new VBox();
            oTimeline.addStyleClass("creatio-mini-timeline sapUiSmallMarginTop");

            MOCK_ENGAGEMENT.forEach((oEntry, iIndex) => {
                const oTimelineItem = new HBox({
                    alignItems: "Start"
                });
                oTimelineItem.addStyleClass("creatio-timeline-item");

                // Timeline dot and line
                const oIndicator = new VBox({
                    alignItems: "Center"
                });
                oIndicator.addStyleClass("creatio-timeline-indicator");
                
                const oDot = new Icon({ src: oEntry.icon, size: "0.875rem" });
                oDot.addStyleClass("creatio-timeline-dot");
                oIndicator.addItem(oDot);
                
                if (iIndex < MOCK_ENGAGEMENT.length - 1) {
                    const oLine = new HTML({ content: '<div class="creatio-timeline-line"></div>' });
                    oIndicator.addItem(oLine);
                }

                // Content
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
         * Render Convert to Account and Create Opportunity buttons
         * @private
         */
        _renderConvertButton: function () {
            const that = this;
            
            // Remove existing buttons if any
            if (this._oConvertButton) {
                this._oConvertButton.destroy();
            }
            if (this._oOpportunityButton) {
                this._oOpportunityButton.destroy();
            }
            
            // Create button container using HBox for proper layout
            const oButtonRow = new HBox({
                justifyContent: "Center",
                alignItems: "Center"
            });
            oButtonRow.addStyleClass("creatio-convert-btn-row");
            
            // Primary: Convert to Account button
            const oConvertBtn = new Button({
                text: "Convert to Account",
                icon: "sap-icon://customer",
                type: "Emphasized",
                press: function () {
                    that._onConvertToAccount();
                }
            });
            oConvertBtn.addStyleClass("creatio-convert-btn creatio-convert-primary");
            
            // Secondary: Create Opportunity button
            const oOpportunityBtn = new Button({
                text: "Create Opportunity",
                icon: "sap-icon://opportunity",
                type: "Default",
                press: function () {
                    that._onCreateOpportunity();
                }
            });
            oOpportunityBtn.addStyleClass("creatio-convert-btn creatio-convert-secondary");
            
            oButtonRow.addItem(oConvertBtn);
            oButtonRow.addItem(oOpportunityBtn);
            
            // Create a container div for proper positioning
            let oContainer = document.getElementById("creatioConvertBtnContainer");
            if (!oContainer) {
                oContainer = document.createElement("div");
                oContainer.id = "creatioConvertBtnContainer";
                oContainer.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;gap:0.75rem;";
                document.body.appendChild(oContainer);
            }
            
            // Place button row in container
            oButtonRow.placeAt(oContainer);
            this._oConvertButton = oConvertBtn;
            this._oOpportunityButton = oOpportunityBtn;
            
            console.log("[ProspectsCreatioExt] Convert and Opportunity buttons rendered");
        },

        /**
         * Find or create a container in the Object Page
         * @private
         */
        _findOrCreateContainer: function (sId, sClass) {
            const oView = this.base.getView();
            
            // Try to find existing container
            let oContainer = oView.byId(sId);
            
            if (!oContainer) {
                // Create new container
                oContainer = new VBox({
                    id: oView.createId(sId),
                    width: "100%"
                });
                oContainer.addStyleClass(sClass);
                
                // Try multiple injection points
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
            console.log("[ProspectsCreatioExt] Updating from entity data:", oData.prospectName);
            
            // Update Chevron State
            this._updateChevronState(oData.status);
            
            // Update Profile Model
            this._updateProfileModel(oData);
            
            // Update KPI Model
            this._updateKPIModel(oData);
            
            // Update Convert button state
            this._updateConvertButtonState(oData);
        },

        /**
         * Update profile model from entity data
         * @private
         */
        _updateProfileModel: function (oData) {
            const sName = oData.prospectName || "Unknown Prospect";
            const sInitials = this._getInitials(sName);
            const sColor = this._getAvatarColor(sName);
            
            this._oProfileModel.setData({
                name: sName,
                subtitle: oData.businessType || "",
                initials: sInitials,
                avatarColor: sColor,
                avatarUrl: "",
                badgeText: oData.prospectScore ? oData.prospectScore + "% Score" : "",
                badgeState: this._getScoreState(oData.prospectScore),
                badgeIcon: this._getScoreIcon(oData.prospectScore),
                businessType: oData.businessType || "",
                source: oData.discoverySource || "",
                sourceIcon: this._getSourceIcon(oData.discoverySource),
                owner: oData.autoAssignedTo?.fullName || "",
                createdAt: this._formatDate(oData.discoveryDate),
                phone: oData.contactPhone || "",
                email: oData.contactEmail || "",
                showCall: !!oData.contactPhone,
                showMessage: true,
                showEmail: !!oData.contactEmail,
                showSchedule: true,
                converted: oData.status === "Converted"
            });

            // Update profile sidebar if it exists
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
                const sSubtitle = this._formatDate(oData.discoveryDate) + (oData.city ? " • " + oData.city : "");
                this._oProfileSubtitle.setText(sSubtitle);
            }
            if (this._oBusinessField && this._oBusinessField._valueText) {
                this._oBusinessField._valueText.setText(oData.businessType || "-");
            }
            if (this._oSourceField && this._oSourceField._valueText) {
                this._oSourceField._valueText.setText(oData.discoverySource || "-");
            }
        },

        /**
         * Update KPI model from entity data
         * @private
         */
        _updateKPIModel: function (oData) {
            const iDaysSinceDiscovery = this._calculateDaysSince(oData.discoveryDate);
            const iProspectScore = oData.prospectScore || 0;
            const fEstValue = oData.estimatedValue || 0;
            
            this._oKPIModel.setProperty("/kpis/0/value", iDaysSinceDiscovery.toString());
            this._oKPIModel.setProperty("/kpis/0/numericValue", iDaysSinceDiscovery);
            
            // Days at current stage (mock for now)
            this._oKPIModel.setProperty("/kpis/1/value", Math.min(iDaysSinceDiscovery, 7).toString());
            this._oKPIModel.setProperty("/kpis/1/numericValue", Math.min(iDaysSinceDiscovery, 7));
            
            this._oKPIModel.setProperty("/kpis/2/value", iProspectScore + "%");
            this._oKPIModel.setProperty("/kpis/2/numericValue", iProspectScore);
            
            this._oKPIModel.setProperty("/kpis/3/value", "RM " + fEstValue.toLocaleString());
            this._oKPIModel.setProperty("/kpis/3/numericValue", fEstValue);
            
            this._oKPIModel.setProperty("/prospectScore", iProspectScore);
        },

        /**
         * Update convert button state
         * @private
         */
        _updateConvertButtonState: function (oData) {
            const bConverted = oData.status === "Converted";
            
            if (this._oConvertButton) {
                this._oConvertButton.setEnabled(!bConverted);
                
                if (bConverted) {
                    this._oConvertButton.setText("Already Converted");
                    this._oConvertButton.setType("Default");
                }
            }
            
            // Opportunity button is always enabled unless already converted
            if (this._oOpportunityButton) {
                this._oOpportunityButton.setEnabled(!bConverted);
            }
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
            const sCurrentStatus = this._oEntityData?.status || "New";
            const aStageKeys = ["New", "Engaged", "Discovery", "Proposal", "Negotiation", "Converted", "Lost"];
            const iCurrentIndex = aStageKeys.indexOf(sCurrentStatus);

            if (iTargetIndex === iCurrentIndex) return;
            if (iTargetIndex < iCurrentIndex) {
                MessageToast.show("Cannot move backwards in the pipeline");
                return;
            }

            MessageBox.confirm(
                "Move from '" + sCurrentStatus + "' to '" + oStage.label + "'?",
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
                MessageBox.error("No prospect context available");
                return;
            }
            
            const sProspectID = oContext.getProperty("ID");
            BusyIndicator.show(0);
            
            fetch("/prospect/Prospects(" + sProspectID + ")/ProspectService.changeStatus", {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ newStatus: sNewStage })
            })
            .then((response) => {
                BusyIndicator.hide();
                if (response.ok) {
                    MessageToast.show("Status updated to: " + sNewStage);
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
                case "meeting":
                    this._onQuickSchedule();
                    break;
                case "proposal":
                    MessageToast.show("Opening proposal editor...");
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
                MessageToast.show("No phone number available for WhatsApp");
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
         * Handle convert to account
         * @private
         */
        _onConvertToAccount: function () {
            const that = this;
            const oView = this.base.getView();
            const oContext = oView && oView.getBindingContext();
            
            if (!oContext) {
                MessageBox.error("No prospect context available");
                return;
            }

            const sProspectName = this._oEntityData?.prospectName || "this prospect";
            
            MessageBox.confirm(
                "Convert '" + sProspectName + "' to an Account? This will create a new account record.",
                {
                    title: "Convert to Account",
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            that._executeConvertToAccount();
                        }
                    }
                }
            );
        },

        /**
         * Execute convert to account action
         * @private
         */
        _executeConvertToAccount: function () {
            const oView = this.base.getView();
            const oContext = oView && oView.getBindingContext();
            const sProspectID = oContext.getProperty("ID");
            
            BusyIndicator.show(0);
            
            fetch("/prospect/Prospects(" + sProspectID + ")/ProspectService.convertToAccount", {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            })
            .then((response) => {
                BusyIndicator.hide();
                if (response.ok) {
                    return response.json();
                }
                throw new Error("Failed to convert prospect");
            })
            .then((oData) => {
                MessageToast.show("Prospect converted to Account successfully!");
                oContext.refresh();
                if (this._oConvertButton) {
                    this._oConvertButton.setText("Already Converted");
                    this._oConvertButton.setEnabled(false);
                    this._oConvertButton.setType("Default");
                }
                if (this._oOpportunityButton) {
                    this._oOpportunityButton.setEnabled(false);
                }
            })
            .catch((error) => {
                BusyIndicator.hide();
                MessageBox.error("Failed to convert: " + error.message);
            });
        },

        /**
         * Handle create opportunity
         * @private
         */
        _onCreateOpportunity: function () {
            const that = this;
            const oView = this.base.getView();
            const oContext = oView && oView.getBindingContext();
            
            if (!oContext) {
                MessageBox.error("No prospect context available");
                return;
            }

            const sProspectName = this._oEntityData?.prospectName || "this prospect";
            
            MessageBox.confirm(
                "Create an Opportunity from '" + sProspectName + "'? This will create a new opportunity record linked to this prospect.",
                {
                    title: "Create Opportunity",
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            that._executeCreateOpportunity();
                        }
                    }
                }
            );
        },

        /**
         * Execute create opportunity action
         * @private
         */
        _executeCreateOpportunity: function () {
            const oView = this.base.getView();
            const oContext = oView && oView.getBindingContext();
            const sProspectID = oContext.getProperty("ID");
            
            BusyIndicator.show(0);
            
            fetch("/prospect/Prospects(" + sProspectID + ")/ProspectService.createOpportunity", {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            })
            .then((response) => {
                BusyIndicator.hide();
                if (response.ok) {
                    return response.json();
                }
                throw new Error("Failed to create opportunity");
            })
            .then((oData) => {
                MessageToast.show("Opportunity created successfully!");
                oContext.refresh();
                // Optionally navigate to the new opportunity
                if (oData && oData.ID) {
                    MessageBox.information(
                        "Opportunity '" + (oData.name || "New Opportunity") + "' has been created. Would you like to view it?",
                        {
                            title: "Opportunity Created",
                            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                            onClose: function (sAction) {
                                if (sAction === MessageBox.Action.YES) {
                                    // Navigate to opportunity - adjust path as needed
                                    window.location.hash = "#/Opportunities(" + oData.ID + ")";
                                }
                            }
                        }
                    );
                }
            })
            .catch((error) => {
                BusyIndicator.hide();
                MessageBox.error("Failed to create opportunity: " + error.message);
            });
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
         * Get source icon
         * @private
         */
        _getSourceIcon: function (sSource) {
            const mIcons = {
                "Instagram": "sap-icon://camera",
                "TikTok": "sap-icon://video",
                "Facebook": "sap-icon://post",
                "LinkedIn": "sap-icon://collaborate",
                "Web": "sap-icon://world",
                "Referral": "sap-icon://contacts",
                "Lead Conversion": "sap-icon://lead-outdated"
            };
            return mIcons[sSource] || "sap-icon://world";
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
            if (this._oConvertButton) {
                this._oConvertButton.destroy();
            }
            if (this._oOpportunityButton) {
                this._oOpportunityButton.destroy();
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
            
            // Remove body class
            document.body.classList.remove("creatio-with-profile-sidebar");
        }
    });
});
