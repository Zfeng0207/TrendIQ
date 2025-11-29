sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/BusyIndicator",
    "sap/ui/core/ListItem"
], function (ControllerExtension, Fragment, MessageBox, MessageToast, JSONModel, Filter, FilterOperator, BusyIndicator, ListItem) {
    "use strict";

    return ControllerExtension.extend("beautyleads.prospects.ext.controller.ObjectPageExt", {
        // Store dialog references
        _oAssignDialog: null,
        _oCreateOpportunityDialog: null,
        _oConvertProspectDialog: null,
        _oSalesReps: [],
        _oDialogModel: null,
        _sCurrentProspectID: null,
        _oCurrentProspectData: null,

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
            BusyIndicator.show(0);
            
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
                BusyIndicator.hide();
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
                BusyIndicator.hide();
                console.error("[Prospects] Error assigning to sales rep:", oError);
                MessageBox.error("Failed to assign prospect: " + oError.message);
            });
        },

        // ========================================
        // CREATE OPPORTUNITY DIALOG METHODS
        // ========================================

        /**
         * Handler for Create Opportunity action
         * Opens a comprehensive dialog for creating an opportunity
         */
        onCreateOpportunity: function(oEvent) {
            console.log("[Prospects] Create Opportunity action triggered");
            
            const oView = this.base.getView();
            const oBindingContext = oView.getBindingContext();
            
            if (!oBindingContext) {
                MessageBox.error("No prospect context found");
                return;
            }
            
            // Store prospect ID for later use
            this._sCurrentProspectID = oBindingContext.getProperty("ID");
            const oProspectData = oBindingContext.getObject();
            
            console.log("[Prospects] Opening dialog for prospect:", oProspectData.prospectName);
            
            // Open the dialog
            this._openCreateOpportunityDialog(oView, oProspectData);
        },

        /**
         * Open the Create Opportunity dialog
         */
        _openCreateOpportunityDialog: function(oView, oProspectData) {
            const that = this;
            
            if (!this._oCreateOpportunityDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "beautyleads.prospects.ext.fragments.CreateOpportunityDialog",
                    controller: this
                }).then(function(oDialog) {
                    that._oCreateOpportunityDialog = oDialog;
                    oView.addDependent(oDialog);
                    
                    // Initialize dialog with prospect data
                    that._initializeCreateOpportunityDialog(oDialog, oProspectData, oView);
                    
                    oDialog.open();
                }).catch(function(oError) {
                    console.error("[Prospects] Error loading dialog fragment:", oError);
                    MessageBox.error("Failed to open dialog. Please try again.");
                });
            } else {
                // Re-initialize dialog with fresh data
                this._initializeCreateOpportunityDialog(this._oCreateOpportunityDialog, oProspectData, oView);
                this._oCreateOpportunityDialog.open();
            }
        },

        /**
         * Initialize the Create Opportunity dialog with prospect data
         */
        _initializeCreateOpportunityDialog: function(oDialog, oProspectData, oView) {
            const that = this;
            
            // Set prospect info in the header
            const oProspectNameText = oView.byId("prospectNameText");
            const oProspectLocationText = oView.byId("prospectLocationText");
            
            if (oProspectNameText) {
                oProspectNameText.setText(oProspectData.prospectName || "");
            }
            if (oProspectLocationText) {
                const sLocation = [oProspectData.city, oProspectData.state, oProspectData.country]
                    .filter(Boolean)
                    .join(", ");
                oProspectLocationText.setText(sLocation || "Location not specified");
            }
            
            // Pre-populate form fields
            const oName = oView.byId("opportunityName");
            if (oName) {
                oName.setValue(oProspectData.prospectName + " - Partnership Opportunity");
            }
            
            const oDescription = oView.byId("opportunityDescription");
            if (oDescription) {
                const sDesc = "Opportunity created from prospect: " + oProspectData.prospectName + 
                    (oProspectData.businessType ? "\nBusiness Type: " + oProspectData.businessType : "") +
                    (oProspectData.discoverySource ? "\nSource: " + oProspectData.discoverySource : "");
                oDescription.setValue(sDesc);
            }
            
            const oStage = oView.byId("opportunityStage");
            if (oStage) {
                oStage.setSelectedKey("Prospecting");
            }
            
            const oProbability = oView.byId("opportunityProbability");
            if (oProbability) {
                oProbability.setValue(oProspectData.prospectScore || 50);
            }
            
            const oAmount = oView.byId("opportunityAmount");
            if (oAmount) {
                oAmount.setValue(oProspectData.estimatedValue || "");
            }
            
            const oExpectedRevenue = oView.byId("opportunityExpectedRevenue");
            if (oExpectedRevenue) {
                oExpectedRevenue.setValue(oProspectData.estimatedValue || "");
            }
            
            // Set expected close date (90 days from now)
            const oCloseDatePicker = oView.byId("opportunityCloseDate");
            if (oCloseDatePicker) {
                oCloseDatePicker.setDateValue(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
            }
            
            const oCompetitors = oView.byId("opportunityCompetitors");
            if (oCompetitors) {
                oCompetitors.setValue("");
            }
            
            const oWinStrategy = oView.byId("opportunityWinStrategy");
            if (oWinStrategy) {
                oWinStrategy.setValue("");
            }
            
            const oNotes = oView.byId("opportunityNotes");
            if (oNotes) {
                oNotes.setValue("");
            }
            
            // Load users for owner dropdown
            this._loadUsersForOwnerDropdown(oView, oProspectData.autoAssignedTo_ID);
        },

        /**
         * Load users for the owner dropdown
         */
        _loadUsersForOwnerDropdown: function(oView, sDefaultOwnerID) {
            const oOwnerComboBox = oView.byId("opportunityOwner");
            
            if (!oOwnerComboBox) {
                return;
            }
            
            // Clear existing items except the first placeholder
            oOwnerComboBox.destroyItems();
            oOwnerComboBox.addItem(new ListItem({
                key: "",
                text: "-- Select Owner --"
            }));
            
            // Fetch users
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
                throw new Error("Failed to load users");
            })
            .then(function(oData) {
                const aUsers = oData.value || [];
                
                aUsers.forEach(function(oUser) {
                    oOwnerComboBox.addItem(new ListItem({
                        key: oUser.ID,
                        text: oUser.fullName,
                        additionalText: oUser.email || ""
                    }));
                });
                
                // Set default selection if available
                if (sDefaultOwnerID) {
                    oOwnerComboBox.setSelectedKey(sDefaultOwnerID);
                }
            })
            .catch(function(oError) {
                console.error("[Prospects] Error loading users:", oError);
            });
        },

        /**
         * Handler for Create Opportunity dialog confirm button
         */
        onCreateOpportunityConfirm: function() {
            const that = this;
            const oView = this.base.getView();
            
            // Collect form data
            const oFormData = this._collectCreateOpportunityFormData(oView);
            
            // Validate required fields
            if (!oFormData.name || oFormData.name.trim() === "") {
                MessageBox.error("Opportunity Name is required");
                return;
            }
            
            if (!oFormData.closeDate) {
                MessageBox.error("Expected Close Date is required");
                return;
            }
            
            console.log("[Prospects] Creating opportunity with data:", oFormData);
            
            // Show busy indicator
            BusyIndicator.show(0);
            
            // Call the backend action
            const sActionUrl = "/prospect/Prospects(" + this._sCurrentProspectID + ")/ProspectService.createOpportunity";
            
            fetch(sActionUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(oFormData)
            })
            .then(function(response) {
                if (response.ok) {
                    return response.json();
                }
                return response.json().then(function(err) {
                    throw new Error(err.error?.message || "Failed to create opportunity");
                });
            })
            .then(function(oResult) {
                BusyIndicator.hide();
                
                console.log("[Prospects] Opportunity created:", oResult);
                
                // Close the dialog
                if (that._oCreateOpportunityDialog) {
                    that._oCreateOpportunityDialog.close();
                }
                
                // Show success message and navigate to the new opportunity
                MessageBox.success(
                    "Opportunity created successfully!",
                    {
                        title: "Success",
                        actions: [MessageBox.Action.OK],
                        onClose: function() {
                            // Navigate to the new opportunity
                            that._navigateToOpportunity(oResult.opportunityID);
                        }
                    }
                );
            })
            .catch(function(oError) {
                BusyIndicator.hide();
                console.error("[Prospects] Error creating opportunity:", oError);
                MessageBox.error("Failed to create opportunity: " + oError.message);
            });
        },

        /**
         * Collect form data from the Create Opportunity dialog
         */
        _collectCreateOpportunityFormData: function(oView) {
            const oName = oView.byId("opportunityName");
            const oDescription = oView.byId("opportunityDescription");
            const oStage = oView.byId("opportunityStage");
            const oProbability = oView.byId("opportunityProbability");
            const oAmount = oView.byId("opportunityAmount");
            const oExpectedRevenue = oView.byId("opportunityExpectedRevenue");
            const oCloseDate = oView.byId("opportunityCloseDate");
            const oOwner = oView.byId("opportunityOwner");
            const oCompetitors = oView.byId("opportunityCompetitors");
            const oWinStrategy = oView.byId("opportunityWinStrategy");
            const oNotes = oView.byId("opportunityNotes");
            
            // Format close date to ISO string (date only)
            let sCloseDate = null;
            if (oCloseDate && oCloseDate.getDateValue()) {
                const oDate = oCloseDate.getDateValue();
                sCloseDate = oDate.toISOString().split('T')[0];
            }
            
            return {
                name: oName ? oName.getValue() : "",
                description: oDescription ? oDescription.getValue() : "",
                stage: oStage ? oStage.getSelectedKey() : "Prospecting",
                probability: oProbability ? parseInt(oProbability.getValue(), 10) : 50,
                amount: oAmount ? parseFloat(oAmount.getValue()) || 0 : 0,
                expectedRevenue: oExpectedRevenue ? parseFloat(oExpectedRevenue.getValue()) || 0 : 0,
                closeDate: sCloseDate,
                owner_ID: oOwner ? oOwner.getSelectedKey() || null : null,
                competitors: oCompetitors ? oCompetitors.getValue() : "",
                winStrategy: oWinStrategy ? oWinStrategy.getValue() : "",
                notes: oNotes ? oNotes.getValue() : ""
            };
        },

        /**
         * Navigate to the newly created opportunity
         */
        _navigateToOpportunity: function(sOpportunityID) {
            if (!sOpportunityID) {
                console.error("[Prospects] No opportunity ID to navigate to");
                return;
            }
            
            console.log("[Prospects] Navigating to opportunity:", sOpportunityID);
            
            // Navigate to opportunities app
            const sOpportunityUrl = "/beautyleads.opportunities/index.html#/Opportunities(" + sOpportunityID + ")";
            window.location.href = sOpportunityUrl;
        },

        /**
         * Handler for Create Opportunity dialog cancel button
         */
        onCreateOpportunityCancel: function() {
            console.log("[Prospects] Create Opportunity dialog cancelled");
            if (this._oCreateOpportunityDialog) {
                this._oCreateOpportunityDialog.close();
            }
        },

        // ========================================
        // CONVERT PROSPECT DIALOG METHODS
        // ========================================

        /**
         * Handler for Convert Prospect action
         * Opens a comprehensive dialog for converting prospect to Account, Contact, and Opportunity
         */
        onConvertProspect: function(oEvent) {
            console.log("[Prospects] Convert Prospect action triggered");
            
            const oView = this.base.getView();
            const oBindingContext = oView.getBindingContext();
            
            if (!oBindingContext) {
                MessageBox.error("No prospect context found");
                return;
            }
            
            // Store prospect data for later use
            this._sCurrentProspectID = oBindingContext.getProperty("ID");
            this._oCurrentProspectData = oBindingContext.getObject();
            
            console.log("[Prospects] Converting prospect:", this._oCurrentProspectData.prospectName);
            
            // Check if already converted
            if (this._oCurrentProspectData.status === 'Converted') {
                MessageBox.warning("This prospect has already been converted.");
                return;
            }
            
            // Open the convert dialog
            this._openConvertDialog(oView);
        },

        /**
         * Open the Convert Prospect dialog
         */
        _openConvertDialog: function(oView) {
            const that = this;
            
            if (!this._oConvertProspectDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "beautyleads.prospects.ext.fragments.ConvertProspectDialog",
                    controller: this
                }).then(function(oDialog) {
                    that._oConvertProspectDialog = oDialog;
                    oView.addDependent(oDialog);
                    
                    // Initialize dialog with prospect data
                    that._initializeConvertDialog(oView);
                    
                    oDialog.open();
                }).catch(function(oError) {
                    console.error("[Prospects] Error loading convert dialog fragment:", oError);
                    MessageBox.error("Failed to open convert dialog. Please try again.");
                });
            } else {
                // Re-initialize dialog with fresh data
                this._initializeConvertDialog(oView);
                this._oConvertProspectDialog.open();
            }
        },

        /**
         * Initialize the Convert Prospect dialog with data
         */
        _initializeConvertDialog: function(oView) {
            const oProspect = this._oCurrentProspectData;
            
            // Parse contact name if available
            let sFirstName = "";
            let sLastName = "";
            if (oProspect.contactName) {
                const nameParts = oProspect.contactName.trim().split(/\s+/);
                if (nameParts.length >= 2) {
                    sFirstName = nameParts[0];
                    sLastName = nameParts.slice(1).join(" ");
                } else if (nameParts.length === 1) {
                    sFirstName = nameParts[0];
                }
            }
            
            // === Header Section ===
            const oProspectName = oView.byId("convertProspectName");
            if (oProspectName) {
                oProspectName.setText(oProspect.prospectName || "Unknown Prospect");
            }
            
            const oProspectDetails = oView.byId("convertProspectDetails");
            if (oProspectDetails) {
                const details = [];
                if (oProspect.businessType) details.push(oProspect.businessType);
                if (oProspect.city) details.push(oProspect.city);
                if (oProspect.discoverySource) details.push("via " + oProspect.discoverySource);
                oProspectDetails.setText(details.join(" • ") || "No details available");
            }
            
            const oProspectScore = oView.byId("convertProspectScore");
            if (oProspectScore) {
                const score = oProspect.prospectScore || 0;
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
            const oAccountName = oView.byId("convertAccountName");
            if (oAccountName) {
                oAccountName.setValue(oProspect.prospectName || "");
            }
            
            const oAccountType = oView.byId("convertAccountType");
            if (oAccountType) {
                oAccountType.setSelectedKey(oProspect.businessType || "Retailer");
            }
            
            const oAccountIndustry = oView.byId("convertAccountIndustry");
            if (oAccountIndustry) {
                oAccountIndustry.setValue("Beauty & Wellness");
            }
            
            const oAccountWebsite = oView.byId("convertAccountWebsite");
            if (oAccountWebsite) {
                oAccountWebsite.setValue("");
            }
            
            const oAccountAddress = oView.byId("convertAccountAddress");
            if (oAccountAddress) {
                oAccountAddress.setValue(oProspect.address || "");
            }
            
            const oAccountCity = oView.byId("convertAccountCity");
            if (oAccountCity) {
                oAccountCity.setValue(oProspect.city || "");
            }
            
            const oAccountState = oView.byId("convertAccountState");
            if (oAccountState) {
                oAccountState.setValue(oProspect.state || "");
            }
            
            const oAccountCountry = oView.byId("convertAccountCountry");
            if (oAccountCountry) {
                oAccountCountry.setValue(oProspect.country || "Malaysia");
            }
            
            const oAccountPostalCode = oView.byId("convertAccountPostalCode");
            if (oAccountPostalCode) {
                oAccountPostalCode.setValue(oProspect.postalCode || "");
            }
            
            // === Contact Section ===
            const oContactFirstName = oView.byId("convertContactFirstName");
            if (oContactFirstName) {
                oContactFirstName.setValue(sFirstName);
            }
            
            const oContactLastName = oView.byId("convertContactLastName");
            if (oContactLastName) {
                oContactLastName.setValue(sLastName);
            }
            
            const oContactTitle = oView.byId("convertContactTitle");
            if (oContactTitle) {
                oContactTitle.setValue("Business Owner");
            }
            
            const oContactEmail = oView.byId("convertContactEmail");
            if (oContactEmail) {
                oContactEmail.setValue(oProspect.contactEmail || "");
            }
            
            const oContactPhone = oView.byId("convertContactPhone");
            if (oContactPhone) {
                oContactPhone.setValue(oProspect.contactPhone || "");
            }
            
            // === Opportunity Section ===
            const oOpportunityName = oView.byId("convertOpportunityName");
            if (oOpportunityName) {
                oOpportunityName.setValue((oProspect.prospectName || "Prospect") + " - Partnership Deal");
            }
            
            const oOpportunityDescription = oView.byId("convertOpportunityDescription");
            if (oOpportunityDescription) {
                let desc = "Partnership opportunity with " + (oProspect.prospectName || "prospect");
                if (oProspect.businessType) {
                    desc += "\nBusiness Type: " + oProspect.businessType;
                }
                oOpportunityDescription.setValue(desc);
            }
            
            const oOpportunityStage = oView.byId("convertOpportunityStage");
            if (oOpportunityStage) {
                oOpportunityStage.setSelectedKey("Prospecting");
            }
            
            const oOpportunityAmount = oView.byId("convertOpportunityAmount");
            if (oOpportunityAmount) {
                oOpportunityAmount.setValue(oProspect.estimatedValue || "");
            }
            
            const oOpportunityProbability = oView.byId("convertOpportunityProbability");
            const oProbabilityText = oView.byId("convertProbabilityText");
            if (oOpportunityProbability) {
                const probability = oProspect.prospectScore || 50;
                oOpportunityProbability.setValue(probability);
                
                // Update probability text
                if (oProbabilityText) {
                    oProbabilityText.setText(probability + "%");
                }
                
                // Attach live change handler for slider
                oOpportunityProbability.attachLiveChange(function(oEvent) {
                    const newValue = oEvent.getParameter("value");
                    if (oProbabilityText) {
                        oProbabilityText.setText(Math.round(newValue) + "%");
                    }
                });
            }
            
            const oOpportunityCloseDate = oView.byId("convertOpportunityCloseDate");
            if (oOpportunityCloseDate) {
                // Set to 90 days from now
                const closeDate = new Date();
                closeDate.setDate(closeDate.getDate() + 90);
                oOpportunityCloseDate.setDateValue(closeDate);
            }
        },

        /**
         * Handler for Convert dialog confirm button
         */
        onConvertDialogConfirm: function() {
            const that = this;
            const oView = this.base.getView();
            
            // Collect form data
            const oFormData = this._collectConvertFormData(oView);
            
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
            
            console.log("[Prospects] Converting prospect with data:", oFormData);
            
            // Show busy indicator
            BusyIndicator.show(0);
            
            // Call the backend action
            const sActionUrl = "/prospect/Prospects(" + this._sCurrentProspectID + ")/ProspectService.convertToAccount";
            
            fetch(sActionUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(oFormData)
            })
            .then(function(response) {
                if (response.ok) {
                    return response.json();
                }
                return response.json().then(function(err) {
                    throw new Error(err.error?.message || "Failed to convert prospect");
                });
            })
            .then(function(oResult) {
                BusyIndicator.hide();
                
                console.log("[Prospects] Conversion successful:", oResult);
                
                // Close the dialog
                if (that._oConvertProspectDialog) {
                    that._oConvertProspectDialog.close();
                }
                
                // Show success message with navigation options
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
                        onClose: function(sAction) {
                            if (sAction === "View Account" && oResult.accountID) {
                                // Navigate to the new account
                                window.location.href = "/beautyleads.accounts/index.html#/Accounts(" + oResult.accountID + ")";
                            } else {
                                // Refresh current page
                                window.location.reload();
                            }
                        }
                    }
                );
            })
            .catch(function(oError) {
                BusyIndicator.hide();
                console.error("[Prospects] Error converting prospect:", oError);
                MessageBox.error("Failed to convert prospect: " + oError.message);
            });
        },

        /**
         * Collect form data from the Convert dialog
         */
        _collectConvertFormData: function(oView) {
            // Account fields
            const oAccountName = oView.byId("convertAccountName");
            const oAccountType = oView.byId("convertAccountType");
            const oAccountIndustry = oView.byId("convertAccountIndustry");
            const oAccountWebsite = oView.byId("convertAccountWebsite");
            const oAccountAddress = oView.byId("convertAccountAddress");
            const oAccountCity = oView.byId("convertAccountCity");
            const oAccountState = oView.byId("convertAccountState");
            const oAccountCountry = oView.byId("convertAccountCountry");
            const oAccountPostalCode = oView.byId("convertAccountPostalCode");
            
            // Contact fields
            const oContactFirstName = oView.byId("convertContactFirstName");
            const oContactLastName = oView.byId("convertContactLastName");
            const oContactTitle = oView.byId("convertContactTitle");
            const oContactEmail = oView.byId("convertContactEmail");
            const oContactPhone = oView.byId("convertContactPhone");
            
            // Opportunity fields
            const oOpportunityName = oView.byId("convertOpportunityName");
            const oOpportunityDescription = oView.byId("convertOpportunityDescription");
            const oOpportunityStage = oView.byId("convertOpportunityStage");
            const oOpportunityAmount = oView.byId("convertOpportunityAmount");
            const oOpportunityProbability = oView.byId("convertOpportunityProbability");
            const oOpportunityCloseDate = oView.byId("convertOpportunityCloseDate");
            
            // Format close date to ISO string (date only)
            let sCloseDate = null;
            if (oOpportunityCloseDate && oOpportunityCloseDate.getDateValue()) {
                const oDate = oOpportunityCloseDate.getDateValue();
                sCloseDate = oDate.toISOString().split('T')[0];
            }
            
            return {
                // Account data
                accountName: oAccountName ? oAccountName.getValue() : "",
                accountType: oAccountType ? oAccountType.getSelectedKey() : "Retailer",
                industry: oAccountIndustry ? oAccountIndustry.getValue() : "Beauty & Wellness",
                website: oAccountWebsite ? oAccountWebsite.getValue() : "",
                address: oAccountAddress ? oAccountAddress.getValue() : "",
                city: oAccountCity ? oAccountCity.getValue() : "",
                state: oAccountState ? oAccountState.getValue() : "",
                country: oAccountCountry ? oAccountCountry.getValue() : "Malaysia",
                postalCode: oAccountPostalCode ? oAccountPostalCode.getValue() : "",
                
                // Contact data
                contactFirstName: oContactFirstName ? oContactFirstName.getValue() : "",
                contactLastName: oContactLastName ? oContactLastName.getValue() : "",
                contactTitle: oContactTitle ? oContactTitle.getValue() : "",
                contactEmail: oContactEmail ? oContactEmail.getValue() : "",
                contactPhone: oContactPhone ? oContactPhone.getValue() : "",
                
                // Opportunity data
                opportunityName: oOpportunityName ? oOpportunityName.getValue() : "",
                opportunityDescription: oOpportunityDescription ? oOpportunityDescription.getValue() : "",
                opportunityStage: oOpportunityStage ? oOpportunityStage.getSelectedKey() : "Prospecting",
                opportunityAmount: oOpportunityAmount ? parseFloat(oOpportunityAmount.getValue()) || 0 : 0,
                opportunityProbability: oOpportunityProbability ? parseInt(oOpportunityProbability.getValue(), 10) : 50,
                opportunityCloseDate: sCloseDate
            };
        },

        /**
         * Handler for Convert dialog cancel button
         */
        onConvertDialogCancel: function() {
            console.log("[Prospects] Convert dialog cancelled");
            if (this._oConvertProspectDialog) {
                this._oConvertProspectDialog.close();
            }
        }
    });
});
