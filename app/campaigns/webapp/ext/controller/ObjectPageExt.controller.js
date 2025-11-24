sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/m/MessageToast"
], function(ControllerExtension, MessageToast) {
    "use strict";

    return ControllerExtension.extend("beautyleads.campaigns.ext.controller.ObjectPageExt", {
        
        // ========================================================================
        // Performance Metrics Formatters
        // ========================================================================
        
        /**
         * Parse performance metrics JSON safely
         * @private
         */
        _parseMetrics: function(sMetrics) {
            try {
                return JSON.parse(sMetrics || "{}");
            } catch (e) {
                return {};
            }
        },
        
        /**
         * Format number with thousand separators
         * @private
         */
        _formatNumber: function(num) {
            if (num === undefined || num === null || isNaN(num)) return "N/A";
            return new Intl.NumberFormat('en-MY').format(Math.round(num));
        },
        
        /**
         * Format currency
         * @private
         */
        _formatCurrency: function(num) {
            if (num === undefined || num === null || isNaN(num)) return "N/A";
            return "RM " + new Intl.NumberFormat('en-MY', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(num);
        },
        
        /**
         * Format percentage
         * @private
         */
        _formatPercentage: function(num, decimals = 2) {
            if (num === undefined || num === null || isNaN(num)) return "N/A";
            return num.toFixed(decimals) + "%";
        },
        
        // Individual Metric Formatters
        
        formatMetricROI: function(sMetrics) {
            const metrics = this._parseMetrics(sMetrics);
            return metrics.roi !== undefined ? this._formatPercentage(metrics.roi) : "N/A";
        },
        
        formatMetricImpressions: function(sMetrics) {
            const metrics = this._parseMetrics(sMetrics);
            return this._formatNumber(metrics.impressions);
        },
        
        formatMetricClicks: function(sMetrics) {
            const metrics = this._parseMetrics(sMetrics);
            return this._formatNumber(metrics.clicks);
        },
        
        formatMetricConversions: function(sMetrics) {
            const metrics = this._parseMetrics(sMetrics);
            return this._formatNumber(metrics.conversions);
        },
        
        formatMetricCTR: function(sMetrics) {
            const metrics = this._parseMetrics(sMetrics);
            if (metrics.impressions && metrics.clicks) {
                const ctr = (metrics.clicks / metrics.impressions) * 100;
                return this._formatPercentage(ctr);
            }
            return metrics.ctr !== undefined ? this._formatPercentage(metrics.ctr) : "N/A";
        },
        
        formatMetricConversionRate: function(sMetrics) {
            const metrics = this._parseMetrics(sMetrics);
            if (metrics.clicks && metrics.conversions) {
                const convRate = (metrics.conversions / metrics.clicks) * 100;
                return this._formatPercentage(convRate);
            }
            return metrics.conversionRate !== undefined ? this._formatPercentage(metrics.conversionRate) : "N/A";
        },
        
        formatMetricRevenue: function(sMetrics) {
            const metrics = this._parseMetrics(sMetrics);
            return this._formatCurrency(metrics.revenue);
        },
        
        formatMetricCostPerConversion: function(sMetrics) {
            const metrics = this._parseMetrics(sMetrics);
            if (metrics.conversions && metrics.cost) {
                const cpc = metrics.cost / metrics.conversions;
                return this._formatCurrency(cpc);
            }
            return metrics.costPerConversion !== undefined ? 
                this._formatCurrency(metrics.costPerConversion) : "N/A";
        },
        
        formatMetricEngagementRate: function(sMetrics) {
            const metrics = this._parseMetrics(sMetrics);
            return metrics.engagementRate !== undefined ? 
                this._formatPercentage(metrics.engagementRate) : "N/A";
        },
        
        formatMetricEngagementTime: function(sMetrics) {
            const metrics = this._parseMetrics(sMetrics);
            if (metrics.avgEngagementTime !== undefined) {
                const seconds = Math.round(metrics.avgEngagementTime);
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                if (minutes > 0) {
                    return `${minutes}m ${remainingSeconds}s`;
                }
                return `${seconds}s`;
            }
            return "N/A";
        },
        
        formatPerformanceStatus: function(sMetrics) {
            const metrics = this._parseMetrics(sMetrics);
            
            // Calculate performance score based on ROI and conversion rate
            let score = 0;
            let count = 0;
            
            if (metrics.roi !== undefined) {
                score += metrics.roi > 0 ? 100 : 0;
                count++;
            }
            
            if (metrics.conversions && metrics.clicks) {
                const convRate = (metrics.conversions / metrics.clicks) * 100;
                if (convRate > 5) score += 100;
                else if (convRate > 2) score += 60;
                else score += 30;
                count++;
            }
            
            if (count === 0) return "No Data Available";
            
            const avgScore = score / count;
            
            if (avgScore >= 80) return "Excellent Performance";
            if (avgScore >= 60) return "Good Performance";
            if (avgScore >= 40) return "Average Performance";
            return "Needs Improvement";
        },
        
        formatPerformanceState: function(sMetrics) {
            const metrics = this._parseMetrics(sMetrics);
            
            // Determine state based on metrics
            if (metrics.roi !== undefined && metrics.roi > 50) return "Success";
            if (metrics.roi !== undefined && metrics.roi > 0) return "Warning";
            if (metrics.roi !== undefined && metrics.roi <= 0) return "Error";
            
            return "None";
        },
        
        formatPrettyJSON: function(sMetrics) {
            const metrics = this._parseMetrics(sMetrics);
            if (Object.keys(metrics).length === 0) {
                return "No performance data available yet. Click 'Generate Performance Report' to create mock performance data.";
            }
            
            // Create a nicely formatted text display
            let formatted = [];
            
            if (metrics.impressions) formatted.push(`📊 Impressions: ${this._formatNumber(metrics.impressions)}`);
            if (metrics.clicks) formatted.push(`👆 Clicks: ${this._formatNumber(metrics.clicks)}`);
            if (metrics.conversions) formatted.push(`✅ Conversions: ${this._formatNumber(metrics.conversions)}`);
            if (metrics.roi !== undefined) formatted.push(`💰 ROI: ${this._formatPercentage(metrics.roi)}`);
            if (metrics.ctr !== undefined) formatted.push(`📈 CTR: ${this._formatPercentage(metrics.ctr)}`);
            if (metrics.conversionRate !== undefined) formatted.push(`🎯 Conversion Rate: ${this._formatPercentage(metrics.conversionRate)}`);
            if (metrics.revenue) formatted.push(`💵 Revenue: ${this._formatCurrency(metrics.revenue)}`);
            if (metrics.costPerConversion) formatted.push(`💸 Cost per Conversion: ${this._formatCurrency(metrics.costPerConversion)}`);
            if (metrics.engagementRate !== undefined) formatted.push(`💬 Engagement Rate: ${this._formatPercentage(metrics.engagementRate)}`);
            if (metrics.avgEngagementTime !== undefined) {
                const seconds = Math.round(metrics.avgEngagementTime);
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                const timeStr = minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${seconds}s`;
                formatted.push(`⏱️ Avg. Engagement Time: ${timeStr}`);
            }
            
            if (metrics.likes) formatted.push(`❤️ Likes: ${this._formatNumber(metrics.likes)}`);
            if (metrics.shares) formatted.push(`🔄 Shares: ${this._formatNumber(metrics.shares)}`);
            if (metrics.comments) formatted.push(`💭 Comments: ${this._formatNumber(metrics.comments)}`);
            
            return formatted.join('\n');
        },
        
        // Simple formatter for table display
        formatCampaignPerformance: function(sMetrics) {
            const metrics = this._parseMetrics(sMetrics);
            
            const parts = [];
            if (metrics.roi !== undefined) {
                parts.push(`ROI: ${this._formatPercentage(metrics.roi, 1)}`);
            }
            if (metrics.clicks !== undefined) {
                parts.push(`${this._formatNumber(metrics.clicks)} clicks`);
            }
            if (metrics.conversions !== undefined) {
                parts.push(`${this._formatNumber(metrics.conversions)} conv.`);
            }
            
            return parts.length > 0 ? parts.join(' • ') : "No data";
        }
    });
});

