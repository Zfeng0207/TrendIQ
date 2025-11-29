sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/core/BusyIndicator"
], function (MessageToast, MessageBox, Fragment, BusyIndicator) {
    "use strict";

    var oConvertDialog = null;
    var oCurrentProspect = null;
    var sCurrentProspectID = null;

    var ConvertProspectAction = {
        /**
         * Handler for Convert Prospect action
         * Opens a dialog for converting prospect to Account, Contact, and Opportunity
         */
        onConvertProspect: function (oEvent) {
            console.log("[Convert Prospect] Action triggered");

            var oProspectData = null;
            sCurrentProspectID = null;

            try {
                // Try to get context from selected contexts
                if (oEvent && oEvent.getParameter) {
                    var aSelectedContexts = oEvent.getParameter("contexts");
                    if (aSelectedContexts && aSelectedContexts.length > 0) {
                        oProspectData = aSelectedContexts[0].getObject();
                        sCurrentProspectID = oProspectData.ID;
                        console.log("[Convert Prospect] Got data from contexts:", oProspectData.prospectName);
                    }
                }

                // Try to get from URL if not found
                if (!sCurrentProspectID) {
                    var sHash = window.location.hash;
                    var oHashMatch = sHash.match(/Prospects\(([^)]+)\)/);
                    if (oHashMatch) {
                        sCurrentProspectID = oHashMatch[1];
                        console.log("[Convert Prospect] Extracted ID from URL:", sCurrentProspectID);
                    }
                }

                if (!sCurrentProspectID) {
                    MessageToast.show("Please select a prospect to convert");
                    return;
                }

                // Fetch prospect data if not available
                if (!oProspectData) {
                    ConvertProspectAction._fetchProspectAndOpenDialog(sCurrentProspectID);
                } else {
                    oCurrentProspect = oProspectData;
                    // Always open dialog so user can review the data
                    ConvertProspectAction._openDialog();
                }

            } catch (error) {
                console.error("[Convert Prospect] Error:", error);
                MessageBox.error("An error occurred: " + error.message);
            }
        },

        /**
         * Fetch prospect data and open dialog
         */
        _fetchProspectAndOpenDialog: function (sProspectID) {
            BusyIndicator.show(0);
            
            fetch("/prospect/Prospects(" + sProspectID + ")", {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(function (response) {
                if (response.ok) {
                    return response.json();
                }
                throw new Error("Failed to fetch prospect data");
            })
            .then(function (oData) {
                BusyIndicator.hide();
                oCurrentProspect = oData;
                // Always open dialog so user can review the data
                ConvertProspectAction._openDialog();
            })
            .catch(function (oError) {
                BusyIndicator.hide();
                console.error("[Convert Prospect] Error fetching prospect:", oError);
                MessageBox.error("Failed to load prospect data: " + oError.message);
            });
        },

        /**
         * Open the Convert dialog
         */
        _openDialog: function () {
            if (!oConvertDialog) {
                Fragment.load({
                    name: "beautyleads.prospects.ext.fragments.ConvertProspectDialog",
                    controller: ConvertProspectAction
                }).then(function (oDialog) {
                    oConvertDialog = oDialog;
                    ConvertProspectAction._initializeDialog();
                    oConvertDialog.open();
                }).catch(function (oError) {
                    console.error("[Convert Prospect] Error loading fragment:", oError);
                    MessageBox.error("Failed to open dialog: " + oError.message);
                });
            } else {
                ConvertProspectAction._initializeDialog();
                oConvertDialog.open();
            }
        },

        /**
         * Initialize dialog with prospect data
         */
        _initializeDialog: function () {
            var oProspect = oCurrentProspect;
            if (!oProspect) return;

            console.log("[Convert Prospect] Initializing dialog with:", oProspect.prospectName);

            // Parse contact name
            var sFirstName = "";
            var sLastName = "";
            if (oProspect.contactName) {
                var nameParts = oProspect.contactName.trim().split(/\s+/);
                if (nameParts.length >= 2) {
                    sFirstName = nameParts[0];
                    sLastName = nameParts.slice(1).join(" ");
                } else if (nameParts.length === 1) {
                    sFirstName = nameParts[0];
                }
            }

            // === Header Section ===
            var oProspectName = sap.ui.getCore().byId("convertProspectName");
            if (oProspectName) {
                oProspectName.setText(oProspect.prospectName || "Unknown Prospect");
            }

            var oProspectDetails = sap.ui.getCore().byId("convertProspectDetails");
            if (oProspectDetails) {
                var details = [];
                if (oProspect.businessType) details.push(oProspect.businessType);
                if (oProspect.city) details.push(oProspect.city);
                if (oProspect.discoverySource) details.push("via " + oProspect.discoverySource);
                oProspectDetails.setText(details.join(" • ") || "No details available");
            }

            var oProspectScore = sap.ui.getCore().byId("convertProspectScore");
            if (oProspectScore) {
                var score = oProspect.prospectScore || 0;
                oProspectScore.setText("Score: " + score + "%");
                if (score >= 70) {
                    oProspectScore.setState("Success");
                } else if (score >= 40) {
                    oProspectScore.setState("Warning");
                } else {
                    oProspectScore.setState("Error");
                }
            }

            // === Account Section ===
            var oAccountName = sap.ui.getCore().byId("convertAccountName");
            if (oAccountName) {
                oAccountName.setValue(oProspect.prospectName || "");
            }

            var oAccountType = sap.ui.getCore().byId("convertAccountType");
            if (oAccountType) {
                oAccountType.setSelectedKey(oProspect.businessType || "Retailer");
            }

            var oAccountIndustry = sap.ui.getCore().byId("convertAccountIndustry");
            if (oAccountIndustry) {
                oAccountIndustry.setValue("Beauty & Wellness");
            }

            var oAccountWebsite = sap.ui.getCore().byId("convertAccountWebsite");
            if (oAccountWebsite) {
                oAccountWebsite.setValue("");
            }

            var oAccountAddress = sap.ui.getCore().byId("convertAccountAddress");
            if (oAccountAddress) {
                oAccountAddress.setValue(oProspect.address || "");
            }

            var oAccountCity = sap.ui.getCore().byId("convertAccountCity");
            if (oAccountCity) {
                oAccountCity.setValue(oProspect.city || "");
            }

            var oAccountState = sap.ui.getCore().byId("convertAccountState");
            if (oAccountState) {
                oAccountState.setValue(oProspect.state || "");
            }

            var oAccountCountry = sap.ui.getCore().byId("convertAccountCountry");
            if (oAccountCountry) {
                oAccountCountry.setValue(oProspect.country || "Malaysia");
            }

            var oAccountPostalCode = sap.ui.getCore().byId("convertAccountPostalCode");
            if (oAccountPostalCode) {
                oAccountPostalCode.setValue(oProspect.postalCode || "");
            }

            // === Contact Section ===
            var oContactFirstName = sap.ui.getCore().byId("convertContactFirstName");
            if (oContactFirstName) {
                oContactFirstName.setValue(sFirstName);
            }

            var oContactLastName = sap.ui.getCore().byId("convertContactLastName");
            if (oContactLastName) {
                oContactLastName.setValue(sLastName);
            }

            var oContactTitle = sap.ui.getCore().byId("convertContactTitle");
            if (oContactTitle) {
                oContactTitle.setValue("Business Owner");
            }

            var oContactEmail = sap.ui.getCore().byId("convertContactEmail");
            if (oContactEmail) {
                oContactEmail.setValue(oProspect.contactEmail || "");
            }

            var oContactPhone = sap.ui.getCore().byId("convertContactPhone");
            if (oContactPhone) {
                oContactPhone.setValue(oProspect.contactPhone || "");
            }

            // === Opportunity Section ===
            var oOpportunityName = sap.ui.getCore().byId("convertOpportunityName");
            if (oOpportunityName) {
                oOpportunityName.setValue((oProspect.prospectName || "Prospect") + " - Partnership Deal");
            }

            var oOpportunityDescription = sap.ui.getCore().byId("convertOpportunityDescription");
            if (oOpportunityDescription) {
                var desc = "Partnership opportunity with " + (oProspect.prospectName || "prospect");
                if (oProspect.businessType) {
                    desc += "\nBusiness Type: " + oProspect.businessType;
                }
                oOpportunityDescription.setValue(desc);
            }

            var oOpportunityStage = sap.ui.getCore().byId("convertOpportunityStage");
            if (oOpportunityStage) {
                oOpportunityStage.setSelectedKey("Prospecting");
            }

            var oOpportunityAmount = sap.ui.getCore().byId("convertOpportunityAmount");
            if (oOpportunityAmount) {
                oOpportunityAmount.setValue(oProspect.estimatedValue || "");
            }

            var oOpportunityProbability = sap.ui.getCore().byId("convertOpportunityProbability");
            var oProbabilityText = sap.ui.getCore().byId("convertProbabilityText");
            if (oOpportunityProbability) {
                var probability = oProspect.prospectScore || 50;
                oOpportunityProbability.setValue(probability);
                
                if (oProbabilityText) {
                    oProbabilityText.setText(probability + "%");
                }
                
                // Detach first to prevent multiple handlers
                oOpportunityProbability.detachLiveChange(ConvertProspectAction._onProbabilityChange);
                oOpportunityProbability.attachLiveChange(ConvertProspectAction._onProbabilityChange);
            }

            var oOpportunityCloseDate = sap.ui.getCore().byId("convertOpportunityCloseDate");
            if (oOpportunityCloseDate) {
                var closeDate = new Date();
                closeDate.setDate(closeDate.getDate() + 90);
                oOpportunityCloseDate.setDateValue(closeDate);
            }
        },

        /**
         * Handler for probability slider change
         */
        _onProbabilityChange: function (oEvent) {
            var newValue = oEvent.getParameter("value");
            var oProbabilityText = sap.ui.getCore().byId("convertProbabilityText");
            if (oProbabilityText) {
                oProbabilityText.setText(Math.round(newValue) + "%");
            }
        },

        /**
         * Handler for dialog confirm
         */
        onConvertDialogConfirm: function () {
            // Collect form data
            var oFormData = ConvertProspectAction._collectFormData();

            // Validate required fields
            if (!oFormData.accountName || oFormData.accountName.trim() === "") {
                MessageBox.error("Company Name is required");
                return;
            }

            if (!oFormData.opportunityName || oFormData.opportunityName.trim() === "") {
                MessageBox.error("Opportunity Name is required");
                return;
            }

            if (!oFormData.opportunityCloseDate) {
                MessageBox.error("Expected Close Date is required");
                return;
            }

            console.log("[Convert Prospect] Converting with data:", oFormData);

            BusyIndicator.show(0);

            var sActionUrl = "/prospect/Prospects(" + sCurrentProspectID + ")/ProspectService.convertToAccount";

            fetch(sActionUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(oFormData)
            })
            .then(function (response) {
                if (response.ok) {
                    return response.json();
                }
                return response.json().then(function (err) {
                    throw new Error(err.error?.message || "Failed to convert prospect");
                });
            })
            .then(function (oResult) {
                BusyIndicator.hide();

                console.log("[Convert Prospect] Success:", oResult);

                if (oConvertDialog) {
                    oConvertDialog.close();
                }

                MessageBox.success(
                    "Prospect converted successfully!\n\n" +
                    "Created:\n" +
                    "• Account\n" +
                    "• Contact\n" +
                    "• Opportunity",
                    {
                        title: "Conversion Complete",
                        actions: [MessageBox.Action.OK, "View Account"],
                        emphasizedAction: "View Account",
                        onClose: function (sAction) {
                            if (sAction === "View Account" && oResult.accountID) {
                                // Use proper key format for draft-enabled entities
                                window.location.href = "/beautyleads.accounts/index.html#/Accounts(ID=" + oResult.accountID + ",IsActiveEntity=true)";
                            } else {
                                window.location.reload();
                            }
                        }
                    }
                );
            })
            .catch(function (oError) {
                BusyIndicator.hide();
                console.error("[Convert Prospect] Error:", oError);
                MessageBox.error("Failed to convert prospect: " + oError.message);
            });
        },

        /**
         * Collect form data
         */
        _collectFormData: function () {
            var oAccountName = sap.ui.getCore().byId("convertAccountName");
            var oAccountType = sap.ui.getCore().byId("convertAccountType");
            var oAccountIndustry = sap.ui.getCore().byId("convertAccountIndustry");
            var oAccountWebsite = sap.ui.getCore().byId("convertAccountWebsite");
            var oAccountAddress = sap.ui.getCore().byId("convertAccountAddress");
            var oAccountCity = sap.ui.getCore().byId("convertAccountCity");
            var oAccountState = sap.ui.getCore().byId("convertAccountState");
            var oAccountCountry = sap.ui.getCore().byId("convertAccountCountry");
            var oAccountPostalCode = sap.ui.getCore().byId("convertAccountPostalCode");
            
            var oContactFirstName = sap.ui.getCore().byId("convertContactFirstName");
            var oContactLastName = sap.ui.getCore().byId("convertContactLastName");
            var oContactTitle = sap.ui.getCore().byId("convertContactTitle");
            var oContactEmail = sap.ui.getCore().byId("convertContactEmail");
            var oContactPhone = sap.ui.getCore().byId("convertContactPhone");
            
            var oOpportunityName = sap.ui.getCore().byId("convertOpportunityName");
            var oOpportunityDescription = sap.ui.getCore().byId("convertOpportunityDescription");
            var oOpportunityStage = sap.ui.getCore().byId("convertOpportunityStage");
            var oOpportunityAmount = sap.ui.getCore().byId("convertOpportunityAmount");
            var oOpportunityProbability = sap.ui.getCore().byId("convertOpportunityProbability");
            var oOpportunityCloseDate = sap.ui.getCore().byId("convertOpportunityCloseDate");

            var sCloseDate = null;
            if (oOpportunityCloseDate && oOpportunityCloseDate.getDateValue()) {
                var oDate = oOpportunityCloseDate.getDateValue();
                sCloseDate = oDate.toISOString().split('T')[0];
            }

            return {
                accountName: oAccountName ? oAccountName.getValue() : "",
                accountType: oAccountType ? oAccountType.getSelectedKey() : "Retailer",
                industry: oAccountIndustry ? oAccountIndustry.getValue() : "Beauty & Wellness",
                website: oAccountWebsite ? oAccountWebsite.getValue() : "",
                address: oAccountAddress ? oAccountAddress.getValue() : "",
                city: oAccountCity ? oAccountCity.getValue() : "",
                state: oAccountState ? oAccountState.getValue() : "",
                country: oAccountCountry ? oAccountCountry.getValue() : "Malaysia",
                postalCode: oAccountPostalCode ? oAccountPostalCode.getValue() : "",
                contactFirstName: oContactFirstName ? oContactFirstName.getValue() : "",
                contactLastName: oContactLastName ? oContactLastName.getValue() : "",
                contactTitle: oContactTitle ? oContactTitle.getValue() : "",
                contactEmail: oContactEmail ? oContactEmail.getValue() : "",
                contactPhone: oContactPhone ? oContactPhone.getValue() : "",
                opportunityName: oOpportunityName ? oOpportunityName.getValue() : "",
                opportunityDescription: oOpportunityDescription ? oOpportunityDescription.getValue() : "",
                opportunityStage: oOpportunityStage ? oOpportunityStage.getSelectedKey() : "Prospecting",
                opportunityAmount: oOpportunityAmount ? parseFloat(oOpportunityAmount.getValue()) || 0 : 0,
                opportunityProbability: oOpportunityProbability ? parseInt(oOpportunityProbability.getValue(), 10) : 50,
                opportunityCloseDate: sCloseDate
            };
        },

        /**
         * Handler for dialog cancel
         */
        onConvertDialogCancel: function () {
            console.log("[Convert Prospect] Dialog cancelled");
            if (oConvertDialog) {
                oConvertDialog.close();
            }
        }
    };

    return ConvertProspectAction;
});

