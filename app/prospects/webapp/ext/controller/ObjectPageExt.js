sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension"
], function (ControllerExtension) {
    "use strict";

    return ControllerExtension.extend("beautyleads.prospects.ext.controller.ObjectPageExt", {

        onInit: function () {
            console.log("[Prospects] Object Page Controller extension loaded");
        }
    });
});

