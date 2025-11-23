sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/m/Text",
    "sap/m/HBox",
    "sap/ui/core/Icon",
    "sap/ui/core/Core"
], function (MessageToast, Fragment, Text, HBox, Icon, Core) {
    "use strict";

    let _dialog = null; // Singleton dialog instance
    let _currentMeetingData = null; // Current meeting data for copy function

    /**
     * Open AI Meeting Planner dialog
     */
    function openAIMeetingDialog(oData, oModel) {
        return new Promise(function (resolve) {
            if (!_dialog) {
                // Load fragment first time
                Fragment.load({
                    name: "beautyleads.merchants.ext.fragments.AIMeetingPlanner",
                    controller: {
                        onCloseAIMeetingPlanner: closeAIMeetingPlanner,
                        onCopyMeetingScript: copyMeetingScript
                    }
                }).then(function (oDialog) {
                    _dialog = oDialog;
                    if (oModel) {
                        oDialog.setModel(oModel);
                    }
                    
                    // Populate and open
                    populateDialog(oData);
                    oDialog.open();
                    console.log("[AI Planner] Dialog opened successfully");
                    resolve({ success: true });
                }).catch(function (err) {
                    console.error("[AI Planner] Failed to load fragment:", err);
                    MessageToast.show("Error loading AI planner: " + err.message, {
                        duration: 3000
                    });
                    resolve({ success: false, error: err });
                });
            } else {
                // Reuse existing dialog
                populateDialog(oData);
                _dialog.open();
                console.log("[AI Planner] Dialog reopened with new data");
                resolve({ success: true });
            }
        });
    }

    /**
     * Populate dialog with partner data
     */
    function populateDialog(oData) {
        if (!_dialog) {
            console.error("[AI Planner] Cannot populate - dialog not loaded");
            return;
        }

        console.log("[AI Planner] Populating dialog with data:", oData);

        try {
            // Extract partner information
            const sPartnerName = oData.merchantName || "Channel Partner";
            const sBusinessType = oData.businessType || "N/A";
            const sLocation = oData.city || oData.location || "N/A";
            const sDiscoverySource = oData.discoverySource || "N/A";
            const iScore = oData.merchantScore || 0;
            // Use contact name if available, otherwise use the merchant/store name
            const sContactName = oData.contactName || sPartnerName;
            const sSocialLinks = oData.socialMediaLinks || "Not available";
            
            console.log("[AI Planner] Using contact name:", sContactName, "from data:", {
                contactName: oData.contactName,
                contactInfo: oData.contactInfo,
                merchantName: oData.merchantName
            });

            // Helper to find control by ID
            const byId = function(sId) {
                try {
                    const aContent = _dialog.getContent();
                    if (!aContent || aContent.length === 0) {
                        console.warn("[AI Planner] Dialog has no content");
                        return null;
                    }
                    const oControl = aContent[0].findAggregatedObjects(true, function(oCtrl) {
                        return oCtrl.getId && oCtrl.getId().endsWith(sId);
                    })[0];
                    if (!oControl) {
                        console.warn("[AI Planner] Control not found:", sId);
                    }
                    return oControl;
                } catch (e) {
                    console.error("[AI Planner] Error finding control", sId, e);
                    return null;
                }
            };

            // Set Partner Overview
            const oPartnerNameText = byId("partnerName");
            if (oPartnerNameText && oPartnerNameText.setText) oPartnerNameText.setText(sPartnerName);
            
            const oBusinessTypeText = byId("businessType");
            if (oBusinessTypeText && oBusinessTypeText.setText) oBusinessTypeText.setText(sBusinessType);
            
            const oLocationText = byId("location");
            if (oLocationText && oLocationText.setText) oLocationText.setText(sLocation);
            
            const oPartnerScoreText = byId("partnerScore");
            if (oPartnerScoreText && oPartnerScoreText.setText) oPartnerScoreText.setText(iScore + "%");

            // Set Suggested Opening - personalized greeting
            let sGreeting = '';
            if (oData.contactName && oData.contactName !== sPartnerName) {
                // If we have a specific contact name different from store name
                sGreeting = 'Hi ' + oData.contactName + ' from <strong>' + sPartnerName + '</strong>';
            } else {
                // Use the store/merchant name
                sGreeting = 'Hi, thank you for taking the time to meet with us regarding <strong>' + sPartnerName + '</strong>';
            }
            
            const sSuggestedOpening = '<p><strong>"' + sGreeting + ', thanks for taking the time to meet with us.</strong></p>' +
                   '<p>Based on your presence in the <strong>' + sBusinessType + '</strong> space at <strong>' + sLocation + '</strong>, ' +
                   'we believe there is strong potential for collaboration."</p>';
            const oSuggestedOpeningText = byId("suggestedOpening");
            if (oSuggestedOpeningText && oSuggestedOpeningText.setHtmlText) oSuggestedOpeningText.setHtmlText(sSuggestedOpening);

            // Set Business Context
            const oContextBusinessType = byId("contextBusinessType");
            if (oContextBusinessType && oContextBusinessType.setText) oContextBusinessType.setText(sBusinessType);
            
            const oContextLocation = byId("contextLocation");
            if (oContextLocation && oContextLocation.setText) oContextLocation.setText(sLocation);
            
            const oContextDiscoverySource = byId("contextDiscoverySource");
            if (oContextDiscoverySource && oContextDiscoverySource.setText) oContextDiscoverySource.setText(sDiscoverySource);
            
            const oContextSocialLinks = byId("contextSocialLinks");
            if (oContextSocialLinks && oContextSocialLinks.setText) oContextSocialLinks.setText(sSocialLinks);

            // Generate Talking Points
            const aTalkingPoints = [
                'Explore growth opportunities based on your channel partner score (' + iScore + '%).',
                'Discuss onboarding readiness and next steps.',
                'Identify ideal first SKUs or campaigns to pilot.',
                'Align on commercial expectations & timelines.'
            ];

            const oTalkingPointsList = byId("talkingPointsList");
            if (oTalkingPointsList && oTalkingPointsList.destroyItems) {
                oTalkingPointsList.destroyItems();
                aTalkingPoints.forEach(function(sPoint, index) {
                    const oPointBox = new HBox({
                        alignItems: "Start",
                        items: [
                            new Icon({
                                src: "sap-icon://circle-task-2",
                                color: "#0070f2"
                            }).addStyleClass("sapUiTinyMarginEnd"),
                            new Text({
                                text: (index + 1) + ". " + sPoint,
                                wrapping: true
                            })
                        ]
                    }).addStyleClass("sapUiTinyMarginBottom");
                    oTalkingPointsList.addItem(oPointBox);
                });
            }

            // Set Next Action
            const sNextAction = '<p><strong>Follow-up:</strong> Schedule a detailed discussion about how SmartCommerce CRM can support ' + 
                   sPartnerName + '\'s growth as an early channel partner.</p>' +
                   '<p>Prepare partnership proposal and onboarding timeline for next meeting.</p>';
            const oNextActionText = byId("nextAction");
            if (oNextActionText && oNextActionText.setHtmlText) oNextActionText.setHtmlText(sNextAction);

            // Store data for copy functionality
            _currentMeetingData = {
                partnerName: sPartnerName,
                businessType: sBusinessType,
                location: sLocation,
                discoverySource: sDiscoverySource,
                score: iScore,
                contactName: sContactName,
                socialLinks: sSocialLinks
            };
            
            console.log("[AI Planner] Dialog populated successfully");
        } catch (error) {
            console.error("[AI Planner] Error populating dialog:", error);
            MessageToast.show("Some data may not display correctly", { duration: 2000 });
        }
    }

    /**
     * Close dialog
     */
    function closeAIMeetingPlanner() {
        if (_dialog) {
            _dialog.close();
        }
    }

    /**
     * Copy meeting script to clipboard
     */
    function copyMeetingScript() {
        if (!_currentMeetingData) {
            MessageToast.show("No meeting data available");
            return;
        }

        const oData = _currentMeetingData;
        
        // Generate full meeting script
        let sScript = "AI MEETING PLANNER FOR " + oData.partnerName.toUpperCase() + "\n";
        sScript += "=".repeat(60) + "\n\n";
        
        sScript += "PARTNER OVERVIEW\n" + "-".repeat(60) + "\n";
        sScript += "Partner Name: " + oData.partnerName + "\n";
        sScript += "Business Type: " + oData.businessType + "\n";
        sScript += "Location: " + oData.location + "\n";
        sScript += "Channel Partner Score: " + oData.score + "%\n\n";
        
        sScript += "SUGGESTED OPENING\n" + "-".repeat(60) + "\n";
        let sGreeting = '';
        if (oData.contactName && oData.contactName !== oData.partnerName) {
            sGreeting = 'Hi ' + oData.contactName + ' from ' + oData.partnerName;
        } else {
            sGreeting = 'Hi, thank you for taking the time to meet with us regarding ' + oData.partnerName;
        }
        sScript += '"' + sGreeting + ', thanks for taking the time to meet with us. ';
        sScript += 'Based on your presence in the ' + oData.businessType + ' space at ' + oData.location + ', ';
        sScript += 'we believe there is strong potential for collaboration."\n\n';
        
        sScript += "BUSINESS CONTEXT\n" + "-".repeat(60) + "\n";
        sScript += "• Business Type: " + oData.businessType + "\n";
        sScript += "• Location: " + oData.location + "\n";
        sScript += "• Discovery Source: " + oData.discoverySource + "\n";
        sScript += "• Social Reach: " + oData.socialLinks + "\n\n";
        
        sScript += "RECOMMENDED TALKING POINTS\n" + "-".repeat(60) + "\n";
        sScript += "1. Explore growth opportunities based on your channel partner score (" + oData.score + "%).\n";
        sScript += "2. Discuss onboarding readiness and next steps.\n";
        sScript += "3. Identify ideal first SKUs or campaigns to pilot.\n";
        sScript += "4. Align on commercial expectations & timelines.\n\n";
        
        sScript += "NEXT ACTION\n" + "-".repeat(60) + "\n";
        sScript += "Follow-up: Schedule a detailed discussion about how SmartCommerce CRM can support ";
        sScript += oData.partnerName + "'s growth as an early channel partner.\n";
        sScript += "Prepare partnership proposal and onboarding timeline for next meeting.\n";

        // Copy to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(sScript).then(function() {
                MessageToast.show("Meeting script copied to clipboard!", { duration: 2000 });
            }).catch(function(err) {
                console.error("Failed to copy:", err);
                MessageToast.show("Failed to copy to clipboard");
            });
        } else {
            // Fallback
            const textArea = document.createElement("textarea");
            textArea.value = sScript;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                MessageToast.show("Meeting script copied to clipboard!", { duration: 2000 });
            } catch (err) {
                MessageToast.show("Failed to copy to clipboard");
            }
            document.body.removeChild(textArea);
        }
    }

    // Return public API
    return {
        /**
         * Handler for AI Meeting Initiator action
         * Called directly from manifest custom action
         */
        onAIMeetingInitiator: function (oEvent) {
            console.log("[AI Planner] Action handler triggered");
            
            // Try to get real binding context and data
            let oBindingContext = null;
            let oModel = null;
            let oData = null;

            try {
                // FE V4 Approach 1: Get context from the internal API if available
                // Custom actions receive selectedContexts in oEvent
                if (oEvent && oEvent.getParameter) {
                    const aSelectedContexts = oEvent.getParameter("selectedContexts");
                    if (aSelectedContexts && aSelectedContexts.length > 0) {
                        oBindingContext = aSelectedContexts[0];
                        console.log("[AI Planner] Context from selectedContexts:", oBindingContext.getPath());
                    }
                }

                // FE V4 Approach 2: Get from current routing/hash
                if (!oBindingContext) {
                    console.log("[AI Planner] Trying to get context from routing");
                    const oAppComponent = Core.getComponent(Core.getCurrentFocusedWindow && Core.getCurrentFocusedWindow().name || "");
                    if (!oAppComponent) {
                        // Try getting the root component
                        const oRootComponent = Core.getRootComponent();
                        if (oRootComponent) {
                            const oRouter = oRootComponent.getRouter && oRootComponent.getRouter();
                            if (oRouter) {
                                const oRouteMatch = oRouter.getRouteInfoByHash && oRouter.getRouteInfoByHash(window.location.hash);
                                console.log("[AI Planner] Route match:", oRouteMatch);
                            }
                        }
                    }
                }

                // Approach 3: Extract path from URL and fetch data directly via HTTP
                if (!oBindingContext) {
                    console.log("[AI Planner] Trying to extract context from URL hash");
                    const sHash = window.location.hash;
                    console.log("[AI Planner] Current hash:", sHash);
                    
                    // Extract the key from URL like #/MerchantDiscoveries(ID=...)
                    const oHashMatch = sHash.match(/MerchantDiscoveries\([^)]+\)/);
                    if (oHashMatch) {
                        const sEntityPath = oHashMatch[0];
                        console.log("[AI Planner] Extracted entity path:", sEntityPath);
                        
                        // Fetch data directly via HTTP
                        const sODataUrl = "/merchant/" + sEntityPath;
                        console.log("[AI Planner] Fetching data from:", sODataUrl);
                        
                        fetch(sODataUrl, {
                            method: 'GET',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            }
                        })
                        .then(function(response) {
                            console.log("[AI Planner] HTTP response status:", response.status);
                            if (response.ok) {
                                return response.json();
                            } else {
                                throw new Error("HTTP " + response.status + ": " + response.statusText);
                            }
                        })
                        .then(function(oJson) {
                            console.log("[AI Planner] ✓ Data fetched successfully:", oJson);
                            const oRealData = oJson.value || oJson; // Handle both array and single object responses
                            if (oRealData && oRealData.merchantName) {
                                console.log("[AI Planner] Re-populating dialog with real data:", oRealData.merchantName);
                                
                                // Wait for dialog to be loaded before populating
                                const waitForDialog = function(attempts) {
                                    if (attempts === void 0) attempts = 0;
                                    
                                    if (_dialog) {
                                        console.log("[AI Planner] Dialog ready, populating with real data");
                                        populateDialog(oRealData);
                                        MessageToast.show("Loaded: " + oRealData.merchantName, { duration: 1500 });
                                    } else if (attempts < 20) {
                                        // Dialog not ready yet, wait and retry
                                        console.log("[AI Planner] Waiting for dialog to load... attempt", attempts + 1);
                                        setTimeout(function() {
                                            waitForDialog(attempts + 1);
                                        }, 100);
                                    } else {
                                        console.error("[AI Planner] Timeout waiting for dialog to load");
                                    }
                                };
                                
                                waitForDialog(0);
                            }
                        })
                        .catch(function(error) {
                            console.error("[AI Planner] Failed to fetch data:", error);
                            MessageToast.show("Using demo data (could not load partner details)", { duration: 2000 });
                        });
                        
                        // Mark that we attempted to fetch real data
                        console.log("[AI Planner] Real data fetch initiated in background");
                    }
                }

                // Get data from context or use mock data
                if (oBindingContext) {
                    oData = oBindingContext.getObject();
                    console.log("[AI Planner] Using real partner data:", oData && oData.merchantName);
                    MessageToast.show("Loading AI Meeting Planner for " + (oData.merchantName || "partner"), {
                        duration: 1500
                    });
                } else {
                    console.warn("[AI Planner] No binding context found, using mock data");
                    oData = {
                        merchantName: "Sample Channel Partner",
                        businessType: "Beauty Salon",
                        city: "Singapore",
                        location: "Marina Bay",
                        discoverySource: "LinkedIn",
                        merchantScore: 75,
                        contactName: "Jane Doe",
                        contactInfo: "Jane Doe",
                        socialMediaLinks: "LinkedIn, Instagram"
                    };
                    MessageToast.show("Showing demo data - please select a partner record for real data", {
                        duration: 2000
                    });
                }

            } catch (error) {
                console.error("[AI Planner] Error retrieving data:", error);
                // Fallback to mock data
                oData = {
                    merchantName: "Sample Channel Partner",
                    businessType: "Beauty Salon",
                    city: "Singapore",
                    location: "Marina Bay",
                    discoverySource: "LinkedIn",
                    merchantScore: 75,
                    contactName: "Jane Doe",
                    contactInfo: "Jane Doe",
                    socialMediaLinks: "LinkedIn, Instagram"
                };
                MessageToast.show("Using demo data due to error", { duration: 2000 });
            }

            // Open the planner dialog
            return openAIMeetingDialog(oData, oModel);
        },

        onCloseAIMeetingPlanner: closeAIMeetingPlanner,
        onCopyMeetingScript: copyMeetingScript
    };
});
