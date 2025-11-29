sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (ControllerExtension, MessageToast, MessageBox) {
    "use strict";

    return ControllerExtension.extend("beautyleads.leads.ext.controller.CustomActions", {
        
        override: {
            onInit: function() {
                console.log("=== CONTROLLER EXTENSION LOADED ===");
                
                // Add global navigation function
                window._beautyleadsNavigateToOnboarding = this._navigateToOnboarding.bind(this);
                console.log("Global navigation function registered");
            }
        },

        /**
         * Save the current draft - activates the draft entity
         * @param {object} oBindingContext - The binding context
         * @param {object} aSelectedContexts - Selected contexts (for table actions)
         */
        onSaveDraft: function(oBindingContext, aSelectedContexts) {
            var that = this;
            var oEditFlow = this.base.getExtensionAPI().getEditFlow();
            
            MessageToast.show("Saving...");
            
            oEditFlow.saveDocument(oBindingContext).then(function() {
                MessageToast.show("Lead saved successfully!");
            }).catch(function(oError) {
                console.error("Save failed:", oError);
                MessageBox.error("Failed to save: " + (oError.message || "Unknown error"));
            });
        },

        /**
         * Navigate to merchant discovery onboarding page
         * @private
         */
        _navigateToOnboarding: function(sMerchantDiscoveryID) {
            console.log("=== NAVIGATING TO ONBOARDING ===");
            console.log("Merchant Discovery ID:", sMerchantDiscoveryID);
            
            MessageToast.show("Lead converted successfully! Redirecting to onboarding...", {
                duration: 1500
            });

            // Navigate to the merchant discovery (onboarding) page
            setTimeout(function() {
                var sUrl = "/beautyleads.merchants/index.html#/MerchantDiscoveries(" + sMerchantDiscoveryID + ")";
                console.log("Navigation URL:", sUrl);
                window.location.href = sUrl;
            }, 1500);
        }
    });
});

