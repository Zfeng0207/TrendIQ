sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension"
], function (ControllerExtension) {
    "use strict";

    return ControllerExtension.extend("beautyleads.accounts.ext.controller.ListReportExt", {
        
        /**
         * Called when the controller is instantiated
         */
        onInit: function () {
            // Call base controller's onInit if available
            if (this.base && this.base.onInit) {
                this.base.onInit.apply(this.base, arguments);
            }

            // Register route matched handler to ensure expanded rows on navigation
            try {
                const oRouter = this.base.getAppComponent().getRouter();
                if (oRouter) {
                    const oRoute = oRouter.getRoute("AccountsList");
                    if (oRoute) {
                        oRoute.attachPatternMatched(this.onRouteMatched, this);
                    }
                }
            } catch (e) {
                // Route might not be available yet, will try in onAfterRendering
                console.warn("ListReportExt: Could not attach route handler:", e);
            }
        },

        /**
         * Called after the view has been rendered
         * Ensures the table is set to expanded (condensed = false) mode
         */
        onAfterRendering: function () {
            // Call base controller's onAfterRendering if available
            if (this.base && this.base.onAfterRendering) {
                this.base.onAfterRendering.apply(this.base, arguments);
            }

            // Ensure table is expanded after rendering (with delay to ensure table is ready)
            setTimeout(function () {
                this._ensureExpandedRows();
            }.bind(this), 100);
        },

        /**
         * Called when the route is matched (navigation)
         * Ensures expanded rows are maintained across navigation
         */
        onRouteMatched: function () {
            // Delay to ensure table is rendered after navigation
            setTimeout(function () {
                this._ensureExpandedRows();
            }.bind(this), 500);
        },

        /**
         * Internal method to ensure table rows are expanded (condensed = false)
         */
        _ensureExpandedRows: function () {
            try {
                const oView = this.base.getView();
                if (!oView) {
                    return;
                }

                // Try multiple ways to find the table
                let oTable = null;

                // Method 1: Try Fiori Elements standard table ID pattern
                const aPossibleIds = [
                    "fe::table::Accounts::LineItem::ResponsiveTable",
                    "fe::table::Accounts::LineItem",
                    "fe::table::Accounts",
                    "fe::table"
                ];

                for (let i = 0; i < aPossibleIds.length; i++) {
                    oTable = oView.byId(aPossibleIds[i]);
                    if (oTable) {
                        break;
                    }
                }

                // Method 2: Search for ResponsiveTable in the view
                if (!oTable) {
                    const aControls = oView.findAggregatedObjects(true, function (oControl) {
                        return oControl.isA("sap.m.ResponsiveTable") || 
                               oControl.isA("sap.ui.table.Table");
                    });
                    if (aControls && aControls.length > 0) {
                        oTable = aControls[0];
                    }
                }

                // Method 3: Try to get from ListReport's internal table reference
                if (!oTable && this.base.byId) {
                    oTable = this.base.byId("fe::table");
                }

                if (oTable) {
                    // Reset retry count on success
                    this._retryCount = 0;
                    
                    // Set condensed to false (expanded/multi-line rows)
                    if (typeof oTable.setCondensed === "function") {
                        oTable.setCondensed(false);
                    }
                    
                    // For ResponsiveTable, also ensure proper row height
                    if (oTable.isA("sap.m.ResponsiveTable")) {
                        // Ensure rows are not condensed
                        if (typeof oTable.setCondensed === "function") {
                            oTable.setCondensed(false);
                        }
                    }
                    
                    // Attach to table's afterRendering to persist the setting
                    if (!oTable._expandedRowsAttached) {
                        oTable.attachAfterRendering(function () {
                            if (typeof oTable.setCondensed === "function") {
                                oTable.setCondensed(false);
                            }
                        });
                        oTable._expandedRowsAttached = true;
                    }
                } else {
                    // If table not found, try again after a short delay (max 3 retries)
                    if (!this._retryCount) {
                        this._retryCount = 0;
                    }
                    if (this._retryCount < 3) {
                        this._retryCount++;
                        setTimeout(function () {
                            this._ensureExpandedRows();
                        }.bind(this), 300);
                    }
                }
            } catch (e) {
                console.warn("ListReportExt: Error ensuring expanded rows:", e);
            }
        },

        /**
         * Hook into the table's onAfterRendering if available
         * This ensures the setting persists even after table re-renders
         */
        _attachTableRendering: function () {
            try {
                const oView = this.base.getView();
                if (!oView) {
                    return;
                }

                // Find table and attach to its afterRendering event
                const aControls = oView.findAggregatedObjects(true, function (oControl) {
                    return oControl.isA("sap.m.ResponsiveTable") || 
                           oControl.isA("sap.ui.table.Table");
                });

                if (aControls && aControls.length > 0) {
                    const oTable = aControls[0];
                    oTable.attachAfterRendering(function () {
                        if (typeof oTable.setCondensed === "function") {
                            oTable.setCondensed(false);
                        }
                    });
                }
            } catch (e) {
                console.warn("ListReportExt: Error attaching table rendering:", e);
            }
        }
    });
});

