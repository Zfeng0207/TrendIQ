sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
    "use strict";

    var brandRankCounter = 0;
    var trendRankCounter = 0;

    return Controller.extend("beautyleads.competitoranalytics.controller.Main", {
        onInit: function () {
            brandRankCounter = 0;
            trendRankCounter = 0;
            
            // Start loading sequence
            this._startLoadingSequence();
        },

        _startLoadingSequence: function () {
            var oView = this.getView();
            var oProgress = oView.byId("loadingProgress");
            var that = this;
            
            // Loading steps with realistic timing
            var loadingSteps = [
                { percent: 15, text: "Connecting to data sources...", delay: 300 },
                { percent: 35, text: "Loading market share data...", delay: 500 },
                { percent: 55, text: "Analyzing competitor metrics...", delay: 400 },
                { percent: 75, text: "Processing brand performance...", delay: 350 },
                { percent: 90, text: "Generating insights...", delay: 300 },
                { percent: 100, text: "Complete", delay: 200 }
            ];
            
            var currentStep = 0;
            var totalDelay = 0;
            
            loadingSteps.forEach(function(step) {
                totalDelay += step.delay;
                setTimeout(function() {
                    if (oProgress) {
                        oProgress.setPercentValue(step.percent);
                        oProgress.setDisplayValue(step.text);
                    }
                }, totalDelay);
            });
            
            // Show main content after loading completes
            setTimeout(function() {
                that._showMainContent();
            }, totalDelay + 400);
        },

        _showMainContent: function () {
            var oView = this.getView();
            var oLoadingScreen = oView.byId("loadingScreen");
            var oAnalyticsPage = oView.byId("analyticsPage");
            
            // Fade out loading screen
            if (oLoadingScreen) {
                oLoadingScreen.addStyleClass("fadeOut");
            }
            
            // Show analytics page after fade
            setTimeout(function() {
                if (oLoadingScreen) {
                    oLoadingScreen.setVisible(false);
                }
                if (oAnalyticsPage) {
                    oAnalyticsPage.setVisible(true);
                    oAnalyticsPage.addStyleClass("fadeIn");
                }
            }, 300);
        },

        formatBrandRank: function () {
            brandRankCounter++;
            if (brandRankCounter > 6) brandRankCounter = 1;
            return brandRankCounter;
        },

        formatTrendRank: function () {
            trendRankCounter++;
            if (trendRankCounter > 4) trendRankCounter = 1;
            return trendRankCounter;
        },

        onRefresh: function () {
            MessageToast.show("Refreshing competitor data...");
            // In a real implementation, this would reload data from the backend
            var oModel = this.getView().getModel("competitors");
            if (oModel) {
                oModel.refresh();
            }
        },

        onSettings: function () {
            MessageToast.show("Settings dialog would open here");
        },

        onBrandPress: function (oEvent) {
            var oSource = oEvent.getSource();
            var oContext = oSource.getBindingContext("competitors");
            if (oContext) {
                var sBrandName = oContext.getProperty("name");
                MessageToast.show("Selected brand: " + sBrandName);
            }
        },

        onCompetitorPress: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var oContext = oItem.getBindingContext("competitors");
            if (oContext) {
                var sCompetitorName = oContext.getProperty("name");
                MessageBox.information("Detailed analysis for " + sCompetitorName + " coming soon.", {
                    title: "Competitor Details"
                });
            }
        },

        formatGrowthState: function (bPositive) {
            return bPositive ? "Success" : "Error";
        },

        formatThreatIcon: function (sThreatLevel) {
            switch (sThreatLevel) {
                case "High":
                    return "sap-icon://warning2";
                case "Medium":
                    return "sap-icon://hint";
                case "Low":
                    return "sap-icon://accept";
                default:
                    return "sap-icon://question-mark";
            }
        }
    });
});
