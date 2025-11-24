sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function(MessageToast, MessageBox) {
    "use strict";

    return {
        /**
         * Custom handler for getAIRecommendations action
         * This is called AFTER the action completes successfully
         */
        onAfterGetAIRecommendations: function(oBindingContext, aSelectedContexts) {
            console.log("=== onAfterGetAIRecommendations handler called ===");
            console.log("Binding context:", oBindingContext);
            console.log("Selected contexts:", aSelectedContexts);
            
            // Show success message
            MessageBox.success(
                "AI Recommendations have been generated successfully!\n\n" +
                "The new recommendations are now visible in the AI Recommendations section below.",
                {
                    title: "Success",
                    actions: [MessageBox.Action.OK],
                    onClose: function() {
                        // Refresh the page to show new data
                        if (oBindingContext) {
                            console.log("Refreshing context after user closed dialog");
                            oBindingContext.refresh();
                        }
                        
                        // Also refresh the page
                        window.location.reload();
                    }
                }
            );
        }
    };
});

