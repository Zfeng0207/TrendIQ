sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/TextArea",
    "sap/m/VBox",
    "sap/m/Text"
], function (MessageToast, MessageBox, Dialog, Button, TextArea, VBox, Text) {
    "use strict";

    /**
     * Display the meeting script in a dialog
     */
    function showMeetingScriptDialog(sMeetingScript, sProspectName) {
        var oDialog = new Dialog({
            title: "AI Meeting Script" + (sProspectName ? " - " + sProspectName : ""),
            contentWidth: "700px",
            contentHeight: "500px",
            resizable: true,
            draggable: true,
            content: [
                new VBox({
                    width: "100%",
                    items: [
                        new Text({
                            text: "Generated meeting preparation script based on prospect data:",
                            wrapping: true
                        }).addStyleClass("sapUiSmallMarginBottom"),
                        new TextArea({
                            value: sMeetingScript,
                            width: "100%",
                            rows: 20,
                            editable: false,
                            growing: false
                        }).addStyleClass("sapUiTinyMargin")
                    ]
                }).addStyleClass("sapUiSmallMargin")
            ],
            buttons: [
                new Button({
                    text: "Copy to Clipboard",
                    type: "Emphasized",
                    press: function() {
                        navigator.clipboard.writeText(sMeetingScript).then(function() {
                            MessageToast.show("Meeting script copied to clipboard!");
                        }).catch(function(err) {
                            console.error("[AI Planner] Failed to copy:", err);
                            MessageToast.show("Failed to copy to clipboard");
                        });
                    }
                }),
                new Button({
                    text: "Close",
                    press: function() {
                        oDialog.close();
                    }
                })
            ],
            afterClose: function() {
                oDialog.destroy();
            }
        });

        oDialog.open();
    }

    return {
        /**
         * Handler for AI Meeting Initiator action
         * Calls the backend action and displays the generated meeting script
         */
        onAIMeetingInitiator: function (oEvent) {
            console.log("[AI Planner] Action handler triggered for Prospect");
            
            var sProspectID = null;
            var sProspectName = null;

            try {
                // Try to get context from the event
                if (oEvent && oEvent.getParameter) {
                    var aSelectedContexts = oEvent.getParameter("contexts") || oEvent.getParameter("selectedContexts");
                    if (aSelectedContexts && aSelectedContexts.length > 0) {
                        var oData = aSelectedContexts[0].getObject();
                        sProspectID = oData.ID;
                        sProspectName = oData.prospectName;
                        console.log("[AI Planner] Got data from contexts:", sProspectName);
                    }
                }

                // Extract path from URL if context not available
                if (!sProspectID) {
                    var sHash = window.location.hash;
                    var oHashMatch = sHash.match(/Prospects\(([^)]+)\)/);
                    if (oHashMatch) {
                        sProspectID = oHashMatch[1];
                        console.log("[AI Planner] Extracted prospect ID from URL:", sProspectID);
                    }
                }

                if (!sProspectID) {
                    MessageToast.show("Please select a prospect to generate meeting script", {
                        duration: 3000
                    });
                    return;
                }

                // Show loading message
                MessageToast.show("Generating AI meeting script...", { duration: 2000 });
                
                // Show busy indicator
                sap.ui.core.BusyIndicator.show(0);

                // Call the backend action
                var sActionUrl = "/prospect/Prospects(" + sProspectID + ")/ProspectService.initiateAIMeeting";
                
                fetch(sActionUrl, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                })
                .then(function(response) {
                    sap.ui.core.BusyIndicator.hide();
                    if (response.ok) {
                        return response.json();
                    }
                    return response.json().then(function(err) {
                        throw new Error(err.error?.message || "Failed to generate meeting script");
                    });
                })
                .then(function(oResult) {
                    console.log("[AI Planner] Meeting script generated:", oResult);
                    
                    // The result is the meeting script string (wrapped in value for OData)
                    var sMeetingScript = oResult.value || oResult;
                    
                    // Display the meeting script in a dialog
                    showMeetingScriptDialog(sMeetingScript, sProspectName);
                })
                .catch(function(oError) {
                    sap.ui.core.BusyIndicator.hide();
                    console.error("[AI Planner] Error generating meeting script:", oError);
                    MessageBox.error("Failed to generate meeting script: " + oError.message);
                });

            } catch (error) {
                sap.ui.core.BusyIndicator.hide();
                console.error("[AI Planner] Error:", error);
                MessageBox.error("An error occurred: " + error.message);
            }
        }
    };
});
