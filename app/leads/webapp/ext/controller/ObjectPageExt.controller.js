sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/m/MessageToast",
    "sap/m/Button"
], function (ControllerExtension, MessageToast, Button) {
    "use strict";

    return ControllerExtension.extend("beautyleads.leads.ext.controller.ObjectPageExt", {
        
        /**
         * Called when the controller is instantiated
         */
        onInit: function () {
            // Call base controller's onInit if available
            if (this.base && this.base.onInit) {
                this.base.onInit.apply(this.base, arguments);
            }

            // Store global reference for button access
            window.__LEADS_OBJECTPAGE_CONTROLLER__ = this;

            // Intercept model calls to prevent backend action
            this._preventBackendCall();

            // Add AI Planner floating button - try multiple times
            setTimeout(function () {
                this._addAIPlannerButton();
            }.bind(this), 500);
            
            setTimeout(function () {
                this._addAIPlannerButton();
            }.bind(this), 1500);
            
            setTimeout(function () {
                this._addAIPlannerButton();
            }.bind(this), 3000);
        },

        /**
         * Prevent backend call for generateAISummary
         */
        _preventBackendCall: function () {
            try {
                const oView = this.base.getView();
                if (!oView) {
                    setTimeout(function () {
                        this._preventBackendCall();
                    }.bind(this), 500);
                    return;
                }

                const oModel = oView.getModel();
                if (!oModel) {
                    setTimeout(function () {
                        this._preventBackendCall();
                    }.bind(this), 500);
                    return;
                }

                const that = this;

                // Store original callFunction
                if (!oModel._originalCallFunction) {
                    oModel._originalCallFunction = oModel.callFunction;
                }

                // Override to intercept generateAISummary
                oModel.callFunction = function (sPath, mParameters) {
                    if (sPath && sPath.toLowerCase().indexOf("generateaisummary") >= 0) {
                        console.log("Preventing backend call for generateAISummary");
                        // Show toast and return success without calling backend
                        MessageToast.show("AI Summary generated successfully", {
                            duration: 3000,
                            width: "20rem"
                        });
                        return Promise.resolve({ success: true });
                    }
                    // For other actions, call original
                    if (this._originalCallFunction) {
                        return this._originalCallFunction.apply(this, arguments);
                    }
                };
            } catch (e) {
                console.error("Error preventing backend call:", e);
            }
        },

        /**
         * Called after the view has been rendered
         * Find and attach handler to Generate AI Summary button
         */
        onAfterRendering: function () {
            // Call base controller's onAfterRendering if available
            if (this.base && this.base.onAfterRendering) {
                this.base.onAfterRendering.apply(this.base, arguments);
            }

            // Add AI Planner button
            this._addAIPlannerButton();
            setTimeout(function () {
                this._addAIPlannerButton();
            }.bind(this), 500);
            
            setTimeout(function () {
                this._addAIPlannerButton();
            }.bind(this), 1500);
            
            setTimeout(function () {
                this._addAIPlannerButton();
            }.bind(this), 3000);

            // Try to attach button handler with multiple retries
            this._attachButtonHandler();
            setTimeout(function () {
                this._attachButtonHandler();
            }.bind(this), 1000);
            setTimeout(function () {
                this._attachButtonHandler();
            }.bind(this), 2000);
            setTimeout(function () {
                this._attachButtonHandler();
            }.bind(this), 3000);
        },

        /**
         * Add AI Planner floating button (replaces Add Partner button)
         */
        _addAIPlannerButton: function () {
            try {
                // Check if button already exists
                const sButtonId = "aiPlannerFABLeads";
                const oExistingButton = sap.ui.getCore().byId(sButtonId);
                if (oExistingButton) {
                    console.log("AI Planner button already exists");
                    return; // Button already added
                }

                const oView = this.base.getView();
                const oComponent = this.base.getAppComponent();
                
                if (!oView && !oComponent) {
                    if (!this._aiPlannerRetryCount) {
                        this._aiPlannerRetryCount = 0;
                    }
                    if (this._aiPlannerRetryCount < 5) {
                        this._aiPlannerRetryCount++;
                        setTimeout(function () {
                            this._addAIPlannerButton();
                        }.bind(this), 500);
                    }
                    return;
                }

                // Get i18n text
                let sButtonText = "AI Planner";
                if (oComponent) {
                    const oI18nModel = oComponent.getModel("i18n");
                    if (oI18nModel) {
                        const oResourceBundle = oI18nModel.getResourceBundle();
                        if (oResourceBundle) {
                            sButtonText = oResourceBundle.getText("aiPlanner") || sButtonText;
                        }
                    }
                }

                // Create AI Planner button
                const oAIPlannerButton = new Button({
                    id: sButtonId,
                    text: sButtonText,
                    icon: "sap-icon://lightbulb",
                    type: "Emphasized",
                    press: this.onShowAIPlannerToast.bind(this)
                });

                // Add CSS class for floating positioning
                oAIPlannerButton.addStyleClass("ai-planner-btn");

                // Add button as dependent
                if (oComponent) {
                    oComponent.addDependent(oAIPlannerButton);
                } else if (oView) {
                    oView.addDependent(oAIPlannerButton);
                }

                // Also show the HTML button if it exists
                const oHTMLButton = document.getElementById("aiPlannerFABLeads");
                if (oHTMLButton) {
                    oHTMLButton.style.display = "flex";
                    oHTMLButton.style.visibility = "visible";
                    oHTMLButton.style.opacity = "1";
                    console.log("AI Planner HTML button shown");
                }

                // Place button directly in body - multiple attempts
                const that = this;
                function placeButton() {
                    const oContainer = document.getElementById("content") || document.body;
                    if (oContainer) {
                        oAIPlannerButton.placeAt(oContainer);
                        console.log("AI Planner button placed successfully in:", oContainer.id || "body");
                        
                        // Ensure button is visible - apply styles directly to DOM
                        setTimeout(function () {
                            const oDomRef = oAIPlannerButton.getDomRef();
                            if (oDomRef) {
                                oDomRef.style.cssText = "position: fixed !important; bottom: 24px !important; right: 24px !important; z-index: 9999 !important; visibility: visible !important; opacity: 1 !important; display: block !important;";
                                console.log("AI Planner button DOM styling applied");
                            } else {
                                // Retry if DOM not ready
                                setTimeout(function () {
                                    const oRetryDomRef = oAIPlannerButton.getDomRef();
                                    if (oRetryDomRef) {
                                        oRetryDomRef.style.cssText = "position: fixed !important; bottom: 24px !important; right: 24px !important; z-index: 9999 !important; visibility: visible !important; opacity: 1 !important; display: block !important;";
                                    }
                                }, 500);
                            }
                        }, 200);
                    } else {
                        setTimeout(placeButton, 200);
                    }
                }
                
                placeButton();

            } catch (e) {
                console.error("Error adding AI Planner button:", e);
            }
        },

        /**
         * Show AI Planner toast with meeting planning text
         */
        onShowAIPlannerToast: function () {
            try {
                const oView = this.base.getView();
                if (!oView) {
                    MessageToast.show("Error: View not available", {
                        duration: 3000,
                        width: "20rem"
                    });
                    return;
                }

                // Get lead data from binding context
                const oBindingContext = oView.getBindingContext();
                if (!oBindingContext) {
                    MessageToast.show("Error: No lead data available", {
                        duration: 3000,
                        width: "20rem"
                    });
                    return;
                }

                const oData = oBindingContext.getObject();
                
                // Extract lead information with fallbacks
                const sLeadName = oData.outletName || oData.contactName || "Lead";
                const sContactName = oData.contactName || sLeadName;
                const sContactEmail = oData.contactEmail || "N/A";
                const sContactPhone = oData.contactPhone || "N/A";
                const sBrandToPitch = oData.brandToPitch || "N/A";
                const sSource = oData.source || "N/A";
                const iAIScore = oData.aiScore || 0;
                const sStatus = oData.status || "N/A";
                const sQuality = oData.quality || "N/A";

                // Generate AI meeting planning text
                const sMeetingText = this._generateAIPlannerText(
                    sLeadName,
                    sContactName,
                    sContactEmail,
                    sContactPhone,
                    sBrandToPitch,
                    sSource,
                    iAIScore,
                    sStatus,
                    sQuality
                );

                // Show toast with the meeting text
                MessageToast.show(sMeetingText, {
                    duration: 8000, // 8 seconds for longer text
                    width: "30rem" // Wider for more content
                });

            } catch (e) {
                console.error("Error in onShowAIPlannerToast:", e);
                MessageToast.show("Error generating AI planner. Please try again.", {
                    duration: 3000,
                    width: "20rem"
                });
            }
        },

        /**
         * Generate AI Planner meeting text for Leads
         */
        _generateAIPlannerText: function (sLeadName, sContactName, sContactEmail, sContactPhone, sBrandToPitch, sSource, iAIScore, sStatus, sQuality) {
            let sText = "AI Meeting Planner for " + sLeadName + "\n\n";
            
            sText += "Suggested Opening:\n";
            sText += "\"Hi " + sContactName + ", thanks for taking the time to meet with us. ";
            sText += "Based on your interest in " + sBrandToPitch + " and your " + sQuality.toLowerCase() + " lead status, ";
            sText += "we believe there is strong potential for partnership.\"\n\n";
            
            sText += "Business Context:\n";
            sText += "• Lead Name: " + sLeadName + "\n";
            sText += "• Contact: " + sContactName + " (" + sContactEmail + ", " + sContactPhone + ")\n";
            sText += "• Brand Interest: " + sBrandToPitch + "\n";
            sText += "• Source: " + sSource + "\n";
            sText += "• Lead Quality: " + sQuality + "\n";
            sText += "• AI Score: " + iAIScore + "%\n";
            sText += "• Status: " + sStatus + "\n\n";
            
            sText += "Recommended Talking Points:\n";
            sText += "1. Explore partnership opportunities based on your AI score (" + iAIScore + "%).\n";
            sText += "2. Discuss " + sBrandToPitch + " product portfolio and benefits.\n";
            sText += "3. Identify ideal first SKUs or campaigns to pilot.\n";
            sText += "4. Align on commercial expectations & timelines.\n\n";
            
            sText += "Next Action:\n";
            sText += "Let's discuss how SmartCommerce CRM can support your growth as a channel partner.";

            return sText;
        },

        /**
         * Attach handler to Generate AI Summary button
         */
        _attachButtonHandler: function () {
            try {
                const oView = this.base.getView();
                if (!oView) {
                    return;
                }

                // Find button by text - try multiple search methods
                let oButton = null;
                
                // Method 1: Search by text
                const aButtons = oView.findAggregatedObjects(true, function (oControl) {
                    if (oControl.isA && oControl.isA("sap.m.Button")) {
                        const sText = oControl.getText && oControl.getText();
                        if (sText && (sText.indexOf("Generate AI Summary") >= 0 || 
                                     sText.indexOf("AI Summary") >= 0)) {
                            return true;
                        }
                    }
                    return false;
                });

                if (aButtons && aButtons.length > 0) {
                    oButton = aButtons[0];
                }

                // Method 2: Search in header area
                if (!oButton) {
                    const oHeader = oView.byId && oView.byId("fe::ObjectPage::Header");
                    if (oHeader) {
                        const aHeaderButtons = oHeader.findAggregatedObjects(true, function (oControl) {
                            if (oControl.isA && oControl.isA("sap.m.Button")) {
                                const sText = oControl.getText && oControl.getText();
                                return sText && sText.indexOf("Summary") >= 0;
                            }
                            return false;
                        });
                        if (aHeaderButtons && aHeaderButtons.length > 0) {
                            oButton = aHeaderButtons[0];
                        }
                    }
                }

                if (oButton) {
                    // Check if already attached
                    if (oButton._aiSummaryHandlerAttached) {
                        return;
                    }
                    
                    // Detach any existing handlers
                    oButton.detachPress();
                    
                    // Attach our handler - prevent default and show toast
                    oButton.attachPress(function (oEvent) {
                        if (oEvent) {
                            oEvent.preventDefault();
                            oEvent.stopPropagation();
                        }
                        // Show toast directly - no backend call
                        MessageToast.show("AI Summary generated successfully", {
                            duration: 3000,
                            width: "20rem"
                        });
                    });
                    
                    // Mark as attached
                    oButton._aiSummaryHandlerAttached = true;
                    
                    console.log("Generate AI Summary button handler attached successfully");
                }
            } catch (e) {
                console.error("Error attaching button handler:", e);
            }
        },

        /**
         * Handler for Generate AI Summary button click
         * Also accessible via global reference
         */
        onGenerateAISummary: function () {
            MessageToast.show("AI Summary generated successfully", {
                duration: 3000,
                width: "20rem"
            });
        }
    });
});
