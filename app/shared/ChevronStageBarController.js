/**
 * Creatio-style Chevron Stage Bar Controller
 * Handles interactive stage progression for entities
 */
sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment"
], function (BaseObject, JSONModel, MessageBox, MessageToast, Fragment) {
    "use strict";

    /**
     * Stage configurations for different entities
     */
    const STAGE_CONFIGS = {
        leads: {
            stages: [
                { key: "New", label: "New", icon: "sap-icon://add", color: "#1976D2" },
                { key: "Contacted", label: "Contacted", icon: "sap-icon://call", color: "#7B1FA2" },
                { key: "Qualified", label: "Qualified", icon: "sap-icon://accept", color: "#388E3C" },
                { key: "Nurturing", label: "Nurturing", icon: "sap-icon://nurture-leads", color: "#F57C00" },
                { key: "Converted", label: "Converted", icon: "sap-icon://complete", color: "#2E7D32", isFinal: true },
                { key: "Lost", label: "Lost", icon: "sap-icon://decline", color: "#D32F2F", isFinal: true, isNegative: true }
            ],
            stageField: "status",
            dateField: "createdAt"
        },
        prospects: {
            stages: [
                { key: "New", label: "New", icon: "sap-icon://add", color: "#1976D2" },
                { key: "Contacted", label: "Contacted", icon: "sap-icon://call", color: "#7B1FA2" },
                { key: "Qualified", label: "Qualified", icon: "sap-icon://accept", color: "#388E3C" },
                { key: "Negotiating", label: "Negotiating", icon: "sap-icon://sales-quote", color: "#F57C00" },
                { key: "In Review", label: "In Review", icon: "sap-icon://inspection", color: "#0288D1" },
                { key: "Converted", label: "Converted", icon: "sap-icon://complete", color: "#2E7D32", isFinal: true }
            ],
            stageField: "status",
            dateField: "discoveryDate"
        },
        opportunities: {
            stages: [
                { key: "Prospecting", label: "Prospecting", icon: "sap-icon://search", color: "#1976D2" },
                { key: "Qualification", label: "Qualification", icon: "sap-icon://checklist-item", color: "#7B1FA2" },
                { key: "Needs Analysis", label: "Needs Analysis", icon: "sap-icon://study-leave", color: "#00796B" },
                { key: "Proposal", label: "Proposal", icon: "sap-icon://document", color: "#F57C00" },
                { key: "Negotiation", label: "Negotiation", icon: "sap-icon://sales-quote", color: "#E64A19" },
                { key: "Closed Won", label: "Closed Won", icon: "sap-icon://complete", color: "#2E7D32", isFinal: true },
                { key: "Closed Lost", label: "Closed Lost", icon: "sap-icon://decline", color: "#D32F2F", isFinal: true, isNegative: true }
            ],
            stageField: "stage",
            dateField: "createdAt"
        }
    };

    return BaseObject.extend("beautyleads.shared.ChevronStageBarController", {
        /**
         * Initialize the chevron stage bar
         * @param {object} oConfig - Configuration object
         * @param {sap.ui.core.mvc.View} oConfig.view - The parent view
         * @param {string} oConfig.entityType - Entity type (leads, prospects, opportunities)
         * @param {function} oConfig.onStageChange - Callback when stage changes
         * @param {string} oConfig.containerId - ID of the container to render into
         */
        constructor: function (oConfig) {
            BaseObject.call(this);
            
            this._oView = oConfig.view;
            this._sEntityType = oConfig.entityType;
            this._fnOnStageChange = oConfig.onStageChange;
            this._sContainerId = oConfig.containerId;
            this._oStageConfig = STAGE_CONFIGS[oConfig.entityType];
            
            // Create model for stage bar data
            this._oStageModel = new JSONModel({
                stages: this._oStageConfig.stages,
                currentStage: "",
                currentStageIndex: -1,
                stageName: "",
                daysInStage: 0,
                entityType: oConfig.entityType
            });
        },

        /**
         * Get the stage model
         * @returns {sap.ui.model.json.JSONModel}
         */
        getModel: function () {
            return this._oStageModel;
        },

        /**
         * Update the current stage based on entity data
         * @param {object} oEntityData - Entity data object
         */
        updateFromEntity: function (oEntityData) {
            if (!oEntityData) return;

            const sCurrentStage = oEntityData[this._oStageConfig.stageField];
            const oDateField = oEntityData[this._oStageConfig.dateField];
            
            // Find stage index
            const iStageIndex = this._oStageConfig.stages.findIndex(s => s.key === sCurrentStage);
            
            // Calculate days in stage
            let iDaysInStage = 0;
            if (oDateField) {
                const oDate = new Date(oDateField);
                const oToday = new Date();
                iDaysInStage = Math.floor((oToday - oDate) / (1000 * 60 * 60 * 24));
            }

            // Get stage label
            const oStage = this._oStageConfig.stages[iStageIndex];
            const sStageName = oStage ? oStage.label : sCurrentStage;

            this._oStageModel.setProperty("/currentStage", sCurrentStage);
            this._oStageModel.setProperty("/currentStageIndex", iStageIndex);
            this._oStageModel.setProperty("/stageName", sStageName);
            this._oStageModel.setProperty("/daysInStage", iDaysInStage);
        },

        /**
         * Render the chevron stage bar into the container
         * @param {sap.ui.core.Control} oContainer - Container to render into
         */
        render: function (oContainer) {
            const that = this;
            const aStages = this._oStageConfig.stages;
            
            // Clear container
            oContainer.removeAllItems();
            
            // Create chevron bar container
            const oChevronBar = new sap.m.HBox({
                class: "creatio-chevron-bar",
                justifyContent: "Start",
                alignItems: "Center"
            });

            // Create each stage chevron
            aStages.forEach((oStage, iIndex) => {
                const oChevron = that._createChevronStage(oStage, iIndex, aStages.length);
                oChevronBar.addItem(oChevron);
            });

            oContainer.addItem(oChevronBar);

            // Add stage info below
            const oStageInfo = this._createStageInfo();
            oContainer.addItem(oStageInfo);
        },

        /**
         * Create a single chevron stage element
         * @private
         */
        _createChevronStage: function (oStage, iIndex, iTotalStages) {
            const that = this;
            const sCurrentStage = this._oStageModel.getProperty("/currentStage");
            const iCurrentIndex = this._oStageModel.getProperty("/currentStageIndex");
            
            // Determine stage state
            let sStateClass = "creatio-stage-future";
            if (iIndex < iCurrentIndex) {
                sStateClass = "creatio-stage-completed";
            } else if (iIndex === iCurrentIndex) {
                sStateClass = "creatio-stage-current";
            }
            
            // Add negative state class if applicable
            if (oStage.isNegative && iIndex === iCurrentIndex) {
                sStateClass += " creatio-stage-negative";
            }

            // Create chevron button
            const oChevron = new sap.m.Button({
                text: oStage.label,
                icon: oStage.icon,
                type: "Transparent",
                press: function () {
                    that._onStageClick(oStage, iIndex);
                },
                enabled: !oStage.isFinal || iIndex === iCurrentIndex
            });

            // Wrap in VBox for chevron shape styling
            const oWrapper = new sap.m.VBox({
                items: [oChevron],
                width: (100 / iTotalStages) + "%"
            });

            oWrapper.addStyleClass("creatio-chevron-stage");
            oWrapper.addStyleClass(sStateClass);
            oWrapper.data("stageKey", oStage.key);
            oWrapper.data("stageIndex", iIndex);

            // Set custom CSS properties for color
            oWrapper.addStyleClass("creatio-stage-color-" + iIndex);

            return oWrapper;
        },

        /**
         * Create stage info display below the bar
         * @private
         */
        _createStageInfo: function () {
            const oInfoBox = new sap.m.HBox({
                class: "creatio-stage-info sapUiTinyMarginTop",
                justifyContent: "SpaceBetween",
                alignItems: "Center"
            });

            // Current stage info
            const oCurrentInfo = new sap.m.VBox({
                items: [
                    new sap.m.Text({ text: "Current Stage", class: "creatio-stage-label" }),
                    new sap.m.Text({ 
                        text: "{stageModel>/stageName}", 
                        class: "creatio-stage-value sapUiTinyMarginTop" 
                    })
                ]
            });
            oCurrentInfo.setModel(this._oStageModel, "stageModel");

            // Days in stage
            const oDaysInfo = new sap.m.VBox({
                alignItems: "End",
                items: [
                    new sap.m.Text({ text: "Days in Stage", class: "creatio-stage-label" }),
                    new sap.m.ObjectNumber({
                        number: "{stageModel>/daysInStage}",
                        unit: "days",
                        class: "creatio-stage-days"
                    })
                ]
            });
            oDaysInfo.setModel(this._oStageModel, "stageModel");

            oInfoBox.addItem(oCurrentInfo);
            oInfoBox.addItem(oDaysInfo);

            return oInfoBox;
        },

        /**
         * Handle stage click - show confirmation dialog
         * @private
         */
        _onStageClick: function (oStage, iTargetIndex) {
            const that = this;
            const iCurrentIndex = this._oStageModel.getProperty("/currentStageIndex");
            const sCurrentStage = this._oStageModel.getProperty("/stageName");

            // Can't click on current stage
            if (iTargetIndex === iCurrentIndex) {
                return;
            }

            // Can't go backwards (except for specific cases)
            if (iTargetIndex < iCurrentIndex && !oStage.isNegative) {
                MessageToast.show("Cannot move backwards in the pipeline");
                return;
            }

            // Confirm stage change
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
         * Execute the stage change
         * @private
         */
        _executeStageChange: function (sNewStage) {
            if (this._fnOnStageChange) {
                this._fnOnStageChange(sNewStage);
            }
        },

        /**
         * Get allowed next stages from current stage
         * @returns {Array} Array of allowed stage keys
         */
        getAllowedNextStages: function () {
            const iCurrentIndex = this._oStageModel.getProperty("/currentStageIndex");
            const aStages = this._oStageConfig.stages;
            
            // Return stages after current (including final states)
            return aStages
                .filter((s, i) => i > iCurrentIndex || s.isFinal)
                .map(s => s.key);
        },

        /**
         * Destroy the controller and cleanup
         */
        destroy: function () {
            if (this._oStageModel) {
                this._oStageModel.destroy();
            }
            BaseObject.prototype.destroy.call(this);
        }
    });
});

