/**
 * Custom Extension Controller for Merchant Discoveries List Report
 * Handles auto-refresh after generateAbout action
 */
sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ui/core/routing/HashChanger"
], function (ControllerExtension, HashChanger) {
    "use strict";

    return ControllerExtension.extend("beautyleads.merchants.ext.controller.ListReportExt", {
        /**
         * Called when the controller is initialized
         */
        onInit: function () {
            // Store reference to controller for later use
            this._oController = this.base.getController();
        },

        /**
         * Called when the generateAbout action is executed
         * This hook is automatically called by Fiori Elements when the action completes
         */
        onGenerateAbout: function (oEvent) {
            const that = this;
            // Wait for the 3-second delay + action completion, then refresh
            setTimeout(() => {
                that._refreshTable();
            }, 3500); // 3s delay + 0.5s buffer
        },

        /**
         * Hook called after any action is executed
         */
        onAfterAction: function (oEvent) {
            const oAction = oEvent.getParameter("action");
            if (oAction && oAction.getName && oAction.getName() === "MerchantService.generateAbout") {
                const that = this;
                // Wait for the 3-second delay + action completion, then refresh
                setTimeout(() => {
                    that._refreshTable();
                }, 3500);
            }
        },

        /**
         * Refresh the table after action completion
         */
        _refreshTable: function () {
            try {
                const oController = this._oController || this.base.getController();
                if (!oController) {
                    console.error("Controller not found");
                    window.location.reload();
                    return;
                }

                // Method 1: Use the List Report's built-in refresh
                if (oController.refresh && typeof oController.refresh === "function") {
                    oController.refresh();
                    console.log("Table refreshed via controller.refresh()");
                    return;
                }

                // Method 2: Get the view and find the table
                const oView = oController.getView();
                if (!oView) {
                    console.error("View not found");
                    window.location.reload();
                    return;
                }

                // Try multiple table ID patterns
                const aTableIds = [
                    "fe::table::MerchantDiscoveries::LineItem",
                    "MerchantDiscoveries::LineItem",
                    "fe::table::MerchantDiscoveries",
                    "MerchantDiscoveries"
                ];

                for (let i = 0; i < aTableIds.length; i++) {
                    const oTable = oView.byId(aTableIds[i]);
                    if (oTable) {
                        const oBinding = oTable.getBinding("rows");
                        if (oBinding) {
                            oBinding.refresh();
                            console.log("Table refreshed via binding for ID: " + aTableIds[i]);
                            return;
                        }
                    }
                }

                // Method 3: Refresh the OData model
                const oModel = oView.getModel();
                if (oModel && typeof oModel.refresh === "function") {
                    oModel.refresh(true);
                    console.log("Model refreshed");
                    return;
                }

                // Method 4: Use HashChanger to trigger navigation refresh
                const oHashChanger = HashChanger.getInstance();
                const sCurrentHash = oHashChanger.getHash();
                oHashChanger.replaceHash(sCurrentHash);
                console.log("Hash refreshed to trigger reload");
                
                // If all else fails, reload the page
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } catch (oError) {
                console.error("Error refreshing table:", oError);
                window.location.reload();
            }
        }
    });
});

