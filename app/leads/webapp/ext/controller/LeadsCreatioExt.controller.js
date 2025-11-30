/**
 * Leads Object Page Extension - Creatio-style Layout
 * Integrates ChevronStageBar, KPI Cards, AI Assistant Panel, and Entity Profile
 */
sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Text",
    "sap/m/Title",
    "sap/m/Button",
    "sap/m/ObjectNumber",
    "sap/m/ObjectStatus",
    "sap/m/Panel",
    "sap/m/TextArea",
    "sap/m/ScrollContainer",
    "sap/f/Avatar",
    "sap/ui/core/Icon",
    "sap/ui/core/BusyIndicator",
    "beautyleads/shared/ChevronStageBarController",
    "beautyleads/shared/AIAssistantController",
    "beautyleads/shared/SharedFormatters"
], function (
    ControllerExtension, Fragment, JSONModel, MessageBox, MessageToast,
    VBox, HBox, Text, Title, Button, ObjectNumber, ObjectStatus, Panel, TextArea,
    ScrollContainer, Avatar, Icon, BusyIndicator,
    ChevronStageBarController, AIAssistantController, SharedFormatters
) {
    "use strict";

    return ControllerExtension.extend("beautyleads.leads.ext.controller.LeadsCreatioExt", {
        // Component references
        _oChevronController: null,
        _oAIAssistantController: null,
        _oProfileModel: null,
        _oKPIModel: null,
        
        // Fragment references
        _oChevronFragment: null,
        _oKPIFragment: null,
        _oAIFragment: null,
        _oProfileFragment: null,

        /**
         * Lifecycle: Controller initialization
         */
        onInit: function () {
            console.log("[LeadsCreatioExt] Initializing Creatio-style extensions");
            
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
            // Profile model
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
                showCall: true,
                showMessage: true,
                showEmail: true,
                showSchedule: true,
                allowCalls: true,
                allowEmails: true,
                allowSMS: false
            });

            // KPI model
            this._oKPIModel = new JSONModel({
                kpis: [
                    { id: "daysSinceCreated", title: "Days Since Created", value: "0", color: "blue", icon: "sap-icon://calendar" },
                    { id: "aiScore", title: "AI Score", value: "0%", color: "green", icon: "sap-icon://target-group" },
                    { id: "sentimentScore", title: "Sentiment", value: "0", color: "purple", icon: "sap-icon://sentiment-positive" },
                    { id: "followUps", title: "Follow-ups", value: "0", color: "orange", icon: "sap-icon://activity-items" }
                ]
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
            const that = this;
            const oView = this.base.getView();
            
            if (!oView) {
                console.warn("[LeadsCreatioExt] View not available");
                return;
            }

            // Initialize Chevron Stage Bar Controller
            this._oChevronController = new ChevronStageBarController({
                view: oView,
                entityType: "leads",
                onStageChange: this._onStageChange.bind(this)
            });

            // Initialize AI Assistant Controller
            this._oAIAssistantController = new AIAssistantController({
                view: oView,
                entityType: "leads",
                serviceUrl: "/ai-assistant/",
                getEntityData: this._getEntityData.bind(this)
            });

            // Render components
            this._renderChevronStageBar();
            this._renderKPICards();
            this._renderAIPanel();
            this._renderEntityProfile();
        },

        /**
         * Render Chevron Stage Bar
         * @private
         */
        _renderChevronStageBar: function () {
            const oView = this.base.getView();
            
            // Find or create container in Object Page header
            let oContainer = this._findOrCreateContainer("leadsChevronContainer", "creatio-header-stage-section");
            
            if (oContainer && this._oChevronController) {
                // Create wrapper
                const oWrapper = new VBox({
                    class: "creatio-chevron-container sapUiSmallMarginBottom"
                });
                
                // Render chevron bar into wrapper
                this._oChevronController.render(oWrapper);
                
                oContainer.addItem(oWrapper);
                console.log("[LeadsCreatioExt] Chevron Stage Bar rendered");
            }
        },

        /**
         * Render KPI Cards Row
         * @private
         */
        _renderKPICards: function () {
            const oContainer = this._findOrCreateContainer("leadsKPIContainer", "creatio-header-kpi-section");
            
            if (oContainer) {
                const oKPIRow = new HBox({
                    class: "creatio-kpi-row sapUiSmallMarginBottom",
                    justifyContent: "Start",
                    wrap: "Wrap"
                });
                
                // Create KPI cards
                const aKPIs = this._oKPIModel.getProperty("/kpis");
                aKPIs.forEach((oKPI, iIndex) => {
                    const oCard = this._createKPICard(oKPI);
                    oKPIRow.addItem(oCard);
                });
                
                oContainer.addItem(oKPIRow);
                console.log("[LeadsCreatioExt] KPI Cards rendered");
            }
        },

        /**
         * Create a single KPI card
         * @private
         */
        _createKPICard: function (oKPI) {
            const oCard = new VBox({
                class: "creatio-kpi-card kpi-" + oKPI.color
            });
            
            // Title
            const oTitle = new Text({
                text: oKPI.title,
                class: "creatio-kpi-title"
            });
            
            // Value
            const oValue = new Text({
                text: oKPI.value,
                class: "creatio-kpi-value"
            });
            
            oCard.addItem(oTitle);
            oCard.addItem(oValue);
            
            // Store reference for updates
            oCard.data("kpiId", oKPI.id);
            oCard._valueText = oValue;
            
            return oCard;
        },

        /**
         * Render AI Assistant Panel
         * @private
         */
        _renderAIPanel: function () {
            const that = this;
            
            // Create AI panel container (fixed position sidebar)
            const oAIPanel = new Panel({
                class: "creatio-ai-panel",
                expandable: false,
                expanded: true,
                headerText: ""
            });

            // Custom header
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
                            new Button({
                                icon: "sap-icon://undo",
                                type: "Transparent",
                                tooltip: "Reset Chat",
                                press: function () {
                                    that._onResetAIChat();
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
            });

            // Welcome message
            const oWelcome = this._createAIWelcomeSection();
            
            // Quick actions
            const oQuickActions = this._createAIQuickActions();
            
            // Messages container
            const oMessagesContainer = new ScrollContainer({
                class: "creatio-ai-messages",
                height: "300px",
                vertical: true,
                horizontal: false
            });
            this._oAIMessagesContainer = oMessagesContainer;
            
            // Input area
            const oInputArea = this._createAIInputArea();
            
            // Assemble panel content
            const oContent = new VBox({
                class: "creatio-ai-content",
                items: [oWelcome, oQuickActions, oMessagesContainer, oInputArea]
            });

            oAIPanel.setCustomHeader(oHeader);
            oAIPanel.addContent(oContent);
            
            // Place panel in body
            oAIPanel.placeAt(document.body);
            this._oAIPanel = oAIPanel;
            
            console.log("[LeadsCreatioExt] AI Panel rendered");
        },

        /**
         * Create AI welcome section
         * @private
         */
        _createAIWelcomeSection: function () {
            return new VBox({
                class: "creatio-ai-welcome sapUiSmallMargin",
                alignItems: "Center",
                items: [
                    new Icon({ src: "sap-icon://da-2", size: "3rem", class: "creatio-ai-welcome-icon" }),
                    new Text({ text: "AI Assistant", class: "creatio-ai-welcome-title sapUiTinyMarginTop" }),
                    new Text({ 
                        text: "Hello! I'm your AI assistant. Ask me anything about this lead, or choose a quick action below.",
                        class: "creatio-ai-welcome-text sapUiTinyMarginTop",
                        textAlign: "Center"
                    })
                ]
            });
        },

        /**
         * Create AI quick action buttons
         * @private
         */
        _createAIQuickActions: function () {
            const that = this;
            const aActions = this._oAIAssistantController ? this._oAIAssistantController.getQuickActions() : [];
            
            const oBox = new HBox({
                class: "creatio-ai-quick-actions sapUiSmallMargin",
                wrap: "Wrap",
                justifyContent: "Center"
            });
            
            aActions.forEach((oAction) => {
                const oBtn = new Button({
                    text: oAction.label,
                    icon: oAction.icon,
                    type: "Transparent",
                    press: function () {
                        that._onQuickAction(oAction.id);
                    }
                });
                oBtn.addStyleClass("sapUiTinyMarginEnd sapUiTinyMarginBottom");
                oBox.addItem(oBtn);
            });
            
            return oBox;
        },

        /**
         * Create AI input area
         * @private
         */
        _createAIInputArea: function () {
            const that = this;
            
            this._oAIInput = new TextArea({
                placeholder: "Type your message...",
                rows: 2,
                growing: true,
                growingMaxLines: 4,
                width: "100%",
                class: "creatio-ai-textarea"
            });
            
            const oSendBtn = new Button({
                icon: "sap-icon://paper-plane",
                type: "Emphasized",
                tooltip: "Send Message",
                press: function () {
                    that._onSendAIMessage();
                }
            });
            
            return new VBox({
                class: "creatio-ai-input-area",
                items: [
                    this._oAIInput,
                    new HBox({
                        class: "creatio-ai-input-actions sapUiTinyMarginTop",
                        justifyContent: "End",
                        items: [oSendBtn]
                    })
                ]
            });
        },

        /**
         * Render Entity Profile sidebar
         * @private
         */
        _renderEntityProfile: function () {
            // Profile is typically rendered in the Object Page header area
            // For now, we update the header facets with profile data via model
            console.log("[LeadsCreatioExt] Entity Profile configured");
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
                    // Add as custom section before existing sections
                    // This is a simplified approach - actual implementation may vary
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
            
            console.log("[LeadsCreatioExt] Updating from entity data:", oData.outletName);
            
            // Update Chevron Stage Bar
            if (this._oChevronController) {
                this._oChevronController.updateFromEntity(oData);
            }
            
            // Update Profile Model
            this._updateProfileModel(oData);
            
            // Update KPI Model
            this._updateKPIModel(oData);
            
            // Update AI Assistant context
            if (this._oAIAssistantController) {
                this._oAIAssistantController.updateEntityContext(oData);
            }
        },

        /**
         * Update profile model from entity data
         * @private
         */
        _updateProfileModel: function (oData) {
            const sName = oData.outletName || oData.contactName || "Unknown Lead";
            
            this._oProfileModel.setData({
                name: sName,
                subtitle: oData.brandToPitch || "",
                initials: SharedFormatters.getInitials(sName),
                avatarColor: SharedFormatters.getAvatarColor(sName),
                avatarUrl: "",
                badgeText: oData.aiScore ? oData.aiScore + "% AI Score" : "",
                badgeState: SharedFormatters.getScoreState(oData.aiScore),
                badgeIcon: SharedFormatters.getScoreIcon(oData.aiScore),
                account: oData.outletName || "",
                jobTitle: oData.contactName || "",
                source: oData.platform || oData.source || "",
                sourceIcon: SharedFormatters.getPlatformIcon(oData.platform),
                owner: oData.owner?.fullName || "",
                createdAt: SharedFormatters.formatDate(oData.createdAt),
                showCall: !!oData.contactPhone,
                showMessage: true,
                showEmail: !!oData.contactEmail,
                showSchedule: true,
                allowCalls: true,
                allowEmails: true,
                allowSMS: false
            });
        },

        /**
         * Update KPI model from entity data
         * @private
         */
        _updateKPIModel: function (oData) {
            const iDaysSinceCreated = SharedFormatters.calculateDaysSince(oData.createdAt);
            
            this._oKPIModel.setProperty("/kpis/0/value", iDaysSinceCreated.toString());
            this._oKPIModel.setProperty("/kpis/1/value", (oData.aiScore || 0) + "%");
            this._oKPIModel.setProperty("/kpis/2/value", (oData.sentimentScore || 0).toString());
            this._oKPIModel.setProperty("/kpis/3/value", "0"); // Follow-ups count would come from activities
        },

        /**
         * Get current entity data
         * @private
         */
        _getEntityData: function () {
            const oView = this.base.getView();
            const oContext = oView && oView.getBindingContext();
            return oContext ? oContext.getObject() : null;
        },

        /**
         * Handle stage change
         * @private
         */
        _onStageChange: function (sNewStage) {
            const that = this;
            const oView = this.base.getView();
            const oContext = oView && oView.getBindingContext();
            
            if (!oContext) {
                MessageBox.error("No lead context available");
                return;
            }
            
            const sLeadID = oContext.getProperty("ID");
            
            BusyIndicator.show(0);
            
            // Call backend action to change stage
            fetch("/lead/Leads(" + sLeadID + ")/LeadService.changeStatus", {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ newStatus: sNewStage })
            })
            .then(function (response) {
                BusyIndicator.hide();
                if (response.ok) {
                    MessageToast.show("Stage updated to: " + sNewStage);
                    oContext.refresh();
                } else {
                    throw new Error("Failed to update stage");
                }
            })
            .catch(function (error) {
                BusyIndicator.hide();
                MessageBox.error("Failed to update stage: " + error.message);
            });
        },

        /**
         * Handle AI panel toggle
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
         * Handle AI chat reset
         * @private
         */
        _onResetAIChat: function () {
            if (this._oAIAssistantController) {
                this._oAIAssistantController.resetChat();
            }
            if (this._oAIMessagesContainer) {
                this._oAIMessagesContainer.removeAllContent();
            }
        },

        /**
         * Handle quick action click
         * @private
         */
        _onQuickAction: function (sActionId) {
            if (this._oAIAssistantController) {
                this._oAIAssistantController.executeQuickAction(sActionId);
                this._refreshAIMessages();
            }
        },

        /**
         * Handle send AI message
         * @private
         */
        _onSendAIMessage: function () {
            if (!this._oAIInput) return;
            
            const sMessage = this._oAIInput.getValue();
            if (!sMessage || sMessage.trim() === "") return;
            
            if (this._oAIAssistantController) {
                this._oAIAssistantController.sendMessage(sMessage);
                this._oAIInput.setValue("");
                
                // Refresh messages display
                setTimeout(() => {
                    this._refreshAIMessages();
                }, 100);
            }
        },

        /**
         * Refresh AI messages display
         * @private
         */
        _refreshAIMessages: function () {
            if (!this._oAIMessagesContainer || !this._oAIAssistantController) return;
            
            const aMessages = this._oAIAssistantController.getModel().getProperty("/messages");
            
            this._oAIMessagesContainer.removeAllContent();
            
            aMessages.forEach((oMsg) => {
                const oMsgBox = new VBox({
                    class: "creatio-ai-message " + (oMsg.type === "user" ? "user-message" : "ai-message")
                });
                
                oMsgBox.addItem(new Text({
                    text: oMsg.text,
                    class: "creatio-ai-message-text"
                }));
                
                oMsgBox.addItem(new Text({
                    text: oMsg.timestamp,
                    class: "creatio-ai-message-time"
                }));
                
                this._oAIMessagesContainer.addContent(oMsgBox);
            });
            
            // Scroll to bottom
            const oDomRef = this._oAIMessagesContainer.getDomRef();
            if (oDomRef) {
                oDomRef.scrollTop = oDomRef.scrollHeight;
            }
        },

        /**
         * Profile action handlers
         */
        onProfileCall: function () {
            const sPhone = this._oProfileModel.getProperty("/phone");
            if (sPhone) {
                window.location.href = "tel:" + sPhone;
            } else {
                MessageToast.show("No phone number available");
            }
        },

        onProfileEmail: function () {
            const sEmail = this._getEntityData()?.contactEmail;
            if (sEmail) {
                window.location.href = "mailto:" + sEmail;
            } else {
                MessageToast.show("No email address available");
            }
        },

        onProfileMessage: function () {
            MessageToast.show("Messaging feature coming soon");
        },

        onProfileSchedule: function () {
            MessageToast.show("Schedule meeting feature coming soon");
        },

        /**
         * Cleanup on controller destroy
         */
        onExit: function () {
            if (this._oChevronController) {
                this._oChevronController.destroy();
            }
            if (this._oAIAssistantController) {
                this._oAIAssistantController.destroy();
            }
            if (this._oProfileModel) {
                this._oProfileModel.destroy();
            }
            if (this._oKPIModel) {
                this._oKPIModel.destroy();
            }
            if (this._oAIPanel) {
                this._oAIPanel.destroy();
            }
        }
    });
});

