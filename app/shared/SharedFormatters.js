/**
 * Shared Formatters for Creatio-style UI Components
 * Common formatting functions used across all entity detail pages
 */
sap.ui.define([], function () {
    "use strict";

    return {
        /**
         * Format a score value with color indication
         * @param {number} iScore - Score value (0-100)
         * @returns {string} Formatted score text
         */
        formatScore: function (iScore) {
            if (iScore === null || iScore === undefined) {
                return "N/A";
            }
            return iScore + "%";
        },

        /**
         * Get score state for ObjectStatus
         * @param {number} iScore - Score value (0-100)
         * @returns {string} State: Success, Warning, Error, or None
         */
        getScoreState: function (iScore) {
            if (iScore === null || iScore === undefined) {
                return "None";
            }
            if (iScore >= 70) {
                return "Success";
            }
            if (iScore >= 40) {
                return "Warning";
            }
            return "Error";
        },

        /**
         * Get icon based on score
         * @param {number} iScore - Score value (0-100)
         * @returns {string} Icon URI
         */
        getScoreIcon: function (iScore) {
            if (iScore >= 70) {
                return "sap-icon://status-positive";
            }
            if (iScore >= 40) {
                return "sap-icon://status-critical";
            }
            return "sap-icon://status-negative";
        },

        /**
         * Format currency value
         * @param {number} fValue - Currency amount
         * @param {string} sCurrency - Currency code (default: MYR)
         * @returns {string} Formatted currency string
         */
        formatCurrency: function (fValue, sCurrency) {
            if (fValue === null || fValue === undefined) {
                return "RM 0.00";
            }
            const sPrefix = (sCurrency === "MYR" || !sCurrency) ? "RM " : sCurrency + " ";
            return sPrefix + parseFloat(fValue).toLocaleString("en-MY", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        },

        /**
         * Format date to readable string
         * @param {string|Date} oDate - Date value
         * @returns {string} Formatted date string
         */
        formatDate: function (oDate) {
            if (!oDate) {
                return "";
            }
            const oDateObj = oDate instanceof Date ? oDate : new Date(oDate);
            return oDateObj.toLocaleDateString("en-MY", {
                year: "numeric",
                month: "short",
                day: "numeric"
            });
        },

        /**
         * Format date with time
         * @param {string|Date} oDate - Date value
         * @returns {string} Formatted date/time string
         */
        formatDateTime: function (oDate) {
            if (!oDate) {
                return "";
            }
            const oDateObj = oDate instanceof Date ? oDate : new Date(oDate);
            return oDateObj.toLocaleString("en-MY", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        },

        /**
         * Calculate days since a date
         * @param {string|Date} oDate - Reference date
         * @returns {number} Number of days
         */
        calculateDaysSince: function (oDate) {
            if (!oDate) {
                return 0;
            }
            const oDateObj = oDate instanceof Date ? oDate : new Date(oDate);
            const oToday = new Date();
            return Math.floor((oToday - oDateObj) / (1000 * 60 * 60 * 24));
        },

        /**
         * Calculate days until a date
         * @param {string|Date} oDate - Target date
         * @returns {number} Number of days (negative if past)
         */
        calculateDaysUntil: function (oDate) {
            if (!oDate) {
                return 0;
            }
            const oDateObj = oDate instanceof Date ? oDate : new Date(oDate);
            const oToday = new Date();
            return Math.ceil((oDateObj - oToday) / (1000 * 60 * 60 * 24));
        },

        /**
         * Format relative time (e.g., "2 days ago")
         * @param {string|Date} oDate - Date value
         * @returns {string} Relative time string
         */
        formatRelativeTime: function (oDate) {
            if (!oDate) {
                return "";
            }
            const iDays = this.calculateDaysSince(oDate);
            
            if (iDays === 0) {
                return "Today";
            } else if (iDays === 1) {
                return "Yesterday";
            } else if (iDays < 7) {
                return iDays + " days ago";
            } else if (iDays < 30) {
                const iWeeks = Math.floor(iDays / 7);
                return iWeeks + (iWeeks === 1 ? " week ago" : " weeks ago");
            } else if (iDays < 365) {
                const iMonths = Math.floor(iDays / 30);
                return iMonths + (iMonths === 1 ? " month ago" : " months ago");
            } else {
                const iYears = Math.floor(iDays / 365);
                return iYears + (iYears === 1 ? " year ago" : " years ago");
            }
        },

        /**
         * Get platform icon based on platform name
         * @param {string} sPlatform - Platform name
         * @returns {string} Icon URI
         */
        getPlatformIcon: function (sPlatform) {
            const mPlatformIcons = {
                "Instagram": "sap-icon://camera",
                "TikTok": "sap-icon://video",
                "Facebook": "sap-icon://post",
                "LinkedIn": "sap-icon://collaborate",
                "Web": "sap-icon://world",
                "Referral": "sap-icon://contacts",
                "Other": "sap-icon://question-mark"
            };
            return mPlatformIcons[sPlatform] || "sap-icon://world";
        },

        /**
         * Get source icon based on source type
         * @param {string} sSource - Source type
         * @returns {string} Icon URI
         */
        getSourceIcon: function (sSource) {
            const mSourceIcons = {
                "Online Web": "sap-icon://world",
                "Partnership": "sap-icon://collaborate",
                "Offline": "sap-icon://physical-activity",
                "Lead Conversion": "sap-icon://convert",
                "Other": "sap-icon://question-mark",
                "Web": "sap-icon://world",
                "Social": "sap-icon://share-2",
                "Referral": "sap-icon://contacts",
                "Import": "sap-icon://upload",
                "Partner": "sap-icon://collaborate",
                "Cold": "sap-icon://call",
                "Event": "sap-icon://appointment"
            };
            return mSourceIcons[sSource] || "sap-icon://hint";
        },

        /**
         * Get account type icon
         * @param {string} sType - Account type
         * @returns {string} Icon URI
         */
        getAccountTypeIcon: function (sType) {
            const mTypeIcons = {
                "Salon": "sap-icon://scissors",
                "Spa": "sap-icon://bath-mode",
                "Retailer": "sap-icon://retail-store",
                "Distributor": "sap-icon://shipping-status",
                "E-commerce": "sap-icon://cart",
                "Influencer": "sap-icon://camera",
                "Chain": "sap-icon://chain-link"
            };
            return mTypeIcons[sType] || "sap-icon://building";
        },

        /**
         * Get status color/state
         * @param {string} sStatus - Status value
         * @returns {string} State: Success, Warning, Error, Information, or None
         */
        getStatusState: function (sStatus) {
            const mStatusStates = {
                // Lead statuses
                "New": "Information",
                "Contacted": "Warning",
                "Qualified": "Success",
                "Nurturing": "Warning",
                "Converted": "Success",
                "Lost": "Error",
                "Archived": "None",
                // Prospect statuses
                "Negotiating": "Warning",
                "In Review": "Information",
                // Opportunity stages
                "Prospecting": "Information",
                "Qualification": "Warning",
                "Needs Analysis": "Warning",
                "Proposal": "Warning",
                "Negotiation": "Warning",
                "Closed Won": "Success",
                "Closed Lost": "Error",
                // Account statuses
                "Active": "Success",
                "Inactive": "None",
                "Prospect": "Information"
            };
            return mStatusStates[sStatus] || "None";
        },

        /**
         * Get initials from a name
         * @param {string} sName - Full name
         * @returns {string} Initials (max 2 characters)
         */
        getInitials: function (sName) {
            if (!sName) {
                return "?";
            }
            const aParts = sName.trim().split(/\s+/);
            if (aParts.length === 1) {
                return aParts[0].substring(0, 2).toUpperCase();
            }
            return (aParts[0][0] + aParts[aParts.length - 1][0]).toUpperCase();
        },

        /**
         * Get avatar color based on name (deterministic)
         * @param {string} sName - Name to generate color for
         * @returns {string} Avatar background color
         */
        getAvatarColor: function (sName) {
            if (!sName) {
                return "Accent1";
            }
            const aColors = [
                "Accent1", "Accent2", "Accent3", "Accent4", "Accent5",
                "Accent6", "Accent7", "Accent8", "Accent9", "Accent10"
            ];
            let iHash = 0;
            for (let i = 0; i < sName.length; i++) {
                iHash = sName.charCodeAt(i) + ((iHash << 5) - iHash);
            }
            return aColors[Math.abs(iHash) % aColors.length];
        },

        /**
         * Format KPI value with appropriate suffix
         * @param {number} nValue - Numeric value
         * @returns {string} Formatted value (e.g., "1.2K", "3.5M")
         */
        formatKPIValue: function (nValue) {
            if (nValue === null || nValue === undefined) {
                return "0";
            }
            if (nValue >= 1000000) {
                return (nValue / 1000000).toFixed(1) + "M";
            }
            if (nValue >= 1000) {
                return (nValue / 1000).toFixed(1) + "K";
            }
            return nValue.toString();
        },

        /**
         * Get trend icon based on trend direction
         * @param {string} sTrend - Trend direction (Improving, Stable, Declining)
         * @returns {string} Icon URI
         */
        getTrendIcon: function (sTrend) {
            const mTrendIcons = {
                "Improving": "sap-icon://trend-up",
                "Stable": "sap-icon://trend-neutral",
                "Declining": "sap-icon://trend-down"
            };
            return mTrendIcons[sTrend] || "sap-icon://trend-neutral";
        },

        /**
         * Get trend state
         * @param {string} sTrend - Trend direction
         * @returns {string} State
         */
        getTrendState: function (sTrend) {
            const mTrendStates = {
                "Improving": "Success",
                "Stable": "None",
                "Declining": "Error"
            };
            return mTrendStates[sTrend] || "None";
        },

        /**
         * Format percentage with sign
         * @param {number} nValue - Percentage value
         * @returns {string} Formatted percentage
         */
        formatPercentageWithSign: function (nValue) {
            if (nValue === null || nValue === undefined) {
                return "0%";
            }
            const sSign = nValue > 0 ? "+" : "";
            return sSign + nValue.toFixed(1) + "%";
        },

        /**
         * Truncate text with ellipsis
         * @param {string} sText - Text to truncate
         * @param {number} iMaxLength - Maximum length
         * @returns {string} Truncated text
         */
        truncateText: function (sText, iMaxLength) {
            if (!sText) {
                return "";
            }
            iMaxLength = iMaxLength || 50;
            if (sText.length <= iMaxLength) {
                return sText;
            }
            return sText.substring(0, iMaxLength - 3) + "...";
        },

        /**
         * Get priority icon
         * @param {string} sPriority - Priority level
         * @returns {string} Icon URI
         */
        getPriorityIcon: function (sPriority) {
            const mPriorityIcons = {
                "High": "sap-icon://message-error",
                "Medium": "sap-icon://message-warning",
                "Low": "sap-icon://message-information"
            };
            return mPriorityIcons[sPriority] || "sap-icon://hint";
        },

        /**
         * Get priority state
         * @param {string} sPriority - Priority level
         * @returns {string} State
         */
        getPriorityState: function (sPriority) {
            const mPriorityStates = {
                "High": "Error",
                "Medium": "Warning",
                "Low": "None"
            };
            return mPriorityStates[sPriority] || "None";
        }
    };
});

