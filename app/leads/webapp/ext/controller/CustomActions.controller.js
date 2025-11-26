sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/m/MessageToast"
], function (ControllerExtension, MessageToast) {
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

