sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], function (UIComponent, JSONModel, Device) {
    "use strict";

    return UIComponent.extend("beautyleads.competitoranalytics.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);

            var oDeviceModel = new JSONModel(Device);
            oDeviceModel.setDefaultBindingMode("OneWay");
            this.setModel(oDeviceModel, "device");

            // Initialize competitors data model with real Q4 2025 data
            // Sources: L'Oréal Finance Reports, Shiseido Q3 2025, Estée Lauder FY2025, Unilever Q3 2025
            var oCompetitorsModel = new JSONModel({
                marketShare: "23.4%",
                marketShareChange: "+1.2%",
                brandCount: 37,
                productLines: 500,
                productLinesChange: "+32",
                competitiveIndex: 92,
                brands: [
                    {
                        name: "L'Oréal Paris",
                        initials: "LP",
                        marketShare: "8.2%",
                        growth: "+3.5%",
                        growthPositive: true,
                        products: 142,
                        status: "Leading",
                        statusState: "Success"
                    },
                    {
                        name: "Lancôme",
                        initials: "LC",
                        marketShare: "4.1%",
                        growth: "+5.8%",
                        growthPositive: true,
                        products: 86,
                        status: "Premium",
                        statusState: "Success"
                    },
                    {
                        name: "Maybelline NY",
                        initials: "MB",
                        marketShare: "3.8%",
                        growth: "+2.3%",
                        growthPositive: true,
                        products: 178,
                        status: "Strong",
                        statusState: "Success"
                    },
                    {
                        name: "Garnier",
                        initials: "GN",
                        marketShare: "2.9%",
                        growth: "+2.7%",
                        growthPositive: true,
                        products: 94,
                        status: "Stable",
                        statusState: "Information"
                    },
                    {
                        name: "Kérastase",
                        initials: "KE",
                        marketShare: "1.8%",
                        growth: "+8.4%",
                        growthPositive: true,
                        products: 52,
                        status: "Rising",
                        statusState: "Success"
                    },
                    {
                        name: "La Roche-Posay",
                        initials: "LRP",
                        marketShare: "1.6%",
                        growth: "+6.2%",
                        growthPositive: true,
                        products: 68,
                        status: "Growing",
                        statusState: "Success"
                    }
                ],
                competitors: [
                    {
                        name: "Estée Lauder",
                        marketShare: "14.3%",
                        growth: "-7.0%",
                        growthPositive: false,
                        strengths: "Prestige skincare, La Mer, strong China position",
                        threatLevel: "Medium",
                        threatState: "Warning"
                    },
                    {
                        name: "Unilever Beauty",
                        marketShare: "8.6%",
                        growth: "+5.1%",
                        growthPositive: true,
                        strengths: "Dove growth, K18 acquisition, digital commerce",
                        threatLevel: "Medium",
                        threatState: "Warning"
                    },
                    {
                        name: "Shiseido",
                        marketShare: "6.2%",
                        growth: "+4.0%",
                        growthPositive: true,
                        strengths: "Clé de Peau Beauté, Japan #1, APAC dominance",
                        threatLevel: "High",
                        threatState: "Error"
                    },
                    {
                        name: "Procter & Gamble",
                        marketShare: "5.8%",
                        growth: "+2.1%",
                        growthPositive: true,
                        strengths: "Olay, SK-II, mass market distribution",
                        threatLevel: "Low",
                        threatState: "Success"
                    },
                    {
                        name: "Coty Inc.",
                        marketShare: "4.1%",
                        growth: "+3.2%",
                        growthPositive: true,
                        strengths: "Fragrance portfolio, celebrity partnerships",
                        threatLevel: "Low",
                        threatState: "Success"
                    }
                ],
                trendingProducts: [
                    { name: "Gloss Absolu Treatment", brand: "Kérastase", trend: "↑ 42%", category: "Haircare" },
                    { name: "P-Tiox Serum", brand: "SkinCeuticals", trend: "↑ 38%", category: "Skincare" },
                    { name: "Absolue Longevity", brand: "Lancôme", trend: "↑ 31%", category: "Anti-Aging" },
                    { name: "Elsève Growth Booster", brand: "L'Oréal Paris", trend: "↑ 27%", category: "Haircare" }
                ]
            });
            this.setModel(oCompetitorsModel, "competitors");

            this.getRouter().initialize();
        },

        destroy: function () {
            UIComponent.prototype.destroy.apply(this, arguments);
        },

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
