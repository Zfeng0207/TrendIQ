sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/core/BusyIndicator",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Item"
], function (MessageToast, MessageBox, Fragment, BusyIndicator, JSONModel, Item) {
    "use strict";

    var oCreateOpportunityDialog = null;
    var oCurrentProspect = null;
    var oDialogModel = null;

    var CreateOpportunityAction = {
        /**
         * Handler for Create Opportunity action
         * Opens a comprehensive dialog for creating an opportunity
         */
        onCreateOpportunity: function (oEvent) {
            console.log("[Create Opportunity] Action handler triggered");

            var sProspectID = null;
            var oProspectData = null;

            try {
                // Try to get context from the event
                if (oEvent && oEvent.getParameter) {
                    var aSelectedContexts = oEvent.getParameter("selectedContexts");
                    if (aSelectedContexts && aSelectedContexts.length > 0) {
                        oProspectData = aSelectedContexts[0].getObject();
                        sProspectID = oProspectData.ID;
                        console.log("[Create Opportunity] Got data from selectedContexts:", oProspectData.prospectName);
                    }
                }

                // Extract path from URL if context not available
                if (!sProspectID) {
                    var sHash = window.location.hash;
                    var oHashMatch = sHash.match(/Prospects\(([^)]+)\)/);
                    if (oHashMatch) {
                        sProspectID = oHashMatch[1];
                        console.log("[Create Opportunity] Extracted prospect ID from URL:", sProspectID);
                    }
                }

                if (!sProspectID) {
                    MessageToast.show("Please select a prospect to create an opportunity", {
                        duration: 3000
                    });
                    return;
                }

                // Fetch prospect data if not available
                if (!oProspectData) {
                    CreateOpportunityAction._fetchProspectAndOpenDialog(sProspectID);
                } else {
                    CreateOpportunityAction._openDialog(oProspectData);
                }

            } catch (error) {
                console.error("[Create Opportunity] Error:", error);
                MessageBox.error("An error occurred: " + error.message);
            }
        },

        /**
         * Fetch prospect data and open dialog
         */
        _fetchProspectAndOpenDialog: function (sProspectID) {
            BusyIndicator.show(0);
            
            fetch("/prospect/Prospects(" + sProspectID + ")?$expand=autoAssignedTo", {
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
                CreateOpportunityAction._openDialog(oData);
            })
            .catch(function (oError) {
                BusyIndicator.hide();
                console.error("[Create Opportunity] Error fetching prospect:", oError);
                MessageBox.error("Failed to load prospect data: " + oError.message);
            });
        },

        /**
         * Open the Create Opportunity dialog
         */
        _openDialog: function (oProspectData) {
            oCurrentProspect = oProspectData;

            if (!oCreateOpportunityDialog) {
                Fragment.load({
                    name: "beautyleads.prospects.ext.fragments.CreateOpportunityDialog",
                    controller: CreateOpportunityAction
                }).then(function (oDialog) {
                    oCreateOpportunityDialog = oDialog;
                    CreateOpportunityAction._initializeDialog(oProspectData);
                    oCreateOpportunityDialog.open();
                });
            } else {
                CreateOpportunityAction._initializeDialog(oProspectData);
                oCreateOpportunityDialog.open();
            }
        },

        /**
         * Initialize dialog with prospect data and fetch users
         */
        _initializeDialog: function (oProspectData) {
            // Set prospect info
            var oProspectNameText = Fragment.byId(undefined, "prospectNameText") || 
                                     sap.ui.getCore().byId("prospectNameText");
            var oProspectLocationText = Fragment.byId(undefined, "prospectLocationText") || 
                                         sap.ui.getCore().byId("prospectLocationText");
            
            if (oProspectNameText) {
                oProspectNameText.setText("Prospect: " + (oProspectData.prospectName || "Unknown"));
            }
            if (oProspectLocationText) {
                oProspectLocationText.setText("Location: " + (oProspectData.location || oProspectData.city || "N/A") + 
                                              " | Business Type: " + (oProspectData.businessType || "N/A"));
            }

            // Pre-populate opportunity name
            var oOpportunityName = sap.ui.getCore().byId("opportunityName");
            if (oOpportunityName) {
                oOpportunityName.setValue(oProspectData.prospectName + " - Partnership Opportunity");
            }

            // Pre-populate description
            var oOpportunityDescription = sap.ui.getCore().byId("opportunityDescription");
            if (oOpportunityDescription) {
                var sDescription = "Opportunity created from prospect: " + oProspectData.prospectName;
                if (oProspectData.businessType) {
                    sDescription += "\nBusiness Type: " + oProspectData.businessType;
                }
                if (oProspectData.location) {
                    sDescription += "\nLocation: " + oProspectData.location;
                }
                oOpportunityDescription.setValue(sDescription);
            }

            // Pre-populate probability based on prospect score
            var oOpportunityProbability = sap.ui.getCore().byId("opportunityProbability");
            if (oOpportunityProbability && oProspectData.prospectScore) {
                oOpportunityProbability.setValue(oProspectData.prospectScore);
            }

            // Pre-populate amount from estimated value
            var oOpportunityAmount = sap.ui.getCore().byId("opportunityAmount");
            if (oOpportunityAmount && oProspectData.estimatedValue) {
                oOpportunityAmount.setValue(oProspectData.estimatedValue);
            }

            // Pre-populate expected revenue
            var oExpectedRevenue = sap.ui.getCore().byId("opportunityExpectedRevenue");
            if (oExpectedRevenue && oProspectData.estimatedValue) {
                oExpectedRevenue.setValue(oProspectData.estimatedValue);
            }

            // Set default close date (3 months from now)
            var oCloseDate = sap.ui.getCore().byId("opportunityCloseDate");
            if (oCloseDate) {
                var dCloseDate = new Date();
                dCloseDate.setMonth(dCloseDate.getMonth() + 3);
                oCloseDate.setDateValue(dCloseDate);
            }

            // Reset other fields
            var oStage = sap.ui.getCore().byId("opportunityStage");
            if (oStage) {
                oStage.setSelectedKey("Qualification");
            }

            var oCompetitors = sap.ui.getCore().byId("opportunityCompetitors");
            if (oCompetitors) {
                oCompetitors.setValue("");
            }

            var oWinStrategy = sap.ui.getCore().byId("opportunityWinStrategy");
            if (oWinStrategy) {
                oWinStrategy.setValue("");
            }

            var oNotes = sap.ui.getCore().byId("opportunityNotes");
            if (oNotes) {
                oNotes.setValue("");
            }

            // Load users for owner selection
            CreateOpportunityAction._loadUsers(oProspectData);
        },

        /**
         * Load users for the owner dropdown
         */
        _loadUsers: function (oProspectData) {
            var oOwnerComboBox = sap.ui.getCore().byId("opportunityOwner");
            if (!oOwnerComboBox) return;

            // Clear existing items except the first placeholder
            oOwnerComboBox.removeAllItems();
            oOwnerComboBox.addItem(new Item({ key: "", text: "-- Select Owner --" }));

            fetch("/prospect/Users?$orderby=fullName", {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(function (response) {
                if (response.ok) {
                    return response.json();
                }
                throw new Error("Failed to fetch users");
            })
            .then(function (oData) {
                var aUsers = oData.value || [];
                aUsers.forEach(function (oUser) {
                    oOwnerComboBox.addItem(new Item({
                        key: oUser.ID,
                        text: oUser.fullName + (oUser.role ? " (" + oUser.role + ")" : "")
                    }));
                });

                // Pre-select owner if prospect has autoAssignedTo
                if (oProspectData.autoAssignedTo_ID) {
                    oOwnerComboBox.setSelectedKey(oProspectData.autoAssignedTo_ID);
                } else if (oProspectData.autoAssignedTo && oProspectData.autoAssignedTo.ID) {
                    oOwnerComboBox.setSelectedKey(oProspectData.autoAssignedTo.ID);
                }
            })
            .catch(function (oError) {
                console.error("[Create Opportunity] Error loading users:", oError);
            });
        },

        /**
         * Handle Create Opportunity confirmation
         */
        onCreateOpportunityConfirm: function () {
            // Validate required fields
            var oOpportunityName = sap.ui.getCore().byId("opportunityName");
            var oCloseDate = sap.ui.getCore().byId("opportunityCloseDate");

            if (!oOpportunityName.getValue()) {
                MessageBox.warning("Please enter an opportunity name.");
                oOpportunityName.focus();
                return;
            }

            if (!oCloseDate.getDateValue()) {
                MessageBox.warning("Please select an expected close date.");
                oCloseDate.focus();
                return;
            }

            // Collect all form data
            var oOpportunityData = {
                name: oOpportunityName.getValue(),
                description: sap.ui.getCore().byId("opportunityDescription").getValue(),
                stage: sap.ui.getCore().byId("opportunityStage").getSelectedKey(),
                probability: parseInt(sap.ui.getCore().byId("opportunityProbability").getValue(), 10),
                amount: parseFloat(sap.ui.getCore().byId("opportunityAmount").getValue()) || 0,
                expectedRevenue: parseFloat(sap.ui.getCore().byId("opportunityExpectedRevenue").getValue()) || 0,
                closeDate: CreateOpportunityAction._formatDate(oCloseDate.getDateValue()),
                owner_ID: sap.ui.getCore().byId("opportunityOwner").getSelectedKey() || null,
                competitors: sap.ui.getCore().byId("opportunityCompetitors").getValue(),
                winStrategy: sap.ui.getCore().byId("opportunityWinStrategy").getValue(),
                notes: sap.ui.getCore().byId("opportunityNotes").getValue()
            };

            console.log("[Create Opportunity] Creating opportunity with data:", oOpportunityData);

            // Show busy indicator
            BusyIndicator.show(0);

            // Call the backend action with opportunity data
            var sActionUrl = "/prospect/Prospects(" + oCurrentProspect.ID + ")/ProspectService.createOpportunity";
            
            fetch(sActionUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(oOpportunityData)
            })
            .then(function (response) {
                BusyIndicator.hide();
                if (response.ok) {
                    return response.json();
                }
                return response.json().then(function (err) {
                    throw new Error(err.error?.message || "Failed to create opportunity");
                });
            })
            .then(function (oResult) {
                console.log("[Create Opportunity] Success:", oResult);
                console.log("[Create Opportunity] Account ID:", oResult.accountID);
                console.log("[Create Opportunity] Contact ID:", oResult.contactID);
                console.log("[Create Opportunity] Activity ID:", oResult.activityID);
                
                // Close dialog
                oCreateOpportunityDialog.close();

                // Build success message with full conversion details
                var sMessage = oResult.message || "Conversion completed successfully!";
                sMessage += "\n\n";
                sMessage += "The following records have been created:\n";
                sMessage += "• Account: " + oCurrentProspect.prospectName + "\n";
                sMessage += "• Contact: " + (oCurrentProspect.contactName || "Primary Contact") + "\n";
                sMessage += "• Opportunity: " + oOpportunityData.name + "\n";
                sMessage += "• Activity: Conversion Note logged\n\n";
                sMessage += "The prospect status has been updated to 'Converted'.";

                // Show success message with option to navigate
                MessageBox.success(
                    sMessage,
                    {
                        title: "Prospect Converted Successfully",
                        actions: [MessageBox.Action.OK, "View Opportunity", "View Account"],
                        emphasizedAction: "View Opportunity",
                        onClose: function (sAction) {
                            if (sAction === "View Opportunity" && oResult.opportunityID) {
                                // Navigate to opportunity within launchpad (draft-enabled entity requires ID= and IsActiveEntity)
                                var sNewHash = "opportunities-manage&/Opportunities(ID=" + oResult.opportunityID + ",IsActiveEntity=true)";
                                window.location.hash = sNewHash;
                                // Force reload to ensure navigation happens
                                setTimeout(function() {
                                    window.location.reload();
                                }, 100);
                            } else if (sAction === "View Account" && oResult.accountID) {
                                // Navigate to account within launchpad
                                var sAccountHash = "accounts-manage&/Accounts(" + oResult.accountID + ")";
                                window.location.hash = sAccountHash;
                                setTimeout(function() {
                                    window.location.reload();
                                }, 100);
                            } else {
                                // Refresh current page
                                window.location.reload();
                            }
                        }
                    }
                );
            })
            .catch(function (oError) {
                BusyIndicator.hide();
                console.error("[Create Opportunity] Error:", oError);
                MessageBox.error("Failed to create opportunity: " + oError.message);
            });
        },

        /**
         * Handle Cancel
         */
        onCreateOpportunityCancel: function () {
            if (oCreateOpportunityDialog) {
                oCreateOpportunityDialog.close();
            }
        },

        /**
         * Format date to YYYY-MM-DD
         */
        _formatDate: function (oDate) {
            if (!oDate) return null;
            var sYear = oDate.getFullYear();
            var sMonth = String(oDate.getMonth() + 1).padStart(2, '0');
            var sDay = String(oDate.getDate()).padStart(2, '0');
            return sYear + "-" + sMonth + "-" + sDay;
        }
    };

    return CreateOpportunityAction;
});

