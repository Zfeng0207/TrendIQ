sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/m/MessageToast"
], function (ControllerExtension, MessageToast) {
    "use strict";

    return ControllerExtension.extend("beautyleads.leads.ext.CustomActions", {
        
        override: {
            /**
             * Called when the view is initialized
             */
            onInit: function() {
                // Call base onInit if it exists
                if (this.base && this.base.onInit) {
                    this.base.onInit();
                }
            },
            
            /**
             * Hook into editFlow to intercept action responses
             * This allows us to navigate after successful conversion
             */
            editFlow: {
                onAfterAction: function(mParameters) {
                    var sActionName = mParameters && mParameters.actionName;
                    
                    // Check if this is the convertToAccount action
                    if (sActionName && sActionName.indexOf("convertToAccount") >= 0) {
                        var oResponse = mParameters.response;
                        
                        // Extract accountID from response
                        var sAccountID;
                        if (oResponse && oResponse.accountID) {
                            sAccountID = oResponse.accountID;
                        } else if (oResponse && oResponse.value && oResponse.value.accountID) {
                            sAccountID = oResponse.value.accountID;
                        }
                        
                        // Navigate to the account onboarding if we have the ID
                        if (sAccountID) {
                            MessageToast.show("Lead converted successfully. Starting onboarding...", {
                                duration: 2000,
                                onClose: function () {
                                    // Navigate to onboarding wizard
                                    sap.ushell.Container.getServiceAsync("CrossApplicationNavigation")
                                        .then(function (oCrossAppNav) {
                                            // Use hash-based navigation to onboarding route
                                            var sHash = oCrossAppNav.hrefForExternal({
                                                target: {
                                                    semanticObject: "Accounts",
                                                    action: "manage"
                                                }
                                            });
                                            
                                            // Navigate to the onboarding route
                                            // Format: #Accounts-manage&/Accounts(ID)/onboarding
                                            window.location.hash = sHash + "&/Accounts(" + sAccountID + ")/onboarding";
                                        })
                                        .catch(function(oError) {
                                            console.error("Navigation error:", oError);
                                            // Fallback to direct hash navigation
                                            window.location.href = "/beautyleads.accounts/index.html#/Accounts(" + sAccountID + ")/onboarding";
                                        });
                                }
                            });
                        }
                    }
                    
                    // Call base handler if it exists
                    if (this.base && this.base.editFlow && this.base.editFlow.onAfterAction) {
                        return this.base.editFlow.onAfterAction.apply(this.base, arguments);
                    }
                }
            }
        }
    });
});
