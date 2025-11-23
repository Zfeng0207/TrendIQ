sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension"
], function (ControllerExtension) {
    "use strict";

    return ControllerExtension.extend("beautyleads.merchants.ext.controller.ObjectPageExt", {

        /**
         * This controller extension only manages the floating AI Planner button
         * The header "AI Meeting Initiator" action is handled by AIMeetingActions.js
         */

        onInit: function () {
            console.log("[AI Planner] Controller extension loaded");
            
            // Set up floating button with delay for DOM readiness
            setTimeout(function () {
                this._setupFloatingButton();
            }.bind(this), 1000);

            // Retry a few times to ensure button appears
            setTimeout(function () {
                this._setupFloatingButton();
            }.bind(this), 2000);
        },

        /**
         * Set up the floating AI Planner button
         */
        _setupFloatingButton: function () {
            try {
                const oHTMLButton = document.getElementById("aiPlannerFAB");
                if (oHTMLButton && !oHTMLButton._aiPlannerSetup) {
                    oHTMLButton.style.display = "flex";
                    oHTMLButton.style.visibility = "visible";
                    oHTMLButton.style.opacity = "1";
                    
                    // Attach click handler
                    oHTMLButton.addEventListener("click", function() {
                        // Trigger the same action as the header button
                        const oView = this.base && this.base.getView && this.base.getView();
                        if (oView) {
                            const oBindingContext = oView.getBindingContext();
                            if (oBindingContext) {
                                // Load and call the action handler directly
                                sap.ui.require(["beautyleads/merchants/ext/actions/AIMeetingActions"], function(Actions) {
                                    // Create a fake event object with necessary properties
                                    const oFakeEvent = {
                                        getSource: function() {
                                            return {
                                                getBindingContext: function() {
                                                    return oBindingContext;
                                                },
                                                getModel: function() {
                                                    return oView.getModel();
                                                }
                                            };
                                        }
                                    };
                                    Actions.onAIMeetingInitiator(oFakeEvent);
                                });
                            }
                        }
                    }.bind(this));
                    
                    oHTMLButton._aiPlannerSetup = true;
                    console.log("[AI Planner] Floating button configured");
                }

                // Hide Add Partner button on ObjectPage
                const oAddPartnerButton = document.getElementById("addPartnerFAB");
                if (oAddPartnerButton) {
                    oAddPartnerButton.style.display = "none";
                    oAddPartnerButton.style.visibility = "hidden";
                    oAddPartnerButton.style.opacity = "0";
                }
            } catch (e) {
                console.error("[AI Planner] Error setting up floating button:", e);
            }
        }
    });
});
