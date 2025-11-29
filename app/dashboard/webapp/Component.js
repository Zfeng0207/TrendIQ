sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], function (UIComponent, JSONModel, Device) {
    "use strict";

    return UIComponent.extend("beautyleads.dashboard.Component", {
        metadata: {
            manifest: "json"
        },

        /**
         * Component initialization
         */
        init: function () {
            // Call parent init
            UIComponent.prototype.init.apply(this, arguments);

            // Set device model
            var oDeviceModel = new JSONModel(Device);
            oDeviceModel.setDefaultBindingMode("OneWay");
            this.setModel(oDeviceModel, "device");

            // Initialize router
            this.getRouter().initialize();
        },

        /**
         * Component destruction
         */
        destroy: function () {
            UIComponent.prototype.destroy.apply(this, arguments);
        },

        /**
         * Get content density class based on device
         * @returns {string} Content density class
         */
        getContentDensityClass: function () {
            if (!this._sContentDensityClass) {
                if (!Device.support.touch) {
                    this._sContentDensityClass = "sapUiSizeCompact";
                } else {
                    this._sContentDensityClass = "sapUiSizeCozy";
                }
            }
            return this._sContentDensityClass;
        }
    });
});

