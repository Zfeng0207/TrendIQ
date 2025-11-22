sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/m/MessageToast"
], function (ControllerExtension, MessageToast) {
    "use strict";

    return ControllerExtension.extend("beautyleads.merchants.ext.controller.ObjectPageExt", {
        
        /**
         * Called when the controller is instantiated
         */
        onInit: function () {
            // Call base controller's onInit if available
            if (this.base && this.base.onInit) {
                this.base.onInit.apply(this.base, arguments);
            }

            // Try to intercept action execution
            this._interceptActionExecution();
            
            // Also intercept at the model level
            this._interceptModelActions();
            
            // Listen for action response events
            this._setupActionResponseHandler();
            
            // Intercept at OData request level
            this._interceptODataRequests();
        },

        /**
         * Intercept OData requests at the lowest level
         */
        _interceptODataRequests: function () {
            try {
                const oView = this.base.getView();
                if (!oView) {
                    setTimeout(function () {
                        this._interceptODataRequests();
                    }.bind(this), 500);
                    return;
                }

                const oModel = oView.getModel();
                if (!oModel) {
                    setTimeout(function () {
                        this._interceptODataRequests();
                    }.bind(this), 500);
                    return;
                }

                const that = this;

                // Intercept requestObject if available (OData V4 model)
                if (oModel.requestObject && !oModel._originalRequestObject) {
                    oModel._originalRequestObject = oModel.requestObject;
                    
                    oModel.requestObject = function (sPath, mParameters) {
                        console.log("requestObject called:", sPath, mParameters);
                        
                        if (sPath && sPath.indexOf("initiateAIMeeting") >= 0) {
                            console.log("Intercepting initiateAIMeeting in requestObject - showing toast");
                            that.onInitiateAIMeeting();
                            return Promise.resolve({ success: true });
                        }
                        
                        if (this._originalRequestObject) {
                            return this._originalRequestObject.apply(this, arguments);
                        }
                    };
                }

                // Intercept submitChanges if available (for batch requests)
                if (oModel.submitChanges && !oModel._originalSubmitChanges) {
                    oModel._originalSubmitChanges = oModel.submitChanges;
                    
                    oModel.submitChanges = function (mParameters) {
                        console.log("submitChanges called:", mParameters);
                        
                        // Check if any change contains initiateAIMeeting
                        const aChanges = oModel.getPendingChanges && oModel.getPendingChanges();
                        if (aChanges) {
                            for (let i = 0; i < aChanges.length; i++) {
                                const oChange = aChanges[i];
                                const sPath = oChange.path || "";
                                if (sPath.indexOf("initiateAIMeeting") >= 0) {
                                    console.log("Intercepting initiateAIMeeting in submitChanges - showing toast");
                                    that.onInitiateAIMeeting();
                                    return Promise.resolve({ success: true });
                                }
                            }
                        }
                        
                        if (this._originalSubmitChanges) {
                            return this._originalSubmitChanges.apply(this, arguments);
                        }
                    };
                }

                console.log("OData request interception set up successfully");
            } catch (e) {
                console.error("ObjectPageExt: Error intercepting OData requests:", e);
            }
        },

        /**
         * Set up handler for action response events
         */
        _setupActionResponseHandler: function () {
            try {
                const oView = this.base.getView();
                if (!oView) {
                    setTimeout(function () {
                        this._setupActionResponseHandler();
                    }.bind(this), 500);
                    return;
                }

                const oModel = oView.getModel();
                if (!oModel) {
                    setTimeout(function () {
                        this._setupActionResponseHandler();
                    }.bind(this), 500);
                    return;
                }

                const that = this;

                // Listen for request completed events
                oModel.attachRequestCompleted(function (oEvent) {
                    const oParams = oEvent.getParameters();
                    const sRequestUrl = oParams.requestUrl || "";
                    const sMethod = oParams.method || "";
                    
                    console.log("Request completed:", sMethod, sRequestUrl);
                    
                    // Check if this is the initiateAIMeeting action
                    if (sRequestUrl && sRequestUrl.indexOf("initiateAIMeeting") >= 0 && sMethod === "POST") {
                        console.log("Detected initiateAIMeeting action completion - showing toast");
                        // Show toast after action completes
                        setTimeout(function () {
                            that.onInitiateAIMeeting();
                        }, 100);
                    }
                });

                // Also listen for batch request completion (Fiori Elements uses $batch)
                oModel.attachBatchRequestCompleted(function (oEvent) {
                    const oParams = oEvent.getParameters();
                    const aRequests = oParams.requests || [];
                    
                    for (let i = 0; i < aRequests.length; i++) {
                        const oRequest = aRequests[i];
                        const sUrl = oRequest.url || "";
                        const sMethod = oRequest.method || "";
                        
                        if (sUrl.indexOf("initiateAIMeeting") >= 0 && sMethod === "POST") {
                            console.log("Detected initiateAIMeeting in batch request - showing toast");
                            setTimeout(function () {
                                that.onInitiateAIMeeting();
                            }, 100);
                            break;
                        }
                    }
                });

                console.log("Action response handler set up successfully");
            } catch (e) {
                console.error("ObjectPageExt: Error setting up action response handler:", e);
            }
        },

        /**
         * Intercept model action calls at multiple levels
         */
        _interceptModelActions: function () {
            try {
                const oView = this.base.getView();
                if (!oView) {
                    setTimeout(function () {
                        this._interceptModelActions();
                    }.bind(this), 500);
                    return;
                }

                const oModel = oView.getModel();
                if (!oModel) {
                    setTimeout(function () {
                        this._interceptModelActions();
                    }.bind(this), 500);
                    return;
                }

                const that = this;

                // Helper function to check if path contains initiateAIMeeting
                function isInitiateAIMeetingPath(sPath) {
                    if (!sPath) return false;
                    const sPathLower = sPath.toLowerCase();
                    return sPathLower.indexOf("initiateaimeeting") >= 0 || 
                           sPathLower.indexOf("initiateaim") >= 0 ||
                           sPathLower.indexOf("merchantservice.initiateaimeeting") >= 0;
                }

                // Store original methods if not already stored
                if (!oModel._originalCallFunction) {
                    oModel._originalCallFunction = oModel.callFunction;
                }
                if (!oModel._originalRead) {
                    oModel._originalRead = oModel.read;
                }
                if (!oModel._originalUpdate) {
                    oModel._originalUpdate = oModel.update;
                }
                if (!oModel._originalCreate) {
                    oModel._originalCreate = oModel.create;
                }

                // Override callFunction to intercept initiateAIMeeting
                oModel.callFunction = function (sPath, mParameters) {
                    console.log("Model callFunction called:", sPath, mParameters);
                    
                    if (isInitiateAIMeetingPath(sPath)) {
                        console.log("Intercepting initiateAIMeeting in callFunction - showing toast");
                        // Show toast instead of calling backend
                        that.onInitiateAIMeeting();
                        // Return a fake promise that resolves immediately
                        return Promise.resolve({ success: true });
                    }
                    
                    // For other actions, call original
                    if (this._originalCallFunction) {
                        return this._originalCallFunction.apply(this, arguments);
                    }
                    return Promise.reject("No original callFunction");
                };

                // Override read to catch action calls that might use read
                oModel.read = function (sPath, mParameters) {
                    if (isInitiateAIMeetingPath(sPath)) {
                        console.log("Intercepting initiateAIMeeting in read - showing toast");
                        that.onInitiateAIMeeting();
                        return Promise.resolve({ success: true });
                    }
                    if (this._originalRead) {
                        return this._originalRead.apply(this, arguments);
                    }
                };

                // Override update to catch action calls that might use update
                oModel.update = function (sPath, oData, mParameters) {
                    if (isInitiateAIMeetingPath(sPath)) {
                        console.log("Intercepting initiateAIMeeting in update - showing toast");
                        that.onInitiateAIMeeting();
                        return Promise.resolve({ success: true });
                    }
                    if (this._originalUpdate) {
                        return this._originalUpdate.apply(this, arguments);
                    }
                };

                // Override create to catch action calls that might use create
                oModel.create = function (sPath, oData, mParameters) {
                    if (isInitiateAIMeetingPath(sPath)) {
                        console.log("Intercepting initiateAIMeeting in create - showing toast");
                        that.onInitiateAIMeeting();
                        return Promise.resolve({ success: true });
                    }
                    if (this._originalCreate) {
                        return this._originalCreate.apply(this, arguments);
                    }
                };
                
                console.log("Model action interception set up successfully (callFunction, read, update, create)");
            } catch (e) {
                console.error("ObjectPageExt: Error intercepting model actions:", e);
            }
        },

        /**
         * Intercept action execution to handle initiateAIMeeting
         */
        _interceptActionExecution: function () {
            try {
                const oView = this.base.getView();
                if (!oView) {
                    return;
                }

                // Get the controller's event bus or router
                const oComponent = this.base.getAppComponent();
                if (oComponent) {
                    // Listen for action execution events
                    const oEventBus = oComponent.getEventBus();
                    if (oEventBus) {
                        oEventBus.subscribe("sap.fe", "actionExecuted", this._onActionExecuted, this);
                    }
                }
            } catch (e) {
                console.warn("ObjectPageExt: Could not intercept action execution:", e);
            }
        },

        /**
         * Handler for action execution events
         */
        _onActionExecuted: function (sChannelId, sEventId, oData) {
            console.log("Action executed event:", sChannelId, sEventId, oData);
            if (oData && oData.action && oData.action.indexOf("initiateAIMeeting") >= 0) {
                console.log("Intercepting initiateAIMeeting action");
                // Intercept and show toast
                setTimeout(function () {
                    this.onInitiateAIMeeting();
                }.bind(this), 100);
            }
        },

        /**
         * Override the base controller's action handler if available
         * This is called by Fiori Elements when an action is triggered
         */
        onExecuteAction: function (oEvent) {
            const sActionName = oEvent.getParameter("actionName") || oEvent.getParameter("action");
            console.log("onExecuteAction called with:", sActionName);
            
            if (sActionName && (sActionName.indexOf("initiateAIMeeting") >= 0 || sActionName === "initiateAIMeeting")) {
                console.log("Intercepting initiateAIMeeting in onExecuteAction");
                // Prevent default execution
                if (oEvent.preventDefault) {
                    oEvent.preventDefault();
                }
                // Show toast directly
                this.onInitiateAIMeeting(oEvent);
                return false; // Prevent further execution
            }
            
            // For other actions, call base handler
            if (this.base && this.base.onExecuteAction) {
                return this.base.onExecuteAction.apply(this.base, arguments);
            }
        },

        /**
         * Called after the view has been rendered
         * Customize the AI Meeting Initiator button appearance
         */
        onAfterRendering: function () {
            // Call base controller's onAfterRendering if available
            if (this.base && this.base.onAfterRendering) {
                this.base.onAfterRendering.apply(this.base, arguments);
            }

            // Set up MutationObserver to catch button when it's created
            this._setupButtonObserver();

            // Customize the AI Meeting Initiator button after rendering
            // Try multiple times with increasing delays
            setTimeout(function () {
                this._customizeAIMeetingButton();
            }.bind(this), 300);
            
            setTimeout(function () {
                this._customizeAIMeetingButton();
            }.bind(this), 1000);
            
            setTimeout(function () {
                this._customizeAIMeetingButton();
            }.bind(this), 2000);
        },

        /**
         * Set up MutationObserver to watch for button creation
         */
        _setupButtonObserver: function () {
            try {
                const oView = this.base.getView();
                if (!oView) {
                    return;
                }

                const oDomRef = oView.getDomRef();
                if (!oDomRef) {
                    setTimeout(function () {
                        this._setupButtonObserver();
                    }.bind(this), 500);
                    return;
                }

                // Create observer to watch for new buttons
                const oObserver = new MutationObserver(function (aMutations) {
                    const that = this;
                    aMutations.forEach(function (oMutation) {
                        if (oMutation.addedNodes && oMutation.addedNodes.length > 0) {
                            for (let i = 0; i < oMutation.addedNodes.length; i++) {
                                const oNode = oMutation.addedNodes[i];
                                if (oNode.nodeType === 1) { // Element node
                                    // Check if it's a button or contains buttons
                                    const sText = oNode.textContent || "";
                                    if (sText.indexOf("AI Meeting Initiator") >= 0 || 
                                        sText.indexOf("Meeting Initiator") >= 0) {
                                        console.log("MutationObserver: Found button in DOM");
                                        setTimeout(function () {
                                            that._customizeAIMeetingButton();
                                        }, 100);
                                    }
                                }
                            }
                        }
                    });
                }.bind(this));

                // Start observing
                oObserver.observe(oDomRef, {
                    childList: true,
                    subtree: true
                });

                // Store observer for cleanup
                this._buttonObserver = oObserver;
                console.log("MutationObserver set up for button detection");
            } catch (e) {
                console.warn("ObjectPageExt: Error setting up MutationObserver:", e);
            }
        },

        /**
         * Internal method to customize the AI Meeting Initiator button
         * Adds icon, ensures proper styling, and attaches press handler
         */
        _customizeAIMeetingButton: function () {
            try {
                const oView = this.base.getView();
                if (!oView) {
                    console.log("_customizeAIMeetingButton: View not available");
                    return;
                }

                console.log("_customizeAIMeetingButton: Searching for button...");

                // Method 1: Find by text content
                let aControls = oView.findAggregatedObjects(true, function (oControl) {
                    if (oControl.isA && oControl.isA("sap.m.Button")) {
                        const sText = oControl.getText();
                        const sId = oControl.getId() || "";
                        console.log("Checking button:", sId, sText);
                        
                        if (sText && (sText.indexOf("AI Meeting Initiator") >= 0 || 
                                     sText.indexOf("Meeting Initiator") >= 0 ||
                                     sText.toLowerCase().indexOf("initiate") >= 0)) {
                            return true;
                        }
                        // Also check by ID pattern
                        if (sId && (sId.indexOf("initiate") >= 0 || sId.indexOf("Meeting") >= 0)) {
                            return true;
                        }
                    }
                    return false;
                });
                
                console.log("Method 1 found buttons:", aControls ? aControls.length : 0);
                
                // Method 2: Try to find by action binding path (Fiori Elements format)
                if (!aControls || aControls.length === 0) {
                    aControls = oView.findAggregatedObjects(true, function (oControl) {
                        if (oControl.isA && oControl.isA("sap.m.Button")) {
                            try {
                                // Check if button has action binding
                                const oBinding = oControl.getBinding && oControl.getBinding("press");
                                if (oBinding) {
                                    const sPath = oBinding.getPath && oBinding.getPath();
                                    const sContext = oBinding.getContext && oBinding.getContext() && oBinding.getContext().getPath();
                                    const sFullPath = (sPath || "") + (sContext || "");
                                    
                                    console.log("Button binding path:", sPath, "Context:", sContext);
                                    
                                    if ((sPath && sPath.indexOf("initiateAIMeeting") >= 0) ||
                                        (sFullPath && sFullPath.indexOf("initiateAIMeeting") >= 0)) {
                                        return true;
                                    }
                                }
                                
                                // Check for action in metadata or custom data
                                const aCustomData = oControl.getCustomData && oControl.getCustomData();
                                if (aCustomData && aCustomData.length > 0) {
                                    for (let i = 0; i < aCustomData.length; i++) {
                                        const sKey = aCustomData[i].getKey && aCustomData[i].getKey();
                                        const sValue = aCustomData[i].getValue && aCustomData[i].getValue();
                                        if ((sKey && (sKey.indexOf("initiate") >= 0 || sKey.indexOf("Action") >= 0)) || 
                                            (sValue && (sValue.indexOf("initiate") >= 0 || sValue.indexOf("MerchantService") >= 0))) {
                                            return true;
                                        }
                                    }
                                }
                                
                                // Check button's metadata for action name
                                const oMetadata = oControl.getMetadata && oControl.getMetadata();
                                if (oMetadata) {
                                    const sName = oMetadata.getName && oMetadata.getName();
                                    if (sName && sName.indexOf("initiate") >= 0) {
                                        return true;
                                    }
                                }
                            } catch (e) {
                                // Ignore errors
                            }
                        }
                        return false;
                    });
                }
                
                console.log("Method 2 found buttons:", aControls ? aControls.length : 0);
                
                // Method 3: Find all buttons in the header/identification area and check their actions
                if (!aControls || aControls.length === 0) {
                    const oHeader = oView.byId && oView.byId("fe::ObjectPage::Header");
                    if (oHeader) {
                        const aAllButtons = oHeader.findAggregatedObjects(true, function (oControl) {
                            return oControl.isA && oControl.isA("sap.m.Button");
                        });
                        console.log("Method 3 (header) found buttons:", aAllButtons ? aAllButtons.length : 0);
                        
                        // Check each button for initiateAIMeeting action
                        if (aAllButtons && aAllButtons.length > 0) {
                            for (let i = 0; i < aAllButtons.length; i++) {
                                const oBtn = aAllButtons[i];
                                const sText = oBtn.getText && oBtn.getText();
                                const sId = oBtn.getId && oBtn.getId();
                                
                                // Check if this button matches our criteria
                                if ((sText && (sText.indexOf("AI Meeting Initiator") >= 0 || 
                                              sText.indexOf("Meeting Initiator") >= 0)) ||
                                    (sId && sId.indexOf("initiate") >= 0)) {
                                    aControls = [oBtn];
                                    console.log("Method 3: Found matching button by text/ID");
                                    break;
                                }
                                
                                // Check button's press binding for action
                                try {
                                    const oBinding = oBtn.getBinding && oBtn.getBinding("press");
                                    if (oBinding) {
                                        const sPath = oBinding.getPath && oBinding.getPath();
                                        if (sPath && sPath.indexOf("initiateAIMeeting") >= 0) {
                                            aControls = [oBtn];
                                            console.log("Method 3: Found matching button by action binding");
                                            break;
                                        }
                                    }
                                } catch (e) {
                                    // Ignore
                                }
                            }
                        }
                    }
                }
                
                // Method 4: Try to find by searching all controls and checking for action in data
                if (!aControls || aControls.length === 0) {
                    const aAllControls = oView.findAggregatedObjects(true, function (oControl) {
                        if (oControl.isA && oControl.isA("sap.m.Button")) {
                            // Get button's data context to check for action
                            try {
                                const oBindingContext = oControl.getBindingContext && oControl.getBindingContext();
                                if (oBindingContext) {
                                    const sPath = oBindingContext.getPath && oBindingContext.getPath();
                                    if (sPath && sPath.indexOf("MerchantDiscoveries") >= 0) {
                                        const sText = oControl.getText && oControl.getText();
                                        if (sText && sText.indexOf("Meeting") >= 0) {
                                            return true;
                                        }
                                    }
                                }
                            } catch (e) {
                                // Ignore
                            }
                        }
                        return false;
                    });
                    if (aAllControls && aAllControls.length > 0) {
                        aControls = aAllControls;
                        console.log("Method 4 found buttons:", aControls.length);
                    }
                }

                if (aControls && aControls.length > 0) {
                    const oButton = aControls[0];
                    
                    // Check if we've already customized this button
                    const sCustomized = oButton.data ? oButton.data("aiMeetingCustomized") : null;
                    if (sCustomized) {
                        console.log("AI Meeting Initiator button already customized");
                        return;
                    }
                    
                    console.log("Found AI Meeting Initiator button, customizing...");
                    
                    // Set button type to Emphasized (blue)
                    oButton.setType("Emphasized");
                    // Add AI icon
                    oButton.setIcon("sap-icon://lightbulb");
                    // Ensure icon is on the left
                    oButton.setIconFirst(true);
                    
                    // Store original press handler if any
                    const fnOriginalPress = oButton.getPress ? oButton.getPress() : null;
                    
                    // Detach any existing press handlers and attach our custom one
                    oButton.detachPress();
                    oButton.attachPress(function (oEvent) {
                        console.log("AI Meeting Initiator button pressed");
                        // Prevent default action
                        if (oEvent) {
                            oEvent.preventDefault();
                            oEvent.stopPropagation();
                        }
                        // Call our handler
                        this.onInitiateAIMeeting(oEvent);
                    }.bind(this));
                    
                    // Mark as customized using data attribute
                    if (oButton.data) {
                        oButton.data("aiMeetingCustomized", "true");
                    }
                    
                    console.log("AI Meeting Initiator button customized and handler attached successfully");
                } else {
                    // Retry if button not found yet
                    if (!this._buttonRetryCount) {
                        this._buttonRetryCount = 0;
                    }
                    if (this._buttonRetryCount < 10) {
                        this._buttonRetryCount++;
                        console.log("AI Meeting Initiator button not found, retrying... (" + this._buttonRetryCount + "/10)");
                        setTimeout(function () {
                            this._customizeAIMeetingButton();
                        }.bind(this), 500);
                    } else {
                        console.warn("AI Meeting Initiator button not found after 10 retries");
                    }
                }
            } catch (e) {
                console.error("ObjectPageExt: Error customizing AI Meeting button:", e);
            }
        },


        /**
         * Handler for AI Meeting Initiator action
         * Called when the "AI Meeting Initiator" button is clicked
         * This handler intercepts the button press and shows the toast directly
         * This method name follows Fiori Elements convention: on<ActionName>
         */
        onInitiateAIMeeting: function (oEvent) {
            console.log("onInitiateAIMeeting called", oEvent);
            
            // Prevent default action execution if event is provided
            if (oEvent) {
                if (oEvent.preventDefault) {
                    oEvent.preventDefault();
                }
                if (oEvent.stopPropagation) {
                    oEvent.stopPropagation();
                }
                if (oEvent.stopImmediatePropagation) {
                    oEvent.stopImmediatePropagation();
                }
            }
            
            try {
                const oView = this.base.getView();
                if (!oView) {
                    console.error("onInitiateAIMeeting: View not available");
                    MessageToast.show("Error: View not available");
                    return;
                }

                // Get the binding context to access entity data
                const oBindingContext = oView.getBindingContext();
                if (!oBindingContext) {
                    console.error("onInitiateAIMeeting: No binding context available");
                    MessageToast.show("Error: No data available");
                    return;
                }

                console.log("onInitiateAIMeeting: Binding context found", oBindingContext.getPath());

                // Get merchant data from binding context
                // Use expand to get related data if needed
                let oData = oBindingContext.getObject();
                
                // If data is not fully loaded, try to get it
                if (!oData || Object.keys(oData).length === 0) {
                    console.log("onInitiateAIMeeting: Data not loaded, trying to read from context");
                    const oModel = oView.getModel();
                    if (oModel) {
                        oModel.read(oBindingContext.getPath(), {
                            success: (oLoadedData) => {
                                oData = oLoadedData;
                                this._processMeetingScript(oData);
                            },
                            error: (oError) => {
                                console.error("onInitiateAIMeeting: Error loading data", oError);
                                MessageToast.show("Error loading partner data");
                            }
                        });
                        return;
                    }
                }
                
                this._processMeetingScript(oData);
                
            } catch (e) {
                console.error("Error in onInitiateAIMeeting:", e);
                MessageToast.show("Error generating meeting script. Please try again.");
            }
        },

        /**
         * Process meeting script data - handles data loading if needed
         * @param {object} oData - Merchant data object
         */
        _processMeetingScript: function (oData) {
            try {
                // If autoAssignedTo is not expanded, try to get it from the model
                if (!oData.autoAssignedTo || typeof oData.autoAssignedTo !== 'object') {
                    const sAssignedToID = oData.autoAssignedTo_ID;
                    if (sAssignedToID) {
                        // Try to get from model
                        const oView = this.base.getView();
                        const oModel = oView ? oView.getModel() : null;
                        if (oModel) {
                            oModel.read("/Users(" + sAssignedToID + ")", {
                                success: (oUserData) => {
                                    oData.autoAssignedTo = oUserData;
                                    this._showMeetingScript(oData);
                                },
                                error: () => {
                                    // Continue without user data
                                    this._showMeetingScript(oData);
                                }
                            });
                            return;
                        }
                    }
                }
                
                // Data is ready, show script
                this._showMeetingScript(oData);
            } catch (e) {
                console.error("Error in _processMeetingScript:", e);
                this._showMeetingScript(oData); // Try anyway
            }
        },

        /**
         * Internal method to show the meeting script toast
         * @param {object} oData - Merchant data object
         */
        _showMeetingScript: function (oData) {
            try {
                // Extract values with fallbacks
                const sChannelPartnerName = oData.merchantName || "N/A";
                const sBusinessType = oData.businessType || "N/A";
                const sLocation = oData.city || oData.location || "N/A";
                const iChannelPartnerScore = oData.merchantScore || 0;
                
                // Get assigned sales rep
                let sAssignedSalesRep = "N/A";
                if (oData.autoAssignedTo && typeof oData.autoAssignedTo === 'object') {
                    sAssignedSalesRep = oData.autoAssignedTo.fullName || "N/A";
                } else if (oData.assignedTo) {
                    sAssignedSalesRep = oData.assignedTo;
                }

                // Generate the meeting script
                const sMeetingScript = this._generateMeetingScript(
                    sChannelPartnerName,
                    sBusinessType,
                    sLocation,
                    iChannelPartnerScore,
                    sAssignedSalesRep
                );

                // Show toast message with the script
                MessageToast.show(sMeetingScript, {
                    duration: 10000, // 10 seconds to allow reading
                    width: "30rem",
                    closeOnBrowserNavigation: false
                });
            } catch (e) {
                console.error("Error in _showMeetingScript:", e);
                MessageToast.show("Error generating meeting script. Please try again.");
            }
        },

        /**
         * Internal method to generate the meeting script
         * @param {string} sChannelPartnerName - Channel Partner Name
         * @param {string} sBusinessType - Business Type
         * @param {string} sLocation - Location (City)
         * @param {number} iChannelPartnerScore - Channel Partner Score
         * @param {string} sAssignedSalesRep - Assigned Sales Rep
         * @returns {string} Formatted meeting script
         */
        _generateMeetingScript: function (sChannelPartnerName, sBusinessType, sLocation, iChannelPartnerScore, sAssignedSalesRep) {
            // Build the meeting script
            let sScript = "📄 AI Meeting Initiator Prepared\n\n";
            sScript += `Hi ${sAssignedSalesRep},\n\n`;
            sScript += `Here's your meeting starter script for ${sChannelPartnerName}:\n\n`;
            sScript += `• Business Type: ${sBusinessType}\n`;
            sScript += `• Location: ${sLocation}\n`;
            sScript += `• Partner Score: ${iChannelPartnerScore}%\n\n`;
            sScript += "Suggested Opening:\n\n";
            sScript += "\"Thank you for meeting today. Based on our analysis, your ";
            
            // Customize opening based on business type
            if (sBusinessType === "Salon" || sBusinessType === "Spa") {
                sScript += "salon's digital presence and customer engagement";
            } else if (sBusinessType === "E-commerce") {
                sScript += "online store's performance and market reach";
            } else if (sBusinessType === "Retailer" || sBusinessType === "Kiosk") {
                sScript += "retail operations and customer footfall";
            } else if (sBusinessType === "Distributor") {
                sScript += "distribution network and market coverage";
            } else {
                sScript += "business's digital presence and customer engagement";
            }
            
            sScript += " show strong potential for partnership activation. I'd love to align on your goals and map out collaboration opportunities across campaigns, inventory planning, and customer retention.\"\n\n";
            sScript += "Good luck with your meeting!";

            return sScript;
        }
    });
});

