/**
 * Creatio-style AI Assistant Chat Controller
 * Handles AI chat functionality and contextual insights
 */
sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator"
], function (BaseObject, JSONModel, MessageToast, BusyIndicator) {
    "use strict";

    /**
     * Quick action configurations for different entities
     */
    const QUICK_ACTIONS = {
        leads: [
            { id: "scoring", label: "Lead Scoring Insights", icon: "sap-icon://target-group" },
            { id: "nextActions", label: "Recommended Actions", icon: "sap-icon://activity-items" },
            { id: "bestTime", label: "Best Time to Contact", icon: "sap-icon://appointment" },
            { id: "overview", label: "Lead Overview", icon: "sap-icon://hint" }
        ],
        prospects: [
            { id: "qualification", label: "Qualification Insights", icon: "sap-icon://accept" },
            { id: "nextActions", label: "Next Best Actions", icon: "sap-icon://activity-items" },
            { id: "conversion", label: "Conversion Likelihood", icon: "sap-icon://trend-up" },
            { id: "overview", label: "Prospect Overview", icon: "sap-icon://hint" }
        ],
        opportunities: [
            { id: "winProbability", label: "Win Probability Analysis", icon: "sap-icon://competitor" },
            { id: "competitors", label: "Competitor Insights", icon: "sap-icon://competitive-analysis" },
            { id: "recommendations", label: "Deal Recommendations", icon: "sap-icon://lightbulb" },
            { id: "overview", label: "Opportunity Overview", icon: "sap-icon://hint" }
        ],
        accounts: [
            { id: "healthAnalysis", label: "Account Health Analysis", icon: "sap-icon://monitor-payments" },
            { id: "growthRecs", label: "Growth Recommendations", icon: "sap-icon://trend-up" },
            { id: "riskAlerts", label: "Risk Warnings", icon: "sap-icon://warning" },
            { id: "overview", label: "Account Overview", icon: "sap-icon://hint" }
        ]
    };

    /**
     * Suggested follow-up actions after AI response
     */
    const SUGGESTIONS = {
        leads: [
            "Increase Interaction Frequency",
            "Generate Email Template",
            "Schedule Follow-up",
            "View Similar Leads"
        ],
        prospects: [
            "Create Opportunity",
            "Schedule Meeting",
            "Send Proposal",
            "Update Qualification"
        ],
        opportunities: [
            "Add Products",
            "Request Discount Approval",
            "Schedule Demo",
            "Generate Quote"
        ],
        accounts: [
            "Offer Additional Services",
            "Schedule Review Meeting",
            "Create Marketing Campaign",
            "View Risk Details"
        ]
    };

    return BaseObject.extend("beautyleads.shared.AIAssistantController", {
        /**
         * Initialize the AI Assistant
         * @param {object} oConfig - Configuration object
         * @param {sap.ui.core.mvc.View} oConfig.view - The parent view
         * @param {string} oConfig.entityType - Entity type (leads, prospects, opportunities, accounts)
         * @param {string} oConfig.serviceUrl - Base URL for AI service
         * @param {function} oConfig.getEntityData - Function to get current entity data
         */
        constructor: function (oConfig) {
            BaseObject.call(this);
            
            this._oView = oConfig.view;
            this._sEntityType = oConfig.entityType;
            this._sServiceUrl = oConfig.serviceUrl || "/ai-assistant/";
            this._fnGetEntityData = oConfig.getEntityData;
            
            // Create model for AI panel
            this._oAIPanelModel = new JSONModel({
                expanded: true,
                messages: [],
                inputText: "",
                isLoading: false,
                showSuggestions: false,
                suggestions: SUGGESTIONS[oConfig.entityType] || [],
                quickActions: QUICK_ACTIONS[oConfig.entityType] || [],
                entityContext: null
            });
        },

        /**
         * Get the AI panel model
         * @returns {sap.ui.model.json.JSONModel}
         */
        getModel: function () {
            return this._oAIPanelModel;
        },

        /**
         * Update entity context for AI
         * @param {object} oEntityData - Current entity data
         */
        updateEntityContext: function (oEntityData) {
            this._oAIPanelModel.setProperty("/entityContext", oEntityData);
        },

        /**
         * Toggle panel expanded state
         */
        togglePanel: function () {
            const bExpanded = this._oAIPanelModel.getProperty("/expanded");
            this._oAIPanelModel.setProperty("/expanded", !bExpanded);
        },

        /**
         * Reset chat history
         */
        resetChat: function () {
            this._oAIPanelModel.setProperty("/messages", []);
            this._oAIPanelModel.setProperty("/inputText", "");
            this._oAIPanelModel.setProperty("/showSuggestions", false);
        },

        /**
         * Send a message to the AI assistant
         * @param {string} sMessage - User message (optional, uses inputText if not provided)
         */
        sendMessage: function (sMessage) {
            const that = this;
            const sText = sMessage || this._oAIPanelModel.getProperty("/inputText");
            
            if (!sText || sText.trim() === "") {
                return;
            }

            // Add user message to chat
            this._addMessage("user", sText);
            this._oAIPanelModel.setProperty("/inputText", "");
            this._oAIPanelModel.setProperty("/isLoading", true);
            this._oAIPanelModel.setProperty("/showSuggestions", false);

            // Get entity context
            const oEntityData = this._fnGetEntityData ? this._fnGetEntityData() : null;

            // Call AI service
            this._callAIService(sText, oEntityData)
                .then(function (oResponse) {
                    that._oAIPanelModel.setProperty("/isLoading", false);
                    that._addMessage("ai", oResponse.message, oResponse.data);
                    that._oAIPanelModel.setProperty("/showSuggestions", true);
                })
                .catch(function (oError) {
                    that._oAIPanelModel.setProperty("/isLoading", false);
                    that._addMessage("ai", "I apologize, but I encountered an error. Please try again.", null, true);
                    console.error("[AI Assistant] Error:", oError);
                });
        },

        /**
         * Execute a quick action
         * @param {string} sActionId - Quick action ID
         */
        executeQuickAction: function (sActionId) {
            const oAction = QUICK_ACTIONS[this._sEntityType].find(a => a.id === sActionId);
            if (oAction) {
                this.sendMessage(oAction.label);
            }
        },

        /**
         * Execute a suggestion action
         * @param {string} sSuggestion - Suggestion text
         */
        executeSuggestion: function (sSuggestion) {
            this.sendMessage(sSuggestion);
        },

        /**
         * Add a message to the chat
         * @private
         */
        _addMessage: function (sType, sText, oData, bIsError) {
            const aMessages = this._oAIPanelModel.getProperty("/messages");
            
            aMessages.push({
                id: Date.now().toString(),
                type: sType, // "user" or "ai"
                text: sText,
                data: oData || null,
                isError: bIsError || false,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });

            this._oAIPanelModel.setProperty("/messages", aMessages);
        },

        /**
         * Call the AI service
         * @private
         */
        _callAIService: function (sQuery, oEntityData) {
            const that = this;
            
            return new Promise(function (resolve, reject) {
                const sUrl = that._sServiceUrl + "chat";
                
                fetch(sUrl, {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        query: sQuery,
                        entityType: that._sEntityType,
                        entityData: oEntityData
                    })
                })
                .then(function (response) {
                    if (response.ok) {
                        return response.json();
                    }
                    // If service is not available, use mock response
                    return that._getMockResponse(sQuery, oEntityData);
                })
                .then(function (oData) {
                    resolve(oData);
                })
                .catch(function (oError) {
                    // Fallback to mock response if service unavailable
                    resolve(that._getMockResponse(sQuery, oEntityData));
                });
            });
        },

        /**
         * Generate mock AI response for demo/fallback
         * @private
         */
        _getMockResponse: function (sQuery, oEntityData) {
            const sLowerQuery = sQuery.toLowerCase();
            let sMessage = "";
            let oData = null;

            // Generate contextual response based on entity type and query
            if (this._sEntityType === "leads") {
                if (sLowerQuery.includes("scoring") || sLowerQuery.includes("score")) {
                    const iScore = oEntityData?.aiScore || 75;
                    sMessage = `Based on the lead's engagement patterns and profile data, the AI Score is ${iScore}%. ` +
                        `This is ${iScore >= 70 ? 'a strong lead' : 'a moderate lead'} with good conversion potential. ` +
                        `Key factors: recent social media activity, brand alignment, and location.`;
                    oData = { aiScore: iScore, confidence: 0.85 };
                } else if (sLowerQuery.includes("action") || sLowerQuery.includes("recommend")) {
                    sMessage = "I recommend the following actions:\n\n" +
                        "1. **Schedule a call** within the next 2 days - the lead showed high engagement recently\n" +
                        "2. **Send product samples** of trending items from their preferred category\n" +
                        "3. **Connect on Instagram** to build relationship before formal outreach";
                } else if (sLowerQuery.includes("time") || sLowerQuery.includes("contact")) {
                    sMessage = "Based on historical engagement data, the best times to contact this lead are:\n\n" +
                        "• **Tuesday-Thursday** between 10:00 AM - 12:00 PM\n" +
                        "• **Preferred channel**: WhatsApp or Instagram DM\n" +
                        "• Average response time: 2-4 hours during business hours";
                } else {
                    sMessage = `This lead "${oEntityData?.outletName || 'Unknown'}" was discovered via ${oEntityData?.platform || 'social media'}. ` +
                        `Current status is "${oEntityData?.status || 'New'}". ` +
                        `The lead shows interest in ${oEntityData?.brandToPitch || 'beauty products'}. ` +
                        `I recommend scheduling a follow-up to discuss partnership opportunities.`;
                }
            } else if (this._sEntityType === "prospects") {
                if (sLowerQuery.includes("qualification") || sLowerQuery.includes("qualify")) {
                    const iScore = oEntityData?.prospectScore || 65;
                    sMessage = `Prospect qualification analysis:\n\n` +
                        `• **Score**: ${iScore}%\n` +
                        `• **Business Type**: ${oEntityData?.businessType || 'Retailer'}\n` +
                        `• **Engagement Level**: ${iScore >= 70 ? 'High' : 'Moderate'}\n\n` +
                        `${iScore >= 70 ? 'This prospect is ready for opportunity creation.' : 'Consider more nurturing before conversion.'}`;
                } else if (sLowerQuery.includes("conversion") || sLowerQuery.includes("likelihood")) {
                    sMessage = "Conversion likelihood analysis:\n\n" +
                        "• **Probability**: 72%\n" +
                        "• **Estimated Timeline**: 2-3 weeks\n" +
                        "• **Key Success Factors**: Strong brand fit, active engagement, decision-maker contact\n\n" +
                        "Recommendation: Move to 'Negotiating' stage and prepare proposal.";
                } else {
                    sMessage = `This prospect "${oEntityData?.prospectName || 'Unknown'}" was discovered from ${oEntityData?.discoverySource || 'web'}. ` +
                        `They operate a ${oEntityData?.businessType || 'retail'} business. ` +
                        `Current status: "${oEntityData?.status || 'New'}". Consider reaching out to discuss partnership.`;
                }
            } else if (this._sEntityType === "opportunities") {
                if (sLowerQuery.includes("win") || sLowerQuery.includes("probability")) {
                    const iWinScore = oEntityData?.aiWinScore || 65;
                    sMessage = `Win probability analysis:\n\n` +
                        `• **AI Win Score**: ${iWinScore}%\n` +
                        `• **Current Stage**: ${oEntityData?.stage || 'Prospecting'}\n` +
                        `• **Deal Value**: RM ${(oEntityData?.amount || 0).toLocaleString()}\n\n` +
                        `${iWinScore >= 70 ? 'Strong deal with high close probability.' : 'Focus on addressing buyer concerns to improve win rate.'}`;
                } else if (sLowerQuery.includes("competitor")) {
                    sMessage = "Competitor analysis:\n\n" +
                        "• **Primary Competitors**: Local distributors, direct brand channels\n" +
                        "• **Our Advantages**: Better pricing, local support, marketing partnership\n" +
                        "• **Risk Areas**: Longer payment terms offered by competitors\n\n" +
                        "Strategy: Emphasize marketing support and exclusivity benefits.";
                } else {
                    sMessage = `Opportunity "${oEntityData?.name || 'Unknown'}" is at ${oEntityData?.stage || 'initial'} stage. ` +
                        `Expected revenue: RM ${(oEntityData?.expectedRevenue || 0).toLocaleString()}. ` +
                        `Close date: ${oEntityData?.closeDate || 'TBD'}. Focus on building relationship and demonstrating value.`;
                }
            } else if (this._sEntityType === "accounts") {
                if (sLowerQuery.includes("health")) {
                    const iHealth = oEntityData?.healthScore || 75;
                    sMessage = `Account health analysis:\n\n` +
                        `• **Health Score**: ${iHealth}%\n` +
                        `• **Risk Level**: ${oEntityData?.riskLevel || 'Low'}\n` +
                        `• **Sentiment Trend**: ${oEntityData?.recentSentimentTrend || 'Stable'}\n\n` +
                        `${iHealth >= 70 ? 'Account is in good standing.' : 'Attention needed to improve account health.'}`;
                } else if (sLowerQuery.includes("growth") || sLowerQuery.includes("recommend")) {
                    sMessage = "Growth recommendations:\n\n" +
                        "1. **Upsell Opportunity**: Introduce premium product lines based on purchase history\n" +
                        "2. **Cross-sell**: Recommend complementary categories (skincare → tools)\n" +
                        "3. **Volume Increase**: Offer tiered pricing for larger orders\n\n" +
                        "Estimated additional revenue potential: RM 15,000/month";
                } else if (sLowerQuery.includes("risk") || sLowerQuery.includes("warning")) {
                    sMessage = "Risk assessment:\n\n" +
                        `• **Current Risk Level**: ${oEntityData?.riskLevel || 'Low'}\n` +
                        "• **Potential Concerns**: None critical at this time\n" +
                        "• **Monitoring**: Order frequency, payment patterns, engagement\n\n" +
                        "No immediate action required. Continue regular engagement.";
                } else {
                    sMessage = `Account "${oEntityData?.accountName || 'Unknown'}" is a ${oEntityData?.accountType || 'partner'} ` +
                        `with ${oEntityData?.accountTier || 'standard'} tier status. ` +
                        `Health score: ${oEntityData?.healthScore || 'N/A'}%. ` +
                        `Focus on maintaining engagement and exploring growth opportunities.`;
                }
            } else {
                sMessage = "I'm here to help you with insights about this record. What would you like to know?";
            }

            return {
                message: sMessage,
                data: oData
            };
        },

        /**
         * Get quick actions for the current entity type
         * @returns {Array}
         */
        getQuickActions: function () {
            return QUICK_ACTIONS[this._sEntityType] || [];
        },

        /**
         * Get suggestions for the current entity type
         * @returns {Array}
         */
        getSuggestions: function () {
            return SUGGESTIONS[this._sEntityType] || [];
        },

        /**
         * Destroy the controller and cleanup
         */
        destroy: function () {
            if (this._oAIPanelModel) {
                this._oAIPanelModel.destroy();
            }
            BaseObject.prototype.destroy.call(this);
        }
    });
});

