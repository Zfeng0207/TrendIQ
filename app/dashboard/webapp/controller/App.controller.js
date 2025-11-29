sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("beautyleads.dashboard.controller.App", {
        onInit: function () {
            var oViewModel = new JSONModel({
                busy: false,
                delay: 0
            });

            this.getView().setModel(oViewModel, "appView");

            // Apply content density class
            this.getView().addStyleClass(
                this.getOwnerComponent().getContentDensityClass()
            );
        }
    });
});

