sap.ui.define([
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/List",
    "sap/m/StandardListItem",
    "sap/m/SearchField",
    "sap/m/VBox",
    "sap/m/Button",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (MessageBox, MessageToast, Dialog, List, StandardListItem, SearchField, VBox, Button, JSONModel, Filter, FilterOperator) {
    "use strict";

    return {
        /**
         * Handler for custom Assign to Sales Rep action
         * Opens a dialog to select sales rep
         */
        onAssignToSalesRep: function (oEvent) {
            console.log("[Prospects] Assign to Sales Rep custom action triggered");
            
            var that = this;
            var sProspectID = null;
            var sProspectName = null;

            try {
                // Try to get context from the event
                if (oEvent && oEvent.getParameter) {
                    var aSelectedContexts = oEvent.getParameter("contexts");
                    if (aSelectedContexts && aSelectedContexts.length > 0) {
                        var oData = aSelectedContexts[0].getObject();
                        sProspectID = oData.ID;
                        sProspectName = oData.prospectName;
                        console.log("[Prospects] Got data from contexts:", sProspectName);
                    }
                }

                // Extract path from URL if context not available
                if (!sProspectID) {
                    var sHash = window.location.hash;
                    var oHashMatch = sHash.match(/Prospects\(([^)]+)\)/);
                    if (oHashMatch) {
                        sProspectID = oHashMatch[1];
                        console.log("[Prospects] Extracted prospect ID from URL:", sProspectID);
                    }
                }

                if (!sProspectID) {
                    MessageToast.show("Please select a prospect first", { duration: 3000 });
                    return;
                }

                // Show loading message
                MessageToast.show("Loading sales representatives...", { duration: 2000 });
                
                // Show busy indicator
                sap.ui.core.BusyIndicator.show(0);

                // Fetch sales reps first
                fetch("/prospect/Users?$filter=role eq 'Sales Rep' and status eq 'Active'&$orderby=fullName", {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                })
                .then(function(response) {
                    sap.ui.core.BusyIndicator.hide();
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error("HTTP " + response.status);
                })
                .then(function(oData) {
                    var aSalesReps = oData.value || [];
                    console.log("[Prospects] Fetched " + aSalesReps.length + " sales reps");
                    that._showSalesRepDialog(aSalesReps, sProspectID, sProspectName);
                })
                .catch(function(oError) {
                    sap.ui.core.BusyIndicator.hide();
                    console.error("[Prospects] Error fetching sales reps:", oError);
                    MessageBox.error("Failed to load sales representatives. Please try again.");
                });

            } catch (error) {
                sap.ui.core.BusyIndicator.hide();
                console.error("[Prospects] Error:", error);
                MessageBox.error("An error occurred: " + error.message);
            }
        },

        /**
         * Show the sales rep selection dialog
         */
        _showSalesRepDialog: function(aSalesReps, sProspectID, sProspectName) {
            var that = this;
            
            // Create the list model
            var oModel = new JSONModel({
                salesReps: aSalesReps,
                filteredSalesReps: aSalesReps
            });
            
            // Create the list
            var oList = new List({
                mode: "SingleSelectMaster",
                items: {
                    path: "/filteredSalesReps",
                    template: new StandardListItem({
                        title: "{fullName}",
                        description: "{territory} - {region}",
                        info: "{email}",
                        icon: "sap-icon://employee",
                        type: "Active"
                    })
                }
            });
            oList.setModel(oModel);
            
            // Create search field
            var oSearchField = new SearchField({
                placeholder: "Search sales reps...",
                liveChange: function(oEvt) {
                    var sQuery = oEvt.getParameter("newValue");
                    var aFiltered = aSalesReps.filter(function(rep) {
                        return rep.fullName && rep.fullName.toLowerCase().indexOf(sQuery.toLowerCase()) > -1;
                    });
                    oModel.setProperty("/filteredSalesReps", aFiltered);
                }
            });
            
            // Create the dialog
            var oDialog = new Dialog({
                title: "Assign to Sales Rep",
                contentWidth: "500px",
                contentHeight: "400px",
                content: [
                    new VBox({
                        items: [oSearchField, oList]
                    }).addStyleClass("sapUiSmallMargin")
                ],
                beginButton: new Button({
                    text: "Assign",
                    type: "Emphasized",
                    press: function() {
                        var oSelectedItem = oList.getSelectedItem();
                        if (!oSelectedItem) {
                            MessageToast.show("Please select a sales rep");
                            return;
                        }
                        
                        var oContext = oSelectedItem.getBindingContext();
                        var oSalesRep = oContext.getObject();
                        var sSalesRepID = oSalesRep.ID;
                        var sSalesRepName = oSalesRep.fullName;
                        
                        console.log("[Prospects] Selected sales rep:", sSalesRepName, sSalesRepID);
                        
                        oDialog.close();
                        
                        // Call the backend action
                        that._callAssignAction(sSalesRepID, sSalesRepName, sProspectID, sProspectName);
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: function() {
                        oDialog.close();
                    }
                }),
                afterClose: function() {
                    oDialog.destroy();
                }
            });

            oDialog.open();
        },

        /**
         * Call the assignToSalesRep action on the backend
         */
        _callAssignAction: function(sSalesRepID, sSalesRepName, sProspectID, sProspectName) {
            // Show busy indicator
            sap.ui.core.BusyIndicator.show(0);
            
            // Call the action via fetch
            var sActionUrl = "/prospect/Prospects(" + sProspectID + ")/ProspectService.assignToSalesRep";
            
            fetch(sActionUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    salesRepID: sSalesRepID
                })
            })
            .then(function(response) {
                sap.ui.core.BusyIndicator.hide();
                if (response.ok) {
                    return response.json();
                }
                return response.json().then(function(err) {
                    throw new Error(err.error?.message || "Assignment failed");
                });
            })
            .then(function(oResult) {
                MessageBox.success(
                    "Prospect '" + (sProspectName || "Selected prospect") + "' has been assigned to " + sSalesRepName,
                    {
                        title: "Assignment Successful",
                        onClose: function() {
                            // Refresh the page to show updated data
                            window.location.reload();
                        }
                    }
                );
            })
            .catch(function(oError) {
                sap.ui.core.BusyIndicator.hide();
                console.error("[Prospects] Error assigning to sales rep:", oError);
                MessageBox.error("Failed to assign prospect: " + oError.message);
            });
        }
    };
});





