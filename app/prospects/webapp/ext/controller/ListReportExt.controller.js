sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/m/MessageToast"
], function (ControllerExtension, MessageToast) {
    "use strict";

    return ControllerExtension.extend("beautyleads.prospects.ext.controller.ListReportExt", {
        // Lifecycle hook
        onInit: function () {
            // Controller extension initialized
            window.__FAB_CONTROLLER__ = this;
        },

        // Helper method to get i18n text
        getText: function (sKey) {
            const oResourceBundle = this.base.getView().getModel("i18n").getResourceBundle();
            return oResourceBundle.getText(sKey);
        }
    });
});


