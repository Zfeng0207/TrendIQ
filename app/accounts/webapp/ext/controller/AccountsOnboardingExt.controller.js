sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment"
], function (ControllerExtension, MessageToast, MessageBox, Fragment) {
    "use strict";

    return ControllerExtension.extend("beautyleads.accounts.ext.controller.AccountsOnboardingExt", {
        
        override: {
            /**
             * Called when the onboarding view is initialized
             */
            onInit: function() {
                // Call base onInit
                if (this.base && this.base.onInit) {
                    this.base.onInit();
                }

                // Show onboarding welcome message and wizard
                var that = this;
                setTimeout(function() {
                    that._showOnboardingWelcome();
                    that._loadOnboardingWizard();
                }, 800);
            },

            /**
             * Called when the route matches this page
             */
            routing: {
                onAfterBinding: function() {
                    // Ensure wizard is loaded when navigating
                    this._loadOnboardingWizard();
                }
            }
        },

        /**
         * Load the onboarding wizard fragment
         * @private
         */
        _loadOnboardingWizard: function() {
            var oView = this.base.getView();
            
            // Check if wizard is already loaded
            if (this._oWizardDialog) {
                return;
            }

            var that = this;
            Fragment.load({
                id: oView.getId(),
                name: "beautyleads.accounts.ext.fragments.OnboardingWizard",
                controller: this
            }).then(function(oFragment) {
                that._oWizardFragment = oFragment;
                // Could add to a section in the object page
                // For now, we'll show it via the welcome dialog
            });
        },

        /**
         * Show welcome message for onboarding
         * @private
         */
        _showOnboardingWelcome: function() {
            var oView = this.base.getView();
            var oBindingContext = oView.getBindingContext();

            if (!oBindingContext) {
                return;
            }

            var sAccountName = oBindingContext.getProperty("accountName");

            MessageBox.information(
                "Welcome to the Account Onboarding Wizard!\n\n" +
                "You've successfully converted a lead to an account: " + sAccountName + "\n\n" +
                "Next steps:\n" +
                "1. Review and complete account details\n" +
                "2. Add contacts and key personnel\n" +
                "3. Set up opportunities and campaigns\n" +
                "4. Configure account preferences\n\n" +
                "Click 'Edit' to complete the onboarding process.",
                {
                    title: "Account Onboarding",
                    actions: [MessageBox.Action.OK],
                    onClose: function() {
                        // Optionally trigger edit mode automatically
                        // that._enableEditMode();
                    }
                }
            );
        },

        /**
         * Enable edit mode for the onboarding
         * @private
         */
        _enableEditMode: function() {
            var oEditFlow = this.base.editFlow;
            if (oEditFlow) {
                oEditFlow.setEditMode(true);
            }
        },

        /**
         * Quick action: Add primary contact
         */
        onAddContact: function() {
            MessageToast.show("Navigate to add contact - Feature coming soon!");
            // TODO: Navigate to contact creation or open contact dialog
        },

        /**
         * Quick action: Create first opportunity
         */
        onCreateOpportunity: function() {
            MessageToast.show("Navigate to create opportunity - Feature coming soon!");
            // TODO: Navigate to opportunity creation
        },

        /**
         * Quick action: View account overview
         */
        onViewOverview: function() {
            var oView = this.base.getView();
            var oBindingContext = oView.getBindingContext();

            if (!oBindingContext) {
                MessageToast.show("No account context found");
                return;
            }

            var sAccountID = oBindingContext.getProperty("ID");
            
            // Navigate to regular account view
            var oRouter = oView.getController().getOwnerComponent().getRouter();
            oRouter.navTo("AccountsObjectPage", {
                key: sAccountID
            });
        },

        /**
         * Complete onboarding and navigate to regular account view
         */
        onCompleteOnboarding: function() {
            var oView = this.base.getView();
            var oBindingContext = oView.getBindingContext();

            if (!oBindingContext) {
                MessageToast.show("No account context found");
                return;
            }

            var sAccountID = oBindingContext.getProperty("ID");

            MessageBox.confirm(
                "Have you completed all necessary account details?",
                {
                    title: "Complete Onboarding",
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    onClose: function(sAction) {
                        if (sAction === MessageBox.Action.YES) {
                            // Navigate to regular account view
                            var oRouter = oView.getController().getOwnerComponent().getRouter();
                            oRouter.navTo("AccountsObjectPage", {
                                key: sAccountID
                            });

                            MessageToast.show("Onboarding completed! Welcome to your new account.");
                        }
                    }
                }
            );
        }
    });
});

