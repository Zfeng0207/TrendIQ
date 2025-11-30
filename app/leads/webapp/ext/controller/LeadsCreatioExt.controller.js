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
    "sap/f/Avatar",
    "sap/f/Card",
    "sap/ui/core/Icon",
    "sap/ui/core/BusyIndicator",
    "sap/ui/core/HTML"
], function (
    ControllerExtension, Fragment, JSONModel, MessageBox, MessageToast,
    VBox, HBox, FlexBox, Text, Title, Label, Button, ObjectNumber, ObjectStatus, 
    Panel, TextArea, ScrollContainer, List, StandardListItem, CustomListItem,
    ProgressIndicator, Link, Avatar, Card, Icon, BusyIndicator, HTML
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
                    { id: "daysSinceCreated", title: "Days Since Created", value: "0", numericValue: 0, color: "blue", icon: "sap-icon://calendar" },
                    { id: "aiScore", title: "AI Score", value: "0%", numericValue: 0, color: "green", icon: "sap-icon://target-group" },
                    { id: "trendScore", title: "Trend Score", value: "0/100", numericValue: 0, color: "purple", icon: "sap-icon://trend-up" },
                    { id: "estimatedValue", title: "Est. Value", value: "RM 0", numericValue: 0, color: "orange", icon: "sap-icon://money-bills" }
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
            
            // Delay to ensure DOM is ready
            setTimeout(() => {
                this._initializeCreatioComponents();
                this._setupBindingContextListener();
            }, 500);
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
            this._renderChevronStageBar();
            this._renderKPICards();
            this._renderEnhancedAIPanel();
            this._renderEntityProfile();
            this._renderConvertButton();
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
         * Build the chevron stage bar
         * @private
         */
        _buildChevronBar: function () {
            const that = this;
            const aStages = [
                { key: "New", label: "NEW", icon: "sap-icon://add", emoji: "➕" },
                { key: "Contacted", label: "CONTACTED", icon: "sap-icon://call", emoji: "📞" },
                { key: "Qualified", label: "QUALIFIED", icon: "sap-icon://accept", emoji: "✅" },
                { key: "Nurturing", label: "NURTURING", icon: "sap-icon://nurture-leads", emoji: "🌱" },
                { key: "Converted", label: "CONVERTED", icon: "sap-icon://complete", emoji: "🎉" },
                { key: "Lost", label: "LOST", icon: "sap-icon://decline", emoji: "❌", isNegative: true }
            ];

            const oBar = new HBox({
                justifyContent: "Start",
                alignItems: "Stretch",
                width: "100%"
            });
            oBar.addStyleClass("creatio-chevron-bar");

            aStages.forEach((oStage, iIndex) => {
                const oChevron = new VBox({
                    alignItems: "Center",
                    justifyContent: "Center"
                });
                oChevron.addStyleClass("creatio-chevron-stage");
                oChevron.addStyleClass("creatio-stage-future");
                oChevron.data("stageKey", oStage.key);
                oChevron.data("stageIndex", iIndex);

                // Stage content with icon and label
                const oContent = new VBox({
                    alignItems: "Center"
                });
                
                const oIcon = new Text({ text: oStage.emoji });
                oIcon.addStyleClass("creatio-stage-emoji");
                
                const oLabel = new Text({ text: oStage.label });
                oLabel.addStyleClass("creatio-stage-label");
                
                oContent.addItem(oIcon);
                oContent.addItem(oLabel);
                oChevron.addItem(oContent);

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

            const aStageKeys = ["New", "Contacted", "Qualified", "Nurturing", "Converted", "Lost"];
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
                    if (sCurrentStatus === "Lost") {
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
         * Create an enhanced KPI card with progress indicator
         * @private
         */
        _createEnhancedKPICard: function (oKPI) {
            const oCard = new VBox();
            oCard.addStyleClass("creatio-kpi-card kpi-" + oKPI.color);
            
            // Title row with icon
            const oTitleRow = new HBox({
                alignItems: "Center",
                justifyContent: "SpaceBetween"
            });
            
            const oTitle = new Text({ text: oKPI.title });
            oTitle.addStyleClass("creatio-kpi-title");
            oTitleRow.addItem(oTitle);

            // Value
            const oValue = new Text({ text: oKPI.value });
            oValue.addStyleClass("creatio-kpi-value");
            
            // Progress bar for scores
            let oProgress = null;
            if (oKPI.id === "aiScore" || oKPI.id === "trendScore") {
                oProgress = new ProgressIndicator({
                    percentValue: oKPI.numericValue,
                    showValue: false,
                    height: "6px",
                    state: this._getProgressState(oKPI.numericValue)
                });
                oProgress.addStyleClass("creatio-kpi-progress sapUiTinyMarginTop");
            }
            
            oCard.addItem(oTitleRow);
            oCard.addItem(oValue);
            if (oProgress) {
                oCard.addItem(oProgress);
            }
            
            // Store reference for updates
            oCard.data("kpiId", oKPI.id);
            oCard._valueText = oValue;
            oCard._progress = oProgress;
            
            return oCard;
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
         * Render Enhanced AI Assistant Panel with 4 sections
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
            
            console.log("[LeadsCreatioExt] Enhanced AI Panel rendered");
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
                    new Title({ text: "Lead Scoring", level: "H6" }).addStyleClass("creatio-section-title")
                ]
            });
            oSection.addItem(oHeader);

            // Score cards container
            const oScoreCards = new VBox();
            oScoreCards.addStyleClass("creatio-score-cards sapUiSmallMarginTop");

            // AI Score with circular indicator
            const oAIScoreCard = this._createScoreCard(
                "AI Score",
                "92%",
                92,
                "High engagement potential based on social activity and brand fit",
                "Success"
            );
            oScoreCards.addItem(oAIScoreCard);

            // Trend Score
            const oTrendScoreCard = this._createScoreCard(
                "Trend Score",
                "95/100",
                95,
                "K-Beauty products are trending strongly on TikTok",
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
            oSentimentCard.addItem(new Text({ text: "85" }).addStyleClass("creatio-score-number"));
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
                    new Text({ text: "Overall Engagement Rating" }).addStyleClass("creatio-rating-label"),
                    new ObjectStatus({
                        text: "HOT LEAD",
                        state: "Success",
                        icon: "sap-icon://heating-cooling"
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

            // Score ring visualization (using HTML for SVG circle)
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

                // Action button - use arrow icon for execute action
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
                    new Text({ text: "3" }).addStyleClass("creatio-stat-number"),
                    new Text({ text: "Contacts" }).addStyleClass("creatio-stat-label")
                ]
            }));
            oStatsRow.addItem(new VBox({
                alignItems: "Center",
                items: [
                    new Text({ text: "85%" }).addStyleClass("creatio-stat-number creatio-stat-success"),
                    new Text({ text: "Response Rate" }).addStyleClass("creatio-stat-label")
                ]
            }));
            oStatsRow.addItem(new VBox({
                alignItems: "Center",
                items: [
                    new Text({ text: "2h" }).addStyleClass("creatio-stat-number"),
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
                
                // Try to find Object Page header and add container
                const oObjectPage = oView.byId("fe::ObjectPage");
                if (oObjectPage) {
                    try {
                        const oDomRef = oObjectPage.getDomRef();
                        if (oDomRef) {
                            const oHeaderContent = oDomRef.querySelector(".sapUxAPObjectPageHeaderContent");
                            if (oHeaderContent) {
                                oContainer.placeAt(oHeaderContent, "first");
                            }
                        }
                    } catch (e) {
                        console.warn("[LeadsCreatioExt] Could not place container in header:", e);
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
            const aStageKeys = ["New", "Contacted", "Qualified", "Nurturing", "Converted", "Lost"];
            const iCurrentIndex = aStageKeys.indexOf(sCurrentStatus);

            if (iTargetIndex === iCurrentIndex) return;
            if (iTargetIndex < iCurrentIndex && oStage.key !== "Lost") {
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
                    this._onQuickCall();
                    break;
                case "catalog":
                    MessageToast.show("Opening catalog selector...");
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
         * Quick action: Schedule meeting
         * @private
         */
        _onQuickSchedule: function () {
            MessageToast.show("Opening meeting scheduler...");
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
            .then((response) => {
                BusyIndicator.hide();
                if (response.ok) {
                    return response.json();
                }
                throw new Error("Failed to convert lead");
            })
            .then((oData) => {
                MessageToast.show("Lead converted to Prospect successfully!");
                // Refresh the context
                oContext.refresh();
                // Update button state
                if (this._oConvertButton) {
                    this._oConvertButton.setText("Already Converted");
                    this._oConvertButton.setEnabled(false);
                    this._oConvertButton.setType("Default");
                }
            })
            .catch((error) => {
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
            if (this._oAIPanel) {
                this._oAIPanel.destroy();
            }
            if (this._oConvertButton) {
                this._oConvertButton.destroy();
            }
        }
    });
});
