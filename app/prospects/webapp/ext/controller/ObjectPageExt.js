sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (ControllerExtension, Fragment, MessageBox, MessageToast, JSONModel, Filter, FilterOperator) {
    "use strict";

    return ControllerExtension.extend("beautyleads.prospects.ext.controller.ObjectPageExt", {
        // Store dialog reference
        _oAssignDialog: null,
        _oSalesReps: [],

        onInit: function () {
            console.log("[Prospects] Object Page Controller extension loaded");
        },

        /**
         * Handler for custom Assign to Sales Rep action
         * Opens a dialog to select sales rep
         */
        onAssignToSalesRep: function (oEvent) {
            console.log("[Prospects] Assign to Sales Rep action triggered");
            
            const oView = this.base.getView();
            const that = this;
            
            // Fetch sales reps first, then open dialog
            this._fetchSalesReps().then(function(aSalesReps) {
                that._oSalesReps = aSalesReps;
                that._openAssignDialog(oView);
            }).catch(function(oError) {
                console.error("[Prospects] Error fetching sales reps:", oError);
                MessageBox.error("Failed to load sales representatives. Please try again.");
            });
        },

        /**
         * Fetch sales reps from the backend
         */
        _fetchSalesReps: function() {
            return new Promise(function(resolve, reject) {
                fetch("/prospect/Users?$filter=role eq 'Sales Rep' and status eq 'Active'&$orderby=fullName", {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                })
                .then(function(response) {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error("HTTP " + response.status);
                })
                .then(function(oData) {
                    const aSalesReps = oData.value || [];
                    console.log("[Prospects] Fetched " + aSalesReps.length + " sales reps");
                    resolve(aSalesReps);
                })
                .catch(function(oError) {
                    reject(oError);
                });
            });
        },

        /**
         * Open the assign dialog
         */
        _openAssignDialog: function(oView) {
            const that = this;
            
            if (!this._oAssignDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "beautyleads.prospects.ext.fragments.AssignSalesRepDialog",
                    controller: this
                }).then(function(oDialog) {
                    that._oAssignDialog = oDialog;
                    oView.addDependent(oDialog);
                    
                    // Create a JSON model for the dialog data
                    const oDialogModel = new JSONModel({
                        salesReps: that._oSalesReps
                    });
                    oDialog.setModel(oDialogModel, "salesReps");
                    
                    // Bind items manually since we're using JSON model
                    oDialog.bindAggregation("items", {
                        path: "salesReps>/salesReps",
                        template: new sap.m.StandardListItem({
                            title: "{salesReps>fullName}",
                            description: "{salesReps>territory} - {salesReps>region}",
                            info: "{salesReps>email}",
                            icon: "sap-icon://employee",
                            type: "Active"
                        })
                    });
                    
                    oDialog.open();
                }).catch(function(oError) {
                    console.error("[Prospects] Error loading dialog fragment:", oError);
                    MessageBox.error("Failed to open dialog. Please try again.");
                });
            } else {
                // Update model with fresh data
                const oDialogModel = this._oAssignDialog.getModel("salesReps");
                oDialogModel.setProperty("/salesReps", this._oSalesReps);
                this._oAssignDialog.open();
            }
        },

        /**
         * Handler for dialog search
         */
        onSalesRepDialogSearch: function(oEvent) {
            const sValue = oEvent.getParameter("value");
            const oFilter = new Filter("fullName", FilterOperator.Contains, sValue);
            const oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([oFilter]);
        },

        /**
         * Handler for dialog confirm (item selected)
         */
        onSalesRepDialogConfirm: function(oEvent) {
            const oSelectedItem = oEvent.getParameter("selectedItem");
            
            if (!oSelectedItem) {
                MessageToast.show("No sales rep selected");
                return;
            }
            
            const oContext = oSelectedItem.getBindingContext("salesReps");
            const oSalesRep = oContext.getObject();
            const sSalesRepID = oSalesRep.ID;
            const sSalesRepName = oSalesRep.fullName;
            
            console.log("[Prospects] Selected sales rep:", sSalesRepName, sSalesRepID);
            
            // Call the backend action
            this._callAssignAction(sSalesRepID, sSalesRepName);
        },

        /**
         * Handler for dialog cancel
         */
        onSalesRepDialogCancel: function(oEvent) {
            console.log("[Prospects] Assign dialog cancelled");
        },

        /**
         * Call the assignToSalesRep action on the backend
         */
        _callAssignAction: function(sSalesRepID, sSalesRepName) {
            const that = this;
            const oView = this.base.getView();
            const oBindingContext = oView.getBindingContext();
            
            if (!oBindingContext) {
                MessageBox.error("No prospect context found");
                return;
            }
            
            const sProspectID = oBindingContext.getProperty("ID");
            const sProspectName = oBindingContext.getProperty("prospectName");
            
            // Show busy indicator
            sap.ui.core.BusyIndicator.show(0);
            
            // Call the action via fetch
            const sActionUrl = "/prospect/Prospects(" + sProspectID + ")/ProspectService.assignToSalesRep";
            
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
                    "Prospect '" + sProspectName + "' has been assigned to " + sSalesRepName,
                    {
                        title: "Assignment Successful",
                        onClose: function() {
                            // Refresh the page to show updated data
                            oBindingContext.refresh();
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
    });
});
