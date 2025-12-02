/**
 * Leads Object Page Extension - Creatio-style Layout
 * Integrates ChevronStageBar, KPI Cards, Enhanced AI Assistant Panel, and Entity Profile
 * 
 * Enhanced Features:
 * - AI Sidebar with Score Breakdown, Next Best Actions, Products, Engagement History
 * - Activity Timeline with mock data
 * - Quick Action Buttons (Call, Email, WhatsApp)
 * - Convert to Prospect button
 * - Visual Score Indicators with progress rings
 */
console.log("[LeadsCreatioExt] Module file is being loaded at:", new Date().toISOString());
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
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/DateTimePicker",
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
    ProgressIndicator, Link, CheckBox, Dialog, Input, DateTimePicker,
    Avatar, Card, Icon, BusyIndicator, HTML,
    AIAssistantPanelFactory
) {
    "use strict";
    
    // Placeholder for shared module imports - will be loaded dynamically
    var ChevronStageBarController = null;
    var AIAssistantController = null;
    var SharedFormatters = null;

    // Mock data for recommended products
    const MOCK_PRODUCTS = [
        { id: "1", name: "K-Beauty Glass Skin Serum", brand: "COSRX", trendScore: 94, category: "Skincare", price: "RM 89.00" },
        { id: "2", name: "Snail Mucin Essence", brand: "COSRX", trendScore: 91, category: "Skincare", price: "RM 75.00" },
        { id: "3", name: "Rice Water Toner", brand: "I'm From", trendScore: 88, category: "Skincare", price: "RM 95.00" }
    ];

    // Mock data for engagement history
    const MOCK_ENGAGEMENT = [
        { id: "1", type: "dm", description: "TikTok DM - Product inquiry", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), icon: "sap-icon://discussion" },
        { id: "2", type: "call", description: "Follow-up call scheduled", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), icon: "sap-icon://call" },
        { id: "3", type: "email", description: "Product catalog sent", date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), icon: "sap-icon://email" }
    ];

    // Mock activity timeline
    const MOCK_ACTIVITIES = [
        { id: "1", type: "call", title: "Call scheduled", description: "Follow-up call with Michelle Tan", date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), status: "upcoming", icon: "sap-icon://call" },
        { id: "2", type: "dm", title: "TikTok DM received", description: "Interested in K-Beauty glass skin products", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), status: "completed", icon: "sap-icon://discussion" },
        { id: "3", type: "email", title: "Catalog sent", description: "K-Beauty product catalog PDF", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), status: "completed", icon: "sap-icon://email" },
        { id: "4", type: "note", title: "Lead created", description: "Auto-discovered from TikTok viral video", date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), status: "completed", icon: "sap-icon://add" }
    ];

    // Next best actions configuration
    const NEXT_BEST_ACTIONS = [
        { id: "call", label: "Schedule Call", icon: "sap-icon://call", priority: "High", dueText: "Today", type: "Emphasized" },
        { id: "catalog", label: "Send Catalog", icon: "sap-icon://document", priority: "Medium", dueText: "This week", type: "Default" },
        { id: "email", label: "Send Email", icon: "sap-icon://email", priority: "Medium", dueText: "This week", type: "Default" },
        { id: "whatsapp", label: "WhatsApp", icon: "sap-icon://discussion-2", priority: "Low", dueText: "Anytime", type: "Default" }
    ];

    // Mock tags for lead categorization
    const MOCK_TAGS = [
        { id: "ai", text: "AI", colorClass: "tag-ai", removable: true },
        { id: "hot_leads", text: "Hot_leads", colorClass: "tag-hot", removable: true },
        { id: "webinar_2023", text: "Webinar_2023", colorClass: "tag-webinar", removable: true }
    ];

    return ControllerExtension.extend("beautyleads.leads.ext.controller.LeadsCreatioExt", {
        // Component references
        _oChevronController: null,
        _oAIAssistantController: null,
        _oProfileModel: null,
        _oKPIModel: null,
        _oEntityData: null,
        
        // Fragment references
        _oChevronFragment: null,
        _oKPIFragment: null,
        _oAIFragment: null,
        _oProfileFragment: null,
        _oAIPanel: null,

        /**
         * Lifecycle: Controller initialization
         */
        onInit: function () {
            console.log("[LeadsCreatioExt] Initializing Creatio-style extensions (Enhanced)");
            
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
                jobTitle: "",
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
                allowCalls: true,
                allowEmails: true,
                allowSMS: false,
                converted: false
            });

            // KPI model with score data
            this._oKPIModel = new JSONModel({
                kpis: [
                    { id: "daysInFunnel", title: "Days in funnel", value: "16", numericValue: 16, color: "blue" },
                    { id: "daysAtStage", title: "Days at current stage", value: "14", numericValue: 14, color: "teal" },
                    { id: "emailsSent", title: "Emails sent", value: "6", numericValue: 6, color: "orange" },
                    { id: "outgoingCalls", title: "Outgoing calls", value: "4", numericValue: 4, color: "red" }
                ],
                aiScore: 0,
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
                console.log("[LeadsCreatioExt] Loaded creatio-layout.css");
            }
        },

        /**
         * Called after view rendering
         * @private
         */
        _onViewAfterRendering: function () {
            console.log("[LeadsCreatioExt] View rendered, initializing components");
            
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
                    console.error("[LeadsCreatioExt] Error loading entity data:", err);
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
                console.warn("[LeadsCreatioExt] View not available");
                return;
            }

            // Render components
            this._renderTagChips();
            this._renderChevronStageBar();
            this._renderKPICards();
            this._renderDashboardWidgets();
            this._renderProfileSidebar();
            this._renderEnhancedAIPanel();
            this._renderEntityProfile();
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

            console.log("[LeadsCreatioExt] Tag chips rendered");
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
                initials: "OJ",
                displaySize: "L",
                backgroundColor: "Accent3"
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

            // Account field
            const oAccountField = this._createProfileField("Account", "Loading...", "sap-icon://building");
            oInfoSection.addItem(oAccountField);

            // Job Title field
            const oJobField = this._createProfileField("Full job Title", "Loading...", "sap-icon://employee");
            oInfoSection.addItem(oJobField);

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
                { text: "Schedule follow-up call", icon: "sap-icon://call", date: "Today" },
                { text: "Send product catalog", icon: "sap-icon://document", date: "Tomorrow" },
                { text: "Review meeting notes", icon: "sap-icon://notes", date: "Dec 2" }
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
            this._oAccountField = oAccountField;
            this._oJobField = oJobField;

            // Add class to body for layout adjustment
            document.body.classList.add("creatio-with-profile-sidebar");

            console.log("[LeadsCreatioExt] Profile sidebar rendered");
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
            let oContainer = this._findOrCreateContainer("leadsChevronContainer", "creatio-header-stage-section");
            
            if (oContainer) {
                // Create wrapper
                const oWrapper = new VBox({
                    class: "creatio-chevron-container sapUiSmallMarginBottom"
                });
                
                // Build chevron stages
                const oChevronBar = this._buildChevronBar();
                oWrapper.addItem(oChevronBar);
                
                oContainer.addItem(oWrapper);
                console.log("[LeadsCreatioExt] Chevron Stage Bar rendered");
            }
        },

        /**
         * Build the chevron stage bar (Professional - No Emojis)
         * @private
         */
        _buildChevronBar: function () {
            const that = this;
            const aStages = [
                { key: "New", label: "NEW", icon: "sap-icon://add" },
                { key: "Contacted", label: "CONTACTED", icon: "sap-icon://call" },
                { key: "Engaged", label: "ENGAGED", icon: "sap-icon://collaborate" },
                { key: "Qualified", label: "QUALIFIED", icon: "sap-icon://accept" },
                { key: "Converted", label: "CONVERTED", icon: "sap-icon://complete" },
                { key: "Disqualified", label: "DISQUALIFIED", icon: "sap-icon://decline", isNegative: true }
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

            const aStageKeys = ["New", "Contacted", "Engaged", "Qualified", "Converted", "Disqualified"];
            const iCurrentIndex = aStageKeys.indexOf(sCurrentStatus);

            // Find all chevron stages and update their state
            const oContainer = oView.byId("leadsChevronContainer");
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
                    if (sCurrentStatus === "Disqualified") {
                        oChevron.addStyleClass("creatio-stage-negative");
                    }
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
            const oContainer = this._findOrCreateContainer("leadsKPIContainer", "creatio-header-kpi-section");
            
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
                console.log("[LeadsCreatioExt] KPI Cards rendered");
            }
        },

        /**
         * Create a clean KPI card (Creatio style - no progress bars)
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
                        <span class="creatio-quick-info-label">Customer need</span>
                        <span class="creatio-quick-info-value">Beauty Products</span>
                    </div>
                    <div class="creatio-quick-info-item">
                        <span class="creatio-quick-info-label">Contact</span>
                        <span class="creatio-quick-info-value link">Sarah Chen</span>
                    </div>
                    <div class="creatio-quick-info-item">
                        <span class="creatio-quick-info-label">Account</span>
                        <span class="creatio-quick-info-value link">GlowUp Cosmetics</span>
                    </div>
                    <div class="creatio-quick-info-item">
                        <span class="creatio-quick-info-label">Created on</span>
                        <span class="creatio-quick-info-value">Nov 14, 2025</span>
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
                                    <span class="creatio-metric-label">Forms submitted</span>
                                    <span class="creatio-metric-value">
                                        <span class="creatio-metric-icon success">✓</span> 2
                                    </span>
                                </div>
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Duration of last visit</span>
                                    <span class="creatio-metric-value">3m 45s</span>
                                </div>
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Last site visit</span>
                                    <span class="creatio-metric-value">Nov 28, 2025</span>
                                </div>
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Avg. duration</span>
                                    <span class="creatio-metric-value">2m 15s</span>
                                </div>
                            </div>
                            <div class="creatio-widget-chart">
                                <span class="creatio-chart-title">Site activity (last 30 days)</span>
                                <div class="creatio-chart-container">
                                    <svg class="creatio-chart-svg" viewBox="0 0 300 100" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="engagementGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" style="stop-color:#2196F3;stop-opacity:0.2"/>
                                                <stop offset="100%" style="stop-color:#2196F3;stop-opacity:0"/>
                                            </linearGradient>
                                        </defs>
                                        <path class="creatio-chart-area primary" d="M0,80 L30,60 L60,70 L90,40 L120,55 L150,35 L180,45 L210,25 L240,30 L270,20 L300,15 L300,100 L0,100 Z" fill="url(#engagementGradient)"/>
                                        <path class="creatio-chart-line primary" d="M0,80 L30,60 L60,70 L90,40 L120,55 L150,35 L180,45 L210,25 L240,30 L270,20 L300,15"/>
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
                            <span class="creatio-widget-title">Email nurturing</span>
                        </div>
                        <div class="creatio-widget-content">
                            <div class="creatio-widget-metrics">
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Sent emails</span>
                                    <span class="creatio-metric-value">6</span>
                                </div>
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Open %</span>
                                    <span class="creatio-metric-value">
                                        <span class="creatio-metric-icon success">✓</span> 83%
                                    </span>
                                </div>
                                <div class="creatio-metric-item">
                                    <span class="creatio-metric-label">Clicks %</span>
                                    <span class="creatio-metric-value">
                                        <span class="creatio-metric-icon warning">!</span> 33%
                                    </span>
                                </div>
                            </div>
                            <div class="creatio-widget-chart">
                                <span class="creatio-chart-title">Email engagement (last 6 emails)</span>
                                <div class="creatio-chart-container">
                                    <svg class="creatio-chart-svg" viewBox="0 0 300 100" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="emailGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:0.2"/>
                                                <stop offset="100%" style="stop-color:#4CAF50;stop-opacity:0"/>
                                            </linearGradient>
                                        </defs>
                                        <path class="creatio-chart-area success" d="M0,40 L50,35 L100,55 L150,30 L200,45 L250,25 L300,35 L300,100 L0,100 Z" fill="url(#emailGradient)"/>
                                        <path class="creatio-chart-line success" d="M0,40 L50,35 L100,55 L150,30 L200,45 L250,25 L300,35"/>
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
                            Contact roles (2)
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
                                <td class="link">Sarah Chen</td>
                                <td>Decision maker</td>
                                <td>✓</td>
                            </tr>
                            <tr>
                                <td class="link">Mike Johnson</td>
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
                // Strategy 1: Try to find the wrapper and place before the sections
                const oWrapper = oObjectPage.querySelector(".sapUxAPObjectPageWrapper");
                if (oWrapper) {
                    // Insert at beginning of wrapper content, after header
                    const oScrollContainer = oWrapper.querySelector(".sapUxAPObjectPageWrapperTransition") || oWrapper;
                    const oFirstSection = oScrollContainer.querySelector(".sapUxAPObjectPageSection");
                    if (oFirstSection) {
                        oFirstSection.parentNode.insertBefore(oDashContainer, oFirstSection);
                        console.log("[LeadsCreatioExt] Dashboard widgets rendered (before sections)");
                        return;
                    }
                }

                // Strategy 2: Fallback to header content
                const oHeaderContent = oObjectPage.querySelector(".sapUxAPObjectPageHeaderContent");
                if (oHeaderContent) {
                    oHeaderContent.appendChild(oDashContainer);
                    console.log("[LeadsCreatioExt] Dashboard widgets rendered (in header)");
                    return;
                }
            }
            
            // Strategy 3: Last resort - append to body at fixed position
            document.body.appendChild(oDashContainer);
            oDashContainer.style.cssText = "position:fixed;top:200px;left:0;right:380px;z-index:100;";
            console.log("[LeadsCreatioExt] Dashboard widgets rendered (fixed fallback)");
        },

        /**
         * Get progress indicator state based on value
         * @private
         */
        _getProgressState: function (iValue) {
            if (iValue >= 70) return "Success";
            if (iValue >= 40) return "Warning";
            return "Error";
        },

        /**
         * Render Enhanced AI Assistant Panel using unified factory
         * @private
         */
        _renderEnhancedAIPanel: function () {
            const that = this;
            
            // Get current lead data for context
            const oEntityData = this._oEntityData || {};
            
            // Create AI panel using factory
            this._oAIPanelFactory = AIAssistantPanelFactory.create({
                entityType: "leads",
                entityData: oEntityData,
                callbacks: {
                    onQuickCall: function() { that._onQuickCall(); },
                    onQuickEmail: function() { that._onQuickEmail(); },
                    onQuickWhatsapp: function() { that._onQuickWhatsApp(); },
                    onQuickSchedule: function() { that._onQuickSchedule(); },
                    onActionPress: function(sActionId) { that._onActionButtonPress(sActionId); },
                    onRefresh: function() { that._refreshAIInsights(); },
                    onChatMessage: function(sMessage) { that._onAIChatMessage(sMessage); }
                }
            });
            
            this._oAIPanel = this._oAIPanelFactory.getPanel();
            console.log("[LeadsCreatioExt] Enhanced AI Panel rendered via factory");
        },

        /**
         * Handle AI chat message
         * @private
         */
        _onAIChatMessage: function (sMessage) {
            console.log("[LeadsCreatioExt] AI Chat message:", sMessage);
            MessageToast.show("AI: Processing your request...");
            // TODO: Integrate with AI service
        },

        /**
         * Render Entity Profile with enhanced avatar
         * @private
         */
        _renderEntityProfile: function () {
            // Profile is typically rendered in the Object Page header area
            // We enhance the header with avatar and quick actions
            console.log("[LeadsCreatioExt] Entity Profile configured");
        },

        /**
         * Render Convert to Prospect button
         * @private
         */
        _renderConvertButton: function () {
            const that = this;
            
            // Remove existing button if any
            if (this._oConvertButton) {
                this._oConvertButton.destroy();
            }
            
            // Create floating action button
            const oConvertBtn = new Button({
                text: "Convert to Prospect",
                icon: "sap-icon://lead-outdated",
                type: "Emphasized",
                press: function () {
                    that._onConvertToProspect();
                }
            });
            oConvertBtn.addStyleClass("creatio-convert-btn");
            
            // Create a container div for proper positioning
            let oContainer = document.getElementById("creatioConvertBtnContainer");
            if (!oContainer) {
                oContainer = document.createElement("div");
                oContainer.id = "creatioConvertBtnContainer";
                oContainer.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;";
                document.body.appendChild(oContainer);
            }
            
            // Place button in container
            oConvertBtn.placeAt(oContainer);
            this._oConvertButton = oConvertBtn;
            
            console.log("[LeadsCreatioExt] Convert button rendered");
        },

        /**
         * Render Quick Action Buttons in AI Panel
         * @private
         */
        _renderQuickActionButtonsInPanel: function () {
            // Quick actions are already rendered in _createNextBestActions
            // This method can be used to add standalone quick action buttons elsewhere
            console.log("[LeadsCreatioExt] Quick action buttons configured in AI panel");
        },

        /**
         * Create Quick Action Buttons for contact info
         * @private
         */
        _createQuickActionButtons: function () {
            const that = this;
            
            const oButtonsRow = new HBox({
                justifyContent: "Center"
            });
            oButtonsRow.addStyleClass("creatio-quick-actions sapUiSmallMarginTop");

            // Call button
            const oCallBtn = new Button({
                icon: "sap-icon://call",
                type: "Default",
                tooltip: "Call",
                press: function () { that._onQuickCall(); }
            });
            oCallBtn.addStyleClass("creatio-quick-btn creatio-quick-call");

            // Email button
            const oEmailBtn = new Button({
                icon: "sap-icon://email",
                type: "Default",
                tooltip: "Send Email",
                press: function () { that._onQuickEmail(); }
            });
            oEmailBtn.addStyleClass("creatio-quick-btn creatio-quick-email");

            // WhatsApp button
            const oWhatsAppBtn = new Button({
                icon: "sap-icon://discussion-2",
                type: "Default",
                tooltip: "WhatsApp",
                press: function () { that._onQuickWhatsApp(); }
            });
            oWhatsAppBtn.addStyleClass("creatio-quick-btn creatio-quick-whatsapp");

            // Schedule button
            const oScheduleBtn = new Button({
                icon: "sap-icon://appointment",
                type: "Default",
                tooltip: "Schedule Meeting",
                press: function () { that._onQuickSchedule(); }
            });
            oScheduleBtn.addStyleClass("creatio-quick-btn creatio-quick-schedule");

            oButtonsRow.addItem(oCallBtn);
            oButtonsRow.addItem(oEmailBtn);
            oButtonsRow.addItem(oWhatsAppBtn);
            oButtonsRow.addItem(oScheduleBtn);

            return oButtonsRow;
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
                        // 1. Try standard header content
                        const oHeaderContent = oDomRef.querySelector(".sapUxAPObjectPageHeaderContent");
                        if (oHeaderContent) {
                            oContainer.placeAt(oHeaderContent, "first");
                            return oContainer;
                        }
                        
                        // 2. Try header title (fallback)
                        const oHeaderTitle = oDomRef.querySelector(".sapUxAPObjectPageHeaderTitle");
                        if (oHeaderTitle) {
                            oContainer.placeAt(oHeaderTitle, "after");
                            return oContainer;
                        }

                        // 3. Fallback: Prepend to Object Page Wrapper
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
            console.log("[LeadsCreatioExt] Updating from entity data:", oData.outletName);
            
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
            const sName = oData.outletName || oData.contactName || "Unknown Lead";
            const sInitials = this._getInitials(sName);
            const sColor = this._getAvatarColor(sName);
            
            this._oProfileModel.setData({
                name: sName,
                subtitle: oData.brandToPitch || "",
                initials: sInitials,
                avatarColor: sColor,
                avatarUrl: "",
                badgeText: oData.aiScore ? oData.aiScore + "% AI Score" : "",
                badgeState: this._getScoreState(oData.aiScore),
                badgeIcon: this._getScoreIcon(oData.aiScore),
                account: oData.outletName || "",
                jobTitle: oData.contactName || "",
                source: oData.platform || oData.source || "",
                sourceIcon: this._getPlatformIcon(oData.platform),
                owner: oData.owner?.fullName || "",
                createdAt: this._formatDate(oData.createdAt),
                phone: oData.contactPhone || "",
                email: oData.contactEmail || "",
                showCall: !!oData.contactPhone,
                showMessage: true,
                showEmail: !!oData.contactEmail,
                showSchedule: true,
                allowCalls: true,
                allowEmails: true,
                allowSMS: false,
                converted: oData.converted || false
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
                const sSubtitle = this._formatDate(oData.createdAt) + (oData.city ? " • " + oData.city : "");
                this._oProfileSubtitle.setText(sSubtitle);
            }
            if (this._oAccountField && this._oAccountField._valueText) {
                this._oAccountField._valueText.setText(oData.outletName || "-");
            }
            if (this._oJobField && this._oJobField._valueText) {
                this._oJobField._valueText.setText(oData.contactName || "-");
            }
        },

        /**
         * Update KPI model from entity data
         * @private
         */
        _updateKPIModel: function (oData) {
            const iDaysSinceCreated = this._calculateDaysSince(oData.createdAt);
            const iAIScore = oData.aiScore || 0;
            const iTrendScore = oData.trendScore || 0;
            const fEstValue = oData.estimatedValue || 0;
            
            this._oKPIModel.setProperty("/kpis/0/value", iDaysSinceCreated.toString());
            this._oKPIModel.setProperty("/kpis/0/numericValue", iDaysSinceCreated);
            
            this._oKPIModel.setProperty("/kpis/1/value", iAIScore + "%");
            this._oKPIModel.setProperty("/kpis/1/numericValue", iAIScore);
            
            this._oKPIModel.setProperty("/kpis/2/value", iTrendScore + "/100");
            this._oKPIModel.setProperty("/kpis/2/numericValue", iTrendScore);
            
            this._oKPIModel.setProperty("/kpis/3/value", "RM " + fEstValue.toLocaleString());
            this._oKPIModel.setProperty("/kpis/3/numericValue", fEstValue);
            
            this._oKPIModel.setProperty("/aiScore", iAIScore);
            this._oKPIModel.setProperty("/trendScore", iTrendScore);
            this._oKPIModel.setProperty("/sentimentScore", oData.sentimentScore || 0);
            this._oKPIModel.setProperty("/sentimentLabel", oData.sentimentLabel || "Neutral");
        },

        /**
         * Update convert button state
         * @private
         */
        _updateConvertButtonState: function (oData) {
            if (this._oConvertButton) {
                const bEnabled = !oData.converted && oData.status === "Qualified";
                this._oConvertButton.setEnabled(bEnabled);
                
                if (oData.converted) {
                    this._oConvertButton.setText("Already Converted");
                    this._oConvertButton.setType("Default");
                }
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
            const aStageKeys = ["New", "Contacted", "Engaged", "Qualified", "Converted", "Disqualified"];
            const iCurrentIndex = aStageKeys.indexOf(sCurrentStatus);

            if (iTargetIndex === iCurrentIndex) return;
            if (iTargetIndex < iCurrentIndex && oStage.key !== "Disqualified") {
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
                MessageBox.error("No lead context available");
                return;
            }
            
            const sLeadID = oContext.getProperty("ID");
            BusyIndicator.show(0);
            
            fetch("/lead/Leads(" + sLeadID + ")/LeadService.changeStatus", {
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
                case "call":
                    this._onQuickSchedule(); // Schedule a call task
                    break;
                case "catalog":
                    this._onSendCatalog();
                    break;
                case "email":
                    this._onQuickEmail();
                    break;
                case "whatsapp":
                    this._onQuickWhatsApp();
                    break;
            }
        },
        
        /**
         * Send Catalog - Opens dialog to select products and compose email
         * @private
         */
        _onSendCatalog: function () {
            const that = this;
            const sLeadName = this._oEntityData?.outletName || "Lead";
            const sLeadEmail = this._oEntityData?.contactEmail || "";
            
            // Create product checkboxes from MOCK_PRODUCTS
            const oProductList = new VBox();
            oProductList.addStyleClass("sapUiSmallMargin");
            
            const aProductCheckboxes = [];
            MOCK_PRODUCTS.forEach(function (oProduct) {
                const oRow = new HBox({
                    alignItems: "Center",
                    justifyContent: "SpaceBetween"
                });
                oRow.addStyleClass("sapUiTinyMarginBottom");
                
                const oCheckBox = new CheckBox({
                    text: oProduct.name,
                    selected: true // Pre-select all products
                });
                oCheckBox.data("product", oProduct);
                aProductCheckboxes.push(oCheckBox);
                
                const oPrice = new Text({
                    text: oProduct.price
                }).addStyleClass("sapUiTinyMarginBegin");
                
                const oBrand = new Text({
                    text: oProduct.brand
                }).addStyleClass("sapUiTinyMarginBegin sapThemeHighlight-asColor");
                
                oRow.addItem(oCheckBox);
                oRow.addItem(oBrand);
                oRow.addItem(oPrice);
                oProductList.addItem(oRow);
            });
            
            // Dialog content
            const oDialogContent = new VBox({
                items: [
                    new Text({
                        text: "Select products to include in the catalog email:"
                    }).addStyleClass("sapUiSmallMarginBottom"),
                    oProductList
                ]
            });
            
            // Create dialog
            const oDialog = new Dialog({
                title: "Send Product Catalog",
                contentWidth: "450px",
                content: oDialogContent,
                beginButton: new Button({
                    text: "Compose Email",
                    type: "Emphasized",
                    icon: "sap-icon://email",
                    press: function () {
                        // Get selected products
                        const aSelectedProducts = [];
                        aProductCheckboxes.forEach(function (oCheckBox) {
                            if (oCheckBox.getSelected()) {
                                aSelectedProducts.push(oCheckBox.data("product"));
                            }
                        });
                        
                        if (aSelectedProducts.length === 0) {
                            MessageToast.show("Please select at least one product");
                            return;
                        }
                        
                        // Compose email
                        that._composeProductCatalogEmail(sLeadEmail, sLeadName, aSelectedProducts);
                        oDialog.close();
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });
            
            oDialog.open();
        },
        
        /**
         * Compose and open email with selected products
         * @private
         */
        _composeProductCatalogEmail: function (sEmail, sLeadName, aProducts) {
            // Build email subject
            const sSubject = encodeURIComponent("Product Catalog for " + sLeadName);
            
            // Build email body with product list
            let sBody = "Dear " + sLeadName + ",\n\n";
            sBody += "Thank you for your interest in our products. Here are our recommended products for you:\n\n";
            
            aProducts.forEach(function (oProduct, iIndex) {
                sBody += (iIndex + 1) + ". " + oProduct.name + "\n";
                sBody += "   Brand: " + oProduct.brand + "\n";
                sBody += "   Price: " + oProduct.price + "\n";
                sBody += "   Trend Score: " + oProduct.trendScore + "%\n\n";
            });
            
            sBody += "Please let me know if you would like more information about any of these products.\n\n";
            sBody += "Best regards,\n";
            sBody += "Your Beauty Sales Team";
            
            const sEncodedBody = encodeURIComponent(sBody);
            
            // Open email client
            const sMailtoUrl = "mailto:" + (sEmail || "") + "?subject=" + sSubject + "&body=" + sEncodedBody;
            window.location.href = sMailtoUrl;
            
            MessageToast.show("Email composer opened with " + aProducts.length + " product(s)");
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
                // Format phone number for WhatsApp (remove non-digits, add country code if needed)
                const sCleanPhone = sPhone.replace(/\D/g, "");
                window.open("https://wa.me/" + sCleanPhone, "_blank");
            } else {
                MessageToast.show("No phone number available for WhatsApp");
            }
        },

        /**
         * Quick action: Schedule task/meeting - Opens dialog to create a task
         * @private
         */
        _onQuickSchedule: function () {
            const that = this;
            const sLeadName = this._oEntityData?.outletName || "Lead";
            
            // Create dialog content
            const oSubjectInput = new Input({
                value: "Follow-up with " + sLeadName,
                placeholder: "Enter task subject",
                width: "100%"
            });
            
            // Set default date to tomorrow at 10:00 AM
            const oDefaultDate = new Date();
            oDefaultDate.setDate(oDefaultDate.getDate() + 1);
            oDefaultDate.setHours(10, 0, 0, 0);
            
            const oDateTimePicker = new DateTimePicker({
                value: oDefaultDate.toISOString(),
                width: "100%",
                placeholder: "Select date and time"
            });
            
            const oNotesInput = new TextArea({
                placeholder: "Add notes (optional)",
                width: "100%",
                rows: 3
            });
            
            const oDialogContent = new VBox({
                items: [
                    new VBox({
                        items: [
                            new Label({ text: "Subject", required: true }),
                            oSubjectInput
                        ]
                    }).addStyleClass("sapUiSmallMarginBottom"),
                    new VBox({
                        items: [
                            new Label({ text: "Due Date & Time", required: true }),
                            oDateTimePicker
                        ]
                    }).addStyleClass("sapUiSmallMarginBottom"),
                    new VBox({
                        items: [
                            new Label({ text: "Notes" }),
                            oNotesInput
                        ]
                    })
                ]
            }).addStyleClass("sapUiSmallMargin");
            
            // Create dialog
            const oDialog = new Dialog({
                title: "Schedule Task",
                contentWidth: "400px",
                content: oDialogContent,
                beginButton: new Button({
                    text: "Create Task",
                    type: "Emphasized",
                    press: function () {
                        const sSubject = oSubjectInput.getValue();
                        const sDueDate = oDateTimePicker.getValue();
                        const sNotes = oNotesInput.getValue();
                        
                        if (!sSubject) {
                            MessageToast.show("Subject is required");
                            return;
                        }
                        if (!sDueDate) {
                            MessageToast.show("Due date is required");
                            return;
                        }
                        
                        // Call backend to create task
                        that._executeScheduleTask(sSubject, sDueDate, sNotes);
                        oDialog.close();
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });
            
            oDialog.open();
        },
        
        /**
         * Execute schedule task via backend
         * @private
         */
        _executeScheduleTask: function (sSubject, sDueDate, sNotes) {
            const that = this;
            const oView = this.base.getView();
            const oContext = oView && oView.getBindingContext();
            
            if (!oContext) {
                MessageBox.error("No lead context available");
                return;
            }
            
            const sLeadID = oContext.getProperty("ID");
            BusyIndicator.show(0);
            
            // Format date for backend
            const oDate = new Date(sDueDate);
            const sFormattedDate = oDate.toISOString();
            
            fetch("/lead/Leads(" + sLeadID + ")/LeadService.scheduleTask", {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    subject: sSubject,
                    dueDate: sFormattedDate,
                    notes: sNotes || ""
                })
            })
            .then(function (response) {
                BusyIndicator.hide();
                if (response.ok) {
                    return response.json();
                }
                throw new Error("Failed to create task");
            })
            .then(function (oData) {
                MessageToast.show("Task scheduled successfully!");
                // Refresh the view to show updated data
                if (oContext) {
                    oContext.refresh();
                }
            })
            .catch(function (error) {
                BusyIndicator.hide();
                MessageBox.error("Failed to schedule task: " + error.message);
            });
        },

        /**
         * Handle convert to prospect
         * @private
         */
        _onConvertToProspect: function () {
            const that = this;
            const oView = this.base.getView();
            const oContext = oView && oView.getBindingContext();
            
            if (!oContext) {
                MessageBox.error("No lead context available");
                return;
            }

            const sLeadName = this._oEntityData?.outletName || "this lead";
            
            MessageBox.confirm(
                "Convert '" + sLeadName + "' to a Prospect? This will create a new prospect record.",
                {
                    title: "Convert to Prospect",
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            that._executeConvertToProspect();
                        }
                    }
                }
            );
        },

        /**
         * Execute convert to prospect action
         * @private
         */
        _executeConvertToProspect: function () {
            const that = this;
            const oView = this.base.getView();
            const oContext = oView && oView.getBindingContext();
            const sLeadID = oContext.getProperty("ID");
            
            BusyIndicator.show(0);
            
            fetch("/lead/Leads(" + sLeadID + ")/LeadService.convertToProspect", {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            })
            .then(function (response) {
                BusyIndicator.hide();
                if (response.ok) {
                    return response.json();
                }
                throw new Error("Failed to convert lead");
            })
            .then(function (oData) {
                // Update button state
                if (that._oConvertButton) {
                    that._oConvertButton.setText("Already Converted");
                    that._oConvertButton.setEnabled(false);
                    that._oConvertButton.setType("Default");
                }
                
                // Show success message and navigate to new Prospect page
                MessageToast.show("Lead converted to Prospect successfully! Redirecting...", {
                    duration: 1500
                });
                
                // Navigate to the new Prospect detail page after a short delay
                const sProspectID = oData.prospectID;
                if (sProspectID) {
                    setTimeout(function () {
                        // Navigate to Prospect app with the new Prospect ID
                        const sProspectUrl = "/beautyleads.prospects/index.html#/Prospects(" + sProspectID + ")";
                        console.log("[LeadsCreatioExt] Navigating to Prospect:", sProspectUrl);
                        window.location.href = sProspectUrl;
                    }, 1500);
                } else {
                    // Fallback: refresh current context if no prospect ID returned
                    oContext.refresh();
                }
            })
            .catch(function (error) {
                BusyIndicator.hide();
                MessageBox.error("Failed to convert: " + error.message);
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
            // In real implementation, this would call the AI service
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
         * Get platform icon
         * @private
         */
        _getPlatformIcon: function (sPlatform) {
            const mIcons = {
                "Instagram": "sap-icon://camera",
                "TikTok": "sap-icon://video",
                "Facebook": "sap-icon://post",
                "LinkedIn": "sap-icon://collaborate",
                "Web": "sap-icon://world",
                "Referral": "sap-icon://contacts"
            };
            return mIcons[sPlatform] || "sap-icon://world";
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
         * Get entity data
         * @private
         */
        _getEntityData: function () {
            return this._oEntityData;
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
            if (this._oConvertButton) {
                this._oConvertButton.destroy();
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
            
            // Remove body class
            document.body.classList.remove("creatio-with-profile-sidebar");
        }
    });
});
