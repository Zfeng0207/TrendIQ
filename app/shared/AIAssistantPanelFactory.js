/**
 * Unified AI Assistant Panel Factory
 * Creates entity-specific AI Assistant sidebars with configurable sections
 * Supports both Insights view and Chat view with toggle
 */
sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/json/JSONModel",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/FlexBox",
    "sap/m/Text",
    "sap/m/Title",
    "sap/m/Label",
    "sap/m/Button",
    "sap/m/SegmentedButton",
    "sap/m/SegmentedButtonItem",
    "sap/m/ObjectStatus",
    "sap/m/Panel",
    "sap/m/TextArea",
    "sap/m/ScrollContainer",
    "sap/m/Link",
    "sap/m/MessageToast",
    "sap/f/Avatar",
    "sap/ui/core/Icon",
    "sap/ui/core/HTML"
], function (
    BaseObject, JSONModel,
    VBox, HBox, FlexBox, Text, Title, Label, Button, SegmentedButton, SegmentedButtonItem,
    ObjectStatus, Panel, TextArea, ScrollContainer, Link, MessageToast,
    Avatar, Icon, HTML
) {
    "use strict";

    // ============================================================================
    // ENTITY CONFIGURATIONS
    // ============================================================================

    const ENTITY_CONFIG = {
        leads: {
            sections: ["quickActions", "scoreBreakdown", "nextBestActions", "recommendedProducts", "engagementHistory"],
            scoreSectionTitle: "Lead Scoring",
            overallRatingLabel: "Overall Engagement Rating",
            overallRatingBadge: { text: "HOT LEAD", state: "Success", icon: "sap-icon://heating-cooling" },
            quickActions: [
                { id: "call", icon: "sap-icon://call", text: "Call", styleClass: "creatio-contact-call" },
                { id: "email", icon: "sap-icon://email", text: "Email", styleClass: "creatio-contact-email" },
                { id: "whatsapp", icon: "sap-icon://discussion-2", text: "WhatsApp", styleClass: "creatio-contact-whatsapp" },
                { id: "schedule", icon: "sap-icon://appointment", text: "Schedule", styleClass: "creatio-contact-schedule" }
            ],
            scoreCards: [
                { id: "aiScore", title: "AI Score", value: "92%", percent: 92, description: "High engagement potential based on social activity and brand fit", state: "Success" },
                { id: "trendScore", title: "Trend Score", value: "95/100", percent: 95, description: "K-Beauty products are trending strongly on TikTok", state: "Success" }
            ],
            sentimentCard: { label: "Sentiment", value: "Very Positive", icon: "sap-icon://sentiment-positive", iconClass: "creatio-sentiment-icon-positive", score: "85" },
            nextBestActions: [
                { id: "call", label: "Schedule Call", icon: "sap-icon://call", priority: "High", dueText: "Today" },
                { id: "catalog", label: "Send Catalog", icon: "sap-icon://document", priority: "Medium", dueText: "This week" },
                { id: "whatsapp", label: "WhatsApp Follow-up", icon: "sap-icon://discussion-2", priority: "Medium", dueText: "Anytime" }
            ],
            products: [
                { id: "1", name: "K-Beauty Glass Skin Serum", brand: "COSRX", trendScore: 94, price: "RM 89.00" },
                { id: "2", name: "Snail Mucin Essence", brand: "COSRX", trendScore: 91, price: "RM 75.00" },
                { id: "3", name: "Rice Water Toner", brand: "I'm From", trendScore: 88, price: "RM 95.00" }
            ],
            engagementStats: [
                { value: "3", label: "Contacts" },
                { value: "85%", label: "Response Rate", styleClass: "creatio-stat-success" },
                { value: "2h", label: "Avg Response" }
            ],
            engagementHistory: [
                { id: "1", description: "TikTok DM - Product inquiry", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), icon: "sap-icon://discussion" },
                { id: "2", description: "Follow-up call scheduled", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), icon: "sap-icon://call" },
                { id: "3", description: "Product catalog sent", date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), icon: "sap-icon://email" }
            ],
            historySectionTitle: "Engagement History"
        },

        prospects: {
            sections: ["quickActions", "scoreBreakdown", "nextBestActions", "recommendedProducts", "engagementHistory"],
            scoreSectionTitle: "Prospect Scoring",
            overallRatingLabel: "PROSPECT RATING",
            overallRatingBadge: { text: "HOT PROSPECT", state: "Success", icon: "sap-icon://heating-cooling" },
            quickActions: [
                { id: "call", icon: "sap-icon://call", text: "Call", styleClass: "creatio-contact-call" },
                { id: "email", icon: "sap-icon://email", text: "Email", styleClass: "creatio-contact-email" },
                { id: "whatsapp", icon: "sap-icon://discussion-2", text: "WhatsApp", styleClass: "creatio-contact-whatsapp" },
                { id: "schedule", icon: "sap-icon://appointment", text: "Schedule", styleClass: "creatio-contact-schedule" }
            ],
            scoreCards: [
                { id: "engagement", title: "Engagement Score", value: "92%", percent: 92, description: "Based on interactions, meetings, and response rate", state: "Success" },
                { id: "value", title: "Estimated Value", value: "RM 50K", percent: 75, description: "Projected annual business value", state: "Success" }
            ],
            sentimentCard: { label: "Sentiment Trend", value: "Improving", icon: "sap-icon://trend-up", iconClass: "creatio-sentiment-icon-positive", score: "88" },
            nextBestActions: [
                { id: "call", label: "Schedule Call", icon: "sap-icon://call", priority: "High", dueText: "Today" },
                { id: "catalog", label: "Send Catalog", icon: "sap-icon://document", priority: "Medium", dueText: "This week" },
                { id: "whatsapp", label: "WhatsApp Follow-up", icon: "sap-icon://discussion-2", priority: "Medium", dueText: "Anytime" }
            ],
            products: [
                { id: "1", name: "K-Beauty Glass Skin Serum", brand: "COSRX", trendScore: 94, price: "RM 89.00" },
                { id: "2", name: "Snail Mucin Essence", brand: "COSRX", trendScore: 91, price: "RM 75.00" },
                { id: "3", name: "Rice Water Toner", brand: "I'm From", trendScore: 88, price: "RM 95.00" }
            ],
            engagementStats: [
                { value: "5", label: "Contacts" },
                { value: "90%", label: "Response Rate", styleClass: "creatio-stat-success" },
                { value: "1h", label: "Avg Response" }
            ],
            engagementHistory: [
                { id: "1", description: "Follow-up call completed", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), icon: "sap-icon://call" },
                { id: "2", description: "Product demo scheduled", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), icon: "sap-icon://appointment" },
                { id: "3", description: "Proposal sent", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), icon: "sap-icon://document" }
            ],
            historySectionTitle: "Engagement History"
        },

        accounts: {
            sections: ["quickActions", "healthBreakdown", "nextBestActions", "growthRecommendations", "riskIndicators", "interactionHistory"],
            scoreSectionTitle: "Account Health",
            overallRatingLabel: "Account Status",
            overallRatingBadge: { text: "HEALTHY", state: "Success", icon: "sap-icon://accept" },
            quickActions: [
                { id: "call", icon: "sap-icon://call", text: "Call", styleClass: "creatio-contact-call" },
                { id: "email", icon: "sap-icon://email", text: "Email", styleClass: "creatio-contact-email" },
                { id: "meeting", icon: "sap-icon://appointment", text: "Meeting", styleClass: "creatio-contact-whatsapp" },
                { id: "order", icon: "sap-icon://cart", text: "New Order", styleClass: "creatio-contact-schedule" }
            ],
            scoreCards: [
                { id: "health", title: "Health Score", value: "85%", percent: 85, description: "Strong account with consistent engagement", state: "Success" },
                { id: "revenue", title: "Revenue Growth", value: "+18%", percent: 75, description: "Above average growth vs previous year", state: "Success" }
            ],
            sentimentCard: { label: "Risk Level", value: "Low Risk", icon: "sap-icon://status-positive", iconClass: "creatio-sentiment-icon-positive", score: "15" },
            nextBestActions: [
                { id: "review", label: "Schedule Account Review", icon: "sap-icon://appointment", priority: "High", dueText: "This week" },
                { id: "opportunity", label: "Create Opportunity", icon: "sap-icon://add", priority: "High", dueText: "Today" },
                { id: "email", label: "Send Update Email", icon: "sap-icon://email", priority: "Medium", dueText: "This week" },
                { id: "call", label: "Check-in Call", icon: "sap-icon://call", priority: "Medium", dueText: "Tomorrow" }
            ],
            growthRecommendations: [
                { id: "1", title: "Upsell Premium Products", description: "Based on order history, recommend K-Beauty premium line", impact: "High", potentialValue: "RM 8,500/month" },
                { id: "2", title: "Cross-sell Skincare", description: "Customer only purchases makeup, recommend skincare bundle", impact: "Medium", potentialValue: "RM 3,200/month" },
                { id: "3", title: "Volume Discount Tier", description: "Eligible for Gold tier with 10% volume increase", impact: "Medium", potentialValue: "RM 5,000/month" }
            ],
            riskIndicators: [
                { id: "1", title: "Payment Delay Pattern", description: "3 late payments in last 6 months", severity: "Medium", icon: "sap-icon://money-bills" },
                { id: "2", title: "Declining Engagement", description: "20% fewer orders vs last quarter", severity: "Low", icon: "sap-icon://decline" }
            ],
            interactionStats: [
                { value: "28", label: "Orders (YTD)" },
                { value: "95%", label: "On-Time Pay", styleClass: "creatio-stat-success" },
                { value: "5d", label: "Avg Order Cycle" }
            ],
            interactionHistory: [
                { id: "1", description: "Order #ORD-2025-0891 placed", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), icon: "sap-icon://cart" },
                { id: "2", description: "Quarterly review call completed", date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), icon: "sap-icon://call" },
                { id: "3", description: "Product training session", date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), icon: "sap-icon://appointment" }
            ],
            historySectionTitle: "Recent Interactions"
        },

        opportunities: {
            sections: ["quickActions", "winProbability", "nextBestActions", "competitors", "dealHistory"],
            scoreSectionTitle: "Win Probability",
            overallRatingLabel: "Deal Outlook",
            overallRatingBadge: { text: "LIKELY TO WIN", state: "Success", icon: "sap-icon://trend-up" },
            quickActions: [
                { id: "call", icon: "sap-icon://call", text: "Call", styleClass: "creatio-contact-call" },
                { id: "email", icon: "sap-icon://email", text: "Email", styleClass: "creatio-contact-email" },
                { id: "meeting", icon: "sap-icon://appointment", text: "Meeting", styleClass: "creatio-contact-whatsapp" },
                { id: "proposal", icon: "sap-icon://document", text: "Proposal", styleClass: "creatio-contact-schedule" }
            ],
            scoreCards: [
                { id: "winScore", title: "AI Win Score", value: "78%", percent: 78, description: "Strong engagement and stakeholder alignment", state: "Success" },
                { id: "momentum", title: "Deal Momentum", value: "85/100", percent: 85, description: "Consistent progress through sales stages", state: "Success" }
            ],
            sentimentCard: { label: "Competitor Threat", value: "Medium", icon: "sap-icon://warning", iconClass: "creatio-sentiment-icon-warning", score: "60" },
            nextBestActions: [
                { id: "demo", label: "Schedule Demo", icon: "sap-icon://play", priority: "High", dueText: "This week" },
                { id: "proposal", label: "Send Proposal", icon: "sap-icon://document", priority: "High", dueText: "Today" },
                { id: "followup", label: "Follow-up Call", icon: "sap-icon://call", priority: "Medium", dueText: "Tomorrow" },
                { id: "stakeholder", label: "Meet Stakeholder", icon: "sap-icon://meeting-room", priority: "Medium", dueText: "This week" }
            ],
            competitors: [
                { id: "1", name: "Local Distributor A", strength: "Better pricing", threat: 65 },
                { id: "2", name: "Direct Brand Channel", strength: "Brand authority", threat: 45 },
                { id: "3", name: "Online Marketplace", strength: "Convenience", threat: 30 }
            ],
            dealStats: [
                { value: "5", label: "Meetings" },
                { value: "3", label: "Proposals", styleClass: "creatio-stat-success" },
                { value: "21", label: "Days Active" }
            ],
            dealHistory: [
                { id: "1", description: "Proposal V2 sent", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), icon: "sap-icon://document" },
                { id: "2", description: "Demo completed", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), icon: "sap-icon://play" },
                { id: "3", description: "Initial meeting", date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), icon: "sap-icon://meeting-room" }
            ],
            historySectionTitle: "Deal History"
        }
    };

    // ============================================================================
    // SECTION BUILDERS
    // ============================================================================

    /**
     * Build the AI panel header with view toggle
     */
    function _buildPanelHeader(oFactory) {
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
                    alignItems: "Center",
                    items: [
                        // View toggle buttons
                        new SegmentedButton({
                            selectedKey: oFactory._currentView,
                            items: [
                                new SegmentedButtonItem({ key: "insights", icon: "sap-icon://business-objects-experience", tooltip: "Insights View" }),
                                new SegmentedButtonItem({ key: "chat", icon: "sap-icon://discussion", tooltip: "Chat View" })
                            ],
                            selectionChange: function(oEvent) {
                                oFactory._onViewToggle(oEvent.getParameter("item").getKey());
                            }
                        }).addStyleClass("creatio-ai-view-toggle"),
                        new Button({
                            icon: "sap-icon://refresh",
                            type: "Transparent",
                            tooltip: "Refresh Insights",
                            press: function () {
                                if (oFactory._callbacks.onRefresh) {
                                    oFactory._callbacks.onRefresh();
                                }
                            }
                        }),
                        new Button({
                            icon: "sap-icon://slim-arrow-right",
                            type: "Transparent",
                            tooltip: "Toggle Panel",
                            press: function () {
                                oFactory._onTogglePanel();
                            }
                        })
                    ]
                })
            ]
        }).addStyleClass("creatio-ai-header");
    }

    /**
     * Build Quick Actions section
     */
    function _buildQuickActionsSection(oConfig, oCallbacks) {
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

        oConfig.quickActions.forEach(function(oAction) {
            const oBtn = new Button({
                icon: oAction.icon,
                text: oAction.text,
                type: "Default",
                press: function () {
                    const sCallbackName = "onQuick" + oAction.id.charAt(0).toUpperCase() + oAction.id.slice(1);
                    if (oCallbacks[sCallbackName]) {
                        oCallbacks[sCallbackName]();
                    } else {
                        MessageToast.show("Action: " + oAction.text);
                    }
                }
            });
            oBtn.addStyleClass("creatio-contact-btn " + oAction.styleClass);
            oButtonsRow.addItem(oBtn);
        });

        oSection.addItem(oButtonsRow);
        return oSection;
    }

    /**
     * Build Score/Health breakdown section
     */
    function _buildScoreSection(oConfig, oEntityData) {
        const oSection = new VBox();
        oSection.addStyleClass("creatio-ai-section");

        const oHeader = new HBox({
            alignItems: "Center",
            items: [
                new Icon({ src: "sap-icon://performance", size: "1rem" }).addStyleClass("creatio-section-icon"),
                new Title({ text: oConfig.scoreSectionTitle, level: "H6" }).addStyleClass("creatio-section-title")
            ]
        });
        oSection.addItem(oHeader);

        const oScoreCards = new VBox();
        oScoreCards.addStyleClass("creatio-score-cards sapUiSmallMarginTop");

        // Add score cards
        oConfig.scoreCards.forEach(function(oCard) {
            const oScoreCard = _createScoreCard(oCard.title, oCard.value, oCard.percent, oCard.description, oCard.state);
            oScoreCards.addItem(oScoreCard);
        });

        // Add sentiment/risk card
        if (oConfig.sentimentCard) {
            const oSentimentCard = new HBox({
                alignItems: "Center",
                justifyContent: "SpaceBetween"
            });
            oSentimentCard.addStyleClass("creatio-sentiment-card sapUiTinyMarginTop");
            
            oSentimentCard.addItem(new VBox({
                items: [
                    new Text({ text: oConfig.sentimentCard.label }).addStyleClass("creatio-score-label"),
                    new HBox({
                        alignItems: "Center",
                        items: [
                            new Icon({ src: oConfig.sentimentCard.icon, size: "1.25rem" }).addStyleClass(oConfig.sentimentCard.iconClass),
                            new Text({ text: oConfig.sentimentCard.value }).addStyleClass("creatio-sentiment-value")
                        ]
                    })
                ]
            }));
            oSentimentCard.addItem(new Text({ text: oConfig.sentimentCard.score }).addStyleClass("creatio-score-number"));
            oScoreCards.addItem(oSentimentCard);
        }

        // Overall rating badge
        const oRatingBox = new HBox({
            alignItems: "Center",
            justifyContent: "Center"
        });
        oRatingBox.addStyleClass("creatio-overall-rating sapUiSmallMarginTop");
        
        oRatingBox.addItem(new VBox({
            alignItems: "Center",
            items: [
                new Text({ text: oConfig.overallRatingLabel }).addStyleClass("creatio-rating-label"),
                new ObjectStatus({
                    text: oConfig.overallRatingBadge.text,
                    state: oConfig.overallRatingBadge.state,
                    icon: oConfig.overallRatingBadge.icon
                }).addStyleClass("creatio-rating-badge")
            ]
        }));
        oScoreCards.addItem(oRatingBox);

        oSection.addItem(oScoreCards);
        return oSection;
    }

    /**
     * Create a score card with progress ring
     */
    function _createScoreCard(sTitle, sValue, iPercent, sDescription, sState) {
        const oCard = new HBox({
            alignItems: "Start",
            justifyContent: "SpaceBetween"
        });
        oCard.addStyleClass("creatio-score-card");

        const sColor = sState === "Success" ? "#2e7d32" : (sState === "Warning" ? "#f57c00" : "#d32f2f");
        const oRing = new HTML({
            content: _createScoreRingSVG(iPercent, sColor)
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
    }

    /**
     * Create SVG score ring
     */
    function _createScoreRingSVG(iPercent, sColor) {
        const iRadius = 24;
        const iStroke = 4;
        const iCircumference = 2 * Math.PI * iRadius;
        const iOffset = iCircumference - (iPercent / 100) * iCircumference;
        
        return '<div class="creatio-score-ring-container">' +
            '<svg width="60" height="60" viewBox="0 0 60 60">' +
            '<circle cx="30" cy="30" r="' + iRadius + '" fill="none" stroke="#e0e0e0" stroke-width="' + iStroke + '"/>' +
            '<circle cx="30" cy="30" r="' + iRadius + '" fill="none" stroke="' + sColor + '" stroke-width="' + iStroke + '" ' +
            'stroke-dasharray="' + iCircumference + '" stroke-dashoffset="' + iOffset + '" ' +
            'stroke-linecap="round" transform="rotate(-90 30 30)"/>' +
            '<text x="30" y="35" text-anchor="middle" class="creatio-ring-text">' + iPercent + '%</text>' +
            '</svg></div>';
    }

    /**
     * Build Next Best Actions section
     */
    function _buildNextActionsSection(oConfig, oCallbacks) {
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

        oConfig.nextBestActions.forEach(function(oAction) {
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
                    if (oCallbacks.onActionPress) {
                        oCallbacks.onActionPress(oAction.id);
                    } else {
                        MessageToast.show("Executing: " + oAction.label);
                    }
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
    }

    /**
     * Build Recommended Products section (for Leads/Prospects)
     */
    function _buildProductsSection(oConfig) {
        const oSection = new VBox();
        oSection.addStyleClass("creatio-ai-section");

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

        const oProductsList = new VBox();
        oProductsList.addStyleClass("creatio-products-list sapUiSmallMarginTop");

        oConfig.products.forEach(function(oProduct) {
            const oProductCard = new HBox({
                alignItems: "Center"
            });
            oProductCard.addStyleClass("creatio-product-card");

            const oAvatar = new Avatar({
                initials: oProduct.name.substring(0, 2).toUpperCase(),
                displaySize: "S",
                backgroundColor: "Accent6"
            });

            const oDetails = new VBox({
                items: [
                    new Text({ text: oProduct.name }).addStyleClass("creatio-product-name"),
                    new Text({ text: oProduct.brand + " • " + oProduct.price }).addStyleClass("creatio-product-meta")
                ]
            });
            oDetails.addStyleClass("creatio-product-details");

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
    }

    /**
     * Build Engagement/Interaction History section
     */
    function _buildHistorySection(oConfig, sStatsKey, sHistoryKey) {
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
                        new Title({ text: oConfig.historySectionTitle, level: "H6" }).addStyleClass("creatio-section-title")
                    ]
                }),
                new Link({ text: "See All", press: function() { MessageToast.show("Opening activity log..."); } })
            ]
        });
        oSection.addItem(oHeader);

        // Stats row
        const aStats = oConfig[sStatsKey] || oConfig.engagementStats;
        if (aStats) {
            const oStatsRow = new HBox({
                justifyContent: "SpaceAround"
            });
            oStatsRow.addStyleClass("creatio-engagement-stats sapUiSmallMarginTop");

            aStats.forEach(function(oStat) {
                const oStatBox = new VBox({
                    alignItems: "Center",
                    items: [
                        new Text({ text: oStat.value }).addStyleClass("creatio-stat-number" + (oStat.styleClass ? " " + oStat.styleClass : "")),
                        new Text({ text: oStat.label }).addStyleClass("creatio-stat-label")
                    ]
                });
                oStatsRow.addItem(oStatBox);
            });
            oSection.addItem(oStatsRow);
        }

        // Timeline
        const aHistory = oConfig[sHistoryKey] || oConfig.engagementHistory;
        if (aHistory) {
            const oTimeline = new VBox();
            oTimeline.addStyleClass("creatio-mini-timeline sapUiSmallMarginTop");

            aHistory.forEach(function(oEntry, iIndex) {
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
                
                if (iIndex < aHistory.length - 1) {
                    const oLine = new HTML({ content: '<div class="creatio-timeline-line"></div>' });
                    oIndicator.addItem(oLine);
                }

                const oContent = new VBox({
                    items: [
                        new Text({ text: oEntry.description }).addStyleClass("creatio-timeline-text"),
                        new Text({ text: _formatRelativeDate(oEntry.date) }).addStyleClass("creatio-timeline-date")
                    ]
                });
                oContent.addStyleClass("creatio-timeline-content");

                oTimelineItem.addItem(oIndicator);
                oTimelineItem.addItem(oContent);
                oTimeline.addItem(oTimelineItem);
            });

            oSection.addItem(oTimeline);
        }

        return oSection;
    }

    /**
     * Build Growth Recommendations section (for Accounts)
     */
    function _buildRecommendationsSection(oConfig) {
        const oSection = new VBox();
        oSection.addStyleClass("creatio-ai-section");

        const oHeader = new HBox({
            alignItems: "Center",
            justifyContent: "SpaceBetween",
            items: [
                new HBox({
                    alignItems: "Center",
                    items: [
                        new Icon({ src: "sap-icon://trend-up", size: "1rem" }).addStyleClass("creatio-section-icon"),
                        new Title({ text: "Growth Recommendations", level: "H6" }).addStyleClass("creatio-section-title")
                    ]
                }),
                new Link({ text: "View All", press: function() { MessageToast.show("Opening recommendations..."); } })
            ]
        });
        oSection.addItem(oHeader);

        const oRecommendationsList = new VBox();
        oRecommendationsList.addStyleClass("creatio-products-list sapUiSmallMarginTop");

        oConfig.growthRecommendations.forEach(function(oRec) {
            const oRecCard = new HBox({
                alignItems: "Center"
            });
            oRecCard.addStyleClass("creatio-product-card");

            const oAvatar = new Avatar({
                initials: oRec.title.substring(0, 2).toUpperCase(),
                displaySize: "S",
                backgroundColor: oRec.impact === "High" ? "Accent2" : "Accent8"
            });

            const oDetails = new VBox({
                items: [
                    new Text({ text: oRec.title }).addStyleClass("creatio-product-name"),
                    new Text({ text: oRec.potentialValue }).addStyleClass("creatio-product-meta")
                ]
            });
            oDetails.addStyleClass("creatio-product-details");

            const oImpact = new ObjectStatus({
                text: oRec.impact,
                state: oRec.impact === "High" ? "Success" : "Warning",
                icon: "sap-icon://trend-up"
            });
            oImpact.addStyleClass("creatio-product-trend");

            oRecCard.addItem(oAvatar);
            oRecCard.addItem(oDetails);
            oRecCard.addItem(oImpact);
            oRecommendationsList.addItem(oRecCard);
        });

        oSection.addItem(oRecommendationsList);
        return oSection;
    }

    /**
     * Build Risk Indicators section (for Accounts)
     */
    function _buildRisksSection(oConfig) {
        const oSection = new VBox();
        oSection.addStyleClass("creatio-ai-section");

        const oHeader = new HBox({
            alignItems: "Center",
            justifyContent: "SpaceBetween",
            items: [
                new HBox({
                    alignItems: "Center",
                    items: [
                        new Icon({ src: "sap-icon://warning", size: "1rem" }).addStyleClass("creatio-section-icon"),
                        new Title({ text: "Risk Indicators", level: "H6" }).addStyleClass("creatio-section-title")
                    ]
                }),
                new Link({ text: "View All", press: function() { MessageToast.show("Opening risk analysis..."); } })
            ]
        });
        oSection.addItem(oHeader);

        const oRisksList = new VBox();
        oRisksList.addStyleClass("creatio-products-list sapUiSmallMarginTop");

        if (!oConfig.riskIndicators || oConfig.riskIndicators.length === 0) {
            const oNoRisks = new Text({ text: "No active risk indicators" });
            oNoRisks.addStyleClass("creatio-no-data");
            oRisksList.addItem(oNoRisks);
        } else {
            oConfig.riskIndicators.forEach(function(oRisk) {
                const oRiskCard = new HBox({
                    alignItems: "Center"
                });
                oRiskCard.addStyleClass("creatio-product-card");

                const oIcon = new Icon({ src: oRisk.icon, size: "1.5rem" });
                oIcon.addStyleClass("creatio-risk-icon");

                const oDetails = new VBox({
                    items: [
                        new Text({ text: oRisk.title }).addStyleClass("creatio-product-name"),
                        new Text({ text: oRisk.description }).addStyleClass("creatio-product-meta")
                    ]
                });
                oDetails.addStyleClass("creatio-product-details");

                const oSeverity = new ObjectStatus({
                    text: oRisk.severity,
                    state: oRisk.severity === "High" ? "Error" : (oRisk.severity === "Medium" ? "Warning" : "None"),
                    icon: "sap-icon://warning"
                });
                oSeverity.addStyleClass("creatio-product-trend");

                oRiskCard.addItem(oIcon);
                oRiskCard.addItem(oDetails);
                oRiskCard.addItem(oSeverity);
                oRisksList.addItem(oRiskCard);
            });
        }

        oSection.addItem(oRisksList);
        return oSection;
    }

    /**
     * Build Competitors section (for Opportunities)
     */
    function _buildCompetitorsSection(oConfig) {
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

        oConfig.competitors.forEach(function(oCompetitor) {
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
    }

    /**
     * Build Chat View
     */
    function _buildChatView(oFactory) {
        const oSection = new VBox();
        oSection.addStyleClass("creatio-ai-chat-view");

        // Chat messages container
        const oChatMessages = new ScrollContainer({
            vertical: true,
            horizontal: false,
            height: "calc(100vh - 300px)"
        });
        oChatMessages.addStyleClass("creatio-ai-chat-messages");

        const oMessagesContainer = new VBox();
        oMessagesContainer.addStyleClass("creatio-ai-messages-container");

        // Welcome message
        const oWelcome = new VBox({
            alignItems: "Center",
            items: [
                new Icon({ src: "sap-icon://da-2", size: "3rem" }).addStyleClass("creatio-ai-welcome-icon"),
                new Text({ text: "AI Assistant" }).addStyleClass("creatio-ai-welcome-title sapUiTinyMarginTop"),
                new Text({ text: "Ask me anything about this " + oFactory._entityType + "..." }).addStyleClass("creatio-ai-welcome-text sapUiTinyMarginTop")
            ]
        });
        oWelcome.addStyleClass("creatio-ai-welcome sapUiSmallMargin");
        oMessagesContainer.addItem(oWelcome);

        oChatMessages.addContent(oMessagesContainer);
        oSection.addItem(oChatMessages);

        // Chat input area
        const oInputArea = new VBox();
        oInputArea.addStyleClass("creatio-ai-input-area");

        const oInputRow = new HBox({
            alignItems: "End"
        });
        oInputRow.addStyleClass("creatio-ai-input-row");

        const oTextArea = new TextArea({
            placeholder: "Ask a question...",
            rows: 2,
            growing: true,
            growingMaxLines: 4,
            width: "100%"
        });
        oTextArea.addStyleClass("creatio-ai-input");
        oFactory._oChatInput = oTextArea;

        const oSendBtn = new Button({
            icon: "sap-icon://paper-plane",
            type: "Emphasized",
            press: function() {
                const sMessage = oTextArea.getValue();
                if (sMessage && sMessage.trim()) {
                    if (oFactory._callbacks.onChatMessage) {
                        oFactory._callbacks.onChatMessage(sMessage);
                    }
                    oTextArea.setValue("");
                }
            }
        });
        oSendBtn.addStyleClass("creatio-ai-send-btn");

        oInputRow.addItem(oTextArea);
        oInputRow.addItem(oSendBtn);
        oInputArea.addItem(oInputRow);
        oSection.addItem(oInputArea);

        return oSection;
    }

    /**
     * Format relative date
     */
    function _formatRelativeDate(oDate) {
        const iDiff = Date.now() - oDate.getTime();
        const iDays = Math.floor(iDiff / (1000 * 60 * 60 * 24));
        
        if (iDays === 0) return "Today";
        if (iDays === 1) return "Yesterday";
        if (iDays < 7) return iDays + " days ago";
        if (iDays < 14) return "1 week ago";
        if (iDays < 30) return Math.floor(iDays / 7) + " weeks ago";
        return oDate.toLocaleDateString();
    }

    // ============================================================================
    // FACTORY CLASS
    // ============================================================================

    var AIAssistantPanelFactory = BaseObject.extend("beautyleads.shared.AIAssistantPanelFactory", {
        /**
         * Constructor
         * @param {object} oOptions Configuration options
         * @param {string} oOptions.entityType Entity type (leads, prospects, accounts, opportunities)
         * @param {object} oOptions.entityData Current entity data
         * @param {object} oOptions.callbacks Callback functions
         */
        constructor: function(oOptions) {
            BaseObject.call(this);
            
            this._entityType = oOptions.entityType;
            this._entityData = oOptions.entityData || {};
            this._callbacks = oOptions.callbacks || {};
            this._currentView = "insights"; // 'insights' or 'chat'
            this._oPanel = null;
            this._oInsightsContent = null;
            this._oChatContent = null;
            this._oChatInput = null;
        },

        /**
         * Create and return the AI panel
         * @returns {sap.m.Panel} The AI panel
         */
        create: function() {
            const that = this;
            const oConfig = ENTITY_CONFIG[this._entityType];
            
            if (!oConfig) {
                console.error("[AIAssistantPanelFactory] Unknown entity type:", this._entityType);
                return null;
            }

            // Create main panel
            const oPanel = new Panel({
                expandable: false,
                expanded: true,
                headerText: ""
            });
            oPanel.addStyleClass("creatio-ai-panel creatio-ai-panel-enhanced creatio-ai-panel-factory");

            // Create header
            const oHeader = _buildPanelHeader(this);
            oPanel.setCustomHeader(oHeader);

            // Create scroll container
            const oScrollContainer = new ScrollContainer({
                vertical: true,
                horizontal: false,
                height: "calc(100vh - 120px)"
            });
            oScrollContainer.addStyleClass("creatio-ai-scroll");

            // Build insights content
            this._oInsightsContent = this._buildInsightsContent(oConfig);
            
            // Build chat content
            this._oChatContent = _buildChatView(this);
            this._oChatContent.setVisible(false);

            // Add both views to container
            const oContentWrapper = new VBox();
            oContentWrapper.addItem(this._oInsightsContent);
            oContentWrapper.addItem(this._oChatContent);
            
            oScrollContainer.addContent(oContentWrapper);
            oPanel.addContent(oScrollContainer);

            // Place in body
            oPanel.placeAt(document.body);
            this._oPanel = oPanel;

            console.log("[AIAssistantPanelFactory] Panel created for entity type:", this._entityType);
            return oPanel;
        },

        /**
         * Build all insights sections based on config
         * @private
         */
        _buildInsightsContent: function(oConfig) {
            const oContent = new VBox();
            oContent.addStyleClass("creatio-ai-content-enhanced");

            oConfig.sections.forEach(function(sSectionId) {
                var oSection = null;

                switch (sSectionId) {
                    case "quickActions":
                        oSection = _buildQuickActionsSection(oConfig, this._callbacks);
                        break;
                    case "scoreBreakdown":
                    case "healthBreakdown":
                    case "winProbability":
                        oSection = _buildScoreSection(oConfig, this._entityData);
                        break;
                    case "nextBestActions":
                        oSection = _buildNextActionsSection(oConfig, this._callbacks);
                        break;
                    case "recommendedProducts":
                        oSection = _buildProductsSection(oConfig);
                        break;
                    case "engagementHistory":
                        oSection = _buildHistorySection(oConfig, "engagementStats", "engagementHistory");
                        break;
                    case "interactionHistory":
                        oSection = _buildHistorySection(oConfig, "interactionStats", "interactionHistory");
                        break;
                    case "dealHistory":
                        oSection = _buildHistorySection(oConfig, "dealStats", "dealHistory");
                        break;
                    case "growthRecommendations":
                        oSection = _buildRecommendationsSection(oConfig);
                        break;
                    case "riskIndicators":
                        oSection = _buildRisksSection(oConfig);
                        break;
                    case "competitors":
                        oSection = _buildCompetitorsSection(oConfig);
                        break;
                    default:
                        console.warn("[AIAssistantPanelFactory] Unknown section:", sSectionId);
                }

                if (oSection) {
                    oContent.addItem(oSection);
                }
            }.bind(this));

            return oContent;
        },

        /**
         * Toggle between insights and chat view
         * @private
         */
        _onViewToggle: function(sView) {
            this._currentView = sView;
            
            if (sView === "insights") {
                this._oInsightsContent.setVisible(true);
                this._oChatContent.setVisible(false);
            } else {
                this._oInsightsContent.setVisible(false);
                this._oChatContent.setVisible(true);
            }
        },

        /**
         * Toggle panel visibility
         * @private
         */
        _onTogglePanel: function() {
            if (this._oPanel) {
                const bCollapsed = this._oPanel.hasStyleClass("collapsed");
                if (bCollapsed) {
                    this._oPanel.removeStyleClass("collapsed");
                } else {
                    this._oPanel.addStyleClass("collapsed");
                }
            }
        },

        /**
         * Update entity data
         * @param {object} oEntityData New entity data
         */
        updateEntityData: function(oEntityData) {
            this._entityData = oEntityData;
            // Could trigger re-render of sections here if needed
        },

        /**
         * Get the panel instance
         * @returns {sap.m.Panel}
         */
        getPanel: function() {
            return this._oPanel;
        },

        /**
         * Destroy the panel
         */
        destroy: function() {
            if (this._oPanel) {
                this._oPanel.destroy();
                this._oPanel = null;
            }
            BaseObject.prototype.destroy.call(this);
        }
    });

    // ============================================================================
    // STATIC FACTORY METHOD
    // ============================================================================

    /**
     * Static factory method for creating AI panels
     * @param {object} oOptions Configuration options
     * @returns {beautyleads.shared.AIAssistantPanelFactory} Factory instance
     */
    AIAssistantPanelFactory.create = function(oOptions) {
        const oFactory = new AIAssistantPanelFactory(oOptions);
        oFactory.create();
        return oFactory;
    };

    /**
     * Get entity configuration
     * @param {string} sEntityType Entity type
     * @returns {object} Entity configuration
     */
    AIAssistantPanelFactory.getEntityConfig = function(sEntityType) {
        return ENTITY_CONFIG[sEntityType];
    };

    return AIAssistantPanelFactory;
});

