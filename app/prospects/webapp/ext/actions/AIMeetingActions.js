sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/core/Core"
], function (MessageToast, Core) {
    "use strict";

    return {
        /**
         * Handler for AI Meeting Initiator action
         */
        onAIMeetingInitiator: function (oEvent) {
            console.log("[AI Planner] Action handler triggered for Prospect");
            
            let oData = null;

            try {
                // Try to get context from the event
                if (oEvent && oEvent.getParameter) {
                    const aSelectedContexts = oEvent.getParameter("selectedContexts");
                    if (aSelectedContexts && aSelectedContexts.length > 0) {
                        oData = aSelectedContexts[0].getObject();
                        console.log("[AI Planner] Got data from selectedContexts:", oData.prospectName);
                    }
                }

                // Extract path from URL and fetch data directly via HTTP
                if (!oData) {
                    const sHash = window.location.hash;
                    const oHashMatch = sHash.match(/Prospects\([^)]+\)/);
                    if (oHashMatch) {
                        const sEntityPath = oHashMatch[0];
                        const sODataUrl = "/prospect/" + sEntityPath;
                        
                        fetch(sODataUrl, {
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
                        .then(function(oJson) {
                            const oRealData = oJson.value || oJson;
                            if (oRealData && oRealData.prospectName) {
                                MessageToast.show("AI Meeting Planner loaded for: " + oRealData.prospectName, {
                                    duration: 3000
                                });
                            }
                        })
                        .catch(function(error) {
                            console.error("[AI Planner] Failed to fetch data:", error);
                        });
                    }
                }

                if (oData) {
                    MessageToast.show("AI Meeting Planner: Preparing script for " + (oData.prospectName || "prospect"), {
                        duration: 3000
                    });
                } else {
                    MessageToast.show("AI Meeting Planner: Select a prospect to generate meeting script", {
                        duration: 3000
                    });
                }

            } catch (error) {
                console.error("[AI Planner] Error:", error);
                MessageToast.show("AI Meeting Planner activated", { duration: 2000 });
            }
        }
    };
});

