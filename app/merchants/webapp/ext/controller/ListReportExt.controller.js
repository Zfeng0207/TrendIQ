sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Button"
], function (ControllerExtension, Fragment, MessageBox, MessageToast, Button) {
    "use strict";

    return ControllerExtension.extend("beautyleads.merchants.ext.controller.ListReportExt", {
        // Lifecycle hook
        onInit: function () {
            // Controller extension initialized
            // Store reference globally for HTML button to access
            window.__FAB_CONTROLLER__ = this;
            
            // Try to add button after initialization
            setTimeout(function () {
                this._addFloatingButton();
            }.bind(this), 1500);
        },

        // Hook into route matching to ensure page is loaded
        onRouteMatched: function () {
            // Add floating button after route is matched
            setTimeout(function () {
                this._addFloatingButton();
            }.bind(this), 1000);
        },

        // Add custom floating button after rendering
        onAfterRendering: function () {
            setTimeout(function () {
                this._addFloatingButton();
            }.bind(this), 500);
        },

        // Internal method to add the floating action button
        _addFloatingButton: function () {
            try {
                // Get the component instead of view for Fiori Elements
                const oComponent = this.base.getAppComponent ? this.base.getAppComponent() : null;
                const oView = this.base.getView ? this.base.getView() : null;
                
                if (!oView && !oComponent) {
                    console.warn("View/Component not available yet");
                    return;
                }
                
                // Check if button already exists globally
                const sButtonId = "addPartnerFAB";
                const oExistingButton = sap.ui.getCore().byId(sButtonId);
                if (oExistingButton) {
                    return; // Button already added
                }
                
                // Create floating action button
                const oFAB = new Button({
                    id: sButtonId,
                    text: this.getText("addPartner"),
                    icon: "sap-icon://add",
                    type: "Emphasized",
                    press: this.onOpenPartnerInfoForm.bind(this)
                });
                
                // Add CSS class for floating positioning
                oFAB.addStyleClass("floating-action-button");
                
                // Add button as dependent to component or view
                if (oComponent) {
                    oComponent.addDependent(oFAB);
                } else if (oView) {
                    oView.addDependent(oFAB);
                }
                
                // Place button directly in the body - this ensures it's always visible
                const fnPlaceButton = function (retries) {
                    retries = retries || 0;
                    const oBody = document.body;
                    
                    if (oBody) {
                        try {
                            // Use placeAt with body element directly
                            oFAB.placeAt(oBody);
                            console.log("FAB button placed successfully at retry", retries);
                            
                            // Ensure it's rendered
                            if (oFAB.getDomRef && !oFAB.getDomRef()) {
                                oFAB.rerender();
                            }
                        } catch (e) {
                            console.error("Error placing FAB:", e);
                            if (retries < 5) {
                                setTimeout(function () {
                                    fnPlaceButton(retries + 1);
                                }, 500);
                            }
                        }
                    } else if (retries < 10) {
                        setTimeout(function () {
                            fnPlaceButton(retries + 1);
                        }, 200);
                    }
                };
                
                // Place the button with retries
                setTimeout(function () {
                    fnPlaceButton(0);
                }, 1000);
                
            } catch (e) {
                console.error("Error in _addFloatingButton:", e);
            }
        },

        // Open Partner Information Form Dialog
        onOpenPartnerInfoForm: function () {
            try {
                const oView = this.base.getView();
                
                if (!oView) {
                    console.warn("View not available, trying to get component");
                    // Try alternative way to get view
                    const oComponent = this.base.getAppComponent ? this.base.getAppComponent() : null;
                    if (oComponent) {
                        const oRootControl = oComponent.getRootControl();
                        if (oRootControl) {
                            this._openDialogWithView(oRootControl);
                            return;
                        }
                    }
                    console.error("Cannot open dialog - no view or component available");
                    return;
                }
                
                this._openDialogWithView(oView);
            } catch (e) {
                console.error("Error opening partner info form:", e);
            }
        },
        
        // Helper method to open dialog with a view
        _openDialogWithView: function (oView) {
            if (!this._oPartnerInfoDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "beautyleads.merchants.ext.fragments.PartnerInfoForm",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    this._oPartnerInfoDialog = oDialog;
                    this._oPartnerInfoDialog.open();
                }.bind(this)).catch(function (error) {
                    console.error("Error loading dialog fragment:", error);
                });
            } else {
                this._oPartnerInfoDialog.open();
            }
        },

        // Submit Partner Information Form
        onSubmitPartnerInfo: function () {
            const oDialog = this._oPartnerInfoDialog;
            const oView = this.base.getView();
            
            // Get form inputs
            const oCompanyName = oView.byId("companyNameInput");
            const oCompanyReg = oView.byId("companyRegInput");
            const oBusinessAddress = oView.byId("businessAddressInput");
            const oContactPerson = oView.byId("contactPersonInput");
            const oContactEmail = oView.byId("contactEmailInput");
            const oContactPhone = oView.byId("contactPhoneInput");
            
            // Validate required fields
            let bValid = true;
            const aRequiredFields = [
                { control: oCompanyName, name: "Company Name" },
                { control: oCompanyReg, name: "Company Registration Number" },
                { control: oBusinessAddress, name: "Business Address" },
                { control: oContactPerson, name: "Contact Person" },
                { control: oContactEmail, name: "Contact Email" },
                { control: oContactPhone, name: "Contact Phone" }
            ];
            
            aRequiredFields.forEach(function (oField) {
                const sValue = oField.control.getValue();
                if (!sValue || sValue.trim() === "") {
                    oField.control.setValueState("Error");
                    oField.control.setValueStateText("This field is required");
                    bValid = false;
                } else {
                    oField.control.setValueState("None");
                }
            });
            
            // Validate email format
            if (oContactEmail.getValue()) {
                const sEmail = oContactEmail.getValue();
                const sEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!sEmailRegex.test(sEmail)) {
                    oContactEmail.setValueState("Error");
                    oContactEmail.setValueStateText("Please enter a valid email address");
                    bValid = false;
                }
            }
            
            if (!bValid) {
                MessageToast.show(this.getText("pleaseFillRequiredFields"));
                return;
            }
            
            // Collect form data (not actually saving, just for reference)
            const oFormData = {
                companyName: oCompanyName.getValue(),
                companyRegistrationNumber: oCompanyReg.getValue(),
                businessAddress: oBusinessAddress.getValue(),
                contactPerson: oContactPerson.getValue(),
                contactEmail: oContactEmail.getValue(),
                contactPhone: oContactPhone.getValue(),
                businessType: oView.byId("businessTypeSelect").getSelectedKey(),
                numberOfOutlets: oView.byId("outletsInput").getValue(),
                annualRevenue: oView.byId("revenueInput").getValue(),
                taxId: oView.byId("taxIdInput").getValue(),
                bankName: oView.byId("bankNameInput").getValue(),
                bankAccountNumber: oView.byId("bankAccountInput").getValue(),
                additionalNotes: oView.byId("notesInput").getValue()
            };
            
            // Log the data (for debugging - not actually stored)
            console.log("Partner Information Form Data:", oFormData);
            
            // Close dialog
            oDialog.close();
            
            // Reset form
            this._resetPartnerInfoForm();
            
            // Show success message
            MessageToast.show(this.getText("fileSubmittedSuccessfully"), {
                duration: 3000,
                width: "20rem"
            });
        },

        // Cancel Partner Information Form
        onCancelPartnerInfo: function () {
            this._oPartnerInfoDialog.close();
            this._resetPartnerInfoForm();
        },

        // Reset Partner Information Form
        _resetPartnerInfoForm: function () {
            const oView = this.base.getView();
            const aInputIds = [
                "companyNameInput",
                "companyRegInput",
                "businessAddressInput",
                "contactPersonInput",
                "contactEmailInput",
                "contactPhoneInput",
                "outletsInput",
                "revenueInput",
                "taxIdInput",
                "bankNameInput",
                "bankAccountInput",
                "notesInput"
            ];
            
            aInputIds.forEach(function (sId) {
                const oControl = oView.byId(sId);
                if (oControl) {
                    oControl.setValue("");
                    oControl.setValueState("None");
                    oControl.setValueStateText("");
                }
            });
            
            const oSelect = oView.byId("businessTypeSelect");
            if (oSelect) {
                oSelect.setSelectedKey("");
            }
        },

        // Helper method to get i18n text
        getText: function (sKey) {
            const oResourceBundle = this.base.getView().getModel("i18n").getResourceBundle();
            return oResourceBundle.getText(sKey);
        }
    });
});
