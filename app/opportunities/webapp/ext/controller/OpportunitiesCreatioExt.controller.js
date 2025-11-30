/**
 * Opportunities Object Page Extension - Creatio-style Layout
 * Integrates ChevronStageBar, KPI Cards, AI Assistant Panel
 */
sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
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
    ControllerExtension, JSONModel, MessageBox, MessageToast,
    VBox, HBox, Text, Title, Button, ObjectNumber, ObjectStatus, Panel, TextArea,
    ScrollContainer, Avatar, Icon, BusyIndicator,
    ChevronStageBarController, AIAssistantController, SharedFormatters
) {
    "use strict";

    return ControllerExtension.extend("beautyleads.opportunities.ext.controller.OpportunitiesCreatioExt", {
        _oChevronController: null,
        _oAIAssistantController: null,
        _oProfileModel: null,
        _oKPIModel: null,

        /**
         * Lifecycle: Controller initialization
         */
        onInit: function () {
            console.log("[OpportunitiesCreatioExt] Initializing Creatio-style extensions");
            
            this._initializeModels();
            
            const oView = this.base.getView();
            if (oView) {
                oView.attachAfterRendering(this._onViewAfterRendering.bind(this));
            }
            
            this._loadCreatioCSS();
        },

        /**
         * Initialize JSON models
         * @private
         */
        _initializeModels: function () {
            this._oProfileModel = new JSONModel({
                name: "",
                subtitle: "",
                initials: "",
                avatarColor: "Accent1",
                badgeText: "",
                badgeState: "None",
                account: "",
                owner: "",
                createdAt: ""
            });

            this._oKPIModel = new JSONModel({
                kpis: [
                    { id: "daysInPipeline", title: "Days in Pipeline", value: "0", color: "blue" },
                    { id: "aiWinScore", title: "AI Win Score", value: "0%", color: "green" },
                    { id: "expectedClose", title: "Expected Close", value: "-", color: "purple" },
                    { id: "dealValue", title: "Deal Value", value: "RM 0", color: "orange" }
                ]
            });
        },

        /**
         * Load Creatio CSS
         * @private
         */
        _loadCreatioCSS: function () {
            const sPath = sap.ui.require.toUrl("beautyleads/shared/creatio-layout.css");
            if (!document.querySelector('link[href*="creatio-layout.css"]')) {
                const oLink = document.createElement("link");
                oLink.rel = "stylesheet";
                oLink.href = sPath;
                document.head.appendChild(oLink);
            }
        },

        /**
         * Called after view rendering
         * @private
         */
        _onViewAfterRendering: function () {
            setTimeout(() => {
                this._initializeCreatioComponents();
                this._setupBindingContextListener();
            }, 500);
        },

        /**
         * Setup binding context listener
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
                    console.error("[OpportunitiesCreatioExt] Error:", err);
                });
            }
        },

        /**
         * Initialize Creatio components
         * @private
         */
        _initializeCreatioComponents: function () {
            const oView = this.base.getView();
            if (!oView) return;

            // Initialize Chevron Stage Bar
            this._oChevronController = new ChevronStageBarController({
                view: oView,
                entityType: "opportunities",
                onStageChange: this._onStageChange.bind(this)
            });

            // Initialize AI Assistant
            this._oAIAssistantController = new AIAssistantController({
                view: oView,
                entityType: "opportunities",
                serviceUrl: "/ai-assistant/",
                getEntityData: this._getEntityData.bind(this)
            });

            this._renderChevronStageBar();
            this._renderKPICards();
            this._renderAIPanel();
        },

        /**
         * Render Chevron Stage Bar
         * @private
         */
        _renderChevronStageBar: function () {
            let oContainer = this._findOrCreateContainer("oppsChevronContainer", "creatio-header-stage-section");
            
            if (oContainer && this._oChevronController) {
                const oWrapper = new VBox({
                    class: "creatio-chevron-container sapUiSmallMarginBottom"
                });
                
                this._oChevronController.render(oWrapper);
                oContainer.addItem(oWrapper);
            }
        },

        /**
         * Render KPI Cards Row
         * @private
         */
        _renderKPICards: function () {
            const oContainer = this._findOrCreateContainer("oppsKPIContainer", "creatio-header-kpi-section");
            
            if (oContainer) {
                const oKPIRow = new HBox({
                    class: "creatio-kpi-row sapUiSmallMarginBottom",
                    justifyContent: "Start",
                    wrap: "Wrap"
                });
                
                const aKPIs = this._oKPIModel.getProperty("/kpis");
                aKPIs.forEach((oKPI) => {
                    oKPIRow.addItem(this._createKPICard(oKPI));
                });
                
                oContainer.addItem(oKPIRow);
            }
        },

        /**
         * Create KPI card
         * @private
         */
        _createKPICard: function (oKPI) {
            const oCard = new VBox({
                class: "creatio-kpi-card kpi-" + oKPI.color
            });
            
            oCard.addItem(new Text({ text: oKPI.title, class: "creatio-kpi-title" }));
            
            const oValue = new Text({ text: oKPI.value, class: "creatio-kpi-value" });
            oCard.addItem(oValue);
            
            oCard.data("kpiId", oKPI.id);
            oCard._valueText = oValue;
            
            return oCard;
        },

        /**
         * Render AI Panel
         * @private
         */
        _renderAIPanel: function () {
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
                            new Button({
                                icon: "sap-icon://undo",
                                type: "Transparent",
                                press: function () { that._onResetAIChat(); }
                            }),
                            new Button({
                                icon: "sap-icon://slim-arrow-right",
                                type: "Transparent",
                                press: function () { that._onToggleAIPanel(); }
                            })
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
                    new Text({ 
                        text: "Ask me about win probability, competitors, or deal strategy.",
                        class: "creatio-ai-welcome-text sapUiTinyMarginTop",
                        textAlign: "Center"
                    })
                ]
            });

            const oQuickActions = this._createAIQuickActions();
            
            const oMessagesContainer = new ScrollContainer({
                class: "creatio-ai-messages",
                height: "300px",
                vertical: true,
                horizontal: false
            });
            this._oAIMessagesContainer = oMessagesContainer;
            
            const oInputArea = this._createAIInputArea();
            
            const oContent = new VBox({
                class: "creatio-ai-content",
                items: [oWelcome, oQuickActions, oMessagesContainer, oInputArea]
            });

            oAIPanel.setCustomHeader(oHeader);
            oAIPanel.addContent(oContent);
            
            oAIPanel.placeAt(document.body);
            this._oAIPanel = oAIPanel;
        },

        /**
         * Create AI quick actions
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
                    press: function () { that._onQuickAction(oAction.id); }
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
                width: "100%"
            });
            
            return new VBox({
                class: "creatio-ai-input-area",
                items: [
                    this._oAIInput,
                    new HBox({
                        justifyContent: "End",
                        items: [
                            new Button({
                                icon: "sap-icon://paper-plane",
                                type: "Emphasized",
                                press: function () { that._onSendAIMessage(); }
                            })
                        ]
                    })
                ]
            });
        },

        /**
         * Find or create container
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
                    try {
                        const oDomRef = oObjectPage.getDomRef();
                        if (oDomRef) {
                            const oHeaderContent = oDomRef.querySelector(".sapUxAPObjectPageHeaderContent");
                            if (oHeaderContent) {
                                oContainer.placeAt(oHeaderContent, "first");
                            }
                        }
                    } catch (e) {
                        console.warn("[OpportunitiesCreatioExt] Could not place container:", e);
                    }
                }
            }
            
            return oContainer;
        },

        /**
         * Update from entity data
         * @private
         */
        _updateFromEntity: function (oData) {
            if (!oData) return;
            
            if (this._oChevronController) {
                this._oChevronController.updateFromEntity(oData);
            }
            
            this._updateProfileModel(oData);
            this._updateKPIModel(oData);
            
            if (this._oAIAssistantController) {
                this._oAIAssistantController.updateEntityContext(oData);
            }
        },

        /**
         * Update profile model
         * @private
         */
        _updateProfileModel: function (oData) {
            const sName = oData.name || "Unknown Opportunity";
            
            this._oProfileModel.setData({
                name: sName,
                subtitle: oData.account?.accountName || "",
                initials: SharedFormatters.getInitials(sName),
                avatarColor: SharedFormatters.getAvatarColor(sName),
                badgeText: oData.aiWinScore ? oData.aiWinScore + "% Win" : "",
                badgeState: SharedFormatters.getScoreState(oData.aiWinScore),
                account: oData.account?.accountName || "",
                owner: oData.owner?.fullName || "",
                createdAt: SharedFormatters.formatDate(oData.createdAt)
            });
        },

        /**
         * Update KPI model
         * @private
         */
        _updateKPIModel: function (oData) {
            const iDaysInPipeline = SharedFormatters.calculateDaysSince(oData.createdAt);
            
            this._oKPIModel.setProperty("/kpis/0/value", iDaysInPipeline.toString());
            this._oKPIModel.setProperty("/kpis/1/value", (oData.aiWinScore || oData.probability || 0) + "%");
            this._oKPIModel.setProperty("/kpis/2/value", SharedFormatters.formatDate(oData.closeDate) || "-");
            this._oKPIModel.setProperty("/kpis/3/value", SharedFormatters.formatCurrency(oData.amount || oData.expectedRevenue));
        },

        /**
         * Get entity data
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
         * Toggle AI panel
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
         * Reset AI chat
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
         * Handle quick action
         * @private
         */
        _onQuickAction: function (sActionId) {
            if (this._oAIAssistantController) {
                this._oAIAssistantController.executeQuickAction(sActionId);
                setTimeout(() => this._refreshAIMessages(), 100);
            }
        },

        /**
         * Send AI message
         * @private
         */
        _onSendAIMessage: function () {
            if (!this._oAIInput) return;
            
            const sMessage = this._oAIInput.getValue();
            if (!sMessage || sMessage.trim() === "") return;
            
            if (this._oAIAssistantController) {
                this._oAIAssistantController.sendMessage(sMessage);
                this._oAIInput.setValue("");
                setTimeout(() => this._refreshAIMessages(), 100);
            }
        },

        /**
         * Refresh AI messages
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
                
                oMsgBox.addItem(new Text({ text: oMsg.text, class: "creatio-ai-message-text" }));
                oMsgBox.addItem(new Text({ text: oMsg.timestamp, class: "creatio-ai-message-time" }));
                
                this._oAIMessagesContainer.addContent(oMsgBox);
            });
            
            const oDomRef = this._oAIMessagesContainer.getDomRef();
            if (oDomRef) {
                oDomRef.scrollTop = oDomRef.scrollHeight;
            }
        },

        /**
         * Cleanup
         */
        onExit: function () {
            if (this._oChevronController) this._oChevronController.destroy();
            if (this._oAIAssistantController) this._oAIAssistantController.destroy();
            if (this._oProfileModel) this._oProfileModel.destroy();
            if (this._oKPIModel) this._oKPIModel.destroy();
            if (this._oAIPanel) this._oAIPanel.destroy();
        }
    });
});

